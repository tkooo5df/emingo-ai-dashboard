# Supabase Setup Guide

## ✅ Code Updated to Use Supabase

All authentication and database code has been updated to use Supabase instead of custom Fly.io authentication.

## 📋 What Was Changed

1. **Authentication (`src/lib/auth.ts`)**
   - Now uses `supabase.auth.signInWithOAuth()` for Google login
   - Uses `supabase.auth.getSession()` and `supabase.auth.getUser()`
   - Removed custom JWT token management

2. **API Client (`src/lib/api.ts`)**
   - Now uses Supabase client directly instead of API server
   - All queries use `supabase.from('table').select()`
   - Automatically filters by `user_id` using RLS

3. **Pages Updated**
   - `Login.tsx` - Uses Supabase OAuth
   - `AuthCallback.tsx` - Handles Supabase OAuth callback
   - `ProtectedRoute.tsx` - Uses Supabase auth state listener

## 🚀 Setup Steps

### 1. Create/Activate Supabase Project

You need an active Supabase project. You can:
- Create a new project at https://supabase.com/dashboard
- Or reactivate one of your existing projects

### 2. Get Supabase Credentials

Once you have a project:
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 3. Update `.env.local`

Add these variables to `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### 4. Create Database Tables

Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql):

```sql
-- Create tables for EMINGO Dashboard
-- Income table
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  source VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Budget table
CREATE TABLE IF NOT EXISTS budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  type VARCHAR(50) DEFAULT 'financial',
  description TEXT,
  target DECIMAL(10, 2) NOT NULL,
  current DECIMAL(10, 2) DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Account transactions table
CREATE TABLE IF NOT EXISTS account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_type VARCHAR(20) CHECK (account_type IN ('ccp', 'cash', 'creditcard')),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_budget_user_id ON budget(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
CREATE INDEX IF NOT EXISTS idx_account_transactions_user_id ON account_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_date ON account_transactions(date);

-- Enable Row Level Security
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for income
CREATE POLICY "Users can view their own income"
  ON income FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own income"
  ON income FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own income"
  ON income FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own income"
  ON income FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- RLS Policies for budget
CREATE POLICY "Users can view their own budget"
  ON budget FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own budget"
  ON budget FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own budget"
  ON budget FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own budget"
  ON budget FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- RLS Policies for goals
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- RLS Policies for account_transactions
CREATE POLICY "Users can view their own account transactions"
  ON account_transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own account transactions"
  ON account_transactions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own account transactions"
  ON account_transactions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own account transactions"
  ON account_transactions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
```

### 5. Enable Google OAuth in Supabase

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/providers
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add redirect URL: `http://localhost:8080/auth/callback`

### 6. Update Redirect URL

In Supabase Dashboard → Authentication → URL Configuration:
- Add: `http://localhost:8080/auth/callback`

## 🎉 Done!

After completing these steps:
1. Restart your dev server: `npm run dev`
2. Try logging in with Google
3. All data will be stored in Supabase with automatic user isolation via RLS

## 📝 Notes

- **API Server**: Still needed for AI proxy (`/api/ai/chat`), but not for database operations
- **RLS**: All tables have Row Level Security enabled - users can only see their own data
- **No API Server Required**: Database operations now happen directly from the browser via Supabase client


