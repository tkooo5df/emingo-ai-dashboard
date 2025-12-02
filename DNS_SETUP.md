# إعداد DNS للدومين emingo.online

## ✅ تم إضافة الدومينات إلى Fly.io

تم إضافة الدومينات التالية إلى التطبيق:
- `emingo.online`
- `www.emingo.online`

## 📋 إعدادات DNS المطلوبة في Namecheap

### 1. إزالة السجلات الحالية:
- ❌ احذف: `CNAME www → parkingpage.namecheap.com.`
- ❌ احذف: `URL Redirect @ → http://www.emingo.online/`

### 2. إضافة السجلات الجديدة:

#### للدومين الرئيسي (emingo.online - @):

**A Record:**
- **Type:** A Record
- **Host:** @
- **Value:** `66.241.125.30`
- **TTL:** Automatic (أو 30 min)

**AAAA Record:**
- **Type:** AAAA Record
- **Host:** @
- **Value:** `2a09:8280:1::b5:cc49:0`
- **TTL:** Automatic (أو 30 min)

**DNS Challenge (للتأكد من SSL):**
- **Type:** TXT Record
- **Host:** _acme-challenge
- **Value:** `emingo.online.gky0qwo.flydns.net`
- **TTL:** Automatic (أو 30 min)

#### للدومين الفرعي (www.emingo.online):

**A Record:**
- **Type:** A Record
- **Host:** www
- **Value:** `66.241.125.30`
- **TTL:** Automatic (أو 30 min)

**AAAA Record:**
- **Type:** AAAA Record
- **Host:** www
- **Value:** `2a09:8280:1::b5:cc49:0`
- **TTL:** Automatic (أو 30 min)

**أو بدلاً من A و AAAA، يمكنك استخدام CNAME:**
- **Type:** CNAME Record
- **Host:** www
- **Value:** `gky0qwo.emingo-ai-dashboard.fly.dev`
- **TTL:** Automatic (أو 30 min)

**DNS Challenge (للتأكد من SSL):**
- **Type:** TXT Record
- **Host:** _acme-challenge.www
- **Value:** `www.emingo.online.gky0qwo.flydns.net`
- **TTL:** Automatic (أو 30 min)

## 📝 ملخص السجلات المطلوبة:

### للدومين الرئيسي (@):
```
A       @       66.241.125.30
AAAA    @       2a09:8280:1::b5:cc49:0
TXT     _acme-challenge   emingo.online.gky0qwo.flydns.net
```

### للدومين الفرعي (www):
```
A       www     66.241.125.30
AAAA    www     2a09:8280:1::b5:cc49:0
TXT     _acme-challenge.www   www.emingo.online.gky0qwo.flydns.net
```

**أو بدلاً من A و AAAA لـ www:**
```
CNAME   www     gky0qwo.emingo-ai-dashboard.fly.dev
TXT     _acme-challenge.www   www.emingo.online.gky0qwo.flydns.net
```

## ⏱️ وقت الانتشار:

- قد يستغرق انتشار DNS من 5 دقائق إلى 48 ساعة
- عادة ما يكون الانتشار سريعاً (5-30 دقيقة)

## ✅ التحقق من الإعداد:

بعد إضافة السجلات، يمكنك التحقق من:
1. الانتظار 5-10 دقائق
2. زيارة: https://emingo.online
3. زيارة: https://www.emingo.online

## 🔒 SSL Certificate:

Fly.io سيقوم تلقائياً بإنشاء شهادة SSL من Let's Encrypt بعد انتشار DNS.

## 📞 في حالة وجود مشاكل:

إذا لم يعمل الدومين بعد 30 دقيقة:
1. تحقق من صحة السجلات في Namecheap
2. استخدم أداة التحقق: https://dnschecker.org
3. تحقق من حالة الشهادة: `flyctl certs list --app emingo-ai-dashboard`

