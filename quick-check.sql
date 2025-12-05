-- فحص سريع لقاعدة البيانات

-- 1. جميع الجداول
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 2. إحصائيات ai_conversations
SELECT COUNT(*) as total, COUNT(DISTINCT user_id) as users, COUNT(DISTINCT session_id) as sessions FROM ai_conversations;

-- 3. عينة من المحادثات
SELECT role, LEFT(content, 50) as preview, created_at FROM ai_conversations ORDER BY created_at DESC LIMIT 5;

-- 4. عدد الصفوف في كل جدول
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL SELECT 'income', COUNT(*) FROM income
UNION ALL SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'goals', COUNT(*) FROM goals
UNION ALL SELECT 'debts', COUNT(*) FROM debts
UNION ALL SELECT 'account_transactions', COUNT(*) FROM account_transactions
UNION ALL SELECT 'ai_conversations', COUNT(*) FROM ai_conversations;

-- 5. بنية ai_conversations
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ai_conversations';

