// دوال مساعدة مشتركة للتنسيق والحسابات

export function formatCurrency(n) {
  if (n === null || n === undefined || n === '') return '—';
  return Number(n).toLocaleString('ar-SA') + ' ريال';
}

export function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function daysUntil(d) {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function toDateInput(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function unitStatusClass(status) {
  const map = { 'مؤجرة': 's-mo', 'شاغرة': 's-sha', 'تحت الصيانة': 's-sia', 'محجوزة': 's-mah' };
  return map[status] || 's-sha';
}

export function paymentStatusClass(status) {
  const map = { 'مدفوعة': 'p-madf', 'مستحقة': 'p-mos', 'متأخرة': 'p-moa', 'ملغاة': 'p-molg' };
  return map[status] || 'p-mos';
}

export function extractErrorMessage(err, fallback = 'حدث خطأ غير متوقع') {
  return err?.response?.data?.error || fallback;
}
