// API Server for database operations
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';

// Load .env.local file manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envPath = join(__dirname, '..', '.env.local');
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        // Always set, even if exists (to allow updates)
        process.env[key] = value;
      }
    }
  });
  console.log('✅ Loaded environment variables from .env.local');
  // Log which API keys are available (without showing full key)
  if (process.env.YOU_API_KEY) {
    const key = process.env.YOU_API_KEY;
    console.log(`✅ YOU_API_KEY found (${key.substring(0, 10)}...${key.substring(key.length - 4)})`);
  }
  if (process.env.VITE_YOU_API_KEY) {
    const key = process.env.VITE_YOU_API_KEY;
    console.log(`✅ VITE_YOU_API_KEY found (${key.substring(0, 10)}...${key.substring(key.length - 4)})`);
  }
} catch (err) {
  // .env.local not found, that's okay - use environment variables directly
  console.log('ℹ️  .env.local not found, using environment variables');
}

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Google OAuth Client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/auth/callback';

let oauth2Client = null;
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  oauth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

// Generate JWT token
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication middleware - verify JWT token
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [AUTH] Missing or invalid authorization header');
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      console.log('❌ [AUTH] Invalid token or missing userId');
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }
    
    console.log('✅ [AUTH] User authenticated:', {
      userId: decoded.userId,
      email: decoded.email,
      endpoint: req.path,
      method: req.method
    });
    
    // Store user_id in request for use in routes
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    console.error('❌ [AUTH] Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized', message: error.message });
  }
}

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

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

// Helper to ensure connection
async function ensureConnection() {
  try {
    const result = await pool.query('SELECT 1');
    return true;
  } catch (error) {
    const errorMsg = error?.message || error?.toString() || 'Unknown connection error';
    console.error('❌ Connection check failed:', errorMsg);
    console.error('Error code:', error?.code);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      syscall: error?.syscall,
      address: error?.address,
      port: error?.port
    });
    console.error('💡 Connection string:', connectionString.replace(/:[^:@]+@/, ':****@')); // Hide password
    throw error; // Re-throw to get full error details
  }
}

// Migrate user_settings table to add missing columns
async function migrateUserSettingsTable() {
  try {
    console.log('🔄 [MIGRATION] Checking user_settings table structure...');
    
    // First check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_settings'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('⚠️ [MIGRATION] user_settings table does not exist, will be created by createAllTables()');
      return;
    }
    
    // Check which columns exist
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_settings' 
      AND table_schema = 'public'
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log('📊 [MIGRATION] Existing columns:', existingColumns);
    
    // Add missing columns one by one with error handling
    const columnsToAdd = [
      { name: 'language', sql: "ALTER TABLE user_settings ADD COLUMN language VARCHAR(10) DEFAULT 'en'" },
      { name: 'currency', sql: "ALTER TABLE user_settings ADD COLUMN currency VARCHAR(10) DEFAULT 'DZD'" },
      { name: 'custom_categories', sql: "ALTER TABLE user_settings ADD COLUMN custom_categories JSONB DEFAULT '[]'::jsonb" },
      { name: 'accounts', sql: "ALTER TABLE user_settings ADD COLUMN accounts JSONB DEFAULT '[]'::jsonb" },
      { name: 'analytics_preferences', sql: "ALTER TABLE user_settings ADD COLUMN analytics_preferences JSONB DEFAULT '{}'::jsonb" }
    ];
    
    let addedCount = 0;
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        try {
          console.log(`➕ [MIGRATION] Adding column: ${column.name}`);
          await pool.query(column.sql);
          console.log(`✅ [MIGRATION] Added column: ${column.name}`);
          addedCount++;
        } catch (addError) {
          // Check if error is because column already exists (race condition)
          if (addError.message && addError.message.includes('already exists')) {
            console.log(`ℹ️ [MIGRATION] Column ${column.name} already exists (race condition)`);
          } else {
            console.error(`❌ [MIGRATION] Error adding column ${column.name}:`, addError.message);
            throw addError; // Re-throw if it's a different error
          }
        }
      } else {
        console.log(`✓ [MIGRATION] Column ${column.name} already exists`);
      }
    }
    
    if (addedCount > 0) {
      console.log(`✅ [MIGRATION] Added ${addedCount} column(s) to user_settings table`);
    } else {
      console.log('✅ [MIGRATION] user_settings table is up to date');
    }
  } catch (error) {
    console.error('❌ [MIGRATION] Error migrating user_settings table:', error);
    console.error('❌ [MIGRATION] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error; // Re-throw to ensure we know about the error
  }
}

