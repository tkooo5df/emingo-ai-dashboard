# 🚀 إعداد API Server

## المشكلة:
مكتبة `pg` لا تعمل في المتصفح لأنها مكتبة Node.js. لذلك تم إنشاء API server منفصل.

## ✅ الحل المطبق:

### 1. API Server
- تم إنشاء `server/api.js` - Express server للتعامل مع قاعدة البيانات
- يعمل على المنفذ `3001`

### 2. API Client
- تم إنشاء `src/lib/api.ts` - عميل API للاتصال بالـ server
- يستخدم `fetch` API (يعمل في المتصفح)

### 3. تحديث storage.ts
- تم تحديث جميع الدوال لاستخدام API بدلاً من `pg` مباشرة

---

## 🚀 كيفية التشغيل:

### الطريقة 1: تشغيل كل شيء معاً (موصى به)

```bash
npm run dev:all
```

هذا سيشغل:
- API Server على `http://localhost:3001`
- Vite Dev Server على `http://localhost:8080`

### الطريقة 2: تشغيل منفصل

**Terminal 1 - API Server:**
```bash
npm run dev:api
```

**Terminal 2 - Vite Dev Server:**
```bash
npm run dev
```

**Terminal 3 - Fly.io Proxy (للتنمية المحلية):**
```bash
flyctl proxy 5432 -a emingo-db
```

---

## ⚙️ إعداد متغيرات البيئة:

### للـ API Server:
أنشئ ملف `.env` في المجلد الرئيسي:

```env
DATABASE_URL=postgres://postgres:vOZx4og262UxQeT@localhost:5432
```

### للـ Frontend:
أنشئ ملف `.env.local`:

```env
VITE_API_URL=/api
```

(أو اتركه فارغاً - سيستخدم proxy من Vite)

---

## 📋 Endpoints المتاحة:

### Income
- `GET /api/income` - جلب جميع الدخل
- `POST /api/income` - إضافة دخل جديد

### Expenses
- `GET /api/expenses` - جلب جميع المصروفات
- `POST /api/expenses` - إضافة مصروف جديد

### Projects
- `GET /api/projects` - جلب جميع المشاريع
- `POST /api/projects` - إضافة مشروع جديد
- `PATCH /api/projects/:id` - تحديث مشروع

### Goals
- `GET /api/goals` - جلب جميع الأهداف
- `POST /api/goals` - إضافة هدف جديد
- `PATCH /api/goals/:id` - تحديث هدف

### Budget
- `GET /api/budget` - جلب الميزانية
- `POST /api/budget` - حفظ الميزانية

### Calculations
- `GET /api/calculate/monthly-income` - حساب الدخل الشهري
- `GET /api/calculate/monthly-expenses` - حساب المصروفات الشهرية

### Account
- `GET /api/account/balance` - جلب رصيد الحساب
- `POST /api/account/transactions` - إضافة معاملة

---

## ✅ التحقق من العمل:

1. شغل API Server: `npm run dev:api`
2. افتح: `http://localhost:3001/api/health`
3. يجب أن ترى: `{"status":"ok"}`

---

## 🎉 الآن التطبيق يعمل بدون أخطاء!

جميع طلبات قاعدة البيانات تمر عبر API Server بدلاً من المتصفح مباشرة.


