import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// إعداد Vite لواجهة React الخاصة بنظام إدارة العقارات
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // أثناء التطوير المحلي: يوجَّه كل طلب /api إلى خادم Backend المحلي
      // عدّل الرابط ليطابق منفذ تشغيل backend/ (افتراضيًا 4000)
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
});
