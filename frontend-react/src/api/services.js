// خدمات نداء الـ API الحقيقية - تطابق نقاط النهاية في backend/src/routes/*
import apiClient from './client';

export const AuthAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }).then(r => r.data),
  me: () => apiClient.get('/auth/me').then(r => r.data),
};

export const UnitsAPI = {
  list: (params = {}) => apiClient.get('/units', { params }).then(r => r.data),
  get: (id) => apiClient.get(`/units/${id}`).then(r => r.data),
  create: (data) => apiClient.post('/units', data).then(r => r.data),
  update: (id, data) => apiClient.patch(`/units/${id}`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/units/${id}`).then(r => r.data),
  // يجلب كل الصفحات (مناسب لحجم بيانات مكتب عقاري صغير)
  listAll: async () => {
    let page = 1; const limit = 100; let all = [];
    while (true) {
      const res = await apiClient.get('/units', { params: { page, limit } }).then(r => r.data);
      all = all.concat(res.data || []);
      if (!res.data || res.data.length < limit) break;
      page++;
      if (page > 50) break;
    }
    return all;
  }
};

export const PaymentsAPI = {
  list: (params = {}) => apiClient.get('/payments', { params }).then(r => r.data),
  create: (data) => apiClient.post('/payments', data).then(r => r.data),
  update: (id, data) => apiClient.patch(`/payments/${id}`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/payments/${id}`).then(r => r.data),
  listAll: async (params = {}) => {
    let page = 1; const limit = 100; let all = [];
    while (true) {
      const res = await apiClient.get('/payments', { params: { ...params, page, limit } }).then(r => r.data);
      all = all.concat(res.data || []);
      if (!res.data || res.data.length < limit) break;
      page++;
      if (page > 50) break;
    }
    return all;
  }
};

export const NotesAPI = {
  listByUnit: (unitId) => apiClient.get('/unit-notes', { params: { unit_id: unitId } }).then(r => r.data),
  create: (data) => apiClient.post('/unit-notes', data).then(r => r.data),
  remove: (id) => apiClient.delete(`/unit-notes/${id}`).then(r => r.data),
};

export const UsersAPI = {
  list: () => apiClient.get('/users').then(r => r.data),
  create: (data) => apiClient.post('/users', data).then(r => r.data),
  update: (id, data) => apiClient.patch(`/users/${id}`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/users/${id}`).then(r => r.data),
};

export const ReportsAPI = {
  occupancy: () => apiClient.get('/reports/occupancy').then(r => r.data),
  unitTypes: () => apiClient.get('/reports/unit-types').then(r => r.data),
  paymentStatus: () => apiClient.get('/reports/payment-status').then(r => r.data),
  upcomingDues: (days = 30) => apiClient.get('/reports/upcoming-dues', { params: { days } }).then(r => r.data),
  overdue: () => apiClient.get('/reports/overdue').then(r => r.data),
  revenue: (from, to) => apiClient.get('/reports/revenue', { params: { from, to } }).then(r => r.data),
  exportPdf: () => apiClient.get('/reports/export', { params: { format: 'pdf' }, responseType: 'blob' }).then(r => r.data),
};
