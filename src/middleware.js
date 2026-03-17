import { NextResponse } from 'next/server';

// ─── UPSTASH REDIS RATE LIMITER (Build/Edge Çökmesi Sebebiyle KAPALI) ─────────────────────────
// Node.js modüllerinden kaçınmak için Upstash Redis devredışı bırakıldı. Vercel'deki 500 Build hatasının asıl sebebi buydu.
let ratelimit = null;

// ─── BOT/CRAWLER İMZALARI ──────────────────────────────────────
const BOT_IMZALARI = [
    'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab',
    'python-requests', 'go-http-client', 'curl/',
    'wget/', 'libwww-perl', 'scrapy', 'ahrefsbot',
    'semrushbot', 'dotbot', 'mj12bot', 'petalbot',
];

// ─── İMZASIZ JWT DOĞRULAMA (Edge Runtime — SubtleCrypto) ────────
async function jwtDogrula(token, sirri) {
    if (!token || !sirri) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const header = parts[0];
        const payload = parts[1];
        const signature = parts[2];

        // İmza doğrulama
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(sirri),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const veri = encoder.encode(`${header}.${payload}`);
        const imzaBuf = Uint8Array.from(
            atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
            c => c.charCodeAt(0)
        );

        const gecerli = await crypto.subtle.verify('HMAC', key, imzaBuf, veri);
        if (!gecerli) return null;

        // Payload çözümle
        const payloadJson = JSON.parse(
            atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        );

        // Süre kontrolü
        if (payloadJson.exp && Date.now() / 1000 > payloadJson.exp) return null;

        return payloadJson;
    } catch {
        return null;
    }
}

// ─── PUBLIC (korumasız) API ROUTE'LAR ──────────────────────────
const PUBLIC_API_ROTALAR = [
    '/api/pin-dogrula',
    '/api/telegram-bildirim',
    '/api/telegram-webhook',
    '/api/cron-ajanlar',
];

