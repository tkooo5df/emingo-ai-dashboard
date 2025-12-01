// Test script to verify database connection and data saving
import pg from 'pg';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually
try {
  const envFile = readFileSync(join(__dirname, '.env.local'), 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
} catch (error) {
  console.log('⚠️  Could not load .env.local, using process.env');
}

const { Pool } = pg;

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:vOZx4og262UxQeT@localhost:5432';
const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test user ID (from database) - will be updated if user not found
let TEST_USER_ID = '97895c35-c4f4-4a69-8693-cd7abddb3f18';

async function testConnection() {
  console.log('\n🔌 Testing database connection...');
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    console.log('   Current time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Make sure flyctl proxy is running: flyctl proxy 5432 -a emingo-db');
    return false;
  }
}

async function testTables() {
  console.log('\n📋 Checking if tables exist...');
  try {
    const tables = [
      'users',
      'income',
      'expenses',
      'account_transactions',
      'projects',
      'goals',
      'budget',
      'user_settings',
      'user_profiles',
      'ai_conversations'
    ];

    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return false;
  }
}

async function testUserExists() {
  console.log('\n👤 Checking if test user exists...');
  try {
    // First, check all users
    const allUsers = await pool.query('SELECT id, email, name FROM users ORDER BY created_at DESC LIMIT 5');
    console.log(`   Found ${allUsers.rows.length} user(s) in database:`);
    allUsers.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Name: ${user.name || 'N/A'}`);
    });

    const result = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [TEST_USER_ID]);
    if (result.rows.length > 0) {
      console.log('✅ Test user found:');
      console.log('   ID:', result.rows[0].id);
      console.log('   Email:', result.rows[0].email);
      console.log('   Name:', result.rows[0].name);
      return true;
    } else {
      console.log('❌ Test user not found with ID:', TEST_USER_ID);
      if (allUsers.rows.length > 0) {
        console.log('💡 Using first available user instead:', allUsers.rows[0].id);
        TEST_USER_ID = allUsers.rows[0].id;
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    return false;
  }
}

async function testInsertIncome() {
  console.log('\n💰 Testing INSERT into income table...');
  try {
    const incomeId = randomUUID();
    const testData = {
      id: incomeId,
      user_id: TEST_USER_ID,
      amount: 1000.50,
      source: 'Test Income',
      category: 'Test Category',
      date: new Date().toISOString().split('T')[0],
      description: 'This is a test income entry',
      account_id: 'test-account-123',
      account_type: 'cash'
    };

    console.log('   Inserting:', testData);

    await pool.query(
      'INSERT INTO income (id, user_id, amount, source, category, date, description, account_id, account_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [testData.id, testData.user_id, testData.amount, testData.source, testData.category, testData.date, testData.description, testData.account_id, testData.account_type]
    );

    console.log('✅ Income inserted successfully');

    // Verify it was saved
    const verify = await pool.query('SELECT * FROM income WHERE id = $1', [incomeId]);
    if (verify.rows.length > 0) {
      console.log('✅ Verified: Income found in database');
      console.log('   Saved data:', verify.rows[0]);
      return true;
    } else {
      console.log('❌ Verification failed: Income not found after insert');
      return false;
    }
  } catch (error) {
    console.error('❌ Error inserting income:', error.message);
    console.error('   Full error:', error);
    return false;
  }
}

async function testInsertExpense() {
  console.log('\n💸 Testing INSERT into expenses table...');
  try {
    const expenseId = randomUUID();
    const testData = {
      id: expenseId,
      user_id: TEST_USER_ID,
      amount: 500.25,
      category: 'Test Expense Category',
      date: new Date().toISOString().split('T')[0],
      description: 'This is a test expense entry',
      account_id: 'test-account-456',
      account_type: 'ccp'
    };

    console.log('   Inserting:', testData);

    await pool.query(
      'INSERT INTO expenses (id, user_id, amount, category, date, description, account_id, account_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [testData.id, testData.user_id, testData.amount, testData.category, testData.date, testData.description, testData.account_id, testData.account_type]
    );

    console.log('✅ Expense inserted successfully');

    // Verify it was saved
    const verify = await pool.query('SELECT * FROM expenses WHERE id = $1', [expenseId]);
    if (verify.rows.length > 0) {
      console.log('✅ Verified: Expense found in database');
      console.log('   Saved data:', verify.rows[0]);
      return true;
    } else {
      console.log('❌ Verification failed: Expense not found after insert');
      return false;
    }
  } catch (error) {
    console.error('❌ Error inserting expense:', error.message);
    console.error('   Full error:', error);
    return false;
  }
}

async function testReadData() {
  console.log('\n📖 Testing READ from database...');
  try {
    // Read income
    const incomeResult = await pool.query(
      'SELECT * FROM income WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [TEST_USER_ID]
    );
    console.log(`✅ Found ${incomeResult.rows.length} income entries`);
    if (incomeResult.rows.length > 0) {
      console.log('   Latest income:', {
        id: incomeResult.rows[0].id,
        amount: incomeResult.rows[0].amount,
        source: incomeResult.rows[0].source,
        date: incomeResult.rows[0].date,
        account_id: incomeResult.rows[0].account_id,
        account_type: incomeResult.rows[0].account_type
      });
    }

    // Read expenses
    const expenseResult = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [TEST_USER_ID]
    );
    console.log(`✅ Found ${expenseResult.rows.length} expense entries`);
    if (expenseResult.rows.length > 0) {
      console.log('   Latest expense:', {
        id: expenseResult.rows[0].id,
        amount: expenseResult.rows[0].amount,
        category: expenseResult.rows[0].category,
        date: expenseResult.rows[0].date,
        account_id: expenseResult.rows[0].account_id,
        account_type: expenseResult.rows[0].account_type
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Error reading data:', error.message);
    return false;
  }
}

async function testAccountTransaction() {
  console.log('\n💳 Testing INSERT into account_transactions table...');
  try {
    const transactionId = randomUUID();
    const testData = {
      id: transactionId,
      user_id: TEST_USER_ID,
      type: 'income',
      amount: 750.00,
      name: 'Test Transaction',
      category: 'Test',
      date: new Date().toISOString().split('T')[0],
      account_type: 'creditcard',
      note: 'Test transaction note'
    };

    console.log('   Inserting:', testData);

    await pool.query(
      'INSERT INTO account_transactions (id, user_id, type, amount, name, category, date, account_type, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [testData.id, testData.user_id, testData.type, testData.amount, testData.name, testData.category, testData.date, testData.account_type, testData.note]
    );

    console.log('✅ Account transaction inserted successfully');

    // Verify it was saved
    const verify = await pool.query('SELECT * FROM account_transactions WHERE id = $1', [transactionId]);
    if (verify.rows.length > 0) {
      console.log('✅ Verified: Transaction found in database');
      console.log('   Saved data:', verify.rows[0]);
      return true;
    } else {
      console.log('❌ Verification failed: Transaction not found after insert');
      return false;
    }
  } catch (error) {
    console.error('❌ Error inserting transaction:', error.message);
    console.error('   Full error:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Database Tests...');
  console.log('='.repeat(60));
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log(`Connection String: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
  console.log('='.repeat(60));

  const results = {
    connection: false,
    tables: false,
    user: false,
    insertIncome: false,
    insertExpense: false,
    insertTransaction: false,
    readData: false
  };

  // Test 1: Connection
  results.connection = await testConnection();
  if (!results.connection) {
    console.log('\n❌ Cannot proceed - database connection failed');
    await pool.end();
    process.exit(1);
  }

  // Test 2: Tables
  results.tables = await testTables();

  // Test 3: User exists (this may update TEST_USER_ID)
  results.user = await testUserExists();
  if (!results.user) {
    console.log('\n❌ Cannot proceed - no users found in database');
    console.log('   Please log in through the app first to create a user');
    await pool.end();
    process.exit(1);
  }
  console.log(`\n✅ Using user ID: ${TEST_USER_ID}`);

  // Test 4: Insert Income
  results.insertIncome = await testInsertIncome();

  // Test 5: Insert Expense
  results.insertExpense = await testInsertExpense();

  // Test 6: Insert Transaction
  results.insertTransaction = await testAccountTransaction();

  // Test 7: Read Data
  results.readData = await testReadData();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(60));
  console.log(`Connection:        ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Tables Check:       ${results.tables ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Exists:        ${results.user ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Insert Income:      ${results.insertIncome ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Insert Expense:     ${results.insertExpense ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Insert Transaction: ${results.insertTransaction ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Read Data:          ${results.readData ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60));

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  console.log(`\n📈 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('✅ All tests passed! Database is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }

  await pool.end();
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

