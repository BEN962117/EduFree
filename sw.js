const CACHE = 'edufree-shell-v5';
const IMAGE_CACHE = 'edufree-topic-images-v1';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE && key !== IMAGE_CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isTopicImage =
    url.origin === self.location.origin &&
    url.pathname.includes('/assets/topic-images/');

  if (isTopicImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async cache => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const response = await fetch(request);

          if (response.ok) {
            await cache.put(request, response.clone());
          }

          return response;
        } catch {
          return new Response('', {
            status: 503,
            statusText: 'Image unavailable offline'
          });
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async cached => {
      if (cached) return cached;

      try {
        const response = await fetch(request);

        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }

        return response;
      } catch {
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }

        return new Response('Offline', {
          status: 503,
          statusText: 'Offline'
        });
      }
    })
  );
});
