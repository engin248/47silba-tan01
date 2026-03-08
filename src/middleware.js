import { NextResponse } from 'next/server';

// ─── BOT/CRAWLER İMZALARI ──────────────────────────────────────
const BOT_IMZALARI = [
    'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab',
    'python-requests', 'go-http-client', 'curl/',
    'wget/', 'libwww-perl', 'scrapy', 'ahrefsbot',
    'semrushbot', 'dotbot', 'mj12bot', 'petalbot',
];

// ─── BLOKLANMIŞ IP LİSTESİ (Gerektiğinde eklenebilir) ──────────
const ENGELLI_IP_LISTESI = [
    // '1.2.3.4',  // Örnek - gerektiğinde buraya ekle
];

export function middleware(request) {
    const url = request.nextUrl.pathname;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'bilinmeyen';
    const userAgent = (request.headers.get('user-agent') || '').toLowerCase();

    // ─── 1. ENGELLİ IP KONTROLÜ ───────────────────────────────
    if (ENGELLI_IP_LISTESI.includes(ip)) {
        return new NextResponse('Erişim Engellendi', { status: 403 });
    }

    // ─── 2. BOT/CRAWLER TESPİTİ ───────────────────────────────
    // API route'larına zararlı bot erişimi engelle
    if (url.startsWith('/api/')) {
        const botTespitEdildi = BOT_IMZALARI.some(imza => userAgent.includes(imza));
        if (botTespitEdildi) {
            console.warn(`[MIDDLEWARE] Bot engellendi: ${userAgent.slice(0, 80)} | IP: ${ip}`);
            return new NextResponse(
                JSON.stringify({ hata: 'Bot erişimi engellendi.' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // ─── 3. KORUNAN SAYFA AUTH KONTROLÜ ───────────────────────
    const korunanRotalar = [
        '/imalat', '/kesim', '/modelhane', '/muhasebe', '/kasa',
        '/ayarlar', '/guvenlik', '/denetmen', '/personel', '/arge',
        '/kumas', '/kalip', '/maliyet', '/uretim', '/musteriler',
        '/siparisler', '/stok', '/katalog', '/gorevler', '/raporlar', '/ajanlar'
    ];

    const eslesenRota = korunanRotalar.find(rota => url.startsWith(rota));

    if (eslesenRota) {
        const authCookie = request.cookies.get('sb47_auth_session');
        const uretimPin = request.cookies.get('sb47_uretim_pin');
        const genelPin = request.cookies.get('sb47_genel_pin');

        let patronMu = false;
        try {
            if (authCookie?.value) {
                const kul = JSON.parse(decodeURIComponent(authCookie.value));
                if (kul.grup === 'tam') patronMu = true;
            }
        } catch (e) { }

        if (!patronMu && !uretimPin && !genelPin) {
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

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)',
    ],
};
