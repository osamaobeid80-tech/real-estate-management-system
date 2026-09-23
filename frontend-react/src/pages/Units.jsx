import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { UnitStatusBadge } from '../components/StatusBadge';
import { UnitsAPI } from '../api/services';
import { formatCurrency, formatDate, toDateInput, extractErrorMessage } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const UNIT_TYPES = ['شقة', 'محل تجاري', 'مكتب', 'فيلا', 'مستودع', 'استوديو'];
const UNIT_STATUSES = ['مؤجرة', 'شاغرة', 'تحت الصيانة', 'محجوزة'];
const FREQUENCIES = ['شهري', 'ربع سنوي', 'نصف سنوي', 'سنوي'];

const emptyForm = {
  unit_number: '', building_name: '', unit_type: 'شقة', floor: '', area_sqm: '',
  unit_status: 'شاغرة', contract_number: '', tenant_name: '', tenant_phone: '',
  tenant_id_number: '', rent_value: '', payment_installment: '', payment_frequency: 'شهري',
  payments_count: '', due_date: '', contract_start_date: '', contract_end_date: '', notes: ''
};

export default function Units() {
  const { canEdit, canDelete } = useAuth();
  const { showToast } = useToast();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadUnits() {
    setLoading(true);
    try {
      const data = await UnitsAPI.listAll();
      setUnits(data);
    } catch (e) {
      showToast('فشل تحميل الوحدات', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUnits(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return units.filter((u) => {
      if (statusFilter && u.unit_status !== statusFilter) return false;
      if (typeFilter && u.unit_type !== typeFilter) return false;
      if (q) {
        const hay = [u.unit_number, u.tenant_name, u.contract_number, u.tenant_phone, u.building_name].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [units, search, statusFilter, typeFilter]);

  function openAdd() {
    if (!canEdit) { showToast('لا تملك صلاحية الإضافة', 'error'); return; }
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(u) {
    if (!canEdit) { showToast('لا تملك صلاحية التعديل', 'error'); return; }
    setEditingId(u.id);
    setForm({
      unit_number: u.unit_number || '', building_name: u.building_name || '', unit_type: u.unit_type || 'شقة',
      floor: u.floor || '', area_sqm: u.area_sqm || '', unit_status: u.unit_status || 'شاغرة',
      contract_number: u.contract_number || '', tenant_name: u.tenant_name || '', tenant_phone: u.tenant_phone || '',
      tenant_id_number: u.tenant_id_number || '', rent_value: u.rent_value || '', payment_installment: u.payment_installment || '',
      payment_frequency: u.payment_frequency || 'شهري', payments_count: u.payments_count || '',
      due_date: toDateInput(u.due_date), contract_start_date: toDateInput(u.contract_start_date),
      contract_end_date: toDateInput(u.contract_end_date), notes: u.notes || ''
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.unit_number.trim()) { showToast('رقم الوحدة مطلوب', 'error'); return; }
    setSaving(true);
    const payload = {
      ...form,
      area_sqm: Number(form.area_sqm) || 0,
      rent_value: Number(form.rent_value) || 0,
      payment_installment: Number(form.payment_installment) || 0,
      payments_count: Number(form.payments_count) || 0,
      due_date: form.due_date || null,
      contract_start_date: form.contract_start_date || null,
      contract_end_date: form.contract_end_date || null,
    };
    try {
      if (editingId) {
        await UnitsAPI.update(editingId, payload);
        showToast('تم تحديث الوحدة بنجاح', 'success');
      } else {
        await UnitsAPI.create({ ...payload, payments_paid: 0 });
        showToast('تمت إضافة الوحدة بنجاح', 'success');
      }
      setModalOpen(false);
      loadUnits();
    } catch (e) {
      showToast(extractErrorMessage(e, 'فشل حفظ الوحدة'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!canDelete) { showToast('الحذف متاح لمسؤول النظام فقط', 'error'); return; }
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return;
    try {
      await UnitsAPI.remove(id);
      showToast('تم حذف الوحدة', 'success');
      loadUnits();
    } catch (e) {
      showToast(extractErrorMessage(e, 'فشل حذف الوحدة'), 'error');
    }
  }

  function setField(name, value) { setForm((f) => ({ ...f, [name]: value })); }

  return (
    <Layout title="الوحدات والعقود">
      <div className="toolbar">
        <div className="search-box">
          <input type="text" placeholder="بحث باسم المستأجر، رقم الوحدة، رقم العقد، الجوال..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">كل الحالات</option>
          {UNIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">كل الأنواع</option>
          {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn btn-primary" onClick={openAdd}><i className="fa-solid fa-plus"></i> إضافة وحدة / عقد</button>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>الوحدة</th><th>المستأجر</th><th>رقم العقد</th><th>الإيجار السنوي</th>
                <th>الدفعة الدورية</th><th>الاستحقاق القادم</th><th>الدفعات</th><th>الحالة</th><th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-600)' }}>جارِ التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9}><EmptyState /></td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.unit_number}</b><br /><span style={{ fontSize: 11, color: 'var(--gray-600)' }}>{u.building_name || ''} · {u.unit_type || ''}</span></td>
                  <td>{u.tenant_name || '—'}<br /><span style={{ fontSize: 11, color: 'var(--gray-600)' }}>{u.tenant_phone || ''}</span></td>
                  <td>{u.contract_number || '—'}</td>
                  <td>{formatCurrency(u.rent_value)}</td>
                  <td>{formatCurrency(u.payment_installment)} <span style={{ fontSize: 10.5, color: 'var(--gray-600)' }}>/ {u.payment_frequency || ''}</span></td>
                  <td>{formatDate(u.due_date)}</td>
                  <td>{u.payments_paid ?? 0} / {u.payments_count ?? 0}</td>
                  <td><UnitStatusBadge status={u.unit_status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/units/${u.id}`} className="btn btn-outline btn-icon" title="عرض التفاصيل"><i className="fa-solid fa-eye"></i></Link>
                      <button className="btn btn-outline btn-icon" title="تعديل" onClick={() => openEdit(u)} disabled={!canEdit}><i className="fa-solid fa-pen"></i></button>
                      <button className="btn btn-danger btn-icon" title="حذف" onClick={() => handleDelete(u.id)} disabled={!canDelete}><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards-only" style={{ padding: 14 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--gray-600)', padding: 20 }}>جارِ التحميل...</div>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : filtered.map((u) => (
            <div className="unit-card" key={u.id}>
              <div className="uc-head">
                <div>
                  <div className="uc-title">{u.unit_number} <span style={{ fontWeight: 400, color: 'var(--gray-600)', fontSize: 12 }}>{u.unit_type || ''}</span></div>
                  <div className="uc-sub">{u.building_name || ''} · {u.tenant_name || 'بدون مستأجر'}</div>
                </div>
                <UnitStatusBadge status={u.unit_status} />
              </div>
              <div className="uc-row"><span>رقم العقد</span><span>{u.contract_number || '—'}</span></div>
              <div className="uc-row"><span>الإيجار السنوي</span><span>{formatCurrency(u.rent_value)}</span></div>
              <div className="uc-row"><span>الدفعة الدورية</span><span>{formatCurrency(u.payment_installment)}</span></div>
              <div className="uc-row"><span>الاستحقاق القادم</span><span>{formatDate(u.due_date)}</span></div>
              <div className="uc-row"><span>الدفعات</span><span>{u.payments_paid ?? 0} / {u.payments_count ?? 0}</span></div>
              <div className="uc-actions">
                <Link to={`/units/${u.id}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}><i className="fa-solid fa-eye"></i> التفاصيل</Link>
                <button className="btn btn-outline btn-sm btn-icon" onClick={() => openEdit(u)} disabled={!canEdit}><i className="fa-solid fa-pen"></i></button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(u.id)} disabled={!canDelete}><i className="fa-solid fa-trash"></i></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? 'تعديل بيانات الوحدة' : 'إضافة وحدة / عقد جديد'}
        onClose={() => setModalOpen(false)}
        footer={<>
          <button className="btn btn-outline" onClick={() => setModalOpen(false)}>إلغاء</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <i className="fa-solid fa-floppy-disk"></i> {saving ? 'جارِ الحفظ...' : 'حفظ'}
          </button>
        </>}
      >
        <h4 style={{ fontSize: 13, color: 'var(--primary)', margin: '0 0 10px' }}>بيانات الوحدة</h4>
        <div className="form-row">
          <div className="form-group"><label>رقم الوحدة *</label><input className="form-control" value={form.unit_number} onChange={(e) => setField('unit_number', e.target.value)} /></div>
          <div className="form-group"><label>اسم المبنى / العقار</label><input className="form-control" value={form.building_name} onChange={(e) => setField('building_name', e.target.value)} /></div>
          <div className="form-group"><label>نوع الوحدة</label>
            <select className="form-control" value={form.unit_type} onChange={(e) => setField('unit_type', e.target.value)}>
              {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label>الطابق</label><input className="form-control" value={form.floor} onChange={(e) => setField('floor', e.target.value)} /></div>
          <div className="form-group"><label>المساحة (م²)</label><input type="number" className="form-control" value={form.area_sqm} onChange={(e) => setField('area_sqm', e.target.value)} /></div>
          <div className="form-group"><label>حالة الوحدة</label>
            <select className="form-control" value={form.unit_status} onChange={(e) => setField('unit_status', e.target.value)}>
              {UNIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <h4 style={{ fontSize: 13, color: 'var(--primary)', margin: '18px 0 10px' }}>بيانات العقد والمستأجر</h4>
        <div className="form-row">
          <div className="form-group"><label>رقم العقد</label><input className="form-control" value={form.contract_number} onChange={(e) => setField('contract_number', e.target.value)} /></div>
          <div className="form-group"><label>اسم المستأجر</label><input className="form-control" value={form.tenant_name} onChange={(e) => setField('tenant_name', e.target.value)} /></div>
          <div className="form-group"><label>جوال المستأجر</label><input className="form-control" value={form.tenant_phone} onChange={(e) => setField('tenant_phone', e.target.value)} placeholder="05xxxxxxxx" /></div>
          <div className="form-group"><label>رقم الهوية / السجل التجاري</label><input className="form-control" value={form.tenant_id_number} onChange={(e) => setField('tenant_id_number', e.target.value)} /></div>
          <div className="form-group"><label>قيمة الإيجار الإجمالية (ريال)</label><input type="number" className="form-control" value={form.rent_value} onChange={(e) => setField('rent_value', e.target.value)} /></div>
          <div className="form-group"><label>قيمة الدفعة الدورية (ريال)</label><input type="number" className="form-control" value={form.payment_installment} onChange={(e) => setField('payment_installment', e.target.value)} /></div>
          <div className="form-group"><label>دورية الدفع</label>
            <select className="form-control" value={form.payment_frequency} onChange={(e) => setField('payment_frequency', e.target.value)}>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-group"><label>عدد الدفعات الكلي</label><input type="number" className="form-control" value={form.payments_count} onChange={(e) => setField('payments_count', e.target.value)} /></div>
          <div className="form-group"><label>تاريخ استحقاق أول دفعة</label><input type="date" className="form-control" value={form.due_date} onChange={(e) => setField('due_date', e.target.value)} /></div>
          <div className="form-group"><label>تاريخ بداية العقد</label><input type="date" className="form-control" value={form.contract_start_date} onChange={(e) => setField('contract_start_date', e.target.value)} /></div>
          <div className="form-group"><label>تاريخ نهاية العقد</label><input type="date" className="form-control" value={form.contract_end_date} onChange={(e) => setField('contract_end_date', e.target.value)} /></div>
        </div>
        <div className="form-group"><label>ملاحظات عامة</label><textarea className="form-control" rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)}></textarea></div>
      </Modal>
    </Layout>
  );
}
