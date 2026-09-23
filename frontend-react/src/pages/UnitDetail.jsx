import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { UnitStatusBadge, PaymentStatusBadge } from '../components/StatusBadge';
import { UnitsAPI, PaymentsAPI, NotesAPI } from '../api/services';
import { formatCurrency, formatDate, extractErrorMessage } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const NOTE_TYPES = ['عام', 'صيانة', 'شكوى', 'تنبيه استحقاق', 'تجديد عقد'];
const PAYMENT_METHODS = ['نقدي', 'تحويل بنكي', 'شيك', 'بطاقة'];
const UNIT_STATUSES = ['مؤجرة', 'شاغرة', 'تحت الصيانة', 'محجوزة'];

export default function UnitDetail() {
  const { id } = useParams();
  const { canEdit } = useAuth();
  const { showToast } = useToast();

  const [unit, setUnit] = useState(null);
  const [payments, setPayments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [pForm, setPForm] = useState({ payment_number: '', amount: '', due_date: '', status: 'مستحقة', paid_date: '', payment_method: 'نقدي', receipt_number: '' });
  const [nForm, setNForm] = useState({ note_type: 'عام', note_text: '' });
  const [eForm, setEForm] = useState({ tenant_name: '', tenant_phone: '', unit_status: 'شاغرة', rent_value: '' });

  async function loadAll() {
    setLoading(true);
    try {
      const [u, pRes, nRes] = await Promise.all([
        UnitsAPI.get(id),
        PaymentsAPI.list({ unit_id: id, limit: 100 }),
        NotesAPI.listByUnit(id)
      ]);
      setUnit(u);
      setPayments((pRes.data || []).sort((a, b) => (a.payment_number || 0) - (b.payment_number || 0)));
      setNotes((nRes.data || []).sort((a, b) => new Date(b.note_date || 0) - new Date(a.note_date || 0)));
    } catch (e) {
      showToast('تعذّر تحميل تفاصيل الوحدة', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [id]);

  async function markPaid(paymentId) {
    if (!canEdit) { showToast('لا تملك صلاحية تسجيل السداد', 'error'); return; }
    const method = prompt('طريقة السداد؟ (نقدي / تحويل بنكي / شيك / بطاقة)', 'تحويل بنكي');
    if (!method) return;
    try {
      await PaymentsAPI.update(paymentId, { status: 'مدفوعة', paid_date: new Date().toISOString().slice(0, 10), payment_method: method });
      showToast('تم تسجيل السداد بنجاح', 'success');
      loadAll();
    } catch (e) {
      showToast(extractErrorMessage(e, 'فشل تسجيل السداد'), 'error');
    }
  }

  function openAddPayment() {
    if (!canEdit) { showToast('لا تملك صلاحية الإضافة', 'error'); return; }
    setPForm({ payment_number: payments.length + 1, amount: unit?.payment_installment || '', due_date: '', status: 'مستحقة', paid_date: '', payment_method: 'نقدي', receipt_number: '' });
    setPaymentModalOpen(true);
  }

  async function savePayment() {
    try {
      await PaymentsAPI.create({
        unit_id: id,
        contract_number: unit.contract_number || '',
        tenant_name: unit.tenant_name || '',
        payment_number: Number(pForm.payment_number) || 0,
        amount: Number(pForm.amount) || 0,
        due_date: pForm.due_date || null,
        status: pForm.status,
        paid_date: pForm.paid_date || null,
        payment_method: pForm.status === 'مدفوعة' ? pForm.payment_method : null,
        receipt_number: pForm.receipt_number,
      });
      showToast('تمت إضافة الدفعة', 'success');
      setPaymentModalOpen(false);
      loadAll();
    } catch (e) {
      showToast(extractErrorMessage(e, 'فشل إضافة الدفعة'), 'error');
    }
  }

  function openAddNote() {
    if (!canEdit) { showToast('لا تملك صلاحية الإضافة', 'error'); return; }
    setNForm({ note_type: 'عام', note_text: '' });
    setNoteModalOpen(true);
  }

  async function saveNote() {
    if (!nForm.note_text.trim()) { showToast('يرجى كتابة نص الملاحظة', 'error'); return; }
    try {
      await NotesAPI.create({ unit_id: id, note_text: nForm.note_text, note_type: nForm.note_type });
      showToast('تمت إضافة الملاحظة', 'success');
      setNoteModalOpen(false);
      loadAll();
    } catch (e) {
      showToast(extractErrorMessage(e, 'فشل إضافة الملاحظة'), 'error');
    }
  }

  function openEdit() {
    if (!canEdit) { showToast('لا تملك صلاحية التعديل', 'error'); return; }
    setEForm({ tenant_name: unit.tenant_name || '', tenant_phone: unit.tenant_phone || '', unit_status: unit.unit_status || 'شاغرة', rent_value: unit.rent_value || '' });
    setEditModalOpen(true);
  }

  async function saveEdit() {
    try {
      await UnitsAPI.update(id, { ...eForm, rent_value: Number(eForm.rent_value) || 0 });
      showToast('تم التحديث بنجاح', 'success');
      setEditModalOpen(false);
      loadAll();
    } catch (e) {
      showToast(extractErrorMessage(e, 'فشل التحديث'), 'error');
    }
  }

  if (loading) {
    return <Layout title="تفاصيل الوحدة"><div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-600)' }}>جارِ التحميل...</div></Layout>;
  }
  if (!unit) {
    return <Layout title="تفاصيل الوحدة"><EmptyState icon="fa-triangle-exclamation" text="الوحدة غير موجودة" /></Layout>;
  }

  const total = unit.payments_count || payments.length || 0;
  const paidCount = payments.filter((p) => p.status === 'مدفوعة').length;
  const pct = total ? Math.round((paidCount / total) * 100) : 0;
  const totalPaidAmount = payments.filter((p) => p.status === 'مدفوعة').reduce((s, p) => s + Number(p.amount || 0), 0);
  const remainingAmount = payments.filter((p) => p.status !== 'مدفوعة' && p.status !== 'ملغاة').reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <Layout title="تفاصيل الوحدة">
      <Link to="/units" className="btn btn-outline btn-sm" style={{ marginBottom: 16 }}><i className="fa-solid fa-arrow-right"></i> رجوع لقائمة الوحدات</Link>

      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--primary-dark)' }}>{unit.unit_number} <span style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 400 }}>{unit.building_name || ''}</span></h2>
          <div style={{ marginTop: 6, color: 'var(--gray-600)', fontSize: 13 }}>{unit.unit_type || ''} · {unit.floor ? `الطابق ${unit.floor}` : ''} · {unit.area_sqm ? `${unit.area_sqm} م²` : ''}</div>
        </div>
        <UnitStatusBadge status={unit.unit_status} />
      </div>

      <div className="form-row" style={{ alignItems: 'stretch' }}>
        <div className="panel">
          <div className="panel-title">
            <h3><i className="fa-solid fa-id-card"></i> بيانات العقد والمستأجر</h3>
            <button className="btn btn-outline btn-sm" onClick={openEdit}><i className="fa-solid fa-pen"></i> تعديل</button>
          </div>
          <InfoRow label="رقم العقد" value={unit.contract_number || '—'} />
          <InfoRow label="اسم المستأجر" value={unit.tenant_name || '—'} />
          <InfoRow label="جوال المستأجر" value={unit.tenant_phone || '—'} />
          <InfoRow label="رقم الهوية/السجل" value={unit.tenant_id_number || '—'} />
          <InfoRow label="قيمة الإيجار السنوية" value={formatCurrency(unit.rent_value)} />
          <InfoRow label="الدفعة الدورية" value={`${formatCurrency(unit.payment_installment)} / ${unit.payment_frequency || ''}`} />
          <InfoRow label="بداية العقد" value={formatDate(unit.contract_start_date)} />
          <InfoRow label="نهاية العقد" value={formatDate(unit.contract_end_date)} last />
          {unit.notes && <div style={{ marginTop: 10, background: 'var(--gray-50)', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: 'var(--gray-600)' }}><i className="fa-solid fa-quote-right"></i> {unit.notes}</div>}
        </div>

        <div className="panel">
          <div className="panel-title"><h3><i className="fa-solid fa-chart-simple"></i> ملخص السداد</h3></div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>{pct}%</div>
            <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>نسبة الدفعات المسددة ({paidCount}/{total})</div>
            <div style={{ background: 'var(--gray-100)', height: 8, borderRadius: 6, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ background: 'var(--success)', height: '100%', width: `${pct}%` }}></div>
            </div>
          </div>
          <InfoRow label="إجمالي المسدد" value={formatCurrency(totalPaidAmount)} valueColor="var(--success)" />
          <InfoRow label="المتبقي (تقديري)" value={formatCurrency(remainingAmount)} valueColor="var(--warn)" last />
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <h3><i className="fa-solid fa-money-bill-wave"></i> جدول الدفعات</h3>
          <button className="btn btn-primary btn-sm" onClick={openAddPayment}><i className="fa-solid fa-plus"></i> إضافة دفعة</button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>#</th><th>القيمة</th><th>الاستحقاق</th><th>تاريخ السداد</th><th>الحالة</th><th>طريقة السداد</th><th>رقم السند</th><th>إجراءات</th></tr></thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={8}><EmptyState text="لا توجد دفعات مسجّلة لهذه الوحدة" /></td></tr>
              ) : payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.payment_number ?? '—'}</td>
                  <td>{formatCurrency(p.amount)}</td>
                  <td>{formatDate(p.due_date)}</td>
                  <td>{formatDate(p.paid_date)}</td>
                  <td><PaymentStatusBadge status={p.status} /></td>
                  <td>{p.payment_method || '—'}</td>
                  <td>{p.receipt_number || '—'}</td>
                  <td>
                    {p.status !== 'مدفوعة' ? (
                      <button className="btn btn-primary btn-sm" onClick={() => markPaid(p.id)} disabled={!canEdit}><i className="fa-solid fa-check"></i> تسجيل سداد</button>
                    ) : (
                      <span style={{ color: 'var(--success)', fontSize: 12 }}><i className="fa-solid fa-circle-check"></i> مكتملة</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <h3><i className="fa-solid fa-note-sticky"></i> الملاحظات والتنبيهات</h3>
          <button className="btn btn-accent btn-sm" onClick={openAddNote}><i className="fa-solid fa-plus"></i> إضافة ملاحظة</button>
        </div>
        {notes.length === 0 ? <EmptyState icon="fa-note-sticky" text="لا توجد ملاحظات مسجّلة" /> : notes.map((n) => (
          <div key={n.id} style={{ borderRight: '3px solid var(--accent)', background: 'var(--gray-50)', borderRadius: 10, padding: '12px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-600)', marginBottom: 6 }}>
              <span><i className="fa-solid fa-tag"></i> {n.note_type || 'عام'} — {n.created_by || ''}</span>
              <span>{formatDate(n.note_date)}</span>
            </div>
            <div style={{ fontSize: 13.5 }}>{n.note_text}</div>
          </div>
        ))}
      </div>

      <Modal open={paymentModalOpen} title="إضافة دفعة جديدة" onClose={() => setPaymentModalOpen(false)} maxWidth={480}
        footer={<><button className="btn btn-outline" onClick={() => setPaymentModalOpen(false)}>إلغاء</button><button className="btn btn-primary" onClick={savePayment}><i className="fa-solid fa-floppy-disk"></i> حفظ الدفعة</button></>}>
        <div className="form-group"><label>رقم الدفعة</label><input type="number" className="form-control" value={pForm.payment_number} onChange={(e) => setPForm({ ...pForm, payment_number: e.target.value })} /></div>
        <div className="form-group"><label>القيمة (ريال)</label><input type="number" className="form-control" value={pForm.amount} onChange={(e) => setPForm({ ...pForm, amount: e.target.value })} /></div>
        <div className="form-group"><label>تاريخ الاستحقاق</label><input type="date" className="form-control" value={pForm.due_date} onChange={(e) => setPForm({ ...pForm, due_date: e.target.value })} /></div>
        <div className="form-group"><label>الحالة</label>
          <select className="form-control" value={pForm.status} onChange={(e) => setPForm({ ...pForm, status: e.target.value })}>
            <option>مستحقة</option><option>مدفوعة</option><option>متأخرة</option><option>ملغاة</option>
          </select>
        </div>
        {pForm.status === 'مدفوعة' && <>
          <div className="form-group"><label>تاريخ السداد</label><input type="date" className="form-control" value={pForm.paid_date} onChange={(e) => setPForm({ ...pForm, paid_date: e.target.value })} /></div>
          <div className="form-group"><label>طريقة السداد</label>
            <select className="form-control" value={pForm.payment_method} onChange={(e) => setPForm({ ...pForm, payment_method: e.target.value })}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </>}
        <div className="form-group"><label>رقم السند</label><input className="form-control" value={pForm.receipt_number} onChange={(e) => setPForm({ ...pForm, receipt_number: e.target.value })} /></div>
      </Modal>

      <Modal open={noteModalOpen} title="إضافة ملاحظة" onClose={() => setNoteModalOpen(false)} maxWidth={480}
        footer={<><button className="btn btn-outline" onClick={() => setNoteModalOpen(false)}>إلغاء</button><button className="btn btn-accent" onClick={saveNote}><i className="fa-solid fa-floppy-disk"></i> حفظ الملاحظة</button></>}>
        <div className="form-group"><label>نوع الملاحظة</label>
          <select className="form-control" value={nForm.note_type} onChange={(e) => setNForm({ ...nForm, note_type: e.target.value })}>
            {NOTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group"><label>نص الملاحظة</label><textarea className="form-control" rows={4} value={nForm.note_text} onChange={(e) => setNForm({ ...nForm, note_text: e.target.value })}></textarea></div>
      </Modal>

      <Modal open={editModalOpen} title="تعديل بيانات الوحدة" onClose={() => setEditModalOpen(false)}
        footer={<><button className="btn btn-outline" onClick={() => setEditModalOpen(false)}>إلغاء</button><button className="btn btn-primary" onClick={saveEdit}>حفظ</button></>}>
        <div className="form-row">
          <div className="form-group"><label>اسم المستأجر</label><input className="form-control" value={eForm.tenant_name} onChange={(e) => setEForm({ ...eForm, tenant_name: e.target.value })} /></div>
          <div className="form-group"><label>جوال المستأجر</label><input className="form-control" value={eForm.tenant_phone} onChange={(e) => setEForm({ ...eForm, tenant_phone: e.target.value })} /></div>
          <div className="form-group"><label>حالة الوحدة</label>
            <select className="form-control" value={eForm.unit_status} onChange={(e) => setEForm({ ...eForm, unit_status: e.target.value })}>
              {UNIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group"><label>قيمة الإيجار</label><input type="number" className="form-control" value={eForm.rent_value} onChange={(e) => setEForm({ ...eForm, rent_value: e.target.value })} /></div>
        </div>
      </Modal>
    </Layout>
  );
}

function InfoRow({ label, value, valueColor, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: last ? 'none' : '1px dashed var(--gray-200)', padding: '6px 0' }}>
      <span style={{ color: 'var(--gray-600)' }}>{label}</span>
      <b style={valueColor ? { color: valueColor } : undefined}>{value}</b>
    </div>
  );
}
