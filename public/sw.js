// NIZAM — Service Worker (Offline Fallback / K-16)
// Strateji: Stale-While-Revalidate (SWR)
//   • Sayfa açılışında cache'den hızlı servis et
//   • Arka planda yeni versiyonu indir (güncelle)
//   • Ağ yoksa cache kopyasını göster, o da yoksa offline.html
// ═══════════════════════════════════════════════════════════

const CACHE_ADI = 'nizamv1-cache-v1';

// Önbelleklenecek kritik statik kaynaklar
const ONBELLEKLENENLER = [
    '/',
    '/karargah',
    '/offline.html',
];

// ── INSTALL: Kritik kaynakları cache'le ─────────────────────
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_ADI).then((cache) => {
            return cache.addAll(ONBELLEKLENENLER).catch(() => {
                // Başarısız olursa sessiz geç (offline.html yoksa hata vermez)
            });
        })
    );
});

// ── ACTIVATE: Eski cache versiyonlarını temizle ─────────────
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) =>
            Promise.all(
                keyList
                    .filter((key) => key !== CACHE_ADI)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// ── FETCH: Stale-While-Revalidate ───────────────────────────
self.addEventListener('fetch', (e) => {
    // Sadece GET isteklerini ele al; API, POST vs. dahil etme
    const { request } = e;
    if (request.method !== 'GET') return;

    // Supabase, Vercel internal ve API rotaları bypass
    const url = new URL(request.url);
    const isApiOrExternal =
        url.pathname.startsWith('/api/') ||
        url.hostname.includes('supabase') ||
        url.hostname.includes('vercel') ||
        url.protocol === 'chrome-extension:';

    if (isApiOrExternal) return;

    e.respondWith(
        caches.open(CACHE_ADI).then(async (cache) => {
            const cached = await cache.match(request);

            const networkFetch = fetch(request)
                .then((networkRes) => {
                    if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
                        cache.put(request, networkRes.clone());
                    }
                    return networkRes;
                })
                .catch(() => {
                    // Ağ yok — cache veya offline fallback
                    if (cached) return cached;
                    // HTML sayfaları için offline.html göster
                    if (request.headers.get('Accept')?.includes('text/html')) {
                        return caches.match('/offline.html');
                    }
                    return new Response('Offline', { status: 503 });
                });

            // Cache varsa hemen servis et, arka planda güncelle (SWR)
            return cached || networkFetch;
        })
    );
});
