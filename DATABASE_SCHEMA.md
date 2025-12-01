# 🗄️ Database Schema Documentation

## Overview
This document describes the complete database schema for the EMINGO AI Dashboard application. All tables are designed to support multi-user functionality with proper user isolation.

## Database Connection
- **Database Name**: emingo-db
- **Platform**: Fly.io PostgreSQL
- **Connection**: Use `flyctl proxy 5432 -a emingo-db` for local development

---

## Tables

### 1. `users`
Stores user account information and authentication data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `password_hash` | VARCHAR(255) | NULL | Hashed password (for email/password auth) |
| `name` | VARCHAR(255) | NULL | User's display name |
| `avatar_url` | TEXT | NULL | URL to user's avatar image |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_created_at` on `created_at`

---

### 2. `income`
Stores income entries for each user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique income entry ID |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Owner user ID |
| `amount` | DECIMAL(10, 2) | NOT NULL | Income amount |
| `source` | VARCHAR(255) | NULL | Income source (e.g., "Freelance", "Salary") |
| `description` | TEXT | NULL | Additional description |
| `category` | VARCHAR(100) | NULL | Income category |
| `date` | DATE | NOT NULL | Income date |
| `account_id` | VARCHAR(255) | NULL | Account ID from user settings |
| `account_type` | VARCHAR(20) | CHECK IN ('ccp', 'cash', 'creditcard') | Payment method type |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Entry creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_income_user_id` on `user_id`
- `idx_income_date` on `date`
- `idx_income_category` on `category`
- `idx_income_account_type` on `account_type`
- `idx_income_created_at` on `created_at`

---

### 3. `expenses`
Stores expense entries for each user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique expense entry ID |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Owner user ID |
| `amount` | DECIMAL(10, 2) | NOT NULL | Expense amount |
| `description` | TEXT | NULL | Additional description |
| `category` | VARCHAR(100) | NOT NULL | Expense category |
| `date` | DATE | NOT NULL | Expense date |
| `account_id` | VARCHAR(255) | NULL | Account ID from user settings |
| `account_type` | VARCHAR(20) | CHECK IN ('ccp', 'cash', 'creditcard') | Payment method type |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Entry creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_expenses_user_id` on `user_id`
- `idx_expenses_date` on `date`
- `idx_expenses_category` on `category`
- `idx_expenses_account_type` on `account_type`
- `idx_expenses_created_at` on `created_at`

---

### 4. `budget`
Stores budget plans and allocations for each user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique budget entry ID |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Owner user ID |
| `category` | VARCHAR(100) | NOT NULL | Budget category |
| `amount` | DECIMAL(10, 2) | NOT NULL | Budget amount |
| `savings` | DECIMAL(10, 2) | DEFAULT 0 | Savings allocation |
| `necessities` | DECIMAL(10, 2) | DEFAULT 0 | Necessities allocation |
| `wants` | DECIMAL(10, 2) | DEFAULT 0 | Wants allocation |
| `investments` | DECIMAL(10, 2) | DEFAULT 0 | Investments allocation |
| `ai_recommendation` | TEXT | NULL | AI-generated budget recommendation |
| `generated_at` | TIMESTAMP | NULL | When budget was generated |
| `period` | VARCHAR(20) | DEFAULT 'monthly' | Budget period |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Entry creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Constraints:**
- UNIQUE(`user_id`, `category`)

**Indexes:**
- `idx_budget_user_id` on `user_id`
- `idx_budget_category` on `category`

---

### 5. `projects`
Stores project information for each user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique project ID |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Owner user ID |
| `name` | VARCHAR(255) | NOT NULL | Project name |
| `client` | VARCHAR(255) | NULL | Client name |
| `description` | TEXT | NULL | Project description |
| `status` | VARCHAR(50) | DEFAULT 'ongoing' | Project status |
| `expected_earnings` | DECIMAL(10, 2) | DEFAULT 0 | Expected earnings |
| `hours_spent` | DECIMAL(10, 2) | DEFAULT 0 | Hours spent on project |
| `start_date` | DATE | NULL | Project start date |
| `end_date` | DATE | NULL | Project end date |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Entry creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_projects_user_id` on `user_id`
- `idx_projects_status` on `status`
- `idx_projects_start_date` on `start_date`

---

### 6. `goals`
Stores financial and personal goals for each user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique goal ID |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Owner user ID |
| `name` | VARCHAR(255) | NOT NULL | Goal name |
| `title` | VARCHAR(255) | NULL | Goal title |
| `type` | VARCHAR(50) | DEFAULT 'financial' | Goal type |
| `description` | TEXT | NULL | Goal description |
| `target` | DECIMAL(10, 2) | NOT NULL | Target amount |
| `current` | DECIMAL(10, 2) | DEFAULT 0 | Current progress |
| `deadline` | DATE | NULL | Goal deadline |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Entry creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_goals_user_id` on `user_id`
- `idx_goals_deadline` on `deadline`
- `idx_goals_type` on `type`

---

