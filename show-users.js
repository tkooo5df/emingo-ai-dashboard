// Script to display all users from database
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
let connectionString = 'postgres://postgres:vOZx4og262UxQeT@localhost:5432';
try {
  const envPath = join(__dirname, '.env.local');
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key === 'DATABASE_URL') {
          connectionString = value;
        }
      }
    }
  });
} catch (err) {
  console.log('Using default connection string');
}

const pool = new Pool({
  connectionString,
  ssl: false
});

async function showUsers() {
  try {
    console.log('🔍 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database\n');

    // Get all users
    const result = await pool.query(
      'SELECT id, email, name, avatar_url, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    console.log(`📊 Total Users: ${result.rows.length}\n`);
    console.log('='.repeat(80));
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in database');
    } else {
      result.rows.forEach((user, index) => {
        console.log(`\n👤 User #${index + 1}:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name || 'No Name'}`);
        console.log(`   Avatar: ${user.avatar_url || 'No Avatar'}`);
        console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
        console.log(`   Updated: ${new Date(user.updated_at).toLocaleString()}`);
        console.log('-'.repeat(80));
      });
    }

    console.log(`\n✅ Displayed ${result.rows.length} user(s)`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Database is running');
    console.error('   2. Connection string is correct');
    console.error('   3. flyctl proxy is running (if using Fly.io): flyctl proxy 5432 -a emingo-db');
  } finally {
    await pool.end();
  }
}

showUsers();


