const CACHE_NAME = 'stalker-pda-v2';
const ASSETS = [
  '/stalker-pda-V.1.0/',
  '/stalker-pda-V.1.0/index.html',
  '/stalker-pda-V.1.0/assets/css/style.css',
  '/stalker-pda-V.1.0/js/app.js',
  '/stalker-pda-V.1.0/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
