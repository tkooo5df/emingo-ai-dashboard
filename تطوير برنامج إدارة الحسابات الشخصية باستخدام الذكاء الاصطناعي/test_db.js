import pg from 'pg';
import { parse } from 'pg-connection-string';

// This script must be run with: node --env-file=.env.local test_db.js

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ CRITICAL ERROR: DATABASE_URL is not set. Run with: node --env-file=.env.local test_db.js');
    process.exit(1);
}

let poolConfig = parse(connectionString);

// Add SSL config for remote connection
if (!poolConfig.host.includes('localhost') && !poolConfig.host.includes('127.0.0.1')) {
    // The connection is failing the SSL handshake.
    // We will try connecting without SSL, as the dedicated IP might be on a private network
    // or the SSL setup is non-standard.
    poolConfig.ssl = false;
    console.log('⚠️ Bypassing SSL for dedicated IP connection attempt.');
}

console.log(`Attempting to connect to: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

const pool = new Pool(poolConfig);

(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
})();