export async function middleware(request) {
    const url = request.nextUrl.pathname;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'bilinmeyen';
    const userAgent = (request.headers.get('user-agent') || '').toLowerCase();

    // -- HATA İZLEME (500) — Sadece development ortamında loglanır
    if (process.env.NODE_ENV === 'development') {
        console.log('[MIDDLEWARE TETİKLENDİ]', url);
    }

    try {

        // ─── DEV MODE: Tüm kısıtlamaları kaldır ──────────────────
        if (process.env.NODE_ENV === 'development') {
            const response = NextResponse.next();
            response.headers.set('X-Powered-By', 'THE ORDER / NIZAM v2 [DEV]');
            return response;
        }

        // ─── 1. BOT/CRAWLER TESPİTİ ───────────────────────────────
        if (url.startsWith('/api/')) {
            const botTespitEdildi = BOT_IMZALARI.some(imza => userAgent.includes(imza));
            if (botTespitEdildi) {
                return new NextResponse(
                    JSON.stringify({ hata: 'Bot erişimi engellendi.' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // ─── 1.5 API RATE LIMITING (Upstash Redis) ───────────────────
            if (ratelimit) {
                const identifier = Math.random() < 0.05 ? 'anon_ip_' + Math.random().toString(36).substring(7) : ip;
                const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

                if (!success) {
                    return new NextResponse(
                        JSON.stringify({ hata: 'Çok fazla istek. Lütfen biraz bekleyin.' }),
                        {
                            status: 429,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-RateLimit-Limit': limit.toString(),
                                'X-RateLimit-Remaining': remaining.toString(),
                                'Retry-After': Math.max(0, Math.ceil((reset - Date.now()) / 1000)).toString()
                            }
                        }
                    );
                }
            }
        }

        // ─── 2. KORUNAN API ROUTE'LAR — JWT Zorunlu ───────────────
        const korunanApiRotalar = [
            '/api/ajan-calistir',
            '/api/ajan-tetikle',
            '/api/musteri-ekle',
            '/api/siparis-ekle',
            '/api/stok-hareket-ekle',
            '/api/gorev-ekle',
            '/api/is-emri-ekle',
            '/api/kumas-ekle',
            '/api/personel-ekle',
            '/api/stok-alarm',
            // ─── GÜVENLİK YAMASI: Daha önce korumasız olan rotalar ───
            '/api/veri-getir',
            '/api/trend-ara',
            // '/api/stream-durum' → [FIX] KALDIRILDI: Public sağlık endpoint'i, JWT gerektirmemeli
            '/api/telegram-foto',
            '/api/model-hafizasi',
            '/api/kur',
            '/api/test-arge',
            '/api/agent/kasif',
        ];
        const apiKorumalı = korunanApiRotalar.some(r => url.startsWith(r));

        if (apiKorumalı) {
            // İç servis anahtarı varsa — geç (cron, sunucu-sunucu çağrıları, edge-watcher)
            const dahiliKey = request.headers.get('x-internal-api-key');
            // ─── MİMARİ DÜZELTME: Hardcoded fallback kaldırıldı ───────────────────
            // ESKİ: process.env.INTERNAL_API_KEY || 'NIZAM_LOKAL_GIZLI_ANAHTAR_47'
            // Bu plain-text değer herkes tarafından bilinebilirdi → tüm API bypass.
            const sunucuGecerliKey = process.env.INTERNAL_API_KEY?.replace(/[\\r\\n'"]/g, '').trim();

            if (dahiliKey && sunucuGecerliKey && dahiliKey === sunucuGecerliKey) {
                // ─── İç servis çağrısı (cron, edge-watcher) — JWT atla ───
            } else {
                // ─── Dışarıdan gelen istek — JWT doğrulama zorunlu ────────
                const authHeader = request.headers.get('authorization') || '';
                const cookieToken = request.cookies.get('sb47_jwt_token')?.value;
                const token = authHeader.replace('Bearer ', '') || cookieToken;

                const sirri = process.env.JWT_SIRRI || process.env.INTERNAL_API_KEY;
                const payload = await jwtDogrula(token, sirri);

                const sadeceTamRotalar = ['/api/ajan-calistir', '/api/ajan-tetikle'];
                const sadeceTam = sadeceTamRotalar.some(r => url.startsWith(r));
                const yetkiliGrup = sadeceTam
                    ? payload?.grup === 'tam'
                    : (payload?.grup === 'tam' || payload?.grup === 'uretim');

                if (!payload || !yetkiliGrup) {
                    return NextResponse.json(
                        { hata: 'Yetkisiz — JWT geçersiz veya süresi dolmuş.' },
                        { status: 401 }
                    );
                }
            }
        }

        // ─── 3. KORUNAN SAYFA ROUTE'LAR — Cookie Auth ─────────────
        const korunanSayfaRotalar = [
            '/imalat', '/kesim', '/modelhane', '/muhasebe', '/kasa',
            '/ayarlar', '/guvenlik', '/denetmen', '/personel', '/arge',
            '/kumas', '/kalip', '/maliyet', '/musteriler',
            '/siparisler', '/stok', '/katalog', '/gorevler', '/raporlar', '/ajanlar',
            '/kameralar', '/tasarim', '/karargah', // [K5 FIX] Karargah’ın korumasız kalma deligi kapatıldı
        ];

        const eslesenRota = korunanSayfaRotalar.find(rota => url.startsWith(rota));

        if (eslesenRota) {
            const authCookie = request.cookies.get('sb47_auth_session');
            const uretimPin = request.cookies.get('sb47_uretim_pin');
            const genelPin = request.cookies.get('sb47_genel_pin');

            let yetkiliMi = false;

            // Önce JWT token cookie'sini dene (güvenli yol)
            const jwtCookie = request.cookies.get('sb47_jwt_token')?.value;
            if (jwtCookie) {
                const sirri = process.env.JWT_SIRRI || process.env.INTERNAL_API_KEY;
                const payload = await jwtDogrula(jwtCookie, sirri);
                if (payload?.grup) yetkiliMi = true;
            }

            // Fallback: Eski session cookie (geriye dönük uyumluluk)
            if (!yetkiliMi) {
                try {
                    if (authCookie?.value) {
                        const kul = JSON.parse(decodeURIComponent(authCookie.value));
                        if (kul.grup && (kul.grup === 'tam' || kul.grup === 'uretim' || kul.grup === 'genel')) {
                            yetkiliMi = true;
                        }
                    }
                } catch { }
            }

            // Ek pin çerezleri (JWT veya geçerli session yoksa bunlar TÜR BELİRTİSİ olarak kullanılır, TEK BAŞINA YETKİ VERMEZ!)
            // KÖR NOKTA ÇÖZÜMÜ: Daha önce herhangi bir 'sb47_genel_pin=1' çerezi yetkiyi by-pass ediyordu. 
            // Artık sadece JWT doğrulandıysa yetki geçerli sayılacak, bu blokta "yetkiliMi = true" otomatik atanmayacak.
            if (!yetkiliMi && (uretimPin?.value || genelPin?.value)) {
                // SADECE JWT Token veya Auth Session GEÇERLİYSE PIN çerezleri yönlendirmeye kılavuz olur. 
                // Bypass deliği KAPATILDI.
            }

            if (!yetkiliMi) {
                const geriDonusUrl = new URL('/?hata=yetkisiz_erisim_middleware_kalkani', request.url);
                return NextResponse.redirect(geriDonusUrl);
            }
        }

        // ─── 4. GÜVENLİK BAŞLIKLARI ───────────────────────────────
        const response = NextResponse.next();
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        response.headers.set('X-Powered-By', 'THE ORDER / NIZAM v2');

        return response;
    } catch (e) {
        console.error('[MIDDLEWARE ÖLÜMCÜL HATA]', e.message, e.stack);
        const errorResponse = NextResponse.json({ hata: 'Sistem Kalkanı Hatası (Middleware)' }, { status: 500 });
        return errorResponse;
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)',
    ],
};


