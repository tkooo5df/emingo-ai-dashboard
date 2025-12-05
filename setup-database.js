// سكريبت Node.js لإنشاء الجداول في قاعدة البيانات Fly.io
import pg from 'pg';
import { readFileSync } from 'fs';

const { Pool } = pg;

// معلومات الاتصال
const connectionString = 'postgres://postgres:vOZx4og262UxQeT@emingo-db.fly.dev:5432';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    console.log('🔌 جارٍ الاتصال بقاعدة البيانات...');
    
    // قراءة ملف SQL
    const sqlFile = readFileSync('create-tables.sql', 'utf8');
    
    // تقسيم إلى أوامر منفصلة (إزالة التعليقات والأوامر الخاصة)
    const commands = sqlFile
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => 
        cmd && 
        !cmd.startsWith('--') && 
        !cmd.startsWith('\\') &&
        cmd.length > 0
      );

    console.log(`📝 تم العثور على ${commands.length} أمر SQL`);

    // تنفيذ كل أمر
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command) {
        try {
          console.log(`\n⚙️  تنفيذ الأمر ${i + 1}/${commands.length}...`);
          await pool.query(command);
          console.log('✅ تم بنجاح');
        } catch (error) {
          // تجاهل الأخطاء إذا كانت الجداول موجودة بالفعل
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('ℹ️  الجدول موجود بالفعل');
          } else {
            console.error('❌ خطأ:', error.message);
          }
        }
      }
    }

    // التحقق من الجداول المنشأة
    console.log('\n📊 الجداول الموجودة:');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    tables.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n🎉 تم إنشاء الجداول بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
    console.log('\n💡 نصيحة: تأكد من أن flyctl proxy يعمل على المنفذ 5432');
    console.log('   نفذ: flyctl proxy 5432 -a emingo-db');
  } finally {
    await pool.end();
  }
}

setupDatabase();


