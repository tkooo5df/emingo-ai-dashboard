// Database connection and utilities for EMINGO
// Note: This file is now only used by the API server (server/api.js)
// Frontend code should use src/lib/api.ts instead

import pg from 'pg';

const { Pool } = pg;

// Create connection pool
let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = import.meta.env.VITE_DATABASE_URL || 
      'postgres://postgres:vOZx4og262UxQeT@localhost:5432';
    
    const isLocalhost = connectionString.includes('localhost');
    
    pool = new Pool({
      connectionString,
      // SSL only for external connections
      ...(isLocalhost ? {} : {
        ssl: {
          rejectUnauthorized: false
        }
      }),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Error handling
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

// Helper function for queries
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Close connection
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