// Create all required tables (only if they don't exist - preserves existing data)
async function createAllTables() {
  // Always create tables using IF NOT EXISTS to ensure all tables exist
  // This allows us to add new tables (like debts) even if other tables already exist
  console.log('📦 Creating/checking database tables (using IF NOT EXISTS)...');

  const tables = [
    // Users table (for storing user info)
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      name VARCHAR(255),
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS income (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL,
      source VARCHAR(255),
      description TEXT,
      category VARCHAR(100),
      date DATE NOT NULL,
      account_id VARCHAR(255),
      account_type VARCHAR(20) CHECK (account_type IN ('ccp', 'cash', 'creditcard')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      date DATE NOT NULL,
      account_id VARCHAR(255),
      account_type VARCHAR(20) CHECK (account_type IN ('ccp', 'cash', 'creditcard')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS budget (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category VARCHAR(100) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      savings DECIMAL(10, 2) DEFAULT 0,
      necessities DECIMAL(10, 2) DEFAULT 0,
      wants DECIMAL(10, 2) DEFAULT 0,
      investments DECIMAL(10, 2) DEFAULT 0,
      ai_recommendation TEXT,
      generated_at TIMESTAMP,
      period VARCHAR(20) DEFAULT 'monthly',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, category)
    )`,
    `CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      client VARCHAR(255),
      description TEXT,
      status VARCHAR(50) DEFAULT 'ongoing',
      expected_earnings DECIMAL(10, 2) DEFAULT 0,
      hours_spent DECIMAL(10, 2) DEFAULT 0,
      start_date DATE,
      end_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS goals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      type VARCHAR(50) DEFAULT 'financial',
      description TEXT,
      target DECIMAL(10, 2) NOT NULL,
      current DECIMAL(10, 2) DEFAULT 0,
      deadline DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS account_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
      amount DECIMAL(10, 2) NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      account_type VARCHAR(20) CHECK (account_type IN ('ccp', 'cash', 'creditcard')),
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS user_profiles (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255),
      age INTEGER,
      current_work VARCHAR(255),
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
           `CREATE TABLE IF NOT EXISTS user_settings (
             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
             user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
             currency VARCHAR(10) DEFAULT 'DZD',
             language VARCHAR(10) DEFAULT 'en',
             custom_categories JSONB DEFAULT '[]'::jsonb,
             accounts JSONB DEFAULT '[]'::jsonb,
             analytics_preferences JSONB DEFAULT '{}'::jsonb,
             created_at TIMESTAMP DEFAULT NOW(),
             updated_at TIMESTAMP DEFAULT NOW()
           )`,
    `CREATE TABLE IF NOT EXISTS ai_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id UUID NOT NULL DEFAULT gen_random_uuid(),
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS debts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('given', 'received')),
      amount DECIMAL(10, 2) NOT NULL,
      person_name VARCHAR(255) NOT NULL,
      description TEXT,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'received')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
  ];

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_income_date ON income(date)',
    'CREATE INDEX IF NOT EXISTS idx_income_category ON income(category)',
    'CREATE INDEX IF NOT EXISTS idx_income_account_type ON income(account_type)',
    'CREATE INDEX IF NOT EXISTS idx_income_created_at ON income(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_account_type ON expenses(account_type)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_budget_user_id ON budget(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_budget_category ON budget(category)',
    'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
    'CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date)',
    'CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline)',
    'CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(type)',
    'CREATE INDEX IF NOT EXISTS idx_account_transactions_user_id ON account_transactions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_account_transactions_date ON account_transactions(date)',
    'CREATE INDEX IF NOT EXISTS idx_account_transactions_type ON account_transactions(type)',
    'CREATE INDEX IF NOT EXISTS idx_account_transactions_account_type ON account_transactions(account_type)',
    'CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id)',
    'CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type)',
    'CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status)',
    'CREATE INDEX IF NOT EXISTS idx_debts_date ON debts(date)'
  ];

  try {
    // Create all tables (using IF NOT EXISTS to preserve existing data)
    console.log('📦 Creating database tables (if they don\'t exist)...');
    for (const table of tables) {
      try {
        await pool.query(table);
      } catch (err) {
        // Log error but continue (table might already exist with different schema)
        console.warn(`⚠️  Warning creating table: ${err.message}`);
      }
    }
    console.log('✅ All tables checked/created');
    
    // Create indexes
    console.log('📊 Creating indexes...');
    for (const index of indexes) {
      try {
        await pool.query(index);
      } catch (err) {
        // Ignore errors if indexes already exist
        if (!err.message.includes('already exists')) {
          console.warn(`⚠️  Warning creating index: ${err.message}`);
        }
      }
    }
    console.log('✅ All indexes created');
    
    // Migrate existing tables to add missing columns
    console.log('🔄 Running table migrations...');
    await migrateUserSettingsTable();
    console.log('✅ All migrations complete');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

// Test connection on startup and create tables
// Use async/await for better error handling
(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    await createAllTables();
    console.log('✅ Database setup complete');
  } catch (err) {
    console.error('❌ Database connection/setup failed:', err.message);
    console.error('Full error:', err);
    console.error('Error code:', err.code);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      address: err.address,
      port: err.port
    });
    console.log('💡 Make sure flyctl proxy is running: flyctl proxy 5432 -a emingo-db');
    console.log('💡 Connection string:', connectionString.replace(/:[^:@]+@/, ':****@')); // Hide password
  }
})();

// Health check
console.log('🔧 Registering route: GET /api/health');
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth endpoints
// Get Google OAuth URL
console.log('🔧 Registering route: GET /api/auth/google/url');
app.get('/api/auth/google/url', (req, res) => {
  try {
    console.log('📡 GET /api/auth/google/url called');
    console.log('🔑 GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'NOT SET');
    console.log('🔑 GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
    
    if (!oauth2Client) {
      console.log('⚠️  OAuth2Client not initialized');
      return res.status(500).json({ 
        error: 'Google OAuth not configured',
        message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local'
      });
    }

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'consent'
    });

    console.log('✅ Generated OAuth URL');
    res.json({ url: authUrl });
  } catch (error) {
    console.error('❌ Error generating OAuth URL:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to generate OAuth URL',
      message: error.message 
    });
  }
});

// Handle Google OAuth callback
app.post('/api/auth/google/callback', async (req, res) => {
  try {
    console.log('📡 POST /api/auth/google/callback called');
    
    if (!oauth2Client) {
      console.error('❌ OAuth2Client not initialized');
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    const { code } = req.body;
    if (!code) {
      console.error('❌ No authorization code provided');
      return res.status(400).json({ error: 'Authorization code required' });
    }

    console.log('🔄 Exchanging code for tokens...');
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('✅ Tokens received, verifying ID token...');
    // Get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const avatar_url = payload.picture;

    if (!email) {
      console.error('❌ No email in Google payload');
      return res.status(400).json({ error: 'Email not provided by Google' });
    }

    console.log(`👤 Google user: ${email} (${name || 'No name'})`);

    // Ensure database connection
    console.log('🔌 Checking database connection...');
    try {
      await ensureConnection();
      // Don't recreate tables here - they should already exist from startup
      // Only check if user table exists, if not, create it (without dropping)
      const tableCheck = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )`
      );
      if (!tableCheck.rows[0].exists) {
        console.log('⚠️  Users table not found, creating tables...');
        await createAllTables();
      }
    } catch (dbError) {
      console.error('❌ Database connection/setup failed during OAuth callback:', dbError.message);
      const errorMessage = dbError.message || 'Database connection failed';
      return res.status(503).json({ 
        error: 'Database unavailable',
        message: `${errorMessage}. Please make sure flyctl proxy is running: flyctl proxy 5432 -a emingo-db`,
        hint: 'Run "flyctl proxy 5432 -a emingo-db" in a separate terminal'
      });
    }

    // Check if user exists by email
    console.log('🔍 Checking if user exists...');
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    let actualUserId;
    if (existingUser.rows.length > 0) {
      // User exists, update their info
      actualUserId = existingUser.rows[0].id;
      console.log(`✅ User exists, updating: ${actualUserId}`);
      await pool.query(
        `UPDATE users SET name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3`,
        [name || null, avatar_url || null, actualUserId]
      );
    } else {
      // Create new user
      actualUserId = randomUUID();
      console.log(`✅ Creating new user: ${actualUserId}`);
      await pool.query(
        `INSERT INTO users (id, email, name, avatar_url, updated_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [actualUserId, email.toLowerCase(), name || null, avatar_url || null]
      );
    }

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = generateToken(actualUserId, email);

    console.log('✅ Google OAuth callback successful');
    res.json({
      success: true,
      token,
      user: {
        id: actualUserId,
        email: email.toLowerCase(),
        name,
        avatar_url
      }
    });
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message || 'Failed to complete Google authentication'
    });
  }
});

// Email/Password Signup
console.log('🔧 Registering route: POST /api/auth/signup');
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = randomUUID();
    await pool.query(
      'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
      [userId, email.toLowerCase(), passwordHash, name || null]
    );

    // Generate JWT token
    const token = generateToken(userId, email);

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: name || null,
        avatar_url: null,
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: 'Failed to create account',
      message: error.message 
    });
  }
});

// Email/Password Login
console.log('🔧 Registering route: POST /api/auth/login');
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, name, avatar_url FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || null,
        avatar_url: user.avatar_url || null,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login',
      message: error.message 
    });
  }
});

// Get current user
console.log('🔧 Registering route: GET /api/auth/me');
app.get('/api/auth/me', authenticateUser, async (req, res) => {
  try {
    console.log('📥 [GET /api/auth/me] Request received');
    console.log('👤 [GET /api/auth/me] User ID from token:', req.userId);
    console.log('📧 [GET /api/auth/me] User email from token:', req.userEmail);
    
    const result = await pool.query(
      'SELECT id, email, name, avatar_url FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      console.error('❌ [GET /api/auth/me] User not found in database:', req.userId);
      // List all users for debugging
      const allUsers = await pool.query('SELECT id, email, name FROM users ORDER BY created_at DESC LIMIT 5');
      console.log('👥 [GET /api/auth/me] Available users in database:', allUsers.rows);
      return res.status(404).json({ 
        error: 'User not found',
        message: `User with ID ${req.userId} not found in database`,
        tokenUserId: req.userId,
        availableUsers: allUsers.rows
      });
    }

    console.log('✅ [GET /api/auth/me] User found:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ [GET /api/auth/me] Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Debug endpoint to check current user ID from token
console.log('🔧 Registering route: GET /api/debug/user');
app.get('/api/debug/user', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📥 [GET /api/debug/user] Request received');
    console.log('👤 [GET /api/debug/user] User ID from token:', userId);
    
    // Get user from database
    const userResult = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0] || null;
    
    // Get all users for comparison
    const allUsers = await pool.query('SELECT id, email, name FROM users ORDER BY created_at DESC LIMIT 10');
    
    // Get profile
    const profileResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    const profile = profileResult.rows[0] || null;
    
    // Get settings
    const settingsResult = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
    const settings = settingsResult.rows[0] || null;
    
    // Count data
    const [incomeCount, expensesCount, projectsCount, goalsCount, transactionsCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM income WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM expenses WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM projects WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM goals WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM account_transactions WHERE user_id = $1', [userId])
    ]);
    
    const debugInfo = {
      token: {
        userId: userId,
        email: req.userEmail
      },
      database: {
        user: user,
        profile: profile,
        settings: settings,
        dataCounts: {
          income: Number(incomeCount.rows[0]?.count || 0),
          expenses: Number(expensesCount.rows[0]?.count || 0),
          projects: Number(projectsCount.rows[0]?.count || 0),
          goals: Number(goalsCount.rows[0]?.count || 0),
          transactions: Number(transactionsCount.rows[0]?.count || 0)
        }
      },
      allUsers: allUsers.rows,
      match: user ? (user.id === userId) : false
    };
    
    console.log('📊 [GET /api/debug/user] Debug info:', JSON.stringify(debugInfo, null, 2));
    res.json(debugInfo);
  } catch (error) {
    console.error('❌ [GET /api/debug/user] Error:', error);
    res.status(500).json({ error: 'Failed to get debug info', message: error.message });
  }
});

// User endpoints - create or update user (for backward compatibility)
app.post('/api/users/me', authenticateUser, async (req, res) => {
  try {
    const { email, name, avatar_url } = req.body;
    
    // Insert or update user
    await pool.query(
      `INSERT INTO users (id, email, name, avatar_url, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) 
       DO UPDATE SET email = $2, name = $3, avatar_url = $4, updated_at = NOW()`,
      [req.userId, email, name || null, avatar_url || null]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

// Income endpoints
app.get('/api/income', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📥 [GET /api/income] Request received');
    console.log('👤 [GET /api/income] User ID from token:', userId);
    
    if (!userId) {
      console.error('❌ [GET /api/income] No user ID found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure connection first
    await ensureConnection();
    console.log('🔍 [GET /api/income] Querying database for user_id:', userId);
    
    const result = await pool.query(
      'SELECT id, amount, source, category, date, description, account_id, account_type FROM income WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [userId]
    );
    
    console.log(`📊 [GET /api/income] Found ${result.rows.length} income entries for user ${userId}`);
    if (result.rows.length > 0) {
      console.log('📊 [GET /api/income] First entry:', result.rows[0]);
    } else {
      console.log('⚠️ [GET /api/income] No income entries found for this user');
      // Check if user exists
      const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
      console.log('👤 [GET /api/income] User check result:', userCheck.rows.length > 0 ? userCheck.rows[0] : 'User not found');
    }
    
    const mappedData = result.rows.map(row => ({
      id: row.id,
      amount: Number(row.amount),
      source: row.source || '',
      category: row.category || '',
      date: row.date,
      description: row.description || undefined,
      account_id: row.account_id || undefined,
      account_type: row.account_type || undefined,
    }));
    
    console.log('✅ [GET /api/income] Returning data:', mappedData.length, 'entries');
    res.json(mappedData);
  } catch (error) {
    console.error('❌ [GET /api/income] Error fetching income:', error.message);
    console.error('❌ [GET /api/income] Full error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch income',
      message: error.message,
      hint: 'Make sure flyctl proxy is running: flyctl proxy 5432 -a emingo-db'
    });
  }
});

app.post('/api/income', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('📥 [POST /api/income] Received income data');
    console.log('👤 [POST /api/income] User ID from token:', userId);
    console.log('📦 [POST /api/income] Request body:', JSON.stringify(req.body, null, 2));

    const { id, amount, source, category, date, description, account_id, account_type } = req.body;
    
    if (!amount || !source || !date) {
      console.error('❌ [POST /api/income] Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Amount, source, and date are required' 
      });
    }

    const incomeId = id || randomUUID();
    
    console.log('💾 [POST /api/income] Preparing to insert:', {
      incomeId,
      userId,
      amount,
      source,
      category,
      date,
      description,
      account_id,
      account_type
    });
    
    // Verify user exists first
    const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      console.error('❌ [POST /api/income] User not found in database:', userId);
      return res.status(404).json({ 
        error: 'User not found',
        message: `User with ID ${userId} does not exist in database` 
      });
    }
    console.log('✅ [POST /api/income] User verified:', userCheck.rows[0].email);
    
    // Insert into income table with account_id and account_type
    const insertQuery = 'INSERT INTO income (id, user_id, amount, source, category, date, description, account_id, account_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
    const insertValues = [incomeId, userId, amount, source, category || null, date, description || null, account_id || null, account_type || null];
    console.log('💾 [POST /api/income] Executing INSERT query');
    console.log('💾 [POST /api/income] Query:', insertQuery);
    console.log('💾 [POST /api/income] Values:', insertValues);
    
    await pool.query(insertQuery, insertValues);
    
    console.log('✅ [POST /api/income] Successfully inserted into income table');
    
    // Verify it was saved
    const verifyResult = await pool.query('SELECT * FROM income WHERE id = $1 AND user_id = $2', [incomeId, userId]);
    if (verifyResult.rows.length > 0) {
      console.log('✅ [POST /api/income] Verified: Data saved correctly:', verifyResult.rows[0]);
    } else {
      console.error('❌ [POST /api/income] WARNING: Data not found after insert!');
    }
    
    // Also insert into account_transactions for synchronization
    await pool.query(
      'INSERT INTO account_transactions (id, user_id, type, amount, name, category, date, account_type, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [incomeId, userId, 'income', amount, source || 'Income', category || null, date, account_type || null, description || null]
    );
    
    console.log('✅ [INCOME] Successfully inserted into account_transactions');
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ [INCOME] Error adding income:', error);
    console.error('❌ [INCOME] Full error:', error);
    console.error('❌ [INCOME] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to add income',
      message: error.message 
    });
  }
});

console.log('🔧 Registering route: PATCH /api/income/:id');
app.patch('/api/income/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.amount !== undefined) {
      fields.push(`amount = $${paramIndex++}`);
      values.push(parseFloat(updates.amount));
    }
    if (updates.source !== undefined) {
      fields.push(`source = $${paramIndex++}`);
      values.push(updates.source);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }
    if (updates.date !== undefined) {
      fields.push(`date = $${paramIndex++}`);
      values.push(updates.date);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.account_id !== undefined) {
      fields.push(`account_id = $${paramIndex++}`);
      values.push(updates.account_id);
    }
    if (updates.account_type !== undefined) {
      fields.push(`account_type = $${paramIndex++}`);
      values.push(updates.account_type);
    }

    if (fields.length === 0) {
      return res.json({ success: true });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);
    values.push(userId);

    await pool.query(
      `UPDATE income SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
      values
    );
    
    // Also update account_transactions
    if (updates.amount !== undefined || updates.source !== undefined || updates.category !== undefined || updates.date !== undefined || updates.description !== undefined || updates.account_type !== undefined) {
      const transactionFields = [];
      const transactionValues = [];
      let transactionParamIndex = 1;
      
      if (updates.amount !== undefined) {
        transactionFields.push(`amount = $${transactionParamIndex++}`);
        transactionValues.push(parseFloat(updates.amount));
      }
      if (updates.source !== undefined) {
        transactionFields.push(`name = $${transactionParamIndex++}`);
        transactionValues.push(updates.source);
      }
      if (updates.category !== undefined) {
        transactionFields.push(`category = $${transactionParamIndex++}`);
        transactionValues.push(updates.category);
      }
      if (updates.date !== undefined) {
        transactionFields.push(`date = $${transactionParamIndex++}`);
        transactionValues.push(updates.date);
      }
      if (updates.description !== undefined) {
        transactionFields.push(`note = $${transactionParamIndex++}`);
        transactionValues.push(updates.description);
      }
      if (updates.account_type !== undefined) {
        transactionFields.push(`account_type = $${transactionParamIndex++}`);
        transactionValues.push(updates.account_type);
      }
      
      if (transactionFields.length > 0) {
        transactionValues.push(id);
        transactionValues.push(userId);
        await pool.query(
          `UPDATE account_transactions SET ${transactionFields.join(', ')} WHERE id = $${transactionParamIndex} AND user_id = $${transactionParamIndex + 1}`,
          transactionValues
        );
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ error: 'Failed to update income' });
  }
});

