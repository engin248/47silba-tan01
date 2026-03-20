// /api/pin-dogrula — Kurumsal 3 Katmanlı PIN Güvenlik Sistemi
// Katman 1: Sunucu tarafı PIN doğrulama (client hiçbir zaman PIN göremez)
// Katman 2: Upstash Redis rate limiting (5 hatalı deneme → 15 dk ban)
// Katman 3: JWT session token (8 saat süre, imzalı)

import { NextResponse } from 'next/server';

// ── UPSTASH RATE LIMIT ─────────────────────────────────────────────
// Upstash env varları yoksa in-memory fallback (geliştirme ortamı)
let ratelimit = null;
<<<<<<< HEAD
// Upstash paketleri yüklü olmadığı için geçici olarak devre dışı bırakıldı (Build Hatasını Önlemek İçin)
/*
=======
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
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
    }
<<<<<<< HEAD
} catch { } // Upstash yoksa devam 
*/
=======
} catch (upstashHata) { console.warn('[PIN] Upstash import edilemedi, in-memory fallback aktif:', upstashHata.message); }
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

// In-memory fallback (Upstash olmadığında)
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

// ── JWT YARDIMCILARI ────────────────────────────────────────────────
async function jwtOlustur(grup) {
    // ─── MİMARİ DÜZELTME: Hardcoded fallback kaldırıldı ────────────
    // ESKİ: || 'sb47-gizli-anahtar-degistir'
    // Bu plain-text fallback: oluşturulan token farklı sırla imzalanıyor,
    // middleware farklı (boş) sırla doğrulama yapıyor → TOKEN HİÇBİR ZAMAN GEÇEMEZ.
    // DOĞRU: JWT_SIRRI ve INTERNAL_API_KEY Vercel ENV'e girilmeli.
    const sirri = process.env.JWT_SIRRI || process.env.INTERNAL_API_KEY;
    if (!sirri) {
        console.error('[MİMARİ ALARM] JWT_SIRRI ENV değişkeni eksik! Giriş sistemi devre dışı.');
        throw new Error('Sistem yapılandırma hatası: JWT anahtarı tanımlı değil.');
    }
    const baslik = { alg: 'HS256', typ: 'JWT' };
    const icerik = {
        grup,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (8 * 3600), // 8 saat
        iss: 'sb47-karargah',
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
<<<<<<< HEAD
        throw new Error('JWT imzalama başarısız: Crypto API kullanılamıyor.');
=======
        // Crypto API yoksa basit token dön
        return btoa(`${grup}:${Date.now() + 8 * 3600 * 1000}`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    }
}

// ── ANA HANDLER ────────────────────────────────────────────────────
export async function POST(request) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'bilinmeyen';

    // ── Rate Limit Kontrolü ──
    if (ratelimit) {
        const { success, remaining } = await ratelimit.limit(`ip:${ip}`);
        if (!success) {
            return NextResponse.json(
                { hata: 'Çok fazla hatalı deneme. 15 dakika bekleyin.', kalanDeneme: 0 },
                { status: 429 }
            );
        }
    } else {
        // In-memory fallback
        const durum = belleKileKontrol(ip);
        if (!durum.izinli) {
            return NextResponse.json(
<<<<<<< HEAD
                { hata: `Çok fazla hatalı deneme. ${Math.ceil(durum.kalanSaniye / 60)} dakika bekleyin.`, kalanDeneme: 0 },
=======
                { hata: `Çok fazla hatalı deneme. ${Math.ceil((durum.kalanSaniye ?? 60) / 60)} dakika bekleyin.`, kalanDeneme: 0 },
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                { status: 429 }
            );
        }
    }

    // ── İstek Gövdesi ──
    let pin, tip;
    try {
        const body = await request.json();
        pin = body?.pin?.trim();
        tip = body?.tip || 'uretim'; // 'uretim' | 'genel' | 'tam'
    } catch {
        return NextResponse.json({ hata: 'Geçersiz istek formatı.' }, { status: 400 });
    }

    if (!pin || pin.length < 4) {
        return NextResponse.json({ hata: 'PIN en az 4 karakter olmalı.' }, { status: 400 });
    }

    // ── PIN Doğrulama: tam > uretim > genel öncelik sırası ──
    // Newline (\r\n), tırnak ve boşlukları temizle (Vercel CLI bazen ekliyor)
    const temizle = (v) => v?.replace(/['"\r\n]/g, '').trim();

    // En yüksek yetki önce — aynı PIN birden fazla gruba denk gelirse tam > uretim > genel
    const YETKI_SIRASI = [
        { pin: temizle(process.env.COORDINATOR_PIN), grup: 'tam' },
<<<<<<< HEAD
        // G2 FIX (Müfettiş 19.03.2026): TEST_COORDINATOR_PIN production'dan kaldırıldı.
        // Test pini production'da aktif olursa güvenlik açığı oluşturur.
=======
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        { pin: temizle(process.env.URETIM_PIN), grup: 'uretim' },
        { pin: temizle(process.env.GENEL_PIN), grup: 'genel' },
    ];

    const eslesen = YETKI_SIRASI.find(({ pin: p }) => p && p !== 'undefined' && p === pin);
    const grup = eslesen ? eslesen.grup : null;

    if (!grup) {
        // Hatalı deneme kaydet
        if (!ratelimit) bellekHataliDeneme(ip);

        // Sisteme log yaz (Supabase bağlantısı varsa)
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const sb = createClient(
<<<<<<< HEAD
                (process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
                (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
            );
            if (process.env.NEXT_PUBLIC_SUPABASE_URL && sb) {
                // Fire-and-forget — await kaldırıldı, bekleme yok
                void (async () => {
                    try {
                        await sb.from('b0_sistem_loglari').insert([{
                            olay: 'PIN_HATALI_GIRIS',
                            detay: `IP: ${ip} | İstek tipi: ${tip} | Saat: ${new Date().toISOString()}`,
                            seviye: 'uyari',
                        }]);
                    } catch { }
                })();
            }
=======
                (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'),
                (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key')
            );
            await sb.from('b0_sistem_loglari').insert([{
                olay: 'PIN_HATALI_GIRIS',
                detay: `IP: ${ip} | İstek tipi: ${tip} | Saat: ${new Date().toISOString()}`,
                seviye: 'uyari',
            }]);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        } catch { /* Log başarısız olsa bile sistemi engelleme */ }

        return NextResponse.json(
            { basarili: false, grup: null, mesaj: 'Yanlış PIN.' },
            { status: 401 }
        );
    }

    // ── Başarılı Giriş — JWT Token Oluştur ──
    const token = await jwtOlustur(grup);

    // Başarılı girişi logla
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(
            (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'),
<<<<<<< HEAD
            (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
        );
        // Fire-and-forget — await kaldırıldı
        void (async () => {
            try {
                await sb.from('b0_sistem_loglari').insert([{
                    olay: 'PIN_BASARILI_GIRIS',
                    detay: `IP: ${ip} | Grup: ${grup} | Token süresi: 8 saat`,
                    seviye: 'bilgi',
                }]);
            } catch { }
        })();
    } catch { /* Log başarısız olsa bile sistemi engelleme */ }

    // ─── GÜVENLİK YAMASI: Server-side Set-Cookie (HttpOnly + Secure + SameSite) ───
    // ESKİ: Token JSON body'de döndürülüp client-side document.cookie ile atanıyordu
    //        → HttpOnly yoktu → XSS saldırısında JavaScript ile çalınabilirdi
    // YENİ: Set-Cookie header ile atanıyor → tarayıcı JS'i cookie'ye ERİŞEMEZ
    const isProd = process.env.NODE_ENV === 'production';
    const cookieMaxAge = 8 * 3600; // 8 saat (saniye)

    const response = NextResponse.json(
        { basarili: true, grup, tokenSuresi: cookieMaxAge },
        { status: 200 }
    );

    // 1. JWT Token cookie — HttpOnly (JS erişemez), Secure (sadece HTTPS), SameSite=Strict (CSRF kalkanı)
    response.cookies.set('sb47_jwt_token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge: cookieMaxAge,
    });

    // 2. Auth session cookie — Middleware sayfa koruması için (readable by middleware)
    const sessionData = JSON.stringify({ grup, zaman: Date.now() });
    response.cookies.set('sb47_auth_session', sessionData, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge: cookieMaxAge,
    });

    // 3. Grup bazlı yardımcı cookie'ler (middleware fallback)
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
=======
            (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key')
        );
        await sb.from('b0_sistem_loglari').insert([{
            olay: 'PIN_BASARILI_GIRIS',
            detay: `IP: ${ip} | Grup: ${grup} | Token süresi: 8 saat`,
            seviye: 'bilgi',
        }]);
    } catch { /* Log başarısız olsa bile sistemi engelleme */ }

    return NextResponse.json(
        { basarili: true, grup, token, tokenSuresi: 8 * 3600 },
        { status: 200 }
    );
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
}
