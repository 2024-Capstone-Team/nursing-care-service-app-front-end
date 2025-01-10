// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('app-cache').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/static/js/bundle.js',
        '/static/css/main.css',
      ]);
    })
  );
});

// Update service worker
// Delete cache if necessary
self.addEventListener("activate", function (event) {
  event.waitUntil(
      caches.keys().then(function (cacheNames) {
          return Promise.all(
              cacheNames.map(function (cacheName) {
                  if (CACHE_NAME !== cacheName && cacheName.startsWith("cache")) {
                      return caches.delete(cacheName);
                  }
              })
          );
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Default Title';
  const options = {
    body: data.body || 'Default message body',
    icon: '/icons/icon-192x192.png', 
    badge: '/icons/icon-72x72.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  const payload = event.data ? event.data.text() : 'No payload';
  console.log('Notification payload:', payload);

  const options = {
    body: payload,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
  };

  event.waitUntil(self.registration.showNotification('Push Notification', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Redirect to your app
  );
});