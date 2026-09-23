// إدارة حالة المصادقة الحقيقية (JWT صادر فعليًا من Backend) - وليس محاكاة في المتصفح
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AuthAPI } from '../api/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('reams_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await AuthAPI.login(email, password);
      localStorage.setItem('reams_token', res.token);
      localStorage.setItem('reams_user', JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('reams_token');
    localStorage.removeItem('reams_user');
    setUser(null);
  }, []);

  // صلاحيات مطابقة تمامًا لمصفوفة الأدوار في مصفوفة الصلاحيات (spec.html) والمفروضة فعليًا على الخادم
  const isAdmin = user?.role === 'مسؤول النظام';
  const canEdit = user?.role === 'مسؤول النظام' || user?.role === 'موظف إدخال بيانات';
  const canDelete = user?.role === 'مسؤول النظام';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, canEdit, canDelete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth يجب استخدامه داخل AuthProvider');
  return ctx;
}
