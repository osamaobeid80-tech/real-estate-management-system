import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: 'fa-gauge-high', label: 'لوحة التحكم', end: true },
  { to: '/units', icon: 'fa-building', label: 'الوحدات والعقود' },
  { to: '/payments', icon: 'fa-hand-holding-dollar', label: 'إدارة المدفوعات' },
  { to: '/reports', icon: 'fa-chart-column', label: 'التقارير' },
  { to: '/settings', icon: 'fa-gears', label: 'الإعدادات والمستخدمون' },
];

export default function Layout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <i className="fa-solid fa-building-columns"></i>
          <div>
            <h1>إدارة العقارات</h1>
            <span>نسخة React + Backend حقيقي</span>
          </div>
        </div>
        <nav className="app-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <i className={`fa-solid ${item.icon}`}></i> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          مسجّل الدخول: <b>{user?.full_name}</b><br />
          <button className="btn btn-outline btn-sm" style={{ marginTop: 8, width: '100%' }} onClick={logout}>
            <i className="fa-solid fa-right-from-bracket"></i> تسجيل الخروج
          </button>
        </div>
      </aside>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      <main className="app-main">
        <header className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="القائمة">
              <i className="fa-solid fa-bars"></i>
            </button>
            <h2>{title}</h2>
          </div>
          <div className="role-chip"><i className="fa-solid fa-user-shield"></i> {user?.role}</div>
        </header>
        <div className="app-content">{children}</div>
      </main>

      <nav className="mobile-bottom-nav">
        <div className="mbn-inner">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
