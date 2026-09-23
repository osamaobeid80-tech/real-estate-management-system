// عميل Axios موحّد للاتصال بالـ Backend الحقيقي (Node.js + Express + PostgreSQL)
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({ baseURL });

// إرفاق رمز JWT تلقائيًا في كل طلب (من التخزين المحلي بعد تسجيل الدخول)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('reams_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// معالجة مركزية لأخطاء الجلسة: عند 401 (توكن منتهي/غير صالح) يُعاد المستخدم لتسجيل الدخول
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('reams_token');
      localStorage.removeItem('reams_user');
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
