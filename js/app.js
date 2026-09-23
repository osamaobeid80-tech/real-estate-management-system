/* ============================================
   نظام إدارة العقارات - سكربت مشترك (الهيكل، التنقل، الأدوار، Toast، Modal)
   ============================================ */

// ------- محاكاة الأدوار (عرض فقط - ليست حماية أمنية حقيقية) -------
const ROLE_KEY = 'reams_current_role';
const DEFAULT_ROLE = 'مسؤول النظام';

function getCurrentRole(){
  return localStorage.getItem(ROLE_KEY) || DEFAULT_ROLE;
}
function setCurrentRole(role){
  localStorage.setItem(ROLE_KEY, role);
  renderTopbarRole();
}
function canEdit(){
  const r = getCurrentRole();
  return r === 'مسؤول النظام' || r === 'موظف إدخال بيانات';
}
function canDelete(){
  return getCurrentRole() === 'مسؤول النظام';
}

// ------- عناصر التنقل -------
const NAV_ITEMS = [
  { href:'index.html', icon:'fa-gauge-high', label:'لوحة التحكم', key:'dashboard' },
  { href:'properties.html', icon:'fa-city', label:'العقارات', key:'properties' },
  { href:'units.html', icon:'fa-building', label:'الوحدات', key:'units' },
  { href:'contracts.html', icon:'fa-file-signature', label:'العقود', key:'contracts' },
  { href:'payments.html', icon:'fa-hand-holding-dollar', label:'إدارة المدفوعات', key:'payments' },
  { href:'reports.html', icon:'fa-chart-column', label:'التقارير', key:'reports' },
  { href:'settings.html', icon:'fa-gears', label:'الإعدادات والمستخدمون', key:'settings' },
  { href:'install-guide.html', icon:'fa-mobile-screen-button', label:'تثبيت التطبيق على الجوال', key:'install' },
  { href:'spec.html', icon:'fa-file-lines', label:'وثيقة المواصفات', key:'spec' },
];

function renderShell(activeKey){
  const sidebarHtml = `
    <aside class="app-sidebar" id="appSidebar">
      <div class="brand">
        <i class="fa-solid fa-building-columns"></i>
        <div><h1>إدارة العقارات</h1><span>مكتب عقاري ذكي</span></div>
      </div>
      <nav class="app-nav">
        ${NAV_ITEMS.map(it => `
          <a href="${it.href}" class="${it.key===activeKey?'active':''}">
            <i class="fa-solid ${it.icon}"></i> ${it.label}
          </a>`).join('')}
      </nav>
      <div class="sidebar-footer">
        هذه واجهة تجريبية (Demo) بدون خادم — يوجد <b>Backend وReact حقيقيان جاهزان</b> في <code>/backend</code> و<code>/frontend-react</code> لمن يريد نشرًا فعليًا.<br>
        <a href="spec.html#security">تفاصيل الأمان والفروقات</a>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
  `;

  const pageTitle = (NAV_ITEMS.find(i=>i.key===activeKey) || {}).label || '';
  const topbarHtml = `
    <header class="app-topbar">
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="menu-toggle" id="menuToggleBtn" aria-label="القائمة"><i class="fa-solid fa-bars"></i></button>
        <h2>${pageTitle}</h2>
      </div>
      <div class="role-chip" id="roleChip"><i class="fa-solid fa-user-shield"></i> <span id="roleChipText"></span></div>
    </header>
  `;

  const bottomNavKeys = ['dashboard','properties','units','contracts','payments'];
  const bottomNavItems = bottomNavKeys.map(k => NAV_ITEMS.find(i=>i.key===k)).filter(Boolean);
  const bottomNavHtml = `
    <nav class="mobile-bottom-nav">
      <div class="mbn-inner">
        ${bottomNavItems.map(it => `
          <a href="${it.href}" class="${it.key===activeKey?'active':''}">
            <i class="fa-solid ${it.icon}"></i><span>${it.label.split(' ')[0]}</span>
          </a>`).join('')}
      </div>
    </nav>
  `;

  const sidebarEl = document.getElementById('sidebarContainer');
  const topbarEl = document.getElementById('topbarContainer');
  const bottomEl = document.getElementById('bottomNavContainer');
  if(sidebarEl) sidebarEl.outerHTML = sidebarHtml;
  if(topbarEl) topbarEl.outerHTML = topbarHtml;
  if(bottomEl) bottomEl.outerHTML = bottomNavHtml;

  const menuBtn = document.getElementById('menuToggleBtn');
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if(menuBtn){
    menuBtn.addEventListener('click', ()=>{
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
  }
  if(overlay){
    overlay.addEventListener('click', ()=>{
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
  renderTopbarRole();
}

function renderTopbarRole(){
  const el = document.getElementById('roleChipText');
  if(el) el.textContent = getCurrentRole();
}

// ------- Toast -------
function ensureToastContainer(){
  let c = document.querySelector('.toast-container');
  if(!c){
    c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
}
function showToast(message, type='info'){
  const c = ensureToastContainer();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type==='success' ? 'fa-circle-check' : (type==='error' ? 'fa-circle-exclamation' : 'fa-circle-info');
  el.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  c.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(), 300); }, 3000);
}

// ------- Modal helpers -------
function openModal(id){
  const m = document.getElementById(id);
  if(m) m.classList.add('open');
}
function closeModal(id){
  const m = document.getElementById(id);
  if(m) m.classList.remove('open');
}

// ------- تنسيقات مساعدة -------
function formatCurrency(n){
  if(n === null || n === undefined || n === '') return '—';
  return Number(n).toLocaleString('ar-SA') + ' ريال';
}
function formatDate(d){
  if(!d) return '—';
  try{
    const date = new Date(d);
    if(isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('ar-SA', { year:'numeric', month:'2-digit', day:'2-digit' });
  }catch(e){ return '—'; }
}
function daysUntil(d){
  if(!d) return null;
  const date = new Date(d);
  if(isNaN(date.getTime())) return null;
  const diff = Math.ceil((date.getTime() - Date.now()) / (1000*60*60*24));
  return diff;
}

function unitStatusBadgeClass(status){
  const map = { 'مؤجرة':'s-mo', 'شاغرة':'s-sha', 'تحت الصيانة':'s-sia', 'محجوزة':'s-mah' };
  return map[status] || 's-sha';
}
function contractStatusBadgeClass(status){
  const map = { 'نشط':'s-mo', 'منتهي':'s-sha', 'ملغى':'p-molg' };
  return map[status] || 's-sha';
}
function paymentStatusBadgeClass(status){
  const map = { 'مدفوعة':'p-madf', 'مستحقة':'p-mos', 'متأخرة':'p-moa', 'ملغاة':'p-molg' };
  return map[status] || 'p-mos';
}

function escapeHtml(str){
  if(str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// تسجيل Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}
