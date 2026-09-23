// إدارة مستخدمي النظام - مقصورة بالكامل على "مسؤول النظام" (مطابقة لمصفوفة الصلاحيات)
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const ADMIN_ONLY = ['مسؤول النظام'];

router.get('/', requireAuth, requireRole(...ADMIN_ONLY), async (req, res) => {
  try {
    const r = await pool.query('SELECT id, full_name, email, phone, role, active, created_at FROM app_users ORDER BY created_at DESC');
    res.json({ data: r.rows, total: r.rows.length });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

router.post('/', requireAuth, requireRole(...ADMIN_ONLY), async (req, res) => {
  const { full_name, email, phone, password, role } = req.body || {};
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO app_users (full_name, email, phone, password_hash, role, active)
       VALUES ($1,$2,$3,$4,$5,true) RETURNING id, full_name, email, phone, role, active`,
      [full_name, email.toLowerCase().trim(), phone, hash, role || 'مستخدم عرض فقط']
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    console.error(e);
    res.status(500).json({ error: 'فشل إنشاء المستخدم' });
  }
});

router.patch('/:id', requireAuth, requireRole(...ADMIN_ONLY), async (req, res) => {
  const allowed = ['full_name', 'phone', 'role', 'active'];
  const fields = Object.keys(req.body || {}).filter(f => allowed.includes(f));
  if (fields.length === 0) return res.status(400).json({ error: 'لا توجد بيانات صالحة للتحديث' });
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map(f => req.body[f]);
  try {
    const r = await pool.query(
      `UPDATE app_users SET ${setClause}, updated_at = now() WHERE id = $${fields.length + 1} RETURNING id, full_name, email, phone, role, active`,
      [...values, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'فشل تحديث المستخدم' });
  }
});

router.delete('/:id', requireAuth, requireRole(...ADMIN_ONLY), async (req, res) => {
  try {
    await pool.query('DELETE FROM app_users WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'فشل حذف المستخدم' });
  }
});

module.exports = router;
