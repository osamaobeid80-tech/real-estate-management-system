// طبقة الاتصال بقاعدة بيانات PostgreSQL
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // فعّل SSL تلقائيًا عند النشر على أغلب مزودي الاستضافة السحابية (Render/Railway/Neon)
  ssl: false
});

pool.on('error', (err) => {
  console.error('خطأ غير متوقع في اتصال قاعدة البيانات:', err);
});

module.exports = pool;
