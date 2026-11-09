// Sinh bởi pwa/build.py: VERSION là hash nội dung, tự đổi khi có file thay đổi.
const VERSION = '452b8a5c52';
const FILES = ["./", "api/api-0-api-la-gi-hand-drawn.html", "api/api-1-ba-tang-hand-drawn.html", "api/api-2-0-transport-hand-drawn.html", "api/api-2-1-transport-cornell-hand-drawn.html", "api/api-2-2-transport-thay-the-hand-drawn.html", "api/api-3-0-protocol-hand-drawn.html", "api/api-3-1-protocol-cornell-hand-drawn.html", "api/api-3-2-tls-https-hand-drawn.html", "api/api-4-0-api-style-hand-drawn.html", "api/api-4-1-api-style-cornell-hand-drawn.html", "api/api-4-2-rpc-grpc-protobuf-hand-drawn.html", "auth/auth-0-buc-tranh-tong-the-hand-drawn.html", "auth/auth-1-authn-authz-cornell-hand-drawn.html", "auth/auth-2-0-cong-cu-mat-ma-hand-drawn.html", "auth/auth-2-1-hash-cornell-hand-drawn.html", "auth/auth-2-2-ma-hoa-doi-xung-cornell-hand-drawn.html", "auth/auth-2-3-ma-hoa-bat-doi-xung-cornell-hand-drawn.html", "auth/auth-3-0-hmac-chu-ky-so-hand-drawn.html", "auth/auth-3-1-hmac-cornell-hand-drawn.html", "auth/auth-3-2-chu-ky-so-cornell-hand-drawn.html", "auth/auth-4-0-session-jwt-hand-drawn.html", "auth/auth-4-1-session-cornell-hand-drawn.html", "auth/auth-4-2-jwt-cornell-hand-drawn.html", "auth/auth-4-3-dung-jwt-cho-dung-cornell-hand-drawn.html", "auth/auth-5-0-oauth2-oidc-hand-drawn.html", "auth/auth-5-1-oauth2-cornell-hand-drawn.html", "auth/auth-5-2-oidc-cornell-hand-drawn.html", "auth/auth-5-3-client-credentials-cornell-hand-drawn.html", "auth/auth-6-0-owasp-hand-drawn.html", "auth/auth-6-1-broken-access-control-cornell-hand-drawn.html", "auth/auth-6-2-cryptographic-failures-cornell-hand-drawn.html", "auth/auth-6-3-injection-ssrf-cornell-hand-drawn.html", "cards/api.json", "cards/auth.json", "cards/database.json", "cards/idempotency.json", "cards/index.json", "cards/microservices.json", "cards/tu-duy.json", "client-server/client-server-side-hand-drawn.html", "database/postgres-thiet-ke-bang-cornell-hand-drawn.html", "database/postgres-to-chuc-du-lieu-cornell-hand-drawn.html", "database/sql-2-0-doc-du-lieu-cornell-hand-drawn.html", "database/sql-2-1-ghi-transaction-cornell-hand-drawn.html", "database/sql-2-2-ddl-migration-cornell-hand-drawn.html", "database/sql-2-3-tra-cuu-nhanh.html", "database/sql-2-4-thu-tu-chay-hand-drawn.html", "database/sql-vs-nosql-hand-drawn.html", "database/toc-do-redis-mongo-postgres-hand-drawn.html", "database/xu-ly-ben-duoi-db-cornell-hand-drawn.html", "database/xu-ly-ben-duoi-db-ket-noi-pool-hand-drawn.html", "finviet/finviet-mo-hinh-kinh-doanh-v2-hand-drawn.html", "icon-192.png", "icon-512.png", "icon.svg", "idempotency/idempotency-cornell-hand-drawn.html", "idempotency/idempotency-hand-drawn.html", "index.html", "manifest.webmanifest", "microservices/microservices-cap-1-ban-chat-cornell-hand-drawn.html", "microservices/microservices-cap-1-ban-chat-hand-drawn.html", "microservices/microservices-cap-1-ban-chat-mindmap-hand-drawn.html", "microservices/microservices-cap-2-tach-service-du-lieu-cornell-hand-drawn.html", "microservices/microservices-cap-2-tach-service-du-lieu-hand-drawn.html", "microservices/microservices-cap-2-tach-service-du-lieu-mindmap-hand-drawn.html", "microservices/microservices-cap-3-giao-tiep-cornell-hand-drawn.html", "microservices/microservices-cap-3-giao-tiep-hand-drawn.html", "microservices/microservices-cap-3-giao-tiep-mindmap-hand-drawn.html", "microservices/microservices-cap-4-chiu-loi-cornell-hand-drawn.html", "microservices/microservices-cap-4-chiu-loi-hand-drawn.html", "microservices/microservices-cap-4-chiu-loi-mindmap-hand-drawn.html", "microservices/microservices-cap-5-saga-cornell-hand-drawn.html", "microservices/microservices-cap-5-saga-hand-drawn.html", "microservices/microservices-cap-5-saga-mindmap-hand-drawn.html", "microservices/microservices-cap-5-saga-phan-cap-hand-drawn.html", "microservices/microservices-cap-6-messaging-tin-cay-cornell-hand-drawn.html", "microservices/microservices-cap-6-messaging-tin-cay-hand-drawn.html", "microservices/microservices-cap-6-messaging-tin-cay-mindmap-hand-drawn.html", "microservices/microservices-cap-6-vi-du-kafka-offset-retention-hand-drawn.html", "microservices/microservices-cap-6-vi-du-queue-vs-topic-hand-drawn.html", "microservices/microservices-cap-7-van-hanh-cornell-hand-drawn.html", "microservices/microservices-cap-7-van-hanh-hand-drawn.html", "microservices/microservices-cap-7-van-hanh-mindmap-hand-drawn.html", "monolithic/monolithic-hand-drawn.html", "pwa.css", "pwa.js", "tu-duy/tu-duy-phan-bien-cornell-hand-drawn.html", "tu-duy/tu-duy-phan-bien-hand-drawn.html"];

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
