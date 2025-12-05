// Script to check PostgreSQL database
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  try {
    const envPath = join(__dirname, '.env.local');
    const envFile = readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.startsWith('DATABASE_URL=')) {
        connectionString = trimmed.split('=').slice(1).join('=');
      }
    });
  } catch (e) {
    console.error('Error reading .env.local:', e.message);
  }
}

if (!connectionString) {
  connectionString = 'postgres://postgres:vOZx4og262UxQeT@localhost:5432';
}

const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new pg.Pool({
  connectionString,
  ssl: isLocalhost ? false : {
    rejectUnauthorized: false
  },
  max: 5,
  connectionTimeoutMillis: 10000,
});

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to database...');
    console.log('📍 Connection:', connectionString.replace(/:[^:@]+@/, ':****@'));
    
    // Test connection
    const testResult = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('\n✅ Database connection successful!');
    console.log('⏰ Current time:', testResult.rows[0].current_time);
    console.log('📦 PostgreSQL version:', testResult.rows[0].pg_version.split(',')[0]);
    
    // Get all tables
    console.log('\n📊 Checking tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Found ${tablesResult.rows.length} tables:`);
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      
      // Get row count
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const count = countResult.rows[0].count;
      
      // Get columns
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log(`\n  📌 ${tableName} (${count} rows)`);
      console.log(`     Columns: ${columnsResult.rows.map(c => c.column_name).join(', ')}`);
    }
    
    // Check ai_conversations table specifically
    console.log('\n🤖 Checking ai_conversations table...');
    const conversationsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        MIN(created_at) as oldest_message,
        MAX(created_at) as newest_message
      FROM ai_conversations
    `);
    
    if (conversationsResult.rows[0].total > 0) {
      console.log(`   Total messages: ${conversationsResult.rows[0].total}`);
      console.log(`   Unique users: ${conversationsResult.rows[0].unique_users}`);
      console.log(`   Unique sessions: ${conversationsResult.rows[0].unique_sessions}`);
      console.log(`   Oldest message: ${conversationsResult.rows[0].oldest_message}`);
      console.log(`   Newest message: ${conversationsResult.rows[0].newest_message}`);
      
      // Get sample conversations
      const sampleResult = await pool.query(`
        SELECT user_id, session_id, role, 
               LEFT(content, 100) as content_preview, 
               created_at
        FROM ai_conversations
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      console.log('\n   📝 Sample conversations (last 5):');
      sampleResult.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. [${row.role}] ${row.content_preview}... (${row.created_at})`);
      });
    } else {
      console.log('   No conversations found yet.');
    }
    
    // Check users table
    console.log('\n👥 Checking users table...');
    const usersResult = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(DISTINCT id) as unique_users
      FROM users
    `);
    console.log(`   Total users: ${usersResult.rows[0].total}`);
    
    if (usersResult.rows[0].total > 0) {
      const sampleUsers = await pool.query(`
        SELECT id, email, name, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `);
      console.log('\n   📝 Sample users (last 5):');
      sampleUsers.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. ${row.email} (${row.name || 'No name'}) - Created: ${row.created_at}`);
      });
    }
    
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('\n❌ Error checking database:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();

