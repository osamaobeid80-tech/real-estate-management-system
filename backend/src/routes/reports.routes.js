// نقاط نهاية التقارير المجمّعة على مستوى قاعدة البيانات (أداء أفضل لبيانات كبيرة)
const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const router = express.Router();

// GET /api/reports/occupancy
router.get('/occupancy', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT unit_status, COUNT(*)::int AS count FROM units GROUP BY unit_status');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'خطأ في الخادم' }); }
});

router.get('/unit-types', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT unit_type, COUNT(*)::int AS count FROM units WHERE unit_type IS NOT NULL GROUP BY unit_type ORDER BY unit_type');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'خطأ في الخادم' }); }
});

router.get('/payment-status', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT status, COUNT(*)::int AS count FROM payments GROUP BY status ORDER BY status');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'خطأ في الخادم' }); }
});

// GET /api/reports/avg-rent — متوسط الإيجار السنوي من العقود النشطة
router.get('/avg-rent', requireAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COALESCE(AVG(rent_value), 0)::numeric AS avg_rent, COUNT(*)::int AS active_contracts
       FROM contracts WHERE contract_status = 'نشط'`
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'خطأ في الخادم' }); }
});

// GET /api/reports/upcoming-dues?days=30
router.get('/upcoming-dues', requireAuth, async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  try {
    const r = await pool.query(
      `SELECT * FROM payments
       WHERE status = 'مستحقة' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::interval
       ORDER BY due_date ASC`,
      [days]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'خطأ في الخادم' }); }
});

// GET /api/reports/overdue
router.get('/overdue', requireAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM payments WHERE status = 'متأخرة' OR (status = 'مستحقة' AND due_date < CURRENT_DATE) ORDER BY due_date ASC`
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'خطأ في الخادم' }); }
});

// GET /api/reports/revenue?from=2026-01-01&to=2026-12-31
router.get('/revenue', requireAuth, async (req, res) => {
  const { from, to } = req.query;
  const params = [];
  let where = `status = 'مدفوعة'`;
  if (from) { params.push(from); where += ` AND paid_date >= $${params.length}`; }
  if (to) { params.push(to); where += ` AND paid_date <= $${params.length}`; }
  try {
    const r = await pool.query(
      `SELECT to_char(paid_date, 'YYYY-MM') AS month, SUM(amount)::numeric AS total
       FROM payments WHERE ${where} GROUP BY month ORDER BY month`,
      params
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'خطأ في الخادم' }); }
});

// GET /api/reports/export?format=pdf — إنشاء PDF على الخادم من استعلامات قاعدة البيانات
router.get('/export', requireAuth, async (req, res) => {
  if (req.query.format !== 'pdf') {
    return res.status(400).json({ error: 'الصيغة المدعومة حاليًا هي pdf فقط' });
  }
  try {
    const [occupancy, revenue, overdue] = await Promise.all([
      pool.query('SELECT unit_status, COUNT(*)::int AS count FROM units GROUP BY unit_status ORDER BY unit_status'),
      pool.query(`SELECT to_char(paid_date, 'YYYY-MM') AS month, SUM(amount)::numeric AS total
        FROM payments WHERE status = 'مدفوعة' GROUP BY month ORDER BY month`),
      pool.query(`SELECT tenant_name, contract_number, amount, due_date
        FROM payments WHERE status = 'متأخرة' OR (status = 'مستحقة' AND due_date < CURRENT_DATE)
        ORDER BY due_date ASC`)
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="real-estate-report.pdf"');
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    doc.pipe(res);
    doc.fontSize(18).text('Real Estate Management Report', { align: 'center' });
    doc.moveDown().fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown().fontSize(14).text('Occupancy Summary');
    occupancy.rows.forEach(row => doc.fontSize(11).text(`${row.unit_status}: ${row.count}`));
    doc.moveDown().fontSize(14).text('Monthly Collected Revenue');
    revenue.rows.forEach(row => doc.fontSize(11).text(`${row.month}: ${row.total}`));
    doc.moveDown().fontSize(14).text('Overdue Payments');
    if (!overdue.rows.length) doc.fontSize(11).text('No overdue payments.');
    overdue.rows.forEach(row => doc.fontSize(11).text(`${row.tenant_name || '-'} | ${row.contract_number || '-'} | ${row.amount} | ${row.due_date}`));
    doc.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ error: 'فشل إنشاء التقرير' });
  }
});

module.exports = router;
