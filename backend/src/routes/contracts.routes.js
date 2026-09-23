// CRUD كامل لجدول العقود (عقد إيجار مرتبط بوحدة واحدة) مع فرض الصلاحيات على مستوى الخادم
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const EDITOR_ROLES = ['مسؤول النظام', 'موظف إدخال بيانات'];
const ADMIN_ONLY = ['مسؤول النظام'];
const SORTABLE = ['contract_number', 'due_date', 'rent_value', 'contract_status', 'created_at'];

// GET /api/contracts?page=1&limit=20&search=&status=&unit_id=
router.get('/', requireAuth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { search = '', status, unit_id } = req.query;
  const sort = SORTABLE.includes(req.query.sort) ? req.query.sort : 'contract_number';

  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(contract_number ILIKE $${params.length} OR tenant_name ILIKE $${params.length} OR tenant_phone ILIKE $${params.length})`);
  }
  if (status) { params.push(status); conditions.push(`contract_status = $${params.length}`); }
  if (unit_id) { params.push(unit_id); conditions.push(`unit_id = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const totalRes = await pool.query(`SELECT COUNT(*) FROM contracts ${where}`, params);
    const dataRes = await pool.query(
      `SELECT * FROM contracts ${where} ORDER BY ${sort} NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
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
    const r = await pool.query('SELECT * FROM contracts WHERE id = $1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'العقد غير موجود' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

router.post('/', requireAuth, requireRole(...EDITOR_ROLES), async (req, res) => {
  const b = req.body || {};
  if (!b.unit_id) return res.status(400).json({ error: 'يجب اختيار الوحدة' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `INSERT INTO contracts
        (unit_id, contract_number, tenant_name, tenant_phone, tenant_id_number, rent_value,
         payment_installment, payment_frequency, due_date, payments_count, payments_paid,
         contract_start_date, contract_end_date, contract_status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [b.unit_id, b.contract_number, b.tenant_name, b.tenant_phone, b.tenant_id_number,
       b.rent_value || null, b.payment_installment || null, b.payment_frequency, b.due_date || null,
       b.payments_count || 0, b.payments_paid || 0, b.contract_start_date || null,
       b.contract_end_date || null, b.contract_status || 'نشط', b.notes]
    );
    // تحديث حالة الوحدة تلقائيًا إلى "مؤجرة" عند إنشاء عقد جديد نشط
    if ((b.contract_status || 'نشط') === 'نشط') {
      await client.query(`UPDATE units SET unit_status = 'مؤجرة', updated_at = now() WHERE id = $1`, [b.unit_id]);
    }
    await client.query('COMMIT');
    res.status(201).json(r.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'فشل إنشاء العقد' });
  } finally {
    client.release();
  }
});

router.patch('/:id', requireAuth, requireRole(...EDITOR_ROLES), async (req, res) => {
  const allowed = ['contract_number', 'tenant_name', 'tenant_phone', 'tenant_id_number', 'rent_value',
    'payment_installment', 'payment_frequency', 'due_date', 'payments_count', 'payments_paid',
    'contract_start_date', 'contract_end_date', 'contract_status', 'notes'];
  const fields = Object.keys(req.body || {}).filter(f => allowed.includes(f));
  if (fields.length === 0) return res.status(400).json({ error: 'لا توجد بيانات صالحة للتحديث' });

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map(f => req.body[f]);
  try {
    const r = await pool.query(
      `UPDATE contracts SET ${setClause}, updated_at = now() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'العقد غير موجود' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'فشل تحديث العقد' });
  }
});

// الحذف مقصور على مسؤول النظام فقط
router.delete('/:id', requireAuth, requireRole(...ADMIN_ONLY), async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM contracts WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'العقد غير موجود' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'فشل حذف العقد' });
  }
});

module.exports = router;
