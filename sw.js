// 캐시 버전 — 게임 업데이트 시 이 값을 바꾸면 캐시 갱신됨
const CACHE_NAME = 'memory-card-v1';

// 캐싱할 파일 목록
const ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Google Fonts — 네트워크 우선으로 처리하므로 여기선 제외
];

// ── 설치: 핵심 에셋 캐싱 ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── 활성화: 구버전 캐시 삭제 ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── 패치: Cache-first (Google Fonts는 Network-first) ──
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Google Fonts — 네트워크 우선, 실패 시 캐시 폴백
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 나머지 — 캐시 우선, 없으면 네트워크
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
