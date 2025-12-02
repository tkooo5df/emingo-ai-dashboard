# إعداد تسجيل الدخول بواسطة Google
# Google OAuth Setup Guide

## 📋 الخطوات (Steps):

### 1. افتح Google Cloud Console
**رابط:** https://console.cloud.google.com/

### 2. إنشاء مشروع جديد أو اختيار مشروع موجود
- اذهب إلى القائمة العلوية
- اختر أو أنشئ مشروع

### 3. تفعيل Google+ API
- اذهب إلى "APIs & Services" → "Library"
- ابحث عن "Google+ API"
- اضغط "Enable"

### 4. إنشاء OAuth 2.0 Credentials
- اذهب إلى "APIs & Services" → "Credentials"
- اضغط "Create Credentials"
- اختر "OAuth 2.0 Client ID"

### 5. ملء المعلومات:
```
Application type: Web application
Name: EMINGO AI Dashboard

Authorized JavaScript origins:
- http://localhost:8080
- https://emingo-ai-dashboard.fly.dev

Authorized redirect URIs:
- http://localhost:8080/auth/callback
- https://emingo-ai-dashboard.fly.dev/auth/callback
```

### 6. احصل على المفاتيح
بعد الإنشاء، ستحصل على:
- ✅ **Client ID** (مثل: 123456789-abc.apps.googleusercontent.com)
- ✅ **Client Secret** (مثل: GOCSPX-abc123...)

---

## 💾 تطبيق المفاتيح (Apply Keys):

### للتطوير المحلي (Local Development):
أضف إلى ملف `.env.local`:

```bash
GOOGLE_CLIENT_ID="ضع هنا Client ID"
GOOGLE_CLIENT_SECRET="ضع هنا Client Secret"
GOOGLE_REDIRECT_URI="http://localhost:8080/auth/callback"
```

### للإنتاج على Fly.io (Production):
نفذ هذا الأمر:

```bash
flyctl secrets set \
  GOOGLE_CLIENT_ID="ضع هنا Client ID" \
  GOOGLE_CLIENT_SECRET="ضع هنا Client Secret" \
  GOOGLE_REDIRECT_URI="https://emingo-ai-dashboard.fly.dev/auth/callback" \
  --app emingo-ai-dashboard
```

---

## 🔓 تفعيل زر Google (Enable Google Button):

سأقوم بتفعيله لك تلقائياً بمجرد حصولك على المفاتيح!

---

## ✅ بعد الانتهاء:
1. ستظهر زر "Continue with Google"
2. يمكن للمستخدمين تسجيل الدخول بحساب Google
3. لن تكون هناك أخطاء

---

## 📞 هل تحتاج مساعدة؟
أخبرني عندما تحصل على Client ID و Client Secret وسأقوم بتهيئة كل شيء لك!

