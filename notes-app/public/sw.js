const SHELL_CACHE = 'notes-cache-v4';
const DYNAMIC_CACHE = 'dynamic-content-v3';
const RUNTIME_CACHE = 'notes-runtime-v3';

/* Не кэшируем «/» при install: в CRA меняются пути /static/js/*.js */
const SHELL_ASSETS = [
  '/manifest.json',
  '/content/home.html',
  '/content/about.html',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
];

function precacheShell(cache) {
  return Promise.all(
    SHELL_ASSETS.map((url) =>
      cache.add(url).catch(() => {
        /* один битый файл не должен отменять весь install */
      })
    )
  );
}

function isMainDocumentRequest(event) {
  return (
    event.request.mode === 'navigate' ||
    event.request.destination === 'document'
  );
}

function cacheNavigateResponse(cache, request, response) {
  if (!response || !response.ok) return;
  const clone = response.clone();
  const u = new URL(response.url);
  if (u.origin !== self.location.origin) return;
  caches.open(cache).then((c) => c.put(request, clone));
}

function offlineDocumentFallback(request) {
  return caches
    .match(request, { ignoreSearch: true })
    .then((cached) => {
      if (cached) return cached;
      return caches.match(new URL('/', self.location.origin).href);
    })
    .then((cached) => cached || caches.match('/'));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => precacheShell(cache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (
            key !== SHELL_CACHE &&
            key !== DYNAMIC_CACHE &&
            key !== RUNTIME_CACHE
          ) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  /* HTML (в т.ч. dev-сервер): сеть → кэш; офлайн — последний документ */
  if (isMainDocumentRequest(event)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          cacheNavigateResponse(SHELL_CACHE, event.request, response);
          return response;
        })
        .catch(() => offlineDocumentFallback(event.request))
    );
    return;
  }

  if (url.pathname.startsWith('/content/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches
              .open(DYNAMIC_CACHE)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then(
              (cached) =>
                cached || caches.match('/content/home.html')
            )
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const type = response.type;
          if (type !== 'basic' && type !== 'cors') {
            return response;
          }
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => caches.match(event.request));
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Новое уведомление', body: '' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      try {
        const t = event.data.text();
        data = JSON.parse(t);
      } catch {
        data = { title: 'Новое уведомление', body: event.data.text() || '' };
      }
    }
  }
  const title = data.title || 'Заметки';
  const options = {
    body: data.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    tag: 'notes-task',
    renotify: true,
    requireInteraction: false,
  };
  event.waitUntil(
    self.registration.showNotification(title, options).catch((e) => {
      console.error('showNotification:', e);
    })
  );
});