console.log('🔧 Registering route: DELETE /api/income/:id');
app.delete('/api/income/:id', authenticateUser, async (req, res) => {
  try {
    console.log('📥 [DELETE /api/income/:id] Request received');
    console.log('👤 [DELETE /api/income/:id] User ID from token:', req.userId);
    console.log('🆔 [DELETE /api/income/:id] Income ID:', req.params.id);
    
    const userId = req.userId;
    if (!userId) {
      console.error('❌ [DELETE /api/income/:id] No user ID found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    console.log('🗑️  [DELETE /api/income/:id] Deleting income entry:', id);
    
    // Delete from income table
    const incomeResult = await pool.query('DELETE FROM income WHERE id = $1 AND user_id = $2', [id, userId]);
    console.log('✅ [DELETE /api/income/:id] Deleted from income table, rows affected:', incomeResult.rowCount);
    
    // Also delete from account_transactions
    const transactionResult = await pool.query('DELETE FROM account_transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    console.log('✅ [DELETE /api/income/:id] Deleted from account_transactions, rows affected:', transactionResult.rowCount);
    
    console.log('✅ [DELETE /api/income/:id] Successfully deleted income entry');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ [DELETE /api/income/:id] Error deleting income:', error);
    console.error('❌ [DELETE /api/income/:id] Error message:', error.message);
    console.error('❌ [DELETE /api/income/:id] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to delete income', message: error.message });
  }
});

// Expenses endpoints
app.get('/api/expenses', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📥 [GET /api/expenses] Request received');
    console.log('👤 [GET /api/expenses] User ID from token:', userId);
    
    if (!userId) {
      console.error('❌ [GET /api/expenses] No user ID found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure connection first
    await ensureConnection();
    console.log('🔍 [GET /api/expenses] Querying database for user_id:', userId);
    
    const result = await pool.query(
      'SELECT id, amount, category, date, description, account_id, account_type FROM expenses WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [userId]
    );
    
    console.log(`📊 [GET /api/expenses] Found ${result.rows.length} expense entries for user ${userId}`);
    if (result.rows.length > 0) {
      console.log('📊 [GET /api/expenses] First entry:', result.rows[0]);
    } else {
      console.log('⚠️ [GET /api/expenses] No expense entries found for this user');
      // Check if user exists
      const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
      console.log('👤 [GET /api/expenses] User check result:', userCheck.rows.length > 0 ? userCheck.rows[0] : 'User not found');
    }
    
    const mappedData = result.rows.map(row => ({
      id: row.id,
      amount: Number(row.amount),
      category: row.category,
      date: row.date,
      description: row.description || undefined,
      account_id: row.account_id || undefined,
      account_type: row.account_type || undefined,
    }));
    
    console.log('✅ [GET /api/expenses] Returning data:', mappedData.length, 'entries');
    res.json(mappedData);
  } catch (error) {
    console.error('❌ [GET /api/expenses] Error fetching expenses:', error.message);
    console.error('❌ [GET /api/expenses] Full error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch expenses',
      message: error.message,
      hint: 'Make sure flyctl proxy is running: flyctl proxy 5432 -a emingo-db'
    });
  }
});

app.post('/api/expenses', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('📥 [POST /api/expenses] Received expense data');
    console.log('👤 [POST /api/expenses] User ID from token:', userId);
    console.log('📦 [POST /api/expenses] Request body:', JSON.stringify(req.body, null, 2));

    const { id, amount, category, date, description, account_id, account_type } = req.body;
    
    if (!amount || !date) {
      console.error('❌ [POST /api/expenses] Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Amount and date are required' 
      });
    }
    
    // Use provided category or default to "Other" if not provided
    const finalCategory = category || 'Other';

    const expenseId = id || randomUUID();
    
    console.log('💾 [POST /api/expenses] Preparing to insert:', {
      expenseId,
      userId,
      amount,
      category: finalCategory,
      date,
      description,
      account_id,
      account_type
    });
    
    // Verify user exists first
    const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      console.error('❌ [POST /api/expenses] User not found in database:', userId);
      return res.status(404).json({ 
        error: 'User not found',
        message: `User with ID ${userId} does not exist in database` 
      });
    }
    console.log('✅ [POST /api/expenses] User verified:', userCheck.rows[0].email);
    
    // Insert into expenses table with account_id and account_type
    const insertQuery = 'INSERT INTO expenses (id, user_id, amount, category, date, description, account_id, account_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    const insertValues = [expenseId, userId, amount, finalCategory, date, description || null, account_id || null, account_type || null];
    console.log('💾 [POST /api/expenses] Executing INSERT query');
    console.log('💾 [POST /api/expenses] Query:', insertQuery);
    console.log('💾 [POST /api/expenses] Values:', insertValues);
    
    await pool.query(insertQuery, insertValues);
    
    console.log('✅ [POST /api/expenses] Successfully inserted into expenses table');
    
    // Verify it was saved
    const verifyResult = await pool.query('SELECT * FROM expenses WHERE id = $1 AND user_id = $2', [expenseId, userId]);
    if (verifyResult.rows.length > 0) {
      console.log('✅ [POST /api/expenses] Verified: Data saved correctly:', verifyResult.rows[0]);
    } else {
      console.error('❌ [POST /api/expenses] WARNING: Data not found after insert!');
    }
    
    // Also insert into account_transactions for synchronization
    await pool.query(
      'INSERT INTO account_transactions (id, user_id, type, amount, name, category, date, account_type, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [expenseId, userId, 'expense', amount, description || finalCategory || 'Expense', finalCategory, date, account_type || null, description || null]
    );
    
    console.log('✅ [EXPENSES] Successfully inserted into account_transactions');
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ [EXPENSES] Error adding expense:', error);
    console.error('❌ [EXPENSES] Full error:', error);
    console.error('❌ [EXPENSES] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to add expense',
      message: error.message 
    });
  }
});

