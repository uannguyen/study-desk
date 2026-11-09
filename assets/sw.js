// Sinh bởi pwa/build.py: VERSION là hash nội dung, tự đổi khi có file thay đổi.
const VERSION = '__VERSION__';
const FILES = __FILES__;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Font Google (Patrick Hand): lưu lần đầu tải được, để offline vẫn ra chữ viết tay.
const FONTS = 'fonts-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Cache-first. Cache theo bản VERSION nên không cần làm mới ngầm: bản mới = sw mới = cache mới.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(FONTS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }))));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req))
  );
});
