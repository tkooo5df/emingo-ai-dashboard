-- تحديث الجداول لتطابق الواجهات الحالية

-- إضافة عمود source إلى جدول income
ALTER TABLE income ADD COLUMN IF NOT EXISTS source VARCHAR(255);

-- تحديث جدول projects لإضافة الأعمدة المطلوبة
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_earnings DECIMAL(10, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hours_spent DECIMAL(10, 2);

-- تحديث جدول goals لإضافة الأعمدة المطلوبة
ALTER TABLE goals ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- تحديث جدول budget ليدعم BudgetPlan
ALTER TABLE budget DROP CONSTRAINT IF EXISTS budget_category_key;
ALTER TABLE budget ADD COLUMN IF NOT EXISTS savings DECIMAL(10, 2);
ALTER TABLE budget ADD COLUMN IF NOT EXISTS necessities DECIMAL(10, 2);
ALTER TABLE budget ADD COLUMN IF NOT EXISTS wants DECIMAL(10, 2);
ALTER TABLE budget ADD COLUMN IF NOT EXISTS investments DECIMAL(10, 2);
ALTER TABLE budget ADD COLUMN IF NOT EXISTS ai_recommendation TEXT;
ALTER TABLE budget ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP;


