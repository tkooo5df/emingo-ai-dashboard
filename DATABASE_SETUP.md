# 🗄️ إعداد قاعدة البيانات Fly.io - دليل شامل

## ✅ تم إنشاء قاعدة البيانات بنجاح!

### معلومات الاتصال:
```
اسم قاعدة البيانات: emingo-db
المنطقة: ams (Amsterdam)
Username: postgres
Password: vOZx4og262UxQeT
Hostname: emingo-db.internal
Port: 5432
```

### Connection Strings:
- **من داخل Fly.io**: `postgres://postgres:vOZx4og262UxQeT@emingo-db.flycast:5432`
- **من خارج Fly.io**: `postgres://postgres:vOZx4og262UxQeT@emingo-db.fly.dev:5432`

---

## 📋 خطوات إنشاء الجداول

### الطريقة الأسهل: استخدام flyctl connect

1. **افتح اتصال بقاعدة البيانات:**
```bash
flyctl postgres connect -a emingo-db
```

2. **انسخ والصق هذا الكود في psql:**

```sql
-- جدول الدخل
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول المصروفات
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول الميزانية
CREATE TABLE IF NOT EXISTS budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  period VARCHAR(20) DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول المشاريع
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'ongoing',
  budget DECIMAL(10, 2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول الأهداف
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target DECIMAL(10, 2) NOT NULL,
  current DECIMAL(10, 2) DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء فهارس
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);

-- التحقق من الجداول
\dt
```

3. **اضغط Enter** بعد لصق الكود

---

## 🔧 تحديث المشروع للاتصال بقاعدة البيانات

### 1. إنشاء ملف `.env.local`:

```env
VITE_DATABASE_URL=postgres://postgres:vOZx4og262UxQeT@emingo-db.fly.dev:5432
```

### 2. تثبيت مكتبة PostgreSQL:

```bash
npm install pg @types/pg
```

### 3. إنشاء ملف اتصال قاعدة البيانات:

أنشئ ملف `src/lib/database.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: import.meta.env.VITE_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export { pool };
```

---

## 🚀 استخدام قاعدة البيانات في التطبيق

بعد إنشاء الجداول، يمكنك تحديث ملفات `storage.ts` لاستخدام قاعدة البيانات بدلاً من localStorage.

---

## 📝 ملاحظات مهمة:

1. **احفظ كلمة المرور في مكان آمن** - لن تتمكن من رؤيتها مرة أخرى
2. **استخدم Environment Variables** - لا تضع كلمة المرور في الكود مباشرة
3. **للإنتاج**: استخدم Fly.io Secrets لإدارة المتغيرات بشكل آمن

---

## 🔐 إدارة Secrets في Fly.io:

```bash
# إضافة secret
flyctl secrets set DATABASE_URL="postgres://postgres:vOZx4og262UxQeT@emingo-db.flycast:5432" -a your-app-name
```

---

## ✅ التحقق من الاتصال:

```bash
# اختبار الاتصال
flyctl postgres connect -a emingo-db

# في psql:
SELECT version();
\dt
```

---

**تم إنشاء قاعدة البيانات بنجاح! 🎉**

