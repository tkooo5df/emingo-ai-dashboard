# إعداد ملف البيئة (.env.local)

## خطوات الإعداد:

### 1. أنشئ ملف `.env.local` في المجلد الرئيسي

### 2. أضف هذا المحتوى:

```env
VITE_DATABASE_URL=postgres://postgres:vOZx4og262UxQeT@localhost:5432
```

### 3. شغل proxy في terminal منفصل:

```bash
flyctl proxy 5432 -a emingo-db
```

### 4. شغل التطبيق:

```bash
npm run dev
```

---

## ⚠️ ملاحظات:

- ملف `.env.local` موجود في `.gitignore` ولن يُرفع إلى Git
- للاتصال المحلي: استخدم `localhost:5432`
- للإنتاج: استخدم `emingo-db.flycast:5432`

---

## 🔐 معلومات الاتصال:

```
Username: postgres
Password: vOZx4og262UxQeT
Database: postgres
Host: emingo-db.internal (من داخل Fly.io)
Host: localhost (عبر proxy)
Port: 5432
```


