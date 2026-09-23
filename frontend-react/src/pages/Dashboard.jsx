import React, { useEffect, useState, useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend
} from 'chart.js';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { PaymentStatusBadge } from '../components/StatusBadge';
import { UnitsAPI, PaymentsAPI } from '../api/services';
import { formatCurrency, formatDate, daysUntil } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Dashboard() {
  const { showToast } = useToast();
  const [units, setUnits] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, p] = await Promise.all([UnitsAPI.listAll(), PaymentsAPI.listAll()]);
        setUnits(u);
        setPayments(p);
      } catch (e) {
        showToast('فشل تحميل بيانات لوحة التحكم', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = units.length;
    const occupied = units.filter((u) => u.unit_status === 'مؤجرة').length;
    const vacant = units.filter((u) => u.unit_status === 'شاغرة').length;
    const overdue = payments.filter((p) => p.status === 'متأخرة' || (p.status === 'مستحقة' && daysUntil(p.due_date) < 0)).length;
    return { total, occupied, vacant, overdue };
  }, [units, payments]);

  const statusChartData = useMemo(() => {
    const statuses = ['مؤجرة', 'شاغرة', 'تحت الصيانة', 'محجوزة'];
    return {
      labels: statuses,
      datasets: [{ data: statuses.map((s) => units.filter((u) => u.unit_status === s).length), backgroundColor: ['#1f9d55', '#94a3b8', '#e0a11c', '#0f4c5c'] }]
    };
  }, [units]);

  const revenueChartData = useMemo(() => {
    const paid = payments.filter((p) => p.status === 'مدفوعة' && p.paid_date);
    const totals = {};
    paid.forEach((p) => {
      const d = new Date(p.paid_date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      totals[key] = (totals[key] || 0) + Number(p.amount || 0);
    });
    const keys = Object.keys(totals).sort();
    return {
      labels: keys.length ? keys : ['لا توجد بيانات'],
      datasets: [{ label: 'الإيرادات المسددة (ريال)', data: keys.length ? keys.map((k) => totals[k]) : [0], backgroundColor: '#0f4c5c', borderRadius: 6 }]
    };
  }, [payments]);

  const upcoming = useMemo(() => {
    return payments
      .filter((p) => p.status === 'مستحقة' || p.status === 'متأخرة')
      .map((p) => ({ ...p, _days: daysUntil(p.due_date) }))
      .filter((p) => p._days !== null && p._days <= 30)
      .sort((a, b) => a._days - b._days)
      .slice(0, 8);
  }, [payments]);

  const overdueCount = payments.filter((p) => p.status === 'متأخرة').length;

  return (
    <Layout title="لوحة التحكم">
      {overdueCount > 0 && (
        <div className="security-banner" style={{ background: '#fdecec', borderColor: '#f6c2c2', color: '#8f2323' }}>
          <i className="fa-solid fa-triangle-exclamation"></i>
          <div>يوجد <b>{overdueCount}</b> دفعة متأخرة السداد تحتاج متابعة عاجلة. <Link to="/payments" style={{ color: 'inherit', textDecoration: 'underline' }}>عرض التفاصيل</Link></div>
        </div>
      )}

      <div className="stat-grid">
        <StatCard color="blue" icon="fa-building" num={loading ? '—' : stats.total} label="إجمالي الوحدات" />
        <StatCard color="green" icon="fa-key" num={loading ? '—' : stats.occupied} label="وحدات مؤجرة" />
        <StatCard color="amber" icon="fa-door-open" num={loading ? '—' : stats.vacant} label="وحدات شاغرة" />
        <StatCard color="red" icon="fa-triangle-exclamation" num={loading ? '—' : stats.overdue} label="دفعات متأخرة" />
      </div>

      <div className="form-row" style={{ alignItems: 'stretch' }}>
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <div className="panel-title"><h3><i className="fa-solid fa-chart-line"></i> إيرادات الدفعات المسددة شهريًا</h3></div>
          <div style={{ height: 280 }}>{!loading && <Bar data={revenueChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />}</div>
        </div>
        <div className="panel">
          <div className="panel-title"><h3><i className="fa-solid fa-chart-pie"></i> توزيع حالة الوحدات</h3></div>
          <div style={{ height: 280 }}>{!loading && <Doughnut data={statusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } } } }} />}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <h3><i className="fa-solid fa-calendar-day"></i> الدفعات المستحقة قريبًا (30 يومًا)</h3>
          <Link to="/payments" className="btn btn-outline btn-sm">عرض كل المدفوعات <i className="fa-solid fa-arrow-left"></i></Link>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>المستأجر</th><th>رقم العقد</th><th>القيمة</th><th>تاريخ الاستحقاق</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-600)' }}>جارِ التحميل...</td></tr>
              ) : upcoming.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon="fa-circle-check" text="لا توجد دفعات مستحقة خلال 30 يومًا القادمة" /></td></tr>
              ) : upcoming.map((p) => (
                <tr key={p.id}>
                  <td>{p.tenant_name || '—'}</td>
                  <td>{p.contract_number || '—'}</td>
                  <td>{formatCurrency(p.amount)}</td>
                  <td>{formatDate(p.due_date)} {p._days < 0 ? <span style={{ color: 'var(--danger)', fontSize: 11 }}>(متأخرة {Math.abs(p._days)} يوم)</span> : <span style={{ color: 'var(--gray-600)', fontSize: 11 }}>(بعد {p._days} يوم)</span>}</td>
                  <td><PaymentStatusBadge status={p._days < 0 ? 'متأخرة' : p.status} /></td>
                  <td><Link to={`/units/${p.unit_id}`} className="btn btn-outline btn-sm">عرض الوحدة</Link></td>
                </tr>
              ))}
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
