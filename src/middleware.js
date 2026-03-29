import { NextResponse } from 'next/server';

// ─── BOT/CRAWLER İMZALARI ──────────────────────────────────────
const BOT_IMZALARI = [
    'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab',
    'python-requests', 'go-http-client', 'curl/',
    'wget/', 'libwww-perl', 'scrapy', 'ahrefsbot',
    'semrushbot', 'dotbot', 'mj12bot', 'petalbot',
    'headlesschrome', 'puppeteer', 'playwright', 'selenium',
    'phantomjs', 'electron', 'cypress', 'nightmare'
];

// ─── IP KISITLAMA (GU-04) ────────────────────────────────────────
// Güvenli IP listesi ENV içinden okunur. Eğer boşsa (veya tanımlı değilse) kontrol edilmez.
const IP_KONTROL_AKTIF = process.env.IP_WHITELIST_ENABLED === 'true';
const GUVENLI_IPLER = (process.env.IP_WHITELIST || '').split(',').map(ip => ip.trim()).filter(Boolean);

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
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'BILINMEYEN_KAYNAK';
        return new NextResponse(
            `[NIZAM SIBER KALKANI AKTIF]
--------------------------------------------------
UYARI: GOLGE ARAMA MOTORLARI TESPIT EDILDI
HEDEF YOL: ${url}
KAYNAK IP: ${ip}

ACIKLAMA: 
Sistemimizde bir zafiyet arayisinda bulundugunuz tespit edilmistir. 
Bu sistem THE ORDER / NIZAM AI tarafindan korunmaktadir.
IP adresiniz karalisteye (blackhole) alinmak uzere işaretlendi.
--------------------------------------------------
ACCESS DENIED.`,
            {
                status: 403,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Kalkan-Durum': 'AKTIF-BLOK'
                }
            }
        );
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

    // ─── [GU-04] IP KISITLAMA KONTROLÜ (BEYAZ LİSTE) ────────────
    if (IP_KONTROL_AKTIF && GUVENLI_IPLER.length > 0) {
        if (!GUVENLI_IPLER.includes(ip) && ip !== '::1' && ip !== '127.0.0.1' && ip !== 'bilinmeyen') {
            console.warn(`[GÜVENLİK GU-04] Yetkisiz IP erişimi engellendi: ${ip}`);
            // IP kısıtlamasına takılanlara 403 sayfasi (veya JSON) dön
            return new NextResponse(
                JSON.stringify({ hata: 'IP Adresiniz sistem erişimi için yetkilendirilmemiş. (GU-04 BEYAZ LİSTE)' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

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
        return new NextResponse(
            `[NIZAM SIBER KALKANI AKTIF]
--------------------------------------------------
UYARI: GOLGE ARAMA MOTORLARI TESPIT EDILDI
HEDEF YOL: ${url}
KAYNAK IP: ${ip}

ACIKLAMA: 
Sistemimizde bir zafiyet arayisinda bulundugunuz tespit edilmistir. 
Bu sistem THE ORDER / NIZAM AI tarafindan korunmaktadir.
IP adresiniz karalisteye (blackhole) alinmak uzere işaretlendi.
--------------------------------------------------
ACCESS DENIED.`,
            { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
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

    // ─── 2. DEFAULT DENY — Tüm /api/ rotaları korumalı ───────────
    // OWASP / Zero Trust standardı: İzin verilmeyenler yasaktır.
    // Public listede olmayan her /api/ rotası JWT veya x-internal-api-key zorunludur.
    const PUBLIC_API_ROTALAR = [
        '/api/pin-dogrula',       // Giriş endpoint'i — JWT yok henüz
        '/api/health',            // Uptime monitor — kamuya açık
        '/api/telegram-webhook',  // Telegram imzası route içinde doğrulanır
        '/api/kur',               // Kamuya açık döviz verisi
        '/api/stream-durum',      // Kamera durum paneli
        '/api/telegram-bildirim', // İç Telegram bildirimi
    ];

    const apiKorumalı = url.startsWith('/api/') && !PUBLIC_API_ROTALAR.some(r => url.startsWith(r));

    if (apiKorumalı) {
        // İç servis anahtarı varsa — geç (cron, sunucu-sunucu çağrıları)
        const dahiliKey = request.headers.get('x-internal-api-key');
        const sunucuGecerliKey = process.env.INTERNAL_API_KEY?.replace(/[\\r\\n'"]/g, '').trim();

        if (dahiliKey && sunucuGecerliKey && dahiliKey === sunucuGecerliKey) {
            // İç servis çağrısı — JWT atla
        } else {
            // Dışarıdan gelen istek — JWT doğrulama zorunlu
            const authHeader = request.headers.get('authorization') || '';
            const cookieToken = request.cookies.get('sb47_jwt_token')?.value;
            const token = authHeader.replace('Bearer ', '') || cookieToken;

            const sirri = process.env.JWT_SIRRI || process.env.INTERNAL_API_KEY;
            const payload = await jwtDogrula(token, sirri);

            // Rol bazlı kısıtlama: Sadece "tam" yetkisi gereken rotalar
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
        '/haberlesme', '/tasarim',
        // [K-08 FIX] Eksik rotalar eklendi
        '/karargah', '/m1-istihbarat', '/m2-finans', '/m3-tasarim', '/m4-lojistik',
        // [#21 FIX] Yarım modüller kapatıldı
        '/odalar', '/sistem-raporu', '/uretim-kiosk',
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


