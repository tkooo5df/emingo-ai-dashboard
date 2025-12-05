-- فحص قاعدة البيانات PostgreSQL

-- 1. عرض جميع الجداول مع عدد الصفوف
\echo '=== جميع الجداول ==='
SELECT 
    table_name as "اسم الجدول",
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as "عدد الأعمدة"
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. فحص جدول ai_conversations
\echo ''
\echo '=== إحصائيات جدول ai_conversations ==='
SELECT 
    COUNT(*) as "إجمالي الرسائل",
    COUNT(DISTINCT user_id) as "عدد المستخدمين",
    COUNT(DISTINCT session_id) as "عدد الجلسات",
    MIN(created_at) as "أقدم رسالة",
    MAX(created_at) as "أحدث رسالة"
FROM ai_conversations;

-- 3. عرض عينة من المحادثات (آخر 10)
\echo ''
\echo '=== عينة من المحادثات (آخر 10) ==='
SELECT 
    user_id as "معرف المستخدم",
    session_id as "معرف الجلسة",
    role as "الدور",
    LEFT(content, 80) as "محتوى الرسالة",
    created_at as "التاريخ"
FROM ai_conversations
ORDER BY created_at DESC
LIMIT 10;

-- 4. فحص جدول users
\echo ''
\echo '=== إحصائيات جدول users ==='
SELECT 
    COUNT(*) as "إجمالي المستخدمين",
    COUNT(DISTINCT id) as "معرفات فريدة"
FROM users;

-- 5. عرض عينة من المستخدمين
\echo ''
\echo '=== عينة من المستخدمين (آخر 5) ==='
SELECT 
    id as "المعرف",
    email as "البريد الإلكتروني",
    name as "الاسم",
    created_at as "تاريخ الإنشاء"
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- 6. عدد الصفوف في كل جدول
\echo ''
\echo '=== عدد الصفوف في كل جدول ==='
SELECT 'income' as "الجدول", COUNT(*) as "عدد الصفوف" FROM income
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
ORDER BY "الجدول";

-- 7. بنية جدول ai_conversations
\echo ''
\echo '=== بنية جدول ai_conversations ==='
SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "قابل للفراغ",
    column_default as "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_name = 'ai_conversations'
ORDER BY ordinal_position;

