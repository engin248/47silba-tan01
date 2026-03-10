const CACHE_ADI = 'sg47-cache-v2';
const ON_BELLEGE_AL = [
    '/',
    '/karargah',
    '/siparisler',
    '/katalog',
    '/stok',
    '/musteriler',
    '/manifest.json',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_ADI).then((cache) => {
            return cache.addAll(ON_BELLEGE_AL).catch(() => { });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_ADI).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    if (request.url.includes('/api/')) {
        event.respondWith(
            fetch(request).catch(() =>
                new Response(JSON.stringify({ hata: 'Cevrimdisi: API erisimi yok.' }),
                    { status: 503, headers: { 'Content-Type': 'application/json' } })
            )
        );
        return;
    }

    event.respondWith(
        caches.open(CACHE_ADI).then((cache) =>
            cache.match(request).then((onbellek) => {
                const agdan = fetch(request).then((res) => {
                    if (res && res.status === 200) cache.put(request, res.clone());
                    return res;
                }).catch(() => onbellek || new Response(
                    '<html><body style="background:#0f172a;color:#34d399;font-family:sans-serif;text-align:center;padding:4rem"><h1>Cevrimdisi</h1><p>Internet baglaninca sayfa yuklenecek.</p></body></html>',
                    { status: 503, headers: { 'Content-Type': 'text/html' } }
                ));
                return onbellek || agdan;
            })
        )
    );
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-queue') {
        event.waitUntil(
            self.clients.matchAll().then((istemciler) =>
                istemciler.forEach(i => i.postMessage({ tip: 'SYNC_BASLADI' }))
            )
        );
    }
});

self.addEventListener('push', (event) => {
    if (!event.data) return;
    const veri = event.data.json().catch(() => ({ baslik: 'THE ORDER 47', mesaj: event.data.text() }));
    event.waitUntil(
        veri.then((d) =>
            self.registration.showNotification(d.baslik || 'THE ORDER 47', {
                body: d.mesaj || 'Yeni bildirim',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                vibrate: [200, 100, 200],
                tag: 'sg47-bildirim',
                renotify: true,
                data: { url: d.url || '/karargah' },
            })
        )
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const hedefUrl = event.notification.data?.url || '/karargah';
    event.waitUntil(clients.openWindow(hedefUrl));
});
