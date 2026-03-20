export const dynamic = 'force-dynamic'
// /api/pin-dogrula â€” Kurumsal 3 KatmanlÄ± PIN GÃ¼venlik Sistemi
// Katman 1: Sunucu tarafÄ± PIN doÄŸrulama (client hiÃ§bir zaman PIN gÃ¶remez)
// Katman 2: Upstash Redis rate limiting (5 hatalÄ± deneme â†’ 15 dk ban)
// Katman 3: JWT session token (8 saat sÃ¼re, imzalÄ±, HttpOnly cookie)

import { NextResponse } from 'next/server';

// â”€â”€ UPSTASH RATE LIMIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Upstash env varlarÄ± yoksa in-memory fallback (geliÅŸtirme ortamÄ±)
let ratelimit = null;
try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { Ratelimit } = await import('@upstash/ratelimit');
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        ratelimit = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(5, '15m'), // 15 dakikada 5 deneme
            analytics: false,
            prefix: 'pin_giris',
        });
    } else {
        console.warn('[PIN][GÃœVENLÄ°K] UPSTASH_REDIS_REST_URL veya TOKEN eksik. In-memory rate limit aktif â€” serverless ortamda bruteforce korumasÄ± zayÄ±f!');
    }
} catch (upstashHata) { console.warn('[PIN] Upstash import edilemedi, in-memory fallback aktif:', upstashHata.message); }

// In-memory fallback (Upstash olmadÄ±ÄŸÄ±nda)
const BELLEK_KILIT = new Map();
const MAX_DENEME = 5;
const KILIT_SURESI_MS = 15 * 60 * 1000; // 15 dakika

function belleKileKontrol(ip) {
    const simdi = Date.now();
    const kayit = BELLEK_KILIT.get(ip);
    if (!kayit) return { izinli: true };
    if (kayit.kilitBitis && simdi < kayit.kilitBitis) {
        const kalanSaniye = Math.ceil((kayit.kilitBitis - simdi) / 1000);
        return { izinli: false, kalanSaniye };
    }
    if (kayit.kilitBitis && simdi >= kayit.kilitBitis) BELLEK_KILIT.delete(ip);
    return { izinli: true };
}

function bellekHataliDeneme(ip) {
    const simdi = Date.now();
    const kayit = BELLEK_KILIT.get(ip) || { sayi: 0 };
    kayit.sayi += 1;
    if (kayit.sayi >= MAX_DENEME) {
        kayit.kilitBitis = simdi + KILIT_SURESI_MS;
        kayit.sayi = 0;
    }
    BELLEK_KILIT.set(ip, kayit);
    return MAX_DENEME - kayit.sayi;
}

// â”€â”€ JWT YARDIMCILARI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function jwtOlustur(grup) {
    // JWT_SIRRI Vercel ENV'e girilmeli. Yoksa giriÅŸ sistemi devre dÄ±ÅŸÄ±dÄ±r.
    const sirri = process.env.JWT_SIRRI || process.env.INTERNAL_API_KEY;
    if (!sirri) {
        console.error('[MÄ°MARÄ° ALARM] JWT_SIRRI ENV deÄŸiÅŸkeni eksik! GiriÅŸ sistemi devre dÄ±ÅŸÄ±.');
        throw new Error('Sistem yapÄ±landÄ±rma hatasÄ±: JWT anahtarÄ± tanÄ±mlÄ± deÄŸil.');
    }
    const baslik = { alg: 'HS256', typ: 'JWT' };
    const icerik = {
        sub: grup,
        grup,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 8 * 3600, // 8 saat
        iss: 'nizam-sb47',
    };
    const enc = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const veri = `${enc(baslik)}.${enc(icerik)}`;

    // Web Crypto API ile HMAC-SHA256 imzalama
    try {
        const anahtar = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(sirri),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const imzaBuffer = await crypto.subtle.sign('HMAC', anahtar, new TextEncoder().encode(veri));
        const imza = btoa(String.fromCharCode(...new Uint8Array(imzaBuffer)))
            .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        return `${veri}.${imza}`;
    } catch {
        throw new Error('JWT imzalama baÅŸarÄ±sÄ±z: Crypto API kullanÄ±lamÄ±yor.');
    }
}

