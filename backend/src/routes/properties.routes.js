// CRUD كامل لجدول العقارات (المباني/الأصول) مع فرض الصلاحيات على مستوى الخادم
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const EDITOR_ROLES = ['مسؤول النظام', 'موظف إدخال بيانات'];
const ADMIN_ONLY = ['مسؤول النظام'];
const SORTABLE = ['property_name', 'property_type', 'city', 'created_at'];

// GET /api/properties?page=1&limit=20&search=&sort=property_name
router.get('/', requireAuth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const search = (req.query.search || '').trim();
  const sort = SORTABLE.includes(req.query.sort) ? req.query.sort : 'property_name';

  try {
    const where = search
      ? 'WHERE property_name ILIKE $1 OR owner_name ILIKE $1 OR city ILIKE $1 OR address ILIKE $1'
      : '';
    const params = search ? [`%${search}%`] : [];

    const totalRes = await pool.query(`SELECT COUNT(*) FROM properties ${where}`, params);
    const dataRes = await pool.query(
      `SELECT * FROM properties ${where} ORDER BY ${sort} NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    res.json({ data: dataRes.rows, total: parseInt(totalRes.rows[0].count, 10), page, limit });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/properties/:id/units-count — عدد الوحدات المرتبطة (مساعد للواجهة)
router.get('/:id/units-count', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT COUNT(*)::int AS count FROM units WHERE property_id = $1', [req.params.id]);
    res.json({ count: r.rows[0].count });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'العقار غير موجود' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

router.post('/', requireAuth, requireRole(...EDITOR_ROLES), async (req, res) => {
  const b = req.body || {};
  if (!b.property_name) return res.status(400).json({ error: 'اسم العقار مطلوب' });
  try {
    const r = await pool.query(
      `INSERT INTO properties (property_name, property_type, address, city, owner_name, owner_phone, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [b.property_name, b.property_type || 'سكني', b.address, b.city, b.owner_name, b.owner_phone, b.notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'فشل إنشاء العقار' });
  }
});

router.patch('/:id', requireAuth, requireRole(...EDITOR_ROLES), async (req, res) => {
  const allowed = ['property_name', 'property_type', 'address', 'city', 'owner_name', 'owner_phone', 'notes'];
  const fields = Object.keys(req.body || {}).filter(f => allowed.includes(f));
  if (fields.length === 0) return res.status(400).json({ error: 'لا توجد بيانات صالحة للتحديث' });

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map(f => req.body[f]);
  try {
    const r = await pool.query(
      `UPDATE properties SET ${setClause}, updated_at = now() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'العقار غير موجود' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'فشل تحديث العقار' });
  }
});

// الحذف مقصور على مسؤول النظام فقط. يفصل الوحدات المرتبطة تلقائيًا (property_id = NULL) بدل حذفها
router.delete('/:id', requireAuth, requireRole(...ADMIN_ONLY), async (req, res) => {
  try {
    await pool.query('UPDATE units SET property_id = NULL WHERE property_id = $1', [req.params.id]);
    const r = await pool.query('DELETE FROM properties WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'العقار غير موجود' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'فشل حذف العقار' });
  }
});

module.exports = router;