console.log('🔧 Registering route: PATCH /api/expenses/:id');
app.patch('/api/expenses/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.amount !== undefined) {
      fields.push(`amount = $${paramIndex++}`);
      values.push(parseFloat(updates.amount));
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }
    if (updates.date !== undefined) {
      fields.push(`date = $${paramIndex++}`);
      values.push(updates.date);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.account_id !== undefined) {
      fields.push(`account_id = $${paramIndex++}`);
      values.push(updates.account_id);
    }
    if (updates.account_type !== undefined) {
      fields.push(`account_type = $${paramIndex++}`);
      values.push(updates.account_type);
    }

    if (fields.length === 0) {
      return res.json({ success: true });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);
    values.push(userId);

    await pool.query(
      `UPDATE expenses SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
      values
    );
    
    // Also update account_transactions
    if (updates.amount !== undefined || updates.category !== undefined || updates.date !== undefined || updates.description !== undefined || updates.account_type !== undefined) {
      const transactionFields = [];
      const transactionValues = [];
      let transactionParamIndex = 1;
      
      if (updates.amount !== undefined) {
        transactionFields.push(`amount = $${transactionParamIndex++}`);
        transactionValues.push(parseFloat(updates.amount));
      }
      if (updates.description !== undefined) {
        transactionFields.push(`name = $${transactionParamIndex++}`);
        transactionValues.push(updates.description);
      }
      if (updates.category !== undefined) {
        transactionFields.push(`category = $${transactionParamIndex++}`);
        transactionValues.push(updates.category);
      }
      if (updates.date !== undefined) {
        transactionFields.push(`date = $${transactionParamIndex++}`);
        transactionValues.push(updates.date);
      }
      if (updates.description !== undefined) {
        transactionFields.push(`note = $${transactionParamIndex++}`);
        transactionValues.push(updates.description);
      }
      if (updates.account_type !== undefined) {
        transactionFields.push(`account_type = $${transactionParamIndex++}`);
        transactionValues.push(updates.account_type);
      }
      
      if (transactionFields.length > 0) {
        transactionValues.push(id);
        transactionValues.push(userId);
        await pool.query(
          `UPDATE account_transactions SET ${transactionFields.join(', ')} WHERE id = $${transactionParamIndex} AND user_id = $${transactionParamIndex + 1}`,
          transactionValues
        );
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

console.log('🔧 Registering route: DELETE /api/expenses/:id');
app.delete('/api/expenses/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    
    // Delete from expenses table
    await pool.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
    
    // Also delete from account_transactions
    await pool.query('DELETE FROM account_transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Projects endpoints
app.get('/api/projects', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure connection first
    await ensureConnection();
    const result = await pool.query(
      'SELECT id, name, client, end_date as deadline, expected_earnings, status, hours_spent FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      client: row.client || '',
      deadline: row.deadline || '',
      expectedEarnings: Number(row.expected_earnings || 0),
      status: row.status,
      hoursSpent: Number(row.hours_spent || 0),
    })));
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch projects',
      message: error.message,
      hint: 'Make sure flyctl proxy is running: flyctl proxy 5432 -a emingo-db'
    });
  }
});

app.post('/api/projects', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, name, client, deadline, expectedEarnings, status, hoursSpent } = req.body;
    await pool.query(
      'INSERT INTO projects (id, user_id, name, client, end_date, expected_earnings, status, hours_spent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, userId, name, client, deadline, expectedEarnings, status, hoursSpent]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ error: 'Failed to add project' });
  }
});

app.patch('/api/projects/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.hoursSpent !== undefined) {
      fields.push(`hours_spent = $${paramIndex++}`);
      values.push(updates.hoursSpent);
    }

    if (fields.length === 0) {
      return res.json({ success: true });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);
    values.push(userId); // Add user_id to WHERE clause

    await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
      values
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Goals endpoints
app.get('/api/goals', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure connection first
    await ensureConnection();
    const result = await pool.query(
      'SELECT id, name, title, type, target, current, deadline, description FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows.map(row => ({
      id: row.id,
      title: row.title || row.name,
      type: row.type || 'financial',
      target: Number(row.target),
      current: Number(row.current),
      deadline: row.deadline || '',
      description: row.description || undefined,
    })));
  } catch (error) {
    console.error('Error fetching goals:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch goals',
      message: error.message,
      hint: 'Make sure flyctl proxy is running: flyctl proxy 5432 -a emingo-db'
    });
  }
});

app.post('/api/goals', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, title, type, target, current, deadline, description } = req.body;
    await pool.query(
      'INSERT INTO goals (id, user_id, name, title, type, target, current, deadline, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, userId, title, title, type, target, current, deadline, description || null]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding goal:', error);
    res.status(500).json({ error: 'Failed to add goal' });
  }
});

app.patch('/api/goals/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.current !== undefined) {
      fields.push(`current = $${paramIndex++}`);
      values.push(updates.current);
    }
    if (updates.target !== undefined) {
      fields.push(`target = $${paramIndex++}`);
      values.push(updates.target);
    }

    if (fields.length === 0) {
      return res.json({ success: true });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);
    values.push(userId); // Add user_id to WHERE clause

    await pool.query(
      `UPDATE goals SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
      values
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

console.log('🔧 Registering route: DELETE /api/goals/:id');
app.delete('/api/goals/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Debts endpoints
console.log('🔧 Registering route: GET /api/debts');
app.get('/api/debts', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await ensureConnection();
    
    // Try to query first, if it fails with "does not exist", create the table
    let result;
    try {
      result = await pool.query(
        'SELECT id, type, amount, person_name, description, date, status FROM debts WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
        [userId]
      );
    } catch (queryError) {
      // If table doesn't exist, create it
      const errorMsg = queryError.message || String(queryError);
      console.log('🔍 [DEBTS] Query error detected:', errorMsg);
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('table')) {
        console.log('⚠️  Debts table not found, creating all tables...');
        try {
          await createAllTables();
          console.log('✅ [DEBTS] Tables created, retrying query...');
          // Wait a bit to ensure table is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          // Retry the query after creating tables
          result = await pool.query(
            'SELECT id, type, amount, person_name, description, date, status FROM debts WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
            [userId]
          );
          console.log('✅ [DEBTS] Query successful after table creation');
        } catch (createError) {
          console.error('❌ [DEBTS] Error creating tables:', createError);
          console.error('❌ [DEBTS] Create error message:', createError.message);
          console.error('❌ [DEBTS] Create error stack:', createError.stack);
          throw createError;
        }
      } else {
        console.error('❌ [DEBTS] Unexpected query error:', queryError);
        throw queryError;
      }
    }
    
    res.json(result.rows.map(row => ({
      id: row.id,
      type: row.type,
      amount: Number(row.amount),
      person_name: row.person_name,
      description: row.description || undefined,
      date: row.date,
      status: row.status
    })));
  } catch (error) {
    console.error('❌ [DEBTS] Error fetching debts:', error);
    console.error('❌ [DEBTS] Full error:', error);
    console.error('❌ [DEBTS] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch debts',
      message: error.message,
      hint: 'The debts table may not exist. Go to Database Settings and click "Create All Tables".'
    });
  }
});

console.log('🔧 Registering route: POST /api/debts');
app.post('/api/debts', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await ensureConnection();

    const { id, type, amount, person_name, description, date, status } = req.body;
    
    if (!type || !amount || !person_name || !date) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Type, amount, person_name, and date are required' 
      });
    }

    if (!['given', 'received'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "given" or "received"' });
    }

    const debtId = id || randomUUID();
    const debtStatus = status || 'pending';
    
    console.log('💾 [POST /api/debts] Inserting debt:', {
      debtId,
      userId,
      type,
      amount,
      person_name,
      date,
      status: debtStatus
    });
    
    // Try to insert, if table doesn't exist, create it first
    try {
      await pool.query(
        'INSERT INTO debts (id, user_id, type, amount, person_name, description, date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [debtId, userId, type, amount, person_name, description || null, date, debtStatus]
      );
      console.log('✅ [POST /api/debts] Debt inserted successfully');
    } catch (insertError) {
      // If table doesn't exist, create it
      const errorMsg = insertError.message || String(insertError);
      console.log('🔍 [POST /api/debts] Insert error detected:', errorMsg);
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('table')) {
        console.log('⚠️  Debts table not found, creating all tables...');
        try {
          await createAllTables();
          console.log('✅ [POST /api/debts] Tables created, retrying insert...');
          // Wait a bit to ensure table is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          // Retry the insert after creating tables
          await pool.query(
            'INSERT INTO debts (id, user_id, type, amount, person_name, description, date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [debtId, userId, type, amount, person_name, description || null, date, debtStatus]
          );
          console.log('✅ [POST /api/debts] Debt inserted successfully after table creation');
        } catch (createError) {
          console.error('❌ [POST /api/debts] Error creating tables:', createError);
          console.error('❌ [POST /api/debts] Create error message:', createError.message);
          console.error('❌ [POST /api/debts] Create error stack:', createError.stack);
          throw createError;
        }
      } else {
        console.error('❌ [POST /api/debts] Unexpected insert error:', insertError);
        throw insertError;
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ [POST /api/debts] Error adding debt:', error);
    console.error('❌ [POST /api/debts] Full error:', error);
    console.error('❌ [POST /api/debts] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to add debt',
      message: error.message,
      hint: 'The debts table may not exist. Go to Database Settings and click "Create All Tables".'
    });
  }
});

