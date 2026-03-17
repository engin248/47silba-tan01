self.addEventListener('install', (e) => {
    // Yeni SW'yi bekletmeden hemen kur
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    console.log('[SW Katili] Eski cache siliniyor:', key);
                    return caches.delete(key);
                })
            );
        }).then(() => {
            console.log('[SW Katili] Zombi Service Worker kendini imha ediyor...');
            return self.registration.unregister();
        }).then(() => {
            console.log('[SW Katili] İmha tamamlandı. İstemcilere reload komutu gönderilecek.');
            return self.clients.matchAll();
        }).then((clients) => {
            clients.forEach(client => {
                // Sadece açık olan sekmeleri zorla yenile
                client.navigate(client.url);
            });
        })
    );
});
