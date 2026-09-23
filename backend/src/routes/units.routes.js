// CRUD كامل لجدول الوحدات (تابعة لعقار) مع فرض الصلاحيات على مستوى الخادم
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const EDITOR_ROLES = ['مسؤول النظام', 'موظف إدخال بيانات'];
const ADMIN_ONLY = ['مسؤول النظام'];
const SORTABLE = ['unit_number', 'unit_status', 'created_at'];

// GET /api/units?page=1&limit=20&search=&sort=unit_number&property_id=
router.get('/', requireAuth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const search = (req.query.search || '').trim();
  const { property_id, status } = req.query;
  const sort = SORTABLE.includes(req.query.sort) ? req.query.sort : 'unit_number';

  const conditions = [];
  const params = [];
  if (search) { params.push(`%${search}%`); conditions.push(`unit_number ILIKE $${params.length}`); }
  if (property_id) { params.push(property_id); conditions.push(`property_id = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`unit_status = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const totalRes = await pool.query(`SELECT COUNT(*) FROM units ${where}`, params);
    const dataRes = await pool.query(
      `SELECT * FROM units ${where} ORDER BY ${sort} NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    res.json({ data: dataRes.rows, total: parseInt(totalRes.rows[0].count, 10), page, limit });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM units WHERE id = $1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'الوحدة غير موجودة' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

router.post('/', requireAuth, requireRole(...EDITOR_ROLES), async (req, res) => {
  const b = req.body || {};
  if (!b.unit_number) return res.status(400).json({ error: 'رقم الوحدة مطلوب' });
  if (!b.property_id) return res.status(400).json({ error: 'يجب اختيار العقار' });
  try {
    const r = await pool.query(
      `INSERT INTO units (property_id, unit_number, unit_type, floor, area_sqm, unit_status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [b.property_id, b.unit_number, b.unit_type, b.floor, b.area_sqm || null, b.unit_status || 'شاغرة', b.notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'فشل إنشاء الوحدة' });
  }
});

// PATCH لتحديث جزئي - يقبل أيًا من الحقول المرسلة فقط
router.patch('/:id', requireAuth, requireRole(...EDITOR_ROLES), async (req, res) => {
  const allowed = ['property_id', 'unit_number', 'unit_type', 'floor', 'area_sqm', 'unit_status', 'notes'];
  const fields = Object.keys(req.body || {}).filter(f => allowed.includes(f));
  if (fields.length === 0) return res.status(400).json({ error: 'لا توجد بيانات صالحة للتحديث' });

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map(f => req.body[f]);
  try {
    const r = await pool.query(
      `UPDATE units SET ${setClause}, updated_at = now() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'الوحدة غير موجودة' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'فشل تحديث الوحدة' });
  }
});

// الحذف مقصور على مسؤول النظام فقط، ويُرفض إن كان للوحدة عقد نشط (مطابقة لمنطق الواجهة)
router.delete('/:id', requireAuth, requireRole(...ADMIN_ONLY), async (req, res) => {
  try {
    const activeContract = await pool.query(
      `SELECT id FROM contracts WHERE unit_id = $1 AND contract_status = 'نشط' LIMIT 1`,
      [req.params.id]
    );
    if (activeContract.rows[0]) {
      return res.status(409).json({ error: 'لا يمكن حذف وحدة مرتبطة بعقد نشط. احذف العقد أولًا.' });
    }
    const r = await pool.query('DELETE FROM units WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'الوحدة غير موجودة' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'فشل حذف الوحدة' });
  }
});

module.exports = router;
