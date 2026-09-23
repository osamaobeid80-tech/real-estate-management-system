import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// حراسة المسارات على مستوى الواجهة فقط (تسهيل تجربة الاستخدام)
// الحماية الفعلية والملزمة تُفرض دائمًا من الخادم (middleware/auth.js) وليس من هنا
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
}
