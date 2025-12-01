# سكريبت لإنشاء الجداول مباشرة في قاعدة البيانات

Write-Host "🚀 بدء إنشاء الجداول في قاعدة البيانات..." -ForegroundColor Green

# قراءة ملف SQL المبسط
$sqlCommands = @"
CREATE TABLE IF NOT EXISTS income (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), amount DECIMAL(10, 2) NOT NULL, description TEXT, category VARCHAR(100), date DATE NOT NULL, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS expenses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), amount DECIMAL(10, 2) NOT NULL, description TEXT, category VARCHAR(100) NOT NULL, date DATE NOT NULL, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS budget (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), category VARCHAR(100) NOT NULL UNIQUE, amount DECIMAL(10, 2) NOT NULL, period VARCHAR(20) DEFAULT 'monthly', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, description TEXT, status VARCHAR(50) DEFAULT 'ongoing', budget DECIMAL(10, 2), start_date DATE, end_date DATE, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS goals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, description TEXT, target DECIMAL(10, 2) NOT NULL, current DECIMAL(10, 2) DEFAULT 0, deadline DATE, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
"@

# حفظ في ملف مؤقت
$tempFile = "temp-commands.sql"
$sqlCommands | Out-File -FilePath $tempFile -Encoding utf8

Write-Host "`n📝 تم إنشاء ملف SQL مؤقت" -ForegroundColor Yellow
Write-Host "`n⚠️  يرجى تنفيذ الأوامر التالية يدوياً:" -ForegroundColor Cyan
Write-Host "`n1. افتح terminal جديد واكتب:" -ForegroundColor White
Write-Host "   flyctl postgres connect -a emingo-db" -ForegroundColor Green
Write-Host "`n2. في psql، انسخ والصق محتوى ملف create-tables-simple.sql" -ForegroundColor White
Write-Host "`nأو استخدم هذا الأمر المباشر:" -ForegroundColor White

# عرض الأوامر
$commands = $sqlCommands -split ';' | Where-Object { $_.Trim() -ne '' }
foreach ($cmd in $commands) {
    Write-Host "   $cmd;" -ForegroundColor Gray
}

Write-Host "`n✅ بعد التنفيذ، تحقق من الجداول بـ: \dt" -ForegroundColor Green

