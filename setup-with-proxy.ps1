# سكريبت PowerShell لإعداد قاعدة البيانات باستخدام proxy

Write-Host "🚀 إعداد قاعدة البيانات Fly.io" -ForegroundColor Green
Write-Host ""

# التحقق من وجود proxy نشط
Write-Host "📡 جارٍ فتح proxy للاتصال بقاعدة البيانات..." -ForegroundColor Yellow
Write-Host "   (سيتم فتح proxy في نافذة منفصلة)" -ForegroundColor Gray
Write-Host ""

# فتح proxy في نافذة منفصلة
Start-Process powershell -ArgumentList "-NoExit", "-Command", "flyctl proxy 5432 -a emingo-db"

Write-Host "⏳ انتظر 5 ثوانٍ حتى يبدأ proxy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "✅ Proxy نشط الآن على localhost:5432" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 جارٍ إنشاء الجداول..." -ForegroundColor Yellow
Write-Host ""

# تشغيل سكريبت Node.js
node setup-tables.js

Write-Host ""
Write-Host "✅ تم!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 لإغلاق proxy، أغلق نافذة PowerShell المنفصلة" -ForegroundColor Cyan

