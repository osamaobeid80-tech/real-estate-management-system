import React, { useEffect, useState, useMemo } from 'react';
import { Doughnut, Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js';
import Layout from '../components/Layout';
import { ReportsAPI } from '../api/services';
import { formatCurrency, formatDate, daysUntil } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

export default function Reports() {
  const { showToast } = useToast();
  const [occupancy, setOccupancy] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [o, types, statuses, r, late] = await Promise.all([ReportsAPI.occupancy(), ReportsAPI.unitTypes(), ReportsAPI.paymentStatus(), ReportsAPI.revenue(), ReportsAPI.overdue()]);
        setOccupancy(o);
        setUnitTypes(types);
        setPaymentStatuses(statuses);
        setRevenue(r);
        setOverdue(late);
      } catch (e) {
        showToast('فشل تحميل بيانات التقارير', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const occupancyData = useMemo(() => {
    const statuses = ['مؤجرة', 'شاغرة', 'تحت الصيانة', 'محجوزة'];
    const counts = Object.fromEntries(occupancy.map((row) => [row.unit_status, Number(row.count)]));
    return { labels: statuses, datasets: [{ data: statuses.map((s) => counts[s] || 0), backgroundColor: ['#1f9d55', '#94a3b8', '#e0a11c', '#0f4c5c'] }] };
  }, [occupancy]);

  const typeData = useMemo(() => ({ labels: unitTypes.map((r) => r.unit_type), datasets: [{ label: 'عدد الوحدات', data: unitTypes.map((r) => Number(r.count)), backgroundColor: '#c99a2e', borderRadius: 6 }] }), [unitTypes]);

  const revenueData = useMemo(() => {
    const keys = revenue.map((r) => r.month);
    return {
      labels: keys.length ? keys : ['لا توجد بيانات'],
      datasets: [{ label: 'الإيرادات (ريال)', data: keys.length ? revenue.map((r) => Number(r.total)) : [0], borderColor: '#0f4c5c', backgroundColor: 'rgba(15,76,92,.15)', fill: true, tension: 0.3 }]
    };
  }, [revenue]);

  const paymentStatusData = useMemo(() => {
    const statuses = ['مدفوعة', 'مستحقة', 'متأخرة', 'ملغاة'];
    const counts = Object.fromEntries(paymentStatuses.map((row) => [row.status, Number(row.count)]));
    return { labels: statuses, datasets: [{ data: statuses.map((s) => counts[s] || 0), backgroundColor: ['#1f9d55', '#0f4c5c', '#d33b3b', '#94a3b8'] }] };
  }, [paymentStatuses]);

  const kpis = useMemo(() => {
    const totalUnits = occupancy.reduce((s, r) => s + Number(r.count), 0);
    const rented = occupancy.find((r) => r.unit_status === 'مؤجرة')?.count || 0;
    const totalRevenue = revenue.reduce((s, r) => s + Number(r.total), 0);
    return { occupancyRate: totalUnits ? Math.round((rented / totalUnits) * 100) : 0, totalRevenue, avgRent: 0, lateCount: overdue.length };
  }, [occupancy, revenue, overdue]);

  const overdueData = useMemo(() => {
    return overdue.map((p) => ({ ...p, _days: Math.abs(daysUntil(p.due_date) || 0) })).sort((a, b) => b._days - a._days);
  }, [overdue]);

  async function exportPdf() {
    const blob = await ReportsAPI.exportPdf();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'تقرير_العقارات.pdf'; a.click(); URL.revokeObjectURL(url);
    showToast('تم إنشاء التقرير PDF على الخادم', 'success');
  }

  return (
    <Layout title="التقارير">
      <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={exportPdf}><i className="fa-solid fa-file-pdf"></i> تصدير PDF</button>
      </div>

      <div className="form-row" style={{ alignItems: 'stretch' }}>
        <div className="panel">
          <div className="panel-title"><h3><i className="fa-solid fa-building"></i> إشغال الوحدات حسب الحالة</h3></div>
          <div style={{ height: 260 }}>{!loading && <Doughnut data={occupancyData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } } } }} />}</div>
        </div>
        <div className="panel">
          <div className="panel-title"><h3><i className="fa-solid fa-layer-group"></i> توزيع الوحدات حسب النوع</h3></div>
          <div style={{ height: 260 }}>{!loading && <Bar data={typeData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><h3><i className="fa-solid fa-chart-column"></i> الإيرادات المسددة شهريًا</h3></div>
        <div style={{ height: 280 }}>{!loading && <Line data={revenueData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />}</div>
      </div>

      <div className="form-row">
        <div className="panel">
          <div className="panel-title"><h3><i className="fa-solid fa-circle-check"></i> حالة سداد الدفعات</h3></div>
          <div style={{ height: 240 }}>{!loading && <Pie data={paymentStatusData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } } } }} />}</div>
        </div>
        <div className="panel">
          <div className="panel-title"><h3><i className="fa-solid fa-ranking-star"></i> أهم المؤشرات</h3></div>
          <div style={{ fontSize: 13.5, lineHeight: 2.3 }}>
            <KpiRow label="نسبة الإشغال" value={`${kpis.occupancyRate}%`} color="var(--primary)" />
            <KpiRow label="إجمالي الإيرادات المحصّلة" value={formatCurrency(kpis.totalRevenue)} color="var(--success)" />
            <KpiRow label="متوسط الإيجار السنوي للوحدة" value={formatCurrency(kpis.avgRent)} />
            <KpiRow label="دفعات متأخرة حاليًا" value={kpis.lateCount} color="var(--danger)" last />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><h3><i className="fa-solid fa-triangle-exclamation"></i> تقرير الدفعات المتأخرة</h3></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>المستأجر</th><th>رقم العقد</th><th>القيمة</th><th>تاريخ الاستحقاق</th><th>عدد أيام التأخير</th></tr></thead>
            <tbody>
              {overdue.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-600)', padding: 20 }}>لا توجد دفعات متأخرة حاليًا</td></tr>
              ) : overdueData.map((p) => (
                <tr key={p.id}>
                  <td>{p.tenant_name || '—'}</td>
                  <td>{p.contract_number || '—'}</td>
                  <td>{formatCurrency(p.amount)}</td>
                  <td>{formatDate(p.due_date)}</td>
                  <td><span className="status-badge p-moa">{p._days} يوم</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function KpiRow({ label, value, color, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: last ? 'none' : '1px dashed var(--gray-200)', padding: '6px 0' }}>
      <span style={{ color: 'var(--gray-600)' }}>{label}</span>
      <b style={color ? { color } : undefined}>{value}</b>
    </div>
  );
}
