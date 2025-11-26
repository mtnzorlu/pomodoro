const CACHE_NAME = 'pomodoro-cache-v2';
const PRECACHE_URLS = [
  './',
  './index.html',
  './main.css',
  './main.js',
  './img/logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './sounds/alarm.mp3',
  './manifest.webmanifest'
];
const APP_SHELL = PRECACHE_URLS.map(path => new URL(path, self.location).toString());
const OFFLINE_URL = new URL('./index.html', self.location).toString();

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }
  // Network-first for HTML, cache-first for others
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const respClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, respClone));
          }
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match(OFFLINE_URL)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok) {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, respClone));
        }
        return response;
      }).catch(() => caches.match(OFFLINE_URL));
    })
  );
});


