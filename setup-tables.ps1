# سكريبت PowerShell لإنشاء الجداول في قاعدة البيانات

$connectionString = "postgres://postgres:vOZx4og262UxQeT@emingo-db.fly.dev:5432"

# قراءة ملف SQL
$sqlContent = Get-Content -Path "create-tables.sql" -Raw

# تنظيف محتوى SQL (إزالة التعليقات والأوامر الخاصة بـ psql)
$sqlContent = $sqlContent -replace '--.*', '' -replace '\\dt', '' -replace '\s+', ' '

# تقسيم إلى أوامر منفصلة
$commands = $sqlContent -split ';' | Where-Object { $_.Trim() -ne '' }

Write-Host "جارٍ إنشاء الجداول..." -ForegroundColor Green

# محاولة استخدام psql إذا كان مثبتاً
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "تم العثور على psql، جارٍ الاتصال..." -ForegroundColor Yellow
    
    # استخدام flyctl proxy أولاً
    Write-Host "يرجى تشغيل هذا الأمر في terminal منفصل:" -ForegroundColor Cyan
    Write-Host "flyctl proxy 5432 -a emingo-db" -ForegroundColor White
    
    Write-Host "`nثم في terminal آخر، نفذ:" -ForegroundColor Cyan
    Write-Host "psql postgres://postgres:vOZx4og262UxQeT@localhost:5432 -f create-tables.sql" -ForegroundColor White
} else {
    Write-Host "psql غير مثبت. يرجى استخدام flyctl postgres connect يدوياً" -ForegroundColor Red
}

