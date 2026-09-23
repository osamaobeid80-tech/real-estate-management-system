// Service Worker - نظام إدارة العقارات
const CACHE_NAME = 'real-estate-app-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'properties.html',
  'units.html',
  'contracts.html',
  'unit-detail.html',
  'payments.html',
  'reports.html',
  'settings.html',
  'install-guide.html',
  'css/app.css',
  'js/app.js',
  'js/data.js',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// استراتيجية: Network First لطلبات البيانات (tables/*)، Cache First للملفات الثابتة
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.includes('/tables/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        return response;
      }).catch(() => cached);
    })
  );
});
