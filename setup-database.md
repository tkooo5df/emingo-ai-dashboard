# دليل إعداد قاعدة البيانات Fly.io

## ✅ تم إنشاء قاعدة البيانات بنجاح!

### معلومات قاعدة البيانات:
- **اسم التطبيق**: emingo-db
- **المنطقة**: ams (Amsterdam)
- **Username**: postgres
- **Password**: vOZx4og262UxQeT
- **Hostname**: emingo-db.internal
- **Port**: 5432

## خطوات إنشاء الجداول:

### الطريقة 1: استخدام psql مباشرة

1. افتح اتصال بقاعدة البيانات:
```bash
flyctl postgres connect -a emingo-db
```

2. في psql، انسخ والصق محتوى ملف `create-tables.sql`:
```sql
-- انسخ محتوى create-tables.sql هنا
```

### الطريقة 2: استخدام flyctl proxy

1. افتح proxy للاتصال المحلي:
```bash
flyctl proxy 5432 -a emingo-db
```

2. في terminal آخر، استخدم psql:
```bash
psql postgres://postgres:vOZx4og262UxQeT@localhost:5432
```

3. ثم نفذ ملف SQL:
```bash
\i create-tables.sql
```

### الطريقة 3: استخدام أداة GUI

استخدم أدوات مثل:
- **pgAdmin**: https://www.pgadmin.org/
- **DBeaver**: https://dbeaver.io/
- **TablePlus**: https://tableplus.com/

**معلومات الاتصال:**
- Host: emingo-db.fly.dev (أو استخدم proxy على localhost:5432)
- Port: 5432
- Database: postgres
- Username: postgres
- Password: vOZx4og262UxQeT

## الجداول المطلوبة:

1. **income** - جدول الدخل
2. **expenses** - جدول المصروفات
3. **budget** - جدول الميزانية
4. **projects** - جدول المشاريع
5. **goals** - جدول الأهداف

جميع الجداول موجودة في ملف `create-tables.sql`

## تحديث المشروع:

بعد إنشاء الجداول، ستحتاج إلى:
1. تحديث ملفات المشروع للاتصال بقاعدة البيانات
2. إضافة متغيرات البيئة
3. تحديث كود التطبيق لاستخدام قاعدة البيانات بدلاً من localStorage


