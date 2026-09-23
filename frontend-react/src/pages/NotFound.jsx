import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <i className="fa-solid fa-map-signs" style={{ fontSize: 40, color: '#cbd5e1' }}></i>
      <h2 style={{ margin: 0, color: '#1e293b' }}>الصفحة غير موجودة</h2>
      <Link to="/" className="btn btn-primary"><i className="fa-solid fa-house"></i> العودة للوحة التحكم</Link>
    </div>
  );
}
