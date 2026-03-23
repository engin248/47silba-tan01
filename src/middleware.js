import { NextResponse } from 'next/server';

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
    // [GÜVENLİK A4]: /api/cron-ajanlar PUBLIC listesinden çıkarıldı
    // Artık x-internal-api-key header'ı zorunlu (aşağıdaki korunanApiRotalar'a eklendi)
];

// ─── HONEYPOT / WORDPRESS BOT ENGELİ ────────────────────────────
const HONEYPOT_YOLLARI = [
    '/wp-admin', '/wp-login', '/wp-content', '/wp-includes',
    '/wordpress', '/backup', '/old', '/new', '/blog',
    '/.env', '/.git', '/config.php', '/setup-config.php',
];

export async function middleware(request) {
    const url = request.nextUrl.pathname;

    // ─── [0] HONEYPOT: WordPress/bot tarama yollarını anında engelle ──
    const honeypotEslesti = HONEYPOT_YOLLARI.some(hp => url.startsWith(hp));
    if (honeypotEslesti) {
        return new NextResponse(null, { status: 403 });
    }

    // ─── [S1] JWT_SIRRI ENV ALARM GUARD ─────────────────────────
    // SPF: Bu iki değişken yoksa auth sistemi tamamen çöker → 503 ver
    const sirriKontrol = process.env.JWT_SIRRI || process.env.INTERNAL_API_KEY;
    if (!sirriKontrol) {
        console.error('[NIZAM KRİTİK] JWT_SIRRI ve INTERNAL_API_KEY ENV eksik — sistem kilitlendi!');
        return new NextResponse(
            JSON.stringify({ hata: 'Sistem yapılandırma hatası. Yöneticiye başvurun.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'bilinmeyen';
    const userAgent = (request.headers.get('user-agent') || '').toLowerCase();

    // ─── 0. SALDIRI YOL ENGELİ (WordPress/CMS Tarama Botu) ────
    const ENGELLENEN_YOLLAR = [
        '/wp-admin', '/wp-login', '/wp-content', '/wp-includes',
        '/wordpress', '/wp-json', '/xmlrpc.php', '/wp-cron.php',
        '/phpmyadmin', '/pma', '/admin/config', '/setup-config.php',
        '/.env', '/.git', '/.htaccess', '/config.php',
        '/backup', '/old', '/new', '/blog', '/tmp',
    ];
    const saldiriYolu = ENGELLENEN_YOLLAR.some(yol =>
        url === yol || url.startsWith(yol + '/') || url.startsWith(yol + '.')
    );
    if (saldiriYolu) {
        console.warn(`[GÜVENLİK] Engellenen yol: ${url} | IP: ${ip}`);
        return new NextResponse(null, { status: 403 });
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
        '/api/cron-ajanlar', // [A4]: Cron artık x-internal-api-key zorunlu
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
        '/kumas', '/kalip', '/maliyet', '/uretim', '/musteriler',
        '/siparisler', '/stok', '/katalog', '/gorevler', '/raporlar', '/ajanlar',
        '/haberlesme', '/tasarim', '/kameralar', // ← EKLENDİ: daha önce korumasızdı
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

        // ─── GÜVENLİK: Legacy JSON cookie fallback KALDIRILDI ─────────────────
        // Eski sb47_auth_session cookie'si (imzasız JSON) yetki veremez.
        // Tek geçerli yetkilendirme: HMAC-SHA256 imzalı JWT token (sb47_jwt_token).
        // Eski session cookie'si olan kullanıcılar giris sayfasına yönlendirilir.

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
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)',
    ],
};


