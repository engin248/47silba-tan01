const CACHE_NAME = 'karargah-cache-v2';
const urlsToCache = [
    '/',
    '/giris',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    // Eski cache sürümlerini temizle
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // POST/PUT/DELETE vs. — hiç müdahale etme (Supabase, Telegram, API route'ları)
    if (event.request.method !== 'GET') return;

    // Dış domain isteklerine hiç dokunma (Supabase, Telegram, Perplexity)
    if (!event.request.url.startsWith(self.location.origin)) return;

    // API route'larına dokunma — bunlar server-side, cache'lenemez
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(networkRes => {
                // Başarılı GET'leri cache'e al
                if (networkRes && networkRes.status === 200) {
                    const clone = networkRes.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                }
                return networkRes;
            }).catch(() => {
                // Sayfa isteğiyse offline HTML döndür
                if (event.request.headers.get('accept')?.includes('text/html')) {
                    return new Response(`
                        <!DOCTYPE html><html lang="tr"><head>
                        <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
                        <title>47 NİZAM — Çevrimdışı</title>
                        <style>
                            body{font-family:sans-serif;background:#0f172a;color:white;display:flex;
                            flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;gap:1rem;}
                            h1{font-size:2rem;color:#f59e0b;margin:0;}
                            p{color:#94a3b8;text-align:center;max-width:380px;line-height:1.6;}
                            .badge{background:#ef4444;padding:8px 20px;border-radius:8px;font-weight:700;font-size:0.9rem;}
                            .info{background:#1e293b;padding:1rem 1.5rem;border-radius:12px;border:1px solid #334155;text-align:center;}
                        </style></head>
                        <body>
                            <div class="badge">⚡ BAĞLANTI KOPTU</div>
                            <h1>47 NİZAM</h1>
                            <div class="info">
                                <p>İnternet bağlantısı yok.</p>
                                <p>Çevrimdışı yaptığınız işlemler IndexedDB'ye kaydedildi.<br>
                                İnternet gelince otomatik olarak sisteme aktarılacak.</p>
                            </div>
                            <p style="font-size:0.75rem;color:#475569;">THE ORDER — Adil Düzen · Şeffaf Maliyet · Adaletli Dağıtım</p>
                        </body></html>
                    `, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
                }
                return new Response('Çevrimdışı', { status: 503 });
            });
        })
    );
});
