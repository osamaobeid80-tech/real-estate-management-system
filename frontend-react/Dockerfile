# صورة Docker لبناء وتشغيل واجهة React (Vite) — نظام إدارة العقارات
# مرحلة 1: بناء الواجهة (npm run build) إلى ملفات ثابتة في dist/
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# رابط الـ Backend الذي ستتصل به الواجهة بعد البناء (يُمرَّر من docker-compose كـ build arg)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# مرحلة 2: تقديم ملفات dist/ الثابتة عبر Nginx خفيف الوزن
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