// â”€â”€ ANA HANDLER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(request) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'bilinmeyen';

    // â”€â”€ Rate Limit KontrolÃ¼ â”€â”€
    if (ratelimit) {
        const { success } = await ratelimit.limit(`ip:${ip}`);
        if (!success) {
            return NextResponse.json(
                { hata: 'Ã‡ok fazla hatalÄ± deneme. 15 dakika bekleyin.', kalanDeneme: 0 },
                { status: 429 }
            );
        }
    } else {
        // In-memory fallback
        const durum = belleKileKontrol(ip);
        if (!durum.izinli) {
            return NextResponse.json(
                { hata: `Ã‡ok fazla hatalÄ± deneme. ${Math.ceil((durum.kalanSaniye ?? 60) / 60)} dakika bekleyin.`, kalanDeneme: 0 },
                { status: 429 }
            );
        }
    }

    // â”€â”€ Ä°stek GÃ¶vdesi â”€â”€
    let pin, tip;
    try {
        const body = await request.json();
        pin = body?.pin?.trim();
        tip = body?.tip || 'uretim'; // 'uretim' | 'genel' | 'tam'
    } catch {
        return NextResponse.json({ hata: 'GeÃ§ersiz istek formatÄ±.' }, { status: 400 });
    }

    if (!pin || pin.length < 4) {
        return NextResponse.json({ hata: 'PIN en az 4 karakter olmalÄ±.' }, { status: 400 });
    }

    // â”€â”€ PIN DoÄŸrulama: tam > uretim > genel Ã¶ncelik sÄ±rasÄ± â”€â”€
    const temizle = (v) => v?.replace(/['"\r\n]/g, '').trim();

    const YETKI_SIRASI = [
        { pin: temizle(process.env.COORDINATOR_PIN), grup: 'tam' },
        // TEST_COORDINATOR_PIN production'dan kaldÄ±rÄ±ldÄ± (MÃ¼fettiÅŸ G2 FIX 19.03.2026)
        { pin: temizle(process.env.URETIM_PIN), grup: 'uretim' },
        { pin: temizle(process.env.GENEL_PIN), grup: 'genel' },
    ];

    const eslesen = YETKI_SIRASI.find(({ pin: p }) => p && p !== 'undefined' && p === pin);
    const grup = eslesen ? eslesen.grup : null;

    if (!grup) {
        // HatalÄ± deneme kaydet
        if (!ratelimit) bellekHataliDeneme(ip);

        // Sisteme log yaz â€” fire-and-forget
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const sb = createClient(
                (process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
                (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
            );
            if (process.env.NEXT_PUBLIC_SUPABASE_URL && sb) {
                void (async () => {
                    try {
                        await sb.from('b0_sistem_loglari').insert([{
                            olay: 'PIN_HATALI_GIRIS',
                            detay: `IP: ${ip} | Ä°stek tipi: ${tip} | Saat: ${new Date().toISOString()}`,
                            seviye: 'uyari',
                        }]);
                    } catch { }
                })();
            }
        } catch { /* Log baÅŸarÄ±sÄ±z olsa bile sistemi engelleme */ }

        return NextResponse.json(
            { basarili: false, grup: null, mesaj: 'YanlÄ±ÅŸ PIN.' },
            { status: 401 }
        );
    }

    // â”€â”€ BaÅŸarÄ±lÄ± GiriÅŸ â€” JWT Token OluÅŸtur â”€â”€
    const token = await jwtOlustur(grup);

    // BaÅŸarÄ±lÄ± giriÅŸi logla â€” fire-and-forget
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(
            (process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
            (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
        );
        void (async () => {
            try {
                await sb.from('b0_sistem_loglari').insert([{
                    olay: 'PIN_BASARILI_GIRIS',
                    detay: `IP: ${ip} | Grup: ${grup} | Token sÃ¼resi: 8 saat`,
                    seviye: 'bilgi',
                }]);
            } catch { }
        })();
    } catch { /* Log baÅŸarÄ±sÄ±z olsa bile sistemi engelleme */ }

    // â”€â”€â”€ GÃœVENLÄ°K: HttpOnly Set-Cookie (XSS korumasÄ±) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Token JSON body'de deÄŸil, HttpOnly cookie olarak dÃ¶ner.
    // JavaScript bu cookie'ye eriÅŸemez â†’ XSS ile token Ã§alÄ±namaz.
    const isProd = process.env.NODE_ENV === 'production';
    const cookieMaxAge = 8 * 3600; // 8 saat

    const response = NextResponse.json(
        { basarili: true, grup, tokenSuresi: cookieMaxAge },
        { status: 200 }
    );

    // 1. JWT Token cookie â€” HttpOnly + Secure + SameSite=Strict
    response.cookies.set('sb47_jwt_token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge: cookieMaxAge,
    });

    // 2. Auth session cookie â€” Middleware sayfa korumasÄ± iÃ§in
    const sessionData = JSON.stringify({ grup, zaman: Date.now() });
    response.cookies.set('sb47_auth_session', sessionData, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge: cookieMaxAge,
    });

    // 3. Grup bazlÄ± yardÄ±mcÄ± cookie'ler (middleware fallback)
    if (grup === 'uretim') {
        response.cookies.set('sb47_uretim_pin', '1', {
            httpOnly: true, secure: isProd, sameSite: 'strict', path: '/', maxAge: cookieMaxAge,
        });
    } else if (grup === 'genel') {
        response.cookies.set('sb47_genel_pin', '1', {
            httpOnly: true, secure: isProd, sameSite: 'strict', path: '/', maxAge: cookieMaxAge,
        });
    }

    return response;
}
