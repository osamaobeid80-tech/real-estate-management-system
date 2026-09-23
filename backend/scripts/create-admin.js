// سكربت مساعد لإنشاء أول مستخدم "مسؤول النظام" بكلمة مرور مُجزّأة (Hashed) بأمان
// الاستخدام: npm run create-admin -- "الاسم الكامل" "email@example.com" "PasswordQuery123" "مسؤول النظام"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

async function main() {
  const [, , fullName, email, password, role] = process.argv;
  if (!fullName || !email || !password) {
    console.log('الاستخدام: npm run create-admin -- "الاسم الكامل" "email@example.com" "password123" ["مسؤول النظام"]');
    process.exit(1);
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO app_users (full_name, email, password_hash, role, active)
       VALUES ($1,$2,$3,$4,true) RETURNING id, full_name, email, role`,
      [fullName, email.toLowerCase().trim(), hash, role || 'مسؤول النظام']
    );
    console.log('✅ تم إنشاء المستخدم بنجاح:', r.rows[0]);
  } catch (e) {
    console.error('❌ فشل إنشاء المستخدم:', e.message);
  } finally {
    process.exit(0);
  }
}
main();
