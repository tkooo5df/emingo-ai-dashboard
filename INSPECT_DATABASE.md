# فحص قاعدة البيانات PostgreSQL

## الطريقة 1: استخدام psql مباشرة

1. الاتصال بقاعدة البيانات:
```bash
flyctl postgres connect -a emingo-db
```

2. بعد الاتصال، نفذ الأوامر التالية:

```sql
-- عرض جميع الجداول
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- فحص جدول ai_conversations
SELECT 
    COUNT(*) as total_messages,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    MIN(created_at) as oldest_message,
    MAX(created_at) as newest_message
FROM ai_conversations;

-- عرض عينة من المحادثات
SELECT user_id, session_id, role, LEFT(content, 100) as content_preview, created_at
FROM ai_conversations
ORDER BY created_at DESC
LIMIT 10;

-- فحص جدول users
SELECT COUNT(*) as total_users FROM users;

-- عدد الصفوف في كل جدول
SELECT 'income' as table_name, COUNT(*) as row_count FROM income
UNION ALL SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'goals', COUNT(*) FROM goals
UNION ALL SELECT 'debts', COUNT(*) FROM debts
UNION ALL SELECT 'account_transactions', COUNT(*) FROM account_transactions
UNION ALL SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL SELECT 'user_settings', COUNT(*) FROM user_settings
UNION ALL SELECT 'budget', COUNT(*) FROM budget
UNION ALL SELECT 'ai_conversations', COUNT(*) FROM ai_conversations
ORDER BY table_name;
```

## الطريقة 2: استخدام API Endpoint

بعد نشر التعديلات، يمكنك استخدام الـ endpoint التالي:

```
GET /api/database/inspect
```

يتطلب authentication token.

## الملفات المتوفرة

- `inspect-db.sql` - ملف SQL كامل لفحص قاعدة البيانات
- `check-database.js` - سكريبت Node.js للفحص (يتطلب اتصال محلي)
- `inspect-database.js` - سكريبت Node.js للفحص عبر API

