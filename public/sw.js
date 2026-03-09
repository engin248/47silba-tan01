// ── SERVICE WORKER v4 — CACHE TEMİZLEYİCİ ──────────────────────
// Bu versiyon tüm eski cache'leri siler ve kendini devre dışı bırakır.
// Next.js dev ortamında SW cache sorunlarını önler.

const CACHE_NAME = 'karargah-cache-v4';

self.addEventListener('install', event => {
    // Hemen aktif ol, bekletme
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    // TÜM eski cache versiyonlarını sil
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => {
                console.log('[SW] Siliniyor cache:', k);
                return caches.delete(k);
            }))
        ).then(() => {
            console.log('[SW] Tüm cache temizlendi, SW aktif.');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    // POST/PUT/DELETE — dokunma
    if (event.request.method !== 'GET') return;

    // Dış domain — dokunma
    if (!event.request.url.startsWith(self.location.origin)) return;

    // API route'ları — dokunma (server-side)
    if (event.request.url.includes('/api/')) return;

    // _next/static dosyaları — cache'e al (JS/CSS varlıkları)
    if (event.request.url.includes('/_next/static/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(event.request).then(cached => {
                    if (cached) return cached;
                    return fetch(event.request).then(res => {
                        if (res && res.status === 200) {
                            cache.put(event.request, res.clone());
                        }
                        return res;
                    });
                })
            )
        );
        return;
    }

    // HTML sayfaları (/, /arge, vb.) — HER ZAMAN TAZE ÇEK, cache'e alma
    // Bu sayede page.js değişiklikleri anında görünür
    event.respondWith(
        fetch(event.request).catch(() => {
            // Offline fallback
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
                        .badge{background:#ef4444;padding:8px 20px;border-radius:8px;font-weight:700;}
                        .info{background:#1e293b;padding:1rem 1.5rem;border-radius:12px;border:1px solid #334155;text-align:center;}
                    </style></head>
                    <body>
                        <div class="badge">⚡ BAĞLANTI KOPTU</div>
                        <h1>47 NİZAM</h1>
                        <div class="info">
                            <p>İnternet bağlantısı yok.</p>
                            <p>Çevrimdışı yaptığınız işlemler kaydedildi.<br>
                            İnternet gelince otomatik olarak sisteme aktarılacak.</p>
                        </div>
                        <p style="font-size:0.75rem;color:#475569;">THE ORDER — Adil Düzen · Şeffaf Maliyet · Adaletli Dağıtım</p>
                    </body></html>
                `, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
            }
            return new Response('Çevrimdışı', { status: 503 });
        })
    );
});
