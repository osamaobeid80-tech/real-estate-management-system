// CRUD لجدول المدفوعات (مرتبطة بوحدة وعقد)
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const EDITOR_ROLES = ['مسؤول النظام', 'موظف إدخال بيانات'];
const ADMIN_ONLY = ['مسؤول النظام'];

// GET /api/payments?page=1&limit=50&search=&unit_id=&contract_id=&status=
router.get('/', requireAuth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = (page - 1) * limit;
  const { search = '', unit_id, contract_id, status } = req.query;

  const conditions = [];
  const params = [];
  if (search) { params.push(`%${search}%`); conditions.push(`(tenant_name ILIKE $${params.length} OR contract_number ILIKE $${params.length} OR receipt_number ILIKE $${params.length})`); }
  if (unit_id) { params.push(unit_id); conditions.push(`unit_id = $${params.length}`); }
  if (contract_id) { params.push(contract_id); conditions.push(`contract_id = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const totalRes = await pool.query(`SELECT COUNT(*) FROM payments ${where}`, params);
    const dataRes = await pool.query(
      `SELECT * FROM payments ${where} ORDER BY due_date ASC NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    res.json({ data: dataRes.rows, total: parseInt(totalRes.rows[0].count, 10), page, limit });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

router.post('/', requireAuth, requireRole(...EDITOR_ROLES), async (req, res) => {
  const b = req.body || {};
  if (!b.unit_id) return res.status(400).json({ error: 'معرف الوحدة مطلوب' });
  try {
    const r = await pool.query(
      `INSERT INTO payments (unit_id, contract_id, contract_number, tenant_name, payment_number, amount, due_date, paid_date, status, payment_method, receipt_number, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [b.unit_id, b.contract_id || null, b.contract_number, b.tenant_name, b.payment_number || null, b.amount || 0,
       b.due_date || null, b.paid_date || null, b.status || 'مستحقة', b.payment_method || null,
       b.receipt_number, b.notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'فشل إنشاء الدفعة' });
  }
});

// تسجيل السداد وتحديث الحقول المسموحة فقط - إدخال البيانات والمسؤول مخوّلان بذلك
router.patch('/:id', requireAuth, requireRole(...EDITOR_ROLES), async (req, res) => {
  const allowed = ['amount','due_date','paid_date','status','payment_method','receipt_number','notes','payment_number'];
  const fields = Object.keys(req.body || {}).filter(f => allowed.includes(f));
  if (fields.length === 0) return res.status(400).json({ error: 'لا توجد بيانات صالحة للتحديث' });

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map(f => req.body[f]);
  try {
    const r = await pool.query(
      `UPDATE payments SET ${setClause}, updated_at = now() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'الدفعة غير موجودة' });

    // إن تم تعليمها مدفوعة، حدّث عداد الدفعات المسددة في سجل العقد المرتبط تلقائيًا
    if (req.body.status === 'مدفوعة' && r.rows[0].contract_id) {
      await pool.query('UPDATE contracts SET payments_paid = payments_paid + 1 WHERE id = $1', [r.rows[0].contract_id]);
    }
    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'فشل تحديث الدفعة' });
  }
});

// الحذف مقصور على مسؤول النظام فقط (تصحيح أخطاء إدخال حرجة)
router.delete('/:id', requireAuth, requireRole(...ADMIN_ONLY), async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM payments WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'الدفعة غير موجودة' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'فشل حذف الدفعة' });
  }
});

module.exports = router;
