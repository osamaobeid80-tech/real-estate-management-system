import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../utils/helpers';

export default function Login() {
  const { user, login, loading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email.trim(), password);
      showToast('تم تسجيل الدخول بنجاح', 'success');
      navigate('/');
    } catch (err) {
      const msg = extractErrorMessage(err, 'تعذّر الاتصال بالخادم. تأكد من تشغيل Backend وصحة رابط API');
      setError(msg);
      showToast(msg, 'error');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(120deg,#0a3540,#0f4c5c 60%,#146475)', padding: 20
    }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '38px 32px', width: '100%', maxWidth: 400, boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <i className="fa-solid fa-building-columns" style={{ fontSize: 34, color: '#c99a2e' }}></i>
          <h1 style={{ fontSize: 19, margin: '10px 0 2px', color: '#0a3540' }}>نظام إدارة العقارات</h1>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>تسجيل الدخول — نسخة React + Backend حقيقي</p>
        </div>

        {error && (
          <div style={{ background: '#fdecec', color: '#b91c1c', padding: '10px 14px', borderRadius: 10, fontSize: 12.5, marginBottom: 16 }}>
            <i className="fa-solid fa-triangle-exclamation"></i> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input type="email" required className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
          </div>
          <div className="form-group">
            <label>كلمة المرور</label>
            <input type="password" required className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={loading}>
            {loading ? 'جارِ الدخول...' : (<><i className="fa-solid fa-right-to-bracket"></i> تسجيل الدخول</>)}
          </button>
        </form>

        <div style={{ marginTop: 18, fontSize: 11.5, color: '#94a3b8', textAlign: 'center', lineHeight: 1.9 }}>
          هذه الواجهة تتصل بـ Backend حقيقي (Node.js + Express + PostgreSQL).<br />
          أنشئ أول مستخدم عبر: <code>npm run create-admin</code> داخل مجلد <code>backend/</code>.
        </div>
      </div>
    </div>
  );
}
