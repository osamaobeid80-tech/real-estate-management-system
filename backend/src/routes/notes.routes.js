// إدارة ملاحظات الوحدات
const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const EDITOR_ROLES = ['مسؤول النظام', 'موظف إدخال بيانات'];
const ADMIN_ONLY = ['مسؤول النظام'];

// GET /api/unit-notes?unit_id=...
router.get('/', requireAuth, async (req, res) => {
  const { unit_id } = req.query;
  try {
    const r = unit_id
      ? await pool.query('SELECT * FROM unit_notes WHERE unit_id = $1 ORDER BY note_date DESC', [unit_id])
      : await pool.query('SELECT * FROM unit_notes ORDER BY note_date DESC LIMIT 200');
    res.json({ data: r.rows, total: r.rows.length });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

router.post('/', requireAuth, requireRole(...EDITOR_ROLES), async (req, res) => {
  const b = req.body || {};
  if (!b.unit_id || !b.note_text) return res.status(400).json({ error: 'معرف الوحدة ونص الملاحظة مطلوبان' });
  try {
    const r = await pool.query(
      `INSERT INTO unit_notes (unit_id, note_text, note_type, created_by, note_date)
       VALUES ($1,$2,$3,$4, COALESCE($5, now())) RETURNING *`,
      [b.unit_id, b.note_text, b.note_type || 'عام', req.user.full_name, b.note_date || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'فشل إضافة الملاحظة' });
  }
});

router.delete('/:id', requireAuth, requireRole(...ADMIN_ONLY), async (req, res) => {
  try {
    await pool.query('DELETE FROM unit_notes WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'فشل حذف الملاحظة' });
  }
});

module.exports = router;
