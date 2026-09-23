/* Service Worker:让工作台像 App 一样
   1) 离线缓存核心资源
   2) 接收页面消息触发系统通知(页面后台时也能弹) */
const CACHE = 'pw-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/store.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// HTML 导航请求：网络优先（确保拿到最新版），离线回退缓存
// 静态资源：缓存优先
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isNav = req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html');
  if (isNav) {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});

// 接收页面消息弹系统通知(页面后台也能弹)
self.addEventListener('message', e => {
  const data = e.data || {};
  if (data.type === 'notify') {
    const title = data.title || '工作台提醒';
    const opts = {
      body: data.body || '',
      icon: data.icon || './icons/icon-192.png',
      tag: data.tag || '',
      requireInteraction: !!data.requireInteraction
    };
    self.registration.showNotification(title, opts);
  }
});

// 点击通知聚焦页面
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      for (const c of clients) {
        if ('focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
