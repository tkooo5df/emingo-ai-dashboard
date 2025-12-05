// Test database connection
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://postgres:vOZx4og262UxQeT@localhost:5432',
  ssl: false
});

console.log('Testing database connection...');

try {
  // Test basic connection
  const result = await pool.query('SELECT NOW()');
  console.log('✅ Database connected!');
  console.log('Current time:', result.rows[0].now);

  // Test account_transactions table
  const tableCheck = await pool.query(`
    SELECT COUNT(*) as count 
    FROM account_transactions
  `);
  console.log('✅ account_transactions table accessible');
  console.log('Row count:', tableCheck.rows[0].count);

  // Test balance calculation
  const incomeResult = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM account_transactions WHERE type = $1',
    ['income']
  );
  const expenseResult = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM account_transactions WHERE type = $1',
    ['expense']
  );
  
  const balance = Number(incomeResult.rows[0].total) - Number(expenseResult.rows[0].total);
  console.log('✅ Balance calculation works!');
  console.log('Current balance:', balance);

  await pool.end();
  console.log('\n✅ All tests passed! Database is ready.');
  process.exit(0);
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  console.error('\n💡 Make sure:');
  console.error('   1. flyctl proxy 5432 -a emingo-db is running');
  console.error('   2. The proxy is connected to the database');
  await pool.end();
  process.exit(1);
}


