# صورة Docker لتشغيل Backend (Node.js + Express) — نظام إدارة العقارات
FROM node:18-alpine

WORKDIR /app

# تثبيت الاعتماديات أولاً (استفادة من طبقة الكاش عند عدم تغيّر package.json)
COPY package*.json ./
RUN npm install --omit=dev

# نسخ باقي كود الخادم
COPY . .

ENV NODE_ENV=production
EXPOSE 4000

# فحص صحة الحاوية عبر مسار /health المتوفر فعليًا في src/index.js
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "src/index.js"]
