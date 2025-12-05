// Script to inspect database via API
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAccessToken } from './src/lib/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

async function inspectDatabase() {
  try {
    console.log('🔍 Inspecting database via API...');
    console.log('📍 API URL:', API_BASE_URL);
    
    // Get access token
    const token = await getAccessToken();
    if (!token) {
      console.error('❌ No access token found. Please login first.');
      return;
    }
    
    const response = await fetch(`${API_BASE_URL}/database/inspect`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      console.error('❌ Error:', error);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n✅ Database Inspection Results:\n');
    console.log('📊 Statistics:');
    console.log(`   Total Tables: ${data.stats.totalTables}`);
    console.log(`   Total Users: ${data.stats.totalUsers}`);
    console.log(`   Total Conversations: ${data.stats.conversations.total}`);
    console.log(`   Unique Users with Conversations: ${data.stats.conversations.uniqueUsers}`);
    console.log(`   Unique Sessions: ${data.stats.conversations.uniqueSessions}`);
    if (data.stats.conversations.oldestMessage) {
      console.log(`   Oldest Message: ${data.stats.conversations.oldestMessage}`);
    }
    if (data.stats.conversations.newestMessage) {
      console.log(`   Newest Message: ${data.stats.conversations.newestMessage}`);
    }
    
    console.log('\n📋 Tables:');
    data.tables.forEach(table => {
      console.log(`\n   📌 ${table.name} (${table.rowCount} rows)`);
      console.log(`      Columns: ${table.columns.map(c => c.column_name).join(', ')}`);
    });
    
    if (data.sampleConversations && data.sampleConversations.length > 0) {
      console.log('\n💬 Sample Conversations (last 5):');
      data.sampleConversations.forEach((conv, idx) => {
        console.log(`   ${idx + 1}. [${conv.role}] ${conv.content_preview}...`);
        console.log(`      User: ${conv.user_id}, Session: ${conv.session_id}, Time: ${conv.created_at}`);
      });
    }
    
    console.log('\n✅ Inspection completed!');
    
  } catch (error) {
    console.error('\n❌ Error inspecting database:', error.message);
    console.error('Error details:', error);
  }
}

inspectDatabase();

