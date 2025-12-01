// سكريبت Node.js لإنشاء الجداول مباشرة
import pg from 'pg';
const { Pool } = pg;

// جرب localhost أولاً (إذا كان proxy نشطاً)، وإلا استخدم العنوان المباشر
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:vOZx4og262UxQeT@localhost:5432';

// إعدادات الاتصال - بدون SSL للاتصال المحلي عبر proxy
const poolConfig = {
  connectionString
};

// SSL فقط للاتصال الخارجي
if (!connectionString.includes('localhost')) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);

const sqlCommands = [
  `CREATE TABLE IF NOT EXISTS income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS budget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ongoing',
    budget DECIMAL(10, 2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target DECIMAL(10, 2) NOT NULL,
    current DECIMAL(10, 2) DEFAULT 0,
    deadline DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  'CREATE INDEX IF NOT EXISTS idx_income_date ON income(date)',
  'CREATE INDEX IF NOT EXISTS idx_income_category ON income(category)',
  'CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)',
  'CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)',
  'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
  'CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline)'
];

async function createTables() {
  try {
    console.log('🔌 جارٍ الاتصال بقاعدة البيانات...');
    
    for (let i = 0; i < sqlCommands.length; i++) {
      try {
        console.log(`\n⚙️  تنفيذ الأمر ${i + 1}/${sqlCommands.length}...`);
        await pool.query(sqlCommands[i]);
        console.log('✅ تم بنجاح');
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('ℹ️  موجود بالفعل');
        } else {
          console.error('❌ خطأ:', error.message);
        }
      }
    }

    // التحقق من الجداول
    console.log('\n📊 الجداول الموجودة:');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n🎉 تم إنشاء جميع الجداول بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.log('\n💡 تأكد من أن قاعدة البيانات متاحة على: emingo-db.fly.dev:5432');
  } finally {
    await pool.end();
  }
}

createTables();