console.log('🔧 Registering route: PATCH /api/debts/:id');
app.patch('/api/debts/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      if (!['pending', 'paid', 'received'].includes(updates.status)) {
        return res.status(400).json({ error: 'Status must be "pending", "paid", or "received"' });
      }
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.amount !== undefined) {
      fields.push(`amount = $${paramIndex++}`);
      values.push(updates.amount);
    }
    if (updates.person_name !== undefined) {
      fields.push(`person_name = $${paramIndex++}`);
      values.push(updates.person_name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.date !== undefined) {
      fields.push(`date = $${paramIndex++}`);
      values.push(updates.date);
    }

    if (fields.length === 0) {
      return res.json({ success: true });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);
    values.push(userId);

    await pool.query(
      `UPDATE debts SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
      values
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating debt:', error);
    res.status(500).json({ error: 'Failed to update debt' });
  }
});

console.log('🔧 Registering route: DELETE /api/debts/:id');
app.delete('/api/debts/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    await pool.query('DELETE FROM debts WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting debt:', error);
    res.status(500).json({ error: 'Failed to delete debt' });
  }
});

console.log('🔧 Registering route: GET /api/debts/total-given');
app.get('/api/debts/total-given', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await ensureConnection();
    
    // Try to query first, if it fails with "does not exist", create the table
    let result;
    try {
      result = await pool.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM debts WHERE user_id = $1 AND type = $2 AND status = $3',
        [userId, 'given', 'pending']
      );
    } catch (queryError) {
      // If table doesn't exist, create it
      const errorMsg = queryError.message || String(queryError);
      console.log('🔍 [DEBTS/TOTAL-GIVEN] Query error detected:', errorMsg);
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('table')) {
        console.log('⚠️  Debts table not found, creating all tables...');
        try {
          await createAllTables();
          console.log('✅ [DEBTS/TOTAL-GIVEN] Tables created, retrying query...');
          // Wait a bit to ensure table is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          // Retry the query after creating tables
          result = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM debts WHERE user_id = $1 AND type = $2 AND status = $3',
            [userId, 'given', 'pending']
          );
          console.log('✅ [DEBTS/TOTAL-GIVEN] Query successful after table creation');
        } catch (createError) {
          console.error('❌ [DEBTS/TOTAL-GIVEN] Error creating tables:', createError);
          console.error('❌ [DEBTS/TOTAL-GIVEN] Create error message:', createError.message);
          console.error('❌ [DEBTS/TOTAL-GIVEN] Create error stack:', createError.stack);
          throw createError;
        }
      } else {
        console.error('❌ [DEBTS/TOTAL-GIVEN] Unexpected query error:', queryError);
        throw queryError;
      }
    }
    
    res.json({ total: Number(result.rows[0]?.total || 0) });
  } catch (error) {
    console.error('❌ [DEBTS] Error calculating total debts given:', error);
    res.status(500).json({ 
      error: 'Failed to calculate total debts given',
      message: error.message 
    });
  }
});

console.log('🔧 Registering route: GET /api/debts/total-received');
app.get('/api/debts/total-received', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await ensureConnection();
    
    // Try to query first, if it fails with "does not exist", create the table
    let result;
    try {
      result = await pool.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM debts WHERE user_id = $1 AND type = $2 AND status = $3',
        [userId, 'received', 'pending']
      );
    } catch (queryError) {
      // If table doesn't exist, create it
      const errorMsg = queryError.message || String(queryError);
      console.log('🔍 [DEBTS/TOTAL-RECEIVED] Query error detected:', errorMsg);
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('table')) {
        console.log('⚠️  Debts table not found, creating all tables...');
        try {
          await createAllTables();
          console.log('✅ [DEBTS/TOTAL-RECEIVED] Tables created, retrying query...');
          // Wait a bit to ensure table is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          // Retry the query after creating tables
          result = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM debts WHERE user_id = $1 AND type = $2 AND status = $3',
            [userId, 'received', 'pending']
          );
          console.log('✅ [DEBTS/TOTAL-RECEIVED] Query successful after table creation');
        } catch (createError) {
          console.error('❌ [DEBTS/TOTAL-RECEIVED] Error creating tables:', createError);
          console.error('❌ [DEBTS/TOTAL-RECEIVED] Create error message:', createError.message);
          console.error('❌ [DEBTS/TOTAL-RECEIVED] Create error stack:', createError.stack);
          throw createError;
        }
      } else {
        console.error('❌ [DEBTS/TOTAL-RECEIVED] Unexpected query error:', queryError);
        throw queryError;
      }
    }
    
    res.json({ total: Number(result.rows[0]?.total || 0) });
  } catch (error) {
    console.error('❌ [DEBTS] Error calculating total debts received:', error);
    res.status(500).json({ 
      error: 'Failed to calculate total debts received',
      message: error.message 
    });
  }
});

// Budget endpoints
app.get('/api/budget', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure connection first
    await ensureConnection();
    const result = await pool.query(
      'SELECT savings, necessities, wants, investments, ai_recommendation, generated_at FROM budget WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    const row = result.rows[0];
    if (!row.savings && !row.necessities && !row.wants && !row.investments) {
      return res.json(null);
    }
    
    res.json({
      savings: Number(row.savings || 0),
      necessities: Number(row.necessities || 0),
      wants: Number(row.wants || 0),
      investments: Number(row.investments || 0),
      aiRecommendation: row.ai_recommendation || undefined,
      generatedAt: row.generated_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching budget:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch budget',
      message: error.message,
      hint: 'Make sure flyctl proxy is running: flyctl proxy 5432 -a emingo-db'
    });
  }
});

app.post('/api/budget', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { savings, necessities, wants, investments, aiRecommendation, generatedAt } = req.body;
    await pool.query('DELETE FROM budget WHERE user_id = $1', [userId]);
    await pool.query(
      'INSERT INTO budget (user_id, category, amount, savings, necessities, wants, investments, ai_recommendation, generated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [userId, 'plan', 0, savings, necessities, wants, investments, aiRecommendation || null, generatedAt]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving budget:', error);
    res.status(500).json({ error: 'Failed to save budget' });
  }
});

// Calculate totals
app.get('/api/calculate/monthly-income', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const result = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3',
      [userId, currentMonth, currentYear]
    );
    res.json({ total: Number(result.rows[0]?.total || 0) });
  } catch (error) {
    console.error('Error calculating monthly income:', error);
    res.status(500).json({ error: 'Failed to calculate monthly income' });
  }
});

app.get('/api/calculate/monthly-expenses', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const result = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3',
      [userId, currentMonth, currentYear]
    );
    res.json({ total: Number(result.rows[0]?.total || 0) });
  } catch (error) {
    console.error('Error calculating monthly expenses:', error);
    res.status(500).json({ error: 'Failed to calculate monthly expenses' });
  }
});

// Account transactions endpoints
app.get('/api/account/balance', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('📊 [BALANCE] Starting balance calculation for user:', userId);
    
    // Ensure connection is active
    console.log('📊 [BALANCE] Checking database connection...');
    await ensureConnection();
    
    console.log('📊 [BALANCE] Querying income...');
    const incomeResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0)::numeric as total FROM account_transactions WHERE type = $1 AND user_id = $2',
      ['income', userId]
    );
    const incomeRow = incomeResult.rows[0];
    console.log('📊 [BALANCE] Income result:', incomeRow);
    console.log('📊 [BALANCE] Income total type:', typeof incomeRow?.total, 'value:', incomeRow?.total);
    
    console.log('📊 [BALANCE] Querying expenses...');
    const expenseResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0)::numeric as total FROM account_transactions WHERE type = $1 AND user_id = $2',
      ['expense', userId]
    );
    const expenseRow = expenseResult.rows[0];
    console.log('📊 [BALANCE] Expense result:', expenseRow);
    console.log('📊 [BALANCE] Expense total type:', typeof expenseRow?.total, 'value:', expenseRow?.total);
    
    // Ensure proper number conversion
    const totalIncome = parseFloat(incomeRow?.total || '0') || 0;
    const totalExpenses = parseFloat(expenseRow?.total || '0') || 0;
    const balance = totalIncome - totalExpenses;
    
    console.log(`✅ [BALANCE] Calculation: ${totalIncome} - ${totalExpenses} = ${balance}`);
    console.log(`✅ [BALANCE] Types - Income: ${typeof totalIncome}, Expenses: ${typeof totalExpenses}, Balance: ${typeof balance}`);
    console.log(`✅ [BALANCE] Final balance: ${balance}`);
    
    res.json({ balance: Number(balance.toFixed(2)) });
  } catch (error) {
    // Extract error information more thoroughly
    const errorMessage = error?.message || 
                        error?.toString() || 
                        (typeof error === 'string' ? error : 'Unknown error');
    const errorCode = error?.code || 
                     error?.errno || 
                     error?.syscall || 
                     'UNKNOWN';
    
    console.error('❌ [BALANCE] Error calculating balance:');
    console.error('  Type:', typeof error);
    console.error('  Message:', errorMessage);
    console.error('  Code:', errorCode);
    console.error('  Errno:', error?.errno);
    console.error('  Syscall:', error?.syscall);
    console.error('  Address:', error?.address);
    console.error('  Port:', error?.port);
    console.error('  Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    res.status(500).json({ 
      error: 'Failed to calculate balance',
      message: errorMessage,
      code: String(errorCode),
      details: {
        errno: error?.errno,
        syscall: error?.syscall,
        address: error?.address,
        port: error?.port
      },
      hint: 'Make sure flyctl proxy is running: flyctl proxy 5432 -a emingo-db'
    });
  }
});

app.post('/api/account/transactions', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('📥 [POST /api/account/transactions] Received transaction data');
    console.log('👤 [POST /api/account/transactions] User ID from token:', userId);
    console.log('📦 [POST /api/account/transactions] Request body:', JSON.stringify(req.body, null, 2));

    const { type, amount, name, category, date, account_id, account_type, note } = req.body;
    
    if (!type || !amount || !name || !date) {
      console.error('❌ [POST /api/account/transactions] Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Type, amount, name, and date are required' 
      });
    }

    // Ensure amount is a number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.error('❌ [POST /api/account/transactions] Invalid amount:', amount);
      return res.status(400).json({ 
        error: 'Invalid amount',
        message: 'Amount must be a positive number' 
      });
    }

    const transactionId = req.body.id || randomUUID();
    
    console.log('💾 [POST /api/account/transactions] Preparing to insert:', {
      transactionId,
      userId,
      type,
      amount: numericAmount,
      amountType: typeof numericAmount,
      name,
      category,
      date,
      account_id,
      account_type,
      note
    });
    
    // Verify user exists first
    const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      console.error('❌ [POST /api/account/transactions] User not found in database:', userId);
      return res.status(404).json({ 
        error: 'User not found',
        message: `User with ID ${userId} does not exist in database` 
      });
    }
    console.log('✅ [POST /api/account/transactions] User verified:', userCheck.rows[0].email);
    
    // Insert into account_transactions (use numericAmount to ensure it's a number)
    const insertQuery = 'INSERT INTO account_transactions (id, user_id, type, amount, name, category, date, account_type, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
    const insertValues = [transactionId, userId, type, numericAmount, name, category || null, date, account_type || null, note || null];
    console.log('💾 [POST /api/account/transactions] Executing INSERT query');
    console.log('💾 [POST /api/account/transactions] Query:', insertQuery);
    console.log('💾 [POST /api/account/transactions] Values:', insertValues);
    
    await pool.query(insertQuery, insertValues);
    
    console.log('✅ [POST /api/account/transactions] Successfully inserted into account_transactions');
    
    // Verify it was saved
    const verifyResult = await pool.query('SELECT * FROM account_transactions WHERE id = $1 AND user_id = $2', [transactionId, userId]);
    if (verifyResult.rows.length > 0) {
      console.log('✅ [POST /api/account/transactions] Verified: Data saved correctly:', verifyResult.rows[0]);
    } else {
      console.error('❌ [POST /api/account/transactions] WARNING: Data not found after insert!');
    }
    
    // Also insert into income or expenses table for synchronization (use numericAmount)
    if (type === 'income') {
      await pool.query(
        'INSERT INTO income (id, user_id, amount, source, category, date, description, account_id, account_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [transactionId, userId, numericAmount, name, category || '', date, note || null, account_id || null, account_type || null]
      );
      console.log('✅ [TRANSACTION] Successfully inserted into income table');
    } else if (type === 'expense') {
      await pool.query(
        'INSERT INTO expenses (id, user_id, amount, category, date, description, account_id, account_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [transactionId, userId, numericAmount, category || '', date, note || null, account_id || null, account_type || null]
      );
      console.log('✅ [TRANSACTION] Successfully inserted into expenses table');
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ [TRANSACTION] Error adding transaction:', error.message);
    console.error('❌ [TRANSACTION] Full error:', error);
    console.error('❌ [TRANSACTION] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to add transaction',
      message: error.message,
      hint: 'Make sure flyctl proxy is running: flyctl proxy 5432 -a emingo-db'
    });
  }
});

// User Settings endpoints
console.log('🔧 Registering route: GET /api/settings');
app.get('/api/settings', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure connection first
    await ensureConnection();

    // Run migration to add missing columns - MUST succeed before proceeding
    console.log('🔄 [GET /api/settings] Running migration...');
    try {
      await migrateUserSettingsTable();
      console.log('✅ [GET /api/settings] Migration completed successfully');
    } catch (migrationError) {
      console.error('❌ [GET /api/settings] Migration FAILED:', migrationError);
      // Don't continue - migration must succeed
      return res.status(500).json({ 
        error: 'Database migration failed',
        message: `Failed to add required columns: ${migrationError.message}` 
      });
    }

    const result = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        currency: 'DZD',
        language: 'en',
        custom_categories: [],
        accounts: [],
        analytics_preferences: {}
      });
    }

    const settings = result.rows[0];
    res.json({
      currency: settings.currency || 'DZD',
      language: settings.language || 'en',
      custom_categories: settings.custom_categories || [],
      accounts: settings.accounts || [],
      analytics_preferences: settings.analytics_preferences || {}
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings',
      message: error.message 
    });
  }
});

console.log('🔧 Registering route: POST /api/settings');
app.post('/api/settings', authenticateUser, async (req, res) => {
  try {
    console.log('📥 [POST /api/settings] Request received');
    const userId = req.userId;
    if (!userId) {
      console.error('❌ [POST /api/settings] No user ID found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log('👤 [POST /api/settings] User ID:', userId);

    // Ensure connection first
    await ensureConnection();
    console.log('✅ [POST /api/settings] Database connection verified');

    const { currency, language, custom_categories, accounts, analytics_preferences } = req.body;
    console.log('📦 [POST /api/settings] Request body:', {
      currency,
      language,
      custom_categories: custom_categories ? `${custom_categories.length} items` : 'null',
      accounts: accounts ? `${accounts.length} items` : 'null',
      analytics_preferences: analytics_preferences ? 'present' : 'null'
    });

    // Ensure table exists first
    try {
      await createAllTables();
      console.log('✅ [POST /api/settings] Tables verified/created');
    } catch (tableError) {
      console.error('❌ [POST /api/settings] Error creating tables:', tableError);
      // Continue anyway - table might already exist
    }

    // Run migration to add missing columns - MUST succeed before proceeding
    console.log('🔄 [POST /api/settings] Running migration...');
    try {
      await migrateUserSettingsTable();
      console.log('✅ [POST /api/settings] Migration completed successfully');
      
      // Verify columns exist after migration
      const verifyColumns = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND table_schema = 'public'
      `);
      const columnNames = verifyColumns.rows.map(r => r.column_name);
      console.log('📊 [POST /api/settings] Verified columns after migration:', columnNames);
      
      if (!columnNames.includes('language')) {
        throw new Error('language column still missing after migration');
      }
      if (!columnNames.includes('currency')) {
        throw new Error('currency column still missing after migration');
      }
    } catch (migrationError) {
      console.error('❌ [POST /api/settings] Migration FAILED:', migrationError);
      console.error('❌ [POST /api/settings] Migration error details:', {
        message: migrationError.message,
        code: migrationError.code,
        stack: migrationError.stack
      });
      // Don't continue - migration must succeed
      return res.status(500).json({ 
        error: 'Database migration failed',
        message: `Failed to add required columns: ${migrationError.message}` 
      });
    }

    // Check if settings exist
    console.log('🔍 [POST /api/settings] Checking for existing settings...');
    const existing = await pool.query(
      'SELECT id FROM user_settings WHERE user_id = $1',
      [userId]
    );
    console.log(`📊 [POST /api/settings] Found ${existing.rows.length} existing settings`);

    if (existing.rows.length > 0) {
      // Update existing settings
      console.log('🔄 [POST /api/settings] Updating existing settings...');
      const updateValues = [
        currency || 'DZD',
        language || 'en',
        JSON.stringify(custom_categories || []),
        JSON.stringify(accounts || []),
        JSON.stringify(analytics_preferences || {}),
        userId
      ];
      console.log('💾 [POST /api/settings] Update values:', updateValues.map((v, i) => 
        i < 2 ? v : (typeof v === 'string' ? `${v.substring(0, 50)}...` : v)
      ));
      
      await pool.query(
        `UPDATE user_settings 
         SET currency = $1, 
             language = $2,
             custom_categories = $3, 
             accounts = $4, 
             analytics_preferences = $5,
             updated_at = NOW()
         WHERE user_id = $6`,
        updateValues
      );
      console.log('✅ [POST /api/settings] Settings updated successfully');
    } else {
      // Create new settings
      console.log('➕ [POST /api/settings] Creating new settings...');
      const insertValues = [
        userId,
        currency || 'DZD',
        language || 'en',
        JSON.stringify(custom_categories || []),
        JSON.stringify(accounts || []),
        JSON.stringify(analytics_preferences || {})
      ];
      console.log('💾 [POST /api/settings] Insert values:', insertValues.map((v, i) => 
        i === 0 ? v : (typeof v === 'string' && v.length > 50 ? `${v.substring(0, 50)}...` : v)
      ));
      
      await pool.query(
        `INSERT INTO user_settings (user_id, currency, language, custom_categories, accounts, analytics_preferences)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        insertValues
      );
      console.log('✅ [POST /api/settings] Settings created successfully');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ [POST /api/settings] Error saving settings:', error);
    console.error('❌ [POST /api/settings] Error message:', error.message);
    console.error('❌ [POST /api/settings] Error code:', error.code);
    console.error('❌ [POST /api/settings] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to save settings',
      message: error.message 
    });
  }
});

console.log('🔧 Registering route: PUT /api/settings');
app.put('/api/settings', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure connection first
    await ensureConnection();

    // Run migration to add missing columns - MUST succeed before proceeding
    console.log('🔄 [PUT /api/settings] Running migration...');
    try {
      await migrateUserSettingsTable();
      console.log('✅ [PUT /api/settings] Migration completed successfully');
    } catch (migrationError) {
      console.error('❌ [PUT /api/settings] Migration FAILED:', migrationError);
      // Don't continue - migration must succeed
      return res.status(500).json({ 
        error: 'Database migration failed',
        message: `Failed to add required columns: ${migrationError.message}` 
      });
    }

    const { currency, language, custom_categories, accounts, analytics_preferences } = req.body;

    // Check if settings exist
    const existing = await pool.query(
      'SELECT id FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      // Update existing settings
      await pool.query(
        `UPDATE user_settings 
         SET currency = COALESCE($1, currency), 
             language = COALESCE($2, language),
             custom_categories = COALESCE($3, custom_categories), 
             accounts = COALESCE($4, accounts), 
             analytics_preferences = COALESCE($5, analytics_preferences),
             updated_at = NOW()
         WHERE user_id = $6`,
        [
          currency ? currency : null,
          language ? language : null,
          custom_categories ? JSON.stringify(custom_categories) : null,
          accounts ? JSON.stringify(accounts) : null,
          analytics_preferences ? JSON.stringify(analytics_preferences) : null,
          userId
        ]
      );
    } else {
      // Create new settings with provided values or defaults
      await pool.query(
        `INSERT INTO user_settings (user_id, currency, language, custom_categories, accounts, analytics_preferences)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          currency || 'DZD',
          language || 'en',
          JSON.stringify(custom_categories || []),
          JSON.stringify(accounts || []),
          JSON.stringify(analytics_preferences || {})
        ]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ [PUT /api/settings] Error updating settings:', error);
    console.error('❌ [PUT /api/settings] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to update settings',
      message: error.message 
    });
  }
});

