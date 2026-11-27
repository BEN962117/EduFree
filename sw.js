
const CACHE = 'edufree-shell-v6';
const IMAGE_CACHE = 'edufree-topic-images-v1';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
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

  if (url.origin !== self.location.origin) return;

  const isTopicImage =
    url.pathname.includes('/assets/topic-images/');

  // Images: use saved copies when available for offline learning.
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

  // Pages: check the network first so learners receive updates.
  if (request.mode === 'navigate' ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('/')) {

    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);

        try {
          const response = await fetch(request);

          if (response.ok) {
            await cache.put(request, response.clone());
          }

          return response;
        } catch {
          return await cache.match(request) ||
            await cache.match('./index.html') ||
            new Response('You are offline. Please reconnect to load EduFree.', {
              status: 503
            });
        }
      })()
    );

    return;
  }

  // Other same-origin files: use cache first, then download.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);

      if (cached) return cached;

      try {
        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response.clone());
        }

        return response;
      } catch {
        return new Response('Offline', {
          status: 503,
          statusText: 'Offline'
        });
      }
    })()
  );
});