### 7. `account_transactions`
Stores account balance transactions (from Account page).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique transaction ID |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Owner user ID |
| `type` | VARCHAR(10) | NOT NULL, CHECK IN ('income', 'expense') | Transaction type |
| `amount` | DECIMAL(10, 2) | NOT NULL | Transaction amount |
| `name` | VARCHAR(255) | NOT NULL | Transaction name/description |
| `category` | VARCHAR(100) | NULL | Transaction category |
| `date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | Transaction date |
| `account_type` | VARCHAR(20) | CHECK IN ('ccp', 'cash', 'creditcard') | Payment method type |
| `note` | TEXT | NULL | Additional notes |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Entry creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_account_transactions_user_id` on `user_id`
- `idx_account_transactions_date` on `date`
- `idx_account_transactions_type` on `type`
- `idx_account_transactions_account_type` on `account_type`

---

### 8. `user_profiles`
Stores user profile information for personalized AI advice.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | PRIMARY KEY, REFERENCES users(id) ON DELETE CASCADE | User ID (one-to-one) |
| `name` | VARCHAR(255) | NULL | User's name |
| `age` | INTEGER | NULL | User's age |
| `current_work` | VARCHAR(255) | NULL | Current occupation/work |
| `description` | TEXT | NULL | User description/about |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Entry creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_user_profiles_user_id` on `user_id`

---

### 9. `user_settings`
Stores user preferences and settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique settings ID |
| `user_id` | UUID | NOT NULL, UNIQUE, REFERENCES users(id) ON DELETE CASCADE | Owner user ID (one-to-one) |
| `currency` | VARCHAR(10) | DEFAULT 'DZD' | Preferred currency |
| `custom_categories` | JSONB | DEFAULT '[]'::jsonb | Custom income/expense categories with icons |
| `accounts` | JSONB | DEFAULT '[]'::jsonb | User-defined accounts/cards |
| `analytics_preferences` | JSONB | DEFAULT '{}'::jsonb | Analytics display preferences |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Entry creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_user_settings_user_id` on `user_id`

**JSONB Structure:**
- `custom_categories`: `[{id, name, icon, type}]`
- `accounts`: `[{id, name, type}]`
- `analytics_preferences`: `{showCharts, showTrends, showProjections}`

---

### 10. `ai_conversations`
Stores AI Assistant chat history for each user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique conversation message ID |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Owner user ID |
| `session_id` | UUID | NOT NULL, DEFAULT gen_random_uuid() | Conversation session ID |
| `role` | VARCHAR(20) | NOT NULL, CHECK IN ('user', 'assistant') | Message role |
| `content` | TEXT | NOT NULL | Message content |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Message timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_ai_conversations_user_id` on `user_id`
- `idx_ai_conversations_session_id` on `session_id`
- `idx_ai_conversations_created_at` on `created_at`

---

## Data Relationships

```
users (1) ──┬── (many) income
            ├── (many) expenses
            ├── (many) budget
            ├── (many) projects
            ├── (many) goals
            ├── (many) account_transactions
            ├── (1) user_profiles
            ├── (1) user_settings
            └── (many) ai_conversations
```

---

## Security & Multi-tenancy

- **User Isolation**: All data tables include `user_id` foreign key with `ON DELETE CASCADE`
- **Authentication**: JWT-based authentication with `authenticateUser` middleware
- **Data Access**: All API endpoints filter data by `user_id` to ensure user isolation
- **Indexes**: Comprehensive indexing on `user_id` and frequently queried columns for performance

---

## API Endpoints

### Authentication
- `GET /api/auth/google/url` - Get Google OAuth URL
- `POST /api/auth/google/callback` - Handle Google OAuth callback
- `POST /api/auth/signup` - Email/password signup
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/me` - Get current user info

### Data Management
- `GET /api/income` - Get user's income entries
- `POST /api/income` - Add income entry
- `GET /api/expenses` - Get user's expense entries
- `POST /api/expenses` - Add expense entry
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Add/update project
- `GET /api/goals` - Get user's goals
- `POST /api/goals` - Add/update goal
- `GET /api/budget` - Get user's budget
- `POST /api/budget` - Add/update budget

### Account Management
- `GET /api/account/balance` - Get account balance
- `POST /api/account/transactions` - Add transaction
- `GET /api/account/transactions` - Get transactions

### Settings & Profile
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Create user settings
- `PUT /api/settings` - Update user settings
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Create user profile
- `PUT /api/profile` - Update user profile

### AI Assistant
- `POST /api/ai/chat` - Send message to AI
- `GET /api/ai/conversations` - Get conversation history
- `POST /api/ai/conversations` - Save conversation message
- `DELETE /api/ai/conversations/:session_id` - Delete conversation session

---

## Automatic Setup

The database schema is automatically created when the API server starts. The `createAllTables()` function:

1. Drops existing tables (if any) to ensure clean schema
2. Creates all tables in the correct order
3. Creates all indexes for optimal performance

**Note**: Dropping tables will delete all existing data. This is intentional for development but should be modified for production.

---

## Maintenance

### Backup
Regular backups should be performed using Fly.io's backup features:
```bash
flyctl postgres backup create -a emingo-db
```

### Migration
For production, consider using a migration tool (e.g., `node-pg-migrate`) instead of dropping/recreating tables.

---

## Performance Considerations

- All tables have indexes on `user_id` for fast user-specific queries
- Date-based indexes for time-range queries
- Category indexes for filtering
- Composite indexes where appropriate (e.g., `user_id` + `date`)

---

## Future Enhancements

Potential additions:
- `notifications` table for user notifications
- `audit_log` table for tracking changes
- `file_attachments` table for receipts/documents
- `recurring_transactions` table for automated entries
- `budget_alerts` table for budget warnings