// Profile endpoints
console.log('🔧 Registering route: GET /api/profile');
app.get('/api/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📥 [GET /api/profile] Request received');
    console.log('👤 [GET /api/profile] User ID from token:', userId);
    
    const result = await pool.query(
      'SELECT name, age, current_work, description FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    
    console.log(`📊 [GET /api/profile] Found ${result.rows.length} profile entries for user ${userId}`);
    if (result.rows.length > 0) {
      console.log('📊 [GET /api/profile] Profile data:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('⚠️ [GET /api/profile] No profile found for this user');
      // Check if user exists
      const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
      console.log('👤 [GET /api/profile] User check result:', userCheck.rows.length > 0 ? userCheck.rows[0] : 'User not found');
      // Return empty profile if none exists
      res.json({
        name: null,
        age: null,
        current_work: null,
        description: null
      });
    }
  } catch (error) {
    console.error('❌ [GET /api/profile] Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

console.log('🔧 Registering route: POST /api/profile');
app.post('/api/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📥 [POST /api/profile] Request received');
    console.log('👤 [POST /api/profile] User ID from token:', userId);
    console.log('📦 [POST /api/profile] Request body:', JSON.stringify(req.body, null, 2));
    
    if (!userId) {
      console.error('❌ [POST /api/profile] No user ID found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, age, current_work, description } = req.body;
    
    console.log('💾 [POST /api/profile] Preparing to save:', {
      userId,
      name,
      age,
      current_work,
      description
    });

    // Verify user exists first
    const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      console.error('❌ [POST /api/profile] User not found in database:', userId);
      return res.status(404).json({ 
        error: 'User not found',
        message: `User with ID ${userId} does not exist in database` 
      });
    }
    console.log('✅ [POST /api/profile] User verified:', userCheck.rows[0].email);

    // Check if profile exists
    const existing = await pool.query(
      'SELECT user_id FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      console.log('🔄 [POST /api/profile] Profile exists, updating...');
      const updateQuery = `UPDATE user_profiles 
         SET name = $1, 
             age = $2, 
             current_work = $3, 
             description = $4,
             updated_at = NOW()
         WHERE user_id = $5`;
      const updateValues = [name || null, age || null, current_work || null, description || null, userId];
      console.log('💾 [POST /api/profile] UPDATE query:', updateQuery);
      console.log('💾 [POST /api/profile] UPDATE values:', updateValues);
      
      await pool.query(updateQuery, updateValues);
      console.log('✅ [POST /api/profile] Profile updated successfully');
    } else {
      console.log('➕ [POST /api/profile] Profile does not exist, creating new...');
      const insertQuery = `INSERT INTO user_profiles (user_id, name, age, current_work, description)
         VALUES ($1, $2, $3, $4, $5)`;
      const insertValues = [userId, name || null, age || null, current_work || null, description || null];
      console.log('💾 [POST /api/profile] INSERT query:', insertQuery);
      console.log('💾 [POST /api/profile] INSERT values:', insertValues);
      
      await pool.query(insertQuery, insertValues);
      console.log('✅ [POST /api/profile] Profile created successfully');
    }

    // Verify it was saved
    const verifyResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    if (verifyResult.rows.length > 0) {
      console.log('✅ [POST /api/profile] Verified: Profile saved correctly:', verifyResult.rows[0]);
    } else {
      console.error('❌ [POST /api/profile] WARNING: Profile not found after save!');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ [POST /api/profile] Error saving user profile:', error);
    console.error('❌ [POST /api/profile] Full error:', error);
    console.error('❌ [POST /api/profile] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to save user profile' });
  }
});

console.log('🔧 Registering route: PUT /api/profile');
app.put('/api/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📥 [PUT /api/profile] Request received');
    console.log('👤 [PUT /api/profile] User ID from token:', userId);
    console.log('📦 [PUT /api/profile] Request body:', JSON.stringify(req.body, null, 2));
    
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const key in updates) {
      if (updates.hasOwnProperty(key) && ['name', 'age', 'current_work', 'description'].includes(key)) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(updates[key]);
      }
    }

    if (fields.length === 0) {
      console.error('❌ [PUT /api/profile] No valid updates provided');
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    console.log('💾 [PUT /api/profile] Fields to update:', fields);
    console.log('💾 [PUT /api/profile] Values:', values);

    // Check if profile exists
    const existing = await pool.query(
      'SELECT user_id FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      console.log('🔄 [PUT /api/profile] Profile exists, updating...');
      // Update existing profile
      values.push(userId); // for WHERE clause
      const updateQuery = `UPDATE user_profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`;
      console.log('💾 [PUT /api/profile] UPDATE query:', updateQuery);
      console.log('💾 [PUT /api/profile] UPDATE values:', values);
      
      await pool.query(updateQuery, values);
      console.log('✅ [PUT /api/profile] Profile updated successfully');
    } else {
      console.log('➕ [PUT /api/profile] Profile does not exist, creating new...');
      // Create new profile with provided values
      const name = updates.name || null;
      const age = updates.age || null;
      const current_work = updates.current_work || null;
      const description = updates.description || null;
      
      const insertQuery = `INSERT INTO user_profiles (user_id, name, age, current_work, description)
         VALUES ($1, $2, $3, $4, $5)`;
      const insertValues = [userId, name, age, current_work, description];
      console.log('💾 [PUT /api/profile] INSERT query:', insertQuery);
      console.log('💾 [PUT /api/profile] INSERT values:', insertValues);
      
      await pool.query(insertQuery, insertValues);
      console.log('✅ [PUT /api/profile] Profile created successfully');
    }

    // Verify it was saved
    const verifyResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    if (verifyResult.rows.length > 0) {
      console.log('✅ [PUT /api/profile] Verified: Profile saved correctly:', verifyResult.rows[0]);
    } else {
      console.error('❌ [PUT /api/profile] WARNING: Profile not found after save!');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ [PUT /api/profile] Error updating user profile:', error);
    console.error('❌ [PUT /api/profile] Full error:', error);
    console.error('❌ [PUT /api/profile] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// AI endpoints - proxy to You.com API to avoid CORS
// Using You.com Advanced Agent API: https://documentation.you.com/api-reference/agents/advanced-agent/advanced-agent-runs-stream
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, model, temperature, max_tokens } = req.body;
    // Try multiple environment variable names for compatibility
    const apiKey = process.env.YOU_API_KEY || 
                   process.env.VITE_YOU_API_KEY || 
                   process.env.OPENAI_API_KEY || 
                   process.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ You.com API key not found in environment variables');
      return res.status(500).json({ 
        error: 'You.com API key not configured',
        message: 'Please set YOU_API_KEY in .env.local. Get your key from https://you.com'
      });
    }
    
    // Convert messages array to input string for You.com API
    // You.com API expects a single input string, not messages array
    let inputText = '';
    if (messages && Array.isArray(messages)) {
      // Combine system and user messages into a single input
      inputText = messages
        .map(msg => {
          if (msg.role === 'system') {
            return msg.content;
          } else if (msg.role === 'user') {
            return msg.content;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n\n');
    } else {
      inputText = messages || 'Hello';
    }
    
    console.log(`📡 Calling You.com Advanced Agent API`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
    
    // You.com API endpoint: https://api.you.com/v1/agents/runs
    const response = await fetch('https://api.you.com/v1/agents/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        agent: 'advanced',
        input: inputText,
        stream: true // You.com API uses SSE stream by default
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('❌ You.com API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      if (response.status === 401) {
        return res.status(401).json({ 
          error: 'You.com API authentication failed',
          message: 'Invalid API key. Please check your YOU_API_KEY in .env.local',
          hint: 'Get a valid API key from https://you.com'
        });
      }
      
      return res.status(response.status).json({ 
        error: 'You.com API error',
        message: errorData.error?.message || errorData.message || response.statusText,
        status: response.status
      });
    }
    
    // You.com API returns SSE stream (text/event-stream)
    // Parse SSE format and extract the final answer
    const contentType = response.headers.get('content-type');
    let answer = '';
    
    if (contentType && contentType.includes('text/event-stream')) {
      // Handle SSE stream
      const text = await response.text();
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.substring(6));
            // Collect text deltas
            if (json.type === 'response.output_text.delta' && json.response?.delta) {
              answer += json.response.delta;
            }
            // Also check for full content if available
            if (json.type === 'response.output_content.full' && json.response?.full) {
              // If full content is available, use it
              if (Array.isArray(json.response.full)) {
                // Handle web search results or other full content
                answer = json.response.full.map(item => item.snippet || item.title || '').join('\n');
              }
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
          }
        }
      }
    } else {
      // Try to parse as JSON if not SSE
      try {
        const jsonData = await response.json();
        // Handle different response formats
        if (jsonData.response?.output_text?.full) {
          answer = jsonData.response.output_text.full;
        } else if (jsonData.response?.output_text?.delta) {
          answer = jsonData.response.output_text.delta;
        } else {
          answer = JSON.stringify(jsonData);
        }
      } catch (e) {
        answer = 'Failed to parse response';
      }
    }
    
    console.log('✅ You.com API response received');
    
    // Convert to OpenAI-compatible format
    res.json({
      choices: [{
        message: {
          content: answer || 'No response received from You.com API'
        }
      }]
    });
  } catch (error) {
    console.error('❌ AI Proxy Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process AI request',
      message: error.message
    });
  }
});

