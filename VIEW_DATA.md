# 📊 كيفية عرض البيانات من قاعدة البيانات

## الطريقة 1: استخدام API Endpoint (الأسهل)

بعد تسجيل الدخول، افتح المتصفح واذهب إلى:
```
http://localhost:8080/api/debug/data
```

سيعرض لك جميع بياناتك في JSON format.

---

## الطريقة 2: استخدام SQL مباشرة

### الاتصال بقاعدة البيانات:

```bash
flyctl postgres connect -a emingo-db
```

### أوامر SQL لعرض البيانات:

#### 1. عرض بيانات المستخدم الحالي:
```sql
-- استبدل USER_ID بـ UUID المستخدم الفعلي
SELECT * FROM income WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18';
SELECT * FROM expenses WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18';
SELECT * FROM account_transactions WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18';
SELECT * FROM projects WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18';
SELECT * FROM goals WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18';
SELECT * FROM user_settings WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18';
SELECT * FROM user_profiles WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18';
SELECT * FROM budget WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18';
SELECT * FROM ai_conversations WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18';
```

#### 2. عرض جميع المستخدمين:
```sql
SELECT id, email, name, created_at FROM users;
```

#### 3. إحصائيات سريعة:
```sql
-- عدد المستخدمين
SELECT COUNT(*) as total_users FROM users;

-- إجمالي الدخل لكل مستخدم
SELECT 
  u.email,
  u.name,
  COALESCE(SUM(i.amount), 0) as total_income
FROM users u
LEFT JOIN income i ON u.id = i.user_id
GROUP BY u.id, u.email, u.name;

-- إجمالي المصروفات لكل مستخدم
SELECT 
  u.email,
  u.name,
  COALESCE(SUM(e.amount), 0) as total_expenses
FROM users u
LEFT JOIN expenses e ON u.id = e.user_id
GROUP BY u.id, u.email, u.name;

-- رصيد كل مستخدم (الدخل - المصروفات)
SELECT 
  u.email,
  u.name,
  COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0) as balance
FROM users u
LEFT JOIN income i ON u.id = i.user_id
LEFT JOIN expenses e ON u.id = e.user_id
GROUP BY u.id, u.email, u.name;
```

#### 4. عرض أحدث البيانات:
```sql
-- أحدث 10 دخل
SELECT * FROM income 
WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18'
ORDER BY created_at DESC 
LIMIT 10;

-- أحدث 10 مصروفات
SELECT * FROM expenses 
WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18'
ORDER BY created_at DESC 
LIMIT 10;

-- أحدث 10 معاملات
SELECT * FROM account_transactions 
WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18'
ORDER BY created_at DESC 
LIMIT 10;
```

#### 5. عرض البيانات حسب التاريخ:
```sql
-- الدخل لهذا الشهر
SELECT * FROM income 
WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18'
  AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE);

-- المصروفات لهذا الشهر
SELECT * FROM expenses 
WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18'
  AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE);
```

#### 6. عرض البيانات حسب الفئة:
```sql
-- الدخل حسب الفئة
SELECT category, SUM(amount) as total
FROM income 
WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18'
GROUP BY category
ORDER BY total DESC;

-- المصروفات حسب الفئة
SELECT category, SUM(amount) as total
FROM expenses 
WHERE user_id = '97895c35-c4f4-4a69-8693-cd7abddb3f18'
GROUP BY category
ORDER BY total DESC;
```

---

## الطريقة 3: استخدام أوامر psql المفيدة

```sql
-- عرض جميع الجداول
\dt

-- عرض بنية جدول معين
\d income
\d expenses
\d users

-- عرض جميع الأعمدة في جدول
\d+ income

-- الخروج من psql
\q
```

---

## ملاحظات مهمة:

1. **UUID المستخدم الحالي**: `97895c35-c4f4-4a69-8693-cd7abddb3f18`
2. **تأكد من تشغيل flyctl proxy** قبل الاتصال:
   ```bash
   flyctl proxy 5432 -a emingo-db
   ```
3. **جميع البيانات محمية**: كل مستخدم يرى بياناته فقط
4. **استخدم API endpoint** للعرض السريع: `http://localhost:8080/api/debug/data`

---

## استكشاف الأخطاء:

إذا كانت الجداول فارغة:
1. تأكد من أنك سجلت الدخول بشكل صحيح
2. تأكد من أن API server يعمل
3. تأكد من أن flyctl proxy يعمل
4. جرب إضافة بيانات جديدة من التطبيق
5. تحقق من console logs في API server


