const CACHE = 'shot-timer-v2';

const ASSETS = [
  '/shooting_timer_pwa/',
  '/shooting_timer_pwa/index.html',
  '/shooting_timer_pwa/manifest.json',
  '/shooting_timer_pwa/styles/tokens.css',
  '/shooting_timer_pwa/styles/base.css',
  '/shooting_timer_pwa/styles/components.css',
  '/shooting_timer_pwa/styles/screens.css',
  '/shooting_timer_pwa/styles/animations.css',
  '/shooting_timer_pwa/js/app.js',
  '/shooting_timer_pwa/js/i18n.js',
  '/shooting_timer_pwa/js/disciplines.js',
  '/shooting_timer_pwa/js/audio.js',
  '/shooting_timer_pwa/js/timer-engine.js',
  '/shooting_timer_pwa/js/ui/components.js',
  '/shooting_timer_pwa/js/ui/home.js',
  '/shooting_timer_pwa/js/ui/modes.js',
  '/shooting_timer_pwa/js/ui/practice.js',
  '/shooting_timer_pwa/icons/icon-192.png',
  '/shooting_timer_pwa/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // For navigation requests always return cached index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/shooting_timer_pwa/index.html').then(r => r || fetch(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      });
    })
  );
});
