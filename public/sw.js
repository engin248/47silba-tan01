// BOŞ KALIYOR: Eski 'sw.js' için temizleyici. Tüm önbellekleri siler (404 Cache hatası için zorunlu).
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => caches.delete(key)));
        })
    );
    self.registration.unregister();
});
