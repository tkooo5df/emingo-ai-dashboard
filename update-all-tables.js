// تحديث جميع الجداول
import pg from 'pg';
const { Pool } = pg;

const connectionString = 'postgres://postgres:vOZx4og262UxQeT@localhost:5432';

const pool = new Pool({ connectionString });

const updates = [
  'ALTER TABLE income ADD COLUMN IF NOT EXISTS source VARCHAR(255)',
  'ALTER TABLE projects ADD COLUMN IF NOT EXISTS client VARCHAR(255)',
  'ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_earnings DECIMAL(10, 2)',
  'ALTER TABLE projects ADD COLUMN IF NOT EXISTS hours_spent DECIMAL(10, 2)',
  'ALTER TABLE goals ADD COLUMN IF NOT EXISTS title VARCHAR(255)',
  'ALTER TABLE goals ADD COLUMN IF NOT EXISTS type VARCHAR(50)',
  'ALTER TABLE budget ADD COLUMN IF NOT EXISTS savings DECIMAL(10, 2)',
  'ALTER TABLE budget ADD COLUMN IF NOT EXISTS necessities DECIMAL(10, 2)',
  'ALTER TABLE budget ADD COLUMN IF NOT EXISTS wants DECIMAL(10, 2)',
  'ALTER TABLE budget ADD COLUMN IF NOT EXISTS investments DECIMAL(10, 2)',
  'ALTER TABLE budget ADD COLUMN IF NOT EXISTS ai_recommendation TEXT',
  'ALTER TABLE budget ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP',
];

async function updateTables() {
  try {
    console.log('🔄 جارٍ تحديث الجداول...\n');
    
    for (let i = 0; i < updates.length; i++) {
      try {
        await pool.query(updates[i]);
        console.log(`✅ ${i + 1}/${updates.length} - تم`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.log(`⚠️  ${i + 1}/${updates.length} - ${error.message}`);
        } else {
          console.log(`✅ ${i + 1}/${updates.length} - موجود بالفعل`);
        }
      }
    }
    
    console.log('\n🎉 تم تحديث جميع الجداول!');
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

updateTables();


