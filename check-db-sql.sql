-- فحص قاعدة البيانات PostgreSQL

-- 1. عرض جميع الجداول
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. فحص جدول ai_conversations
SELECT 
    'ai_conversations' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    MIN(created_at) as oldest_message,
    MAX(created_at) as newest_message
FROM ai_conversations;

-- 3. عرض عينة من المحادثات
SELECT 
    user_id,
    session_id,
    role,
    LEFT(content, 100) as content_preview,
    created_at
FROM ai_conversations
ORDER BY created_at DESC
LIMIT 10;

-- 4. فحص جدول users
SELECT 
    'users' as table_name,
    COUNT(*) as total_users,
    COUNT(DISTINCT id) as unique_ids
FROM users;

-- 5. عرض عينة من المستخدمين
SELECT 
    id,
    email,
    name,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- 6. فحص جميع الجداول مع عدد الصفوف
SELECT 
    'income' as table_name, COUNT(*) as row_count FROM income
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'goals', COUNT(*) FROM goals
UNION ALL
SELECT 'debts', COUNT(*) FROM debts
UNION ALL
SELECT 'account_transactions', COUNT(*) FROM account_transactions
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'user_settings', COUNT(*) FROM user_settings
UNION ALL
SELECT 'budget', COUNT(*) FROM budget
UNION ALL
SELECT 'ai_conversations', COUNT(*) FROM ai_conversations
ORDER BY table_name;

-- 7. فحص بنية جدول ai_conversations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ai_conversations'
ORDER BY ordinal_position;