// Global Daily Tip (same for all users, changes every 24 hours)
let dailyTipCache = {
  tip: null,
  timestamp: null,
  language: 'en'
};

// Generate daily tip based on language
async function generateDailyTip(language = 'en') {
  const apiKey = process.env.YOU_API_KEY || 
                 process.env.VITE_YOU_API_KEY || 
                 process.env.OPENAI_API_KEY || 
                 process.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    const fallbackTips = {
      en: 'Track your daily expenses to understand your spending patterns. Small savings add up over time.',
      ar: 'تتبع مصروفاتك اليومية لفهم أنماط إنفاقك. المدخرات الصغيرة تتراكم مع الوقت.',
      fr: 'Suivez vos dépenses quotidiennes pour comprendre vos habitudes de dépenses. Les petites économies s\'accumulent avec le temps.'
    };
    return fallbackTips[language] || fallbackTips.en;
  }
  
  const languagePrompt = language === 'ar' ? 'بالعربية' : language === 'fr' ? 'en français' : 'in English';
  const prompt = `Provide ONE practical daily financial tip in ${languagePrompt}. Keep it to exactly 2 sentences maximum. Be concise and actionable. No formatting, no asterisks, just plain text.`;
  
  try {
    const response = await fetch('https://api.you.com/v1/agents/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        agent: 'advanced',
        input: prompt,
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`You.com API error: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let answer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data === '[DONE]') continue;
          
          try {
            const jsonData = JSON.parse(data);
            if (jsonData.response?.output_text?.full) {
              answer = jsonData.response.output_text.full;
            } else if (jsonData.response?.output_text?.delta) {
              answer += jsonData.response.output_text.delta;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    
    // Clean response
    return answer
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .trim()
      .substring(0, 200); // Limit to 200 chars (2 sentences)
  } catch (error) {
    console.error('Error generating daily tip:', error);
    const fallbackTips = {
      en: 'Track your daily expenses to understand your spending patterns. Small savings add up over time.',
      ar: 'تتبع مصروفاتك اليومية لفهم أنماط إنفاقك. المدخرات الصغيرة تتراكم مع الوقت.',
      fr: 'Suivez vos dépenses quotidiennes pour comprendre vos habitudes de dépenses. Les petites économies s\'accumulent avec le temps.'
    };
    return fallbackTips[language] || fallbackTips.en;
  }
}

console.log('🔧 Registering route: GET /api/ai/daily-tip');
app.get('/api/ai/daily-tip', async (req, res) => {
  try {
    const language = req.query.lang || 'en';
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if we have a cached tip for this language that's less than 24 hours old
    if (dailyTipCache.tip && 
        dailyTipCache.language === language && 
        dailyTipCache.timestamp && 
        (now - dailyTipCache.timestamp) < twentyFourHours) {
      console.log(`✅ Returning cached daily tip for ${language}`);
      return res.json({ tip: dailyTipCache.tip, cached: true });
    }
    
    // Generate new tip
    console.log(`🔄 Generating new daily tip for ${language}`);
    const tip = await generateDailyTip(language);
    
    // Cache it
    dailyTipCache = {
      tip,
      timestamp: now,
      language
    };
    
    res.json({ tip, cached: false });
  } catch (error) {
    console.error('Error getting daily tip:', error);
    const fallbackTips = {
      en: 'Track your daily expenses to understand your spending patterns. Small savings add up over time.',
      ar: 'تتبع مصروفاتك اليومية لفهم أنماط إنفاقك. المدخرات الصغيرة تتراكم مع الوقت.',
      fr: 'Suivez vos dépenses quotidiennes pour comprendre vos habitudes de dépenses. Les petites économies s\'accumulent avec le temps.'
    };
    const language = req.query.lang || 'en';
    res.json({ tip: fallbackTips[language] || fallbackTips.en });
  }
});

// AI Conversations endpoints
console.log('🔧 Registering route: GET /api/ai/conversations');
app.get('/api/ai/conversations', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { session_id, limit = 50 } = req.query;
    
    let query = 'SELECT id, session_id, role, content, created_at FROM ai_conversations WHERE user_id = $1';
    const params = [userId];
    
    if (session_id) {
      query += ' AND session_id = $2 ORDER BY created_at ASC';
      params.push(session_id);
    } else {
      query += ' ORDER BY created_at DESC LIMIT $2';
      params.push(limit);
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching AI conversations:', error);
    res.status(500).json({ error: 'Failed to fetch AI conversations' });
  }
});

console.log('🔧 Registering route: POST /api/ai/conversations');
app.post('/api/ai/conversations', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { session_id, role, content } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({ error: 'Role and content are required' });
    }
    
    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "user" or "assistant"' });
    }
    
    const conversationId = randomUUID();
    const actualSessionId = session_id || randomUUID();
    
    await pool.query(
      `INSERT INTO ai_conversations (id, user_id, session_id, role, content)
       VALUES ($1, $2, $3, $4, $5)`,
      [conversationId, userId, actualSessionId, role, content]
    );
    
    res.json({
      success: true,
      id: conversationId,
      session_id: actualSessionId
    });
  } catch (error) {
    console.error('Error saving AI conversation:', error);
    res.status(500).json({ error: 'Failed to save AI conversation' });
  }
});

console.log('🔧 Registering route: DELETE /api/ai/conversations/:session_id');
app.delete('/api/ai/conversations/:session_id', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { session_id } = req.params;
    
    await pool.query(
      'DELETE FROM ai_conversations WHERE user_id = $1 AND session_id = $2',
      [userId, session_id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting AI conversation:', error);
    res.status(500).json({ error: 'Failed to delete AI conversation' });
  }
});

// Database management endpoints
console.log('🔧 Registering route: GET /api/database/tables');
app.get('/api/database/tables', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables', message: error.message });
  }
});

console.log('🔧 Registering route: POST /api/database/create-tables');
app.post('/api/database/create-tables', authenticateUser, async (req, res) => {
  try {
    await createAllTables();
    res.json({ success: true, message: 'All tables created successfully' });
  } catch (error) {
    console.error('Error creating tables:', error);
    res.status(500).json({ error: 'Failed to create tables', message: error.message });
  }
});

// Test migration endpoint
console.log('🔧 Registering route: POST /api/database/migrate-settings');
app.post('/api/database/migrate-settings', authenticateUser, async (req, res) => {
  try {
    console.log('🧪 [TEST] Running migration test...');
    await migrateUserSettingsTable();
    
    // Verify columns exist
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_settings' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    const columns = columnsResult.rows.map(row => ({
      name: row.column_name,
      type: row.data_type
    }));
    
    console.log('✅ [TEST] Migration test completed');
    res.json({ 
      success: true, 
      message: 'Migration completed successfully',
      columns: columns,
      columnCount: columns.length
    });
  } catch (error) {
    console.error('❌ [TEST] Migration test failed:', error);
    res.status(500).json({ 
      error: 'Migration test failed', 
      message: error.message,
      stack: error.stack
    });
  }
});

console.log('🔧 Registering route: GET /api/database/table/:name');
app.get('/api/database/table/:name', authenticateUser, async (req, res) => {
  try {
    const { name } = req.params;
    const columns = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [name]);
    res.json(columns.rows);
  } catch (error) {
    console.error('Error fetching table info:', error);
    res.status(500).json({ error: 'Failed to fetch table info', message: error.message });
  }
});

// Admin middleware - check if user is admin
function isAdmin(req, res, next) {
  const adminEmail = 'aminekerkarr@gmail.com';
  if (req.userEmail && req.userEmail.toLowerCase() === adminEmail.toLowerCase()) {
    console.log('✅ [ADMIN] Admin access granted:', req.userEmail);
    next();
  } else {
    console.log('❌ [ADMIN] Admin access denied:', req.userEmail);
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Admin access required' 
    });
  }
}

// Admin endpoints
console.log('🔧 Registering route: GET /api/admin/data');
app.get('/api/admin/data', authenticateUser, isAdmin, async (req, res) => {
  try {
    console.log('📥 [ADMIN] Fetching all users...');
    
    // Ensure database connection
    await ensureConnection();
    console.log('✅ [ADMIN] Database connection verified');
    
    // First, check total count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalCount = parseInt(countResult.rows[0].total);
    console.log(`📊 [ADMIN] Total users in database: ${totalCount}`);
    
    // Get all users from database (no LIMIT - get all)
    const usersResult = await pool.query(
      'SELECT id, email, name, avatar_url, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    
    console.log(`✅ [ADMIN] Query executed successfully`);
    console.log(`📊 [ADMIN] Rows returned: ${usersResult.rows.length}`);
    console.log(`📊 [ADMIN] Expected: ${totalCount}`);
    
    if (usersResult.rows.length !== totalCount) {
      console.warn(`⚠️ [ADMIN] Mismatch: Expected ${totalCount} users but got ${usersResult.rows.length}`);
    }
    
    // Log first few users for debugging
    if (usersResult.rows.length > 0) {
      console.log('📋 [ADMIN] Sample users:', usersResult.rows.slice(0, 3).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name
      })));
    }
    
    res.json({ 
      users: usersResult.rows,
      total: totalCount,
      returned: usersResult.rows.length
    });
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching admin data:', error);
    console.error('❌ [ADMIN] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to fetch admin data',
      message: error.message 
    });
  }
});

// Serve static files in production (must be after all API routes)
// IMPORTANT: This must be placed AFTER all API route definitions
if (process.env.NODE_ENV === 'production') {
  // Create static file middleware that skips API routes
  const staticMiddleware = express.static(join(__dirname, '../dist'));
  
  // Only serve static files for non-API routes
  app.use((req, res, next) => {
    // Skip static file serving for ALL API routes (any HTTP method)
    if (req.path.startsWith('/api')) {
      return next(); // Skip static file serving for API routes
    }
    // Serve static files for non-API routes
    return staticMiddleware(req, res, next);
  });
  
  // Serve index.html for all non-API GET routes (SPA routing)
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://0.0.0.0:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('📦 Serving static files from /dist');
  }
  
  // Log authentication configuration
  if (JWT_SECRET && JWT_SECRET !== 'your-secret-key-change-in-production') {
    console.log('✅ JWT_SECRET configured');
  } else {
    console.log('⚠️  JWT_SECRET not set or using default');
    console.log('💡 Set JWT_SECRET in .env.local');
  }
  
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    console.log('✅ Google OAuth configured');
    console.log(`   Client ID: ${GOOGLE_CLIENT_ID.substring(0, 10)}...`);
    console.log(`   Redirect URI: ${GOOGLE_REDIRECT_URI}`);
  } else {
    console.log('⚠️  Google OAuth not configured');
    console.log('💡 Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
    console.log('💡 Get credentials from: https://console.cloud.google.com/apis/credentials');
  }
  
  const apiKey = process.env.YOU_API_KEY || 
                 process.env.VITE_YOU_API_KEY || 
                 process.env.OPENAI_API_KEY || 
                 process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.log('⚠️  You.com API key not found. AI features will not work.');
    console.log('💡 Set YOU_API_KEY in .env.local');
    console.log('💡 Get your API key from: https://you.com');
  } else {
    console.log('✅ You.com API key configured');
    console.log('📡 Using You.com Advanced Agent API: https://api.you.com/v1/agents/runs');
  }
  
  // Log registered routes
  console.log('\n📋 Registered API endpoints:');
  console.log('   GET    /api/health');
  console.log('   GET    /api/auth/google/url');
  console.log('   POST   /api/auth/google/callback');
  console.log('   GET    /api/auth/me');
  console.log('   GET    /api/income');
  console.log('   POST   /api/income');
  console.log('   PATCH  /api/income/:id');
  console.log('   DELETE /api/income/:id');
  console.log('   GET    /api/expenses');
  console.log('   POST   /api/expenses');
  console.log('   PATCH  /api/expenses/:id');
  console.log('   DELETE /api/expenses/:id');
  console.log('   GET    /api/projects');
  console.log('   POST   /api/projects');
  console.log('   PATCH  /api/projects/:id');
  console.log('   GET    /api/goals');
  console.log('   POST   /api/goals');
  console.log('   PATCH  /api/goals/:id');
  console.log('   DELETE /api/goals/:id');
  console.log('   GET    /api/budget');
  console.log('   POST   /api/budget');
  console.log('   GET    /api/account/balance');
  console.log('   POST   /api/account/transactions');
  console.log('   GET    /api/debts');
  console.log('   POST   /api/debts');
  console.log('   PATCH  /api/debts/:id');
  console.log('   DELETE /api/debts/:id');
  console.log('   GET    /api/debts/total-given');
  console.log('   GET    /api/debts/total-received');
  console.log('   GET    /api/database/tables');
  console.log('   POST   /api/database/create-tables');
  console.log('   GET    /api/database/table/:name');
  console.log('   GET    /api/settings');
  console.log('   POST   /api/settings');
  console.log('   PUT    /api/settings');
  console.log('   GET    /api/profile');
  console.log('   POST   /api/profile');
  console.log('   PUT    /api/profile');
  console.log('   GET    /api/ai/conversations');
  console.log('   POST   /api/ai/conversations');
  console.log('   DELETE /api/ai/conversations/:session_id');
  console.log('   POST   /api/ai/chat');
  console.log('   GET    /api/ai/daily-tip');
  console.log('   GET    /api/debug/data (View all your data)');
  console.log('   GET    /api/admin/data (Admin only)');
});

// Debug endpoint to view all user data
console.log('🔧 Registering route: GET /api/debug/data');
app.get('/api/debug/data', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`📊 [DEBUG] Fetching all data for user: ${userId}`);
    
    const [user, income, expenses, projects, goals, transactions, settings, profile, budget, conversations] = await Promise.all([
      pool.query('SELECT id, email, name, created_at FROM users WHERE id = $1', [userId]),
      pool.query('SELECT * FROM income WHERE user_id = $1 ORDER BY date DESC', [userId]),
      pool.query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC', [userId]),
      pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      pool.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      pool.query('SELECT * FROM account_transactions WHERE user_id = $1 ORDER BY date DESC', [userId]),
      pool.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]),
      pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]),
      pool.query('SELECT * FROM budget WHERE user_id = $1', [userId]),
      pool.query('SELECT * FROM ai_conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId])
    ]);
    
    const data = {
      user: user.rows[0] || null,
      income: income.rows.map(row => ({
        ...row,
        amount: Number(row.amount)
      })),
      expenses: expenses.rows.map(row => ({
        ...row,
        amount: Number(row.amount)
      })),
      projects: projects.rows,
      goals: goals.rows.map(row => ({
        ...row,
        target: Number(row.target),
        current: Number(row.current)
      })),
      transactions: transactions.rows.map(row => ({
        ...row,
        amount: Number(row.amount)
      })),
      settings: settings.rows[0] || null,
      profile: profile.rows[0] || null,
      budget: budget.rows[0] || null,
      conversations: conversations.rows,
      summary: {
        total_income: income.rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
        total_expenses: expenses.rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
        income_count: income.rows.length,
        expenses_count: expenses.rows.length,
        projects_count: projects.rows.length,
        goals_count: goals.rows.length,
        transactions_count: transactions.rows.length
      }
    };
    
    console.log(`✅ [DEBUG] Data fetched successfully for user: ${userId}`);
    res.json(data);
  } catch (error) {
    console.error('❌ [DEBUG] Error fetching data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data',
      message: error.message 
    });
  }
});

