// نقطة انطلاق الخادم - نظام إدارة العقارات (Backend حقيقي)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const propertiesRoutes = require('./routes/properties.routes');
const unitsRoutes = require('./routes/units.routes');
const contractsRoutes = require('./routes/contracts.routes');
const paymentsRoutes = require('./routes/payments.routes');
const notesRoutes = require('./routes/notes.routes');
const usersRoutes = require('./routes/users.routes');
const reportsRoutes = require('./routes/reports.routes');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/unit-notes', notesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'المسار غير موجود' }));

// معالج الأخطاء العام
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'خطأ غير متوقع في الخادم' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على المنفذ ${PORT}`);
  console.log(`   فحص الصحة: http://localhost:${PORT}/health`);
});
