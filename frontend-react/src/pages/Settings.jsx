import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { UsersAPI } from '../api/services';
import { extractErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

const ROLES = ['مسؤول النظام', 'موظف إدخال بيانات', 'مستخدم عرض فقط'];
const emptyForm = { full_name: '', email: '', phone: '', password: '', role: 'مستخدم عرض فقط' };

export default function Settings() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await UsersAPI.list();
      setUsers(res.data || []);
    } catch (e) {
      showToast(extractErrorMessage(e, 'فشل تحميل المستخدمين'), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  function openAdd() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      showToast('الاسم والبريد وكلمة المرور مطلوبة', 'error');
      return;
    }
    setSaving(true);
    try {
      await UsersAPI.create(form);
      showToast('تمت إضافة المستخدم بنجاح', 'success');
      setModalOpen(false);
      loadUsers();
    } catch (e) {
      showToast(extractErrorMessage(e, 'فشل إضافة المستخدم'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u) {
    try {
      await UsersAPI.update(u.id, { active: !u.active });
      showToast('تم تحديث حالة المستخدم', 'success');
      loadUsers();
    } catch (e) {
      showToast(extractErrorMessage(e, 'فشل التحديث'), 'error');
    }
  }

  async function deleteUser(id) {
    if (!confirm('هل تريد حذف هذا المستخدم؟')) return;
    try {
      await UsersAPI.remove(id);
      showToast('تم حذف المستخدم', 'success');
      loadUsers();
    } catch (e) {
      showToast(extractErrorMessage(e, 'فشل الحذف'), 'error');
    }
  }

  return (
    <Layout title="الإعدادات والمستخدمون">
      <div className="security-banner" style={{ background: 'var(--success-light)', borderColor: '#bbf0cd', color: '#15803d' }}>
        <i className="fa-solid fa-shield-halved"></i>
        <div>
          <b>هذه نسخة الواجهة المرتبطة بـ Backend حقيقي:</b> إدارة المستخدمين هنا محمية فعليًا على مستوى الخادم —
          هذه الصفحة لا تُعرض أصلاً إلا لمن يملك دور "مسؤول النظام" الصادر من JWT حقيقي، وأي محاولة وصول مباشرة لنقاط
          <code> /api/users </code> بدون توكن صالح بهذا الدور تُرفض بكود 401/403 من الخادم (راجع <code>backend/src/middleware/auth.js</code>).
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <h3><i className="fa-solid fa-users-gear"></i> المستخدمون المسجّلون في النظام</h3>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fa-solid fa-plus"></i> إضافة مستخدم</button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>الجوال</th><th>الدور</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-600)' }}>جارِ التحميل...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon="fa-users" text="لا يوجد مستخدمون مسجّلون" /></td></tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.full_name}</b></td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td><span className="status-badge s-mah">{u.role}</span></td>
                  <td>{u.active ? <span className="status-badge s-mo">مفعّل</span> : <span className="status-badge s-sha">معطّل</span>}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleActive(u)}>{u.active ? 'تعطيل' : 'تفعيل'}</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteUser(u.id)}><i className="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><h3><i className="fa-solid fa-shield-halved"></i> مصفوفة الصلاحيات المرجعية</h3></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>الدور</th><th>الوحدات</th><th>المدفوعات</th><th>الملاحظات</th><th>التقارير</th><th>المستخدمون</th></tr></thead>
            <tbody>
              <tr><td><b>مسؤول النظام</b></td><td>كل الصلاحيات</td><td>كل الصلاحيات</td><td>كل الصلاحيات</td><td>عرض + تصدير</td><td>إدارة كاملة</td></tr>
              <tr><td><b>موظف إدخال بيانات</b></td><td>إضافة/تعديل</td><td>إضافة/تحديث حالة</td><td>إضافة</td><td>عرض فقط</td><td>لا صلاحية</td></tr>
              <tr><td><b>مستخدم عرض فقط</b></td><td>عرض فقط</td><td>عرض فقط</td><td>عرض فقط</td><td>عرض فقط</td><td>لا صلاحية</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} title="إضافة مستخدم جديد" onClose={() => setModalOpen(false)} maxWidth={480}
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>إلغاء</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'جارِ الحفظ...' : 'حفظ'}</button></>}>
        <div className="form-group"><label>الاسم الكامل</label><input className="form-control" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div className="form-group"><label>البريد الإلكتروني</label><input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="form-group"><label>الجوال</label><input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="form-group"><label>كلمة المرور المبدئية</label><input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <div className="form-group"><label>الدور الوظيفي</label>
          <select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </Modal>
    </Layout>
  );
}
