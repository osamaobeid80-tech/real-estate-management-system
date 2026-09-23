import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { PaymentStatusBadge } from '../components/StatusBadge';
import { PaymentsAPI, UnitsAPI } from '../api/services';
import { formatCurrency, formatDate, daysUntil, extractErrorMessage } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Payments() {
  const { canEdit } = useAuth();
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function loadPayments() {
    setLoading(true);
    try {
      const data = await PaymentsAPI.listAll();
      setPayments(data.map((p) => {
        if (p.status === 'مستحقة') {
          const d = daysUntil(p.due_date);
          if (d !== null && d < 0) return { ...p, _displayStatus: 'متأخرة' };
        }
        return p;
      }));
    } catch (e) {
      showToast('فشل تحميل المدفوعات', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPayments(); }, []);

  const stats = useMemo(() => {
    const paid = payments.filter((p) => p.status === 'مدفوعة');
    const due = payments.filter((p) => (p._displayStatus || p.status) === 'مستحقة');
    const late = payments.filter((p) => (p._displayStatus || p.status) === 'متأخرة');
    const totalAmount = paid.reduce((s, p) => s + Number(p.amount || 0), 0);
    return { paid: paid.length, due: due.length, late: late.length, totalAmount };
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      const effStatus = p._displayStatus || p.status;
      if (statusFilter && effStatus !== statusFilter) return false;
      if (q) {
        const hay = [p.tenant_name, p.contract_number, p.receipt_number].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));
  }, [payments, search, statusFilter]);

  async function quickMarkPaid(paymentId, unitId) {
    if (!canEdit) { showToast('لا تملك صلاحية تسجيل السداد', 'error'); return; }
    const method = prompt('طريقة السداد؟ (نقدي / تحويل بنكي / شيك / بطاقة)', 'تحويل بنكي');
    if (!method) return;
    try {
      await PaymentsAPI.update(paymentId, { status: 'مدفوعة', paid_date: new Date().toISOString().slice(0, 10), payment_method: method });
      showToast('تم تسجيل السداد بنجاح', 'success');
      loadPayments();
    } catch (e) {
      showToast(extractErrorMessage(e, 'فشل تسجيل السداد'), 'error');
    }
  }

  return (
    <Layout title="إدارة المدفوعات">
      <div className="stat-grid">
        <StatCard color="green" icon="fa-circle-check" num={loading ? '—' : stats.paid} label="دفعات مسددة" />
        <StatCard color="blue" icon="fa-hourglass-half" num={loading ? '—' : stats.due} label="دفعات مستحقة" />
        <StatCard color="red" icon="fa-triangle-exclamation" num={loading ? '—' : stats.late} label="دفعات متأخرة" />
        <StatCard color="amber" icon="fa-sack-dollar" num={loading ? '—' : stats.totalAmount.toLocaleString('ar-SA')} label="إجمالي المسدد (ريال)" />
      </div>

      <div className="toolbar">
        <div className="search-box">
          <input type="text" placeholder="بحث باسم المستأجر أو رقم العقد أو رقم السند..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="مدفوعة">مدفوعة</option>
          <option value="مستحقة">مستحقة</option>
          <option value="متأخرة">متأخرة</option>
          <option value="ملغاة">ملغاة</option>
        </select>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>المستأجر</th><th>رقم العقد</th><th>#</th><th>القيمة</th><th>الاستحقاق</th><th>السداد</th><th>الحالة</th><th>طريقة السداد</th><th>إجراءات</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-600)' }}>جارِ التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9}><EmptyState /></td></tr>
              ) : filtered.map((p) => {
                const effStatus = p._displayStatus || p.status;
                return (
                  <tr key={p.id}>
                    <td>{p.tenant_name || '—'}</td>
                    <td><Link to={`/units/${p.unit_id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>{p.contract_number || '—'}</Link></td>
                    <td>{p.payment_number ?? '—'}</td>
                    <td>{formatCurrency(p.amount)}</td>
                    <td>{formatDate(p.due_date)}</td>
                    <td>{formatDate(p.paid_date)}</td>
                    <td><PaymentStatusBadge status={effStatus} /></td>
                    <td>{p.payment_method || '—'}</td>
                    <td>
                      {p.status !== 'مدفوعة' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => quickMarkPaid(p.id, p.unit_id)} disabled={!canEdit}><i className="fa-solid fa-check"></i> تسجيل سداد</button>
                      ) : (
                        <Link to={`/units/${p.unit_id}`} className="btn btn-outline btn-sm">عرض الوحدة</Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ color, icon, num, label }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="icon-box"><i className={`fa-solid ${icon}`}></i></div>
      <div>
        <div className="num">{num}</div>
        <div className="lbl">{label}</div>
      </div>
    </div>
  );
}
