// /api/pin-dogrula — Kurumsal 3 Katmanlı PIN Gvenlik Sistemi
// Katman 1: Sunucu tarafı PIN doğrulama (client hibir zaman PIN gremez)
// Katman 2: Upstash Redis rate limiting (5 hatalı deneme → 15 dk ban)
// Katman 3: JWT session token (8 saat sre, imzalı, HttpOnly cookie)

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';


//  UPSTASH REDIS MÜDAHALESİ (RATE LIMIT) 
// [Mizanet FIX] Free tier 'evalsha' hatasından kaçınmak ve serverless bellek 
// kilitlenmesini önlemek için saf Redis 'INCR' ve 'EXPIRE' komutlarını kullanıyoruz.
import { Redis } from '@upstash/redis';

let _redisInstance = null;
function getRedisClient() {
    if (_redisInstance) return _redisInstance;
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN;
    if (!url || !token) return null; // Sessiz ve güvenli reddetme
    _redisInstance = new Redis({ url, token });
    return _redisInstance;
}

async function checkFailedAttempts(ip) {
    const redis = getRedisClient();
    if (!redis) return { isLocked: false };

    try {
        const key = `pin_hatali:${ip}`;
        const count = await redis.get(key);
        if (count && parseInt(count) >= 5) {
            const ttl = await redis.ttl(key);
            return { isLocked: true, timeLeft: ttl };
        }
        return { isLocked: false };
    } catch {
        return { isLocked: false };
    }
}

async function recordFailedAttempt(ip) {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        const key = `pin_hatali:${ip}`;
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, 900); // 15 dakika kilit süresi
        }
    } catch (e) {
        // Sessizce hatayı geç, asıl akışı bozma
    }
}

//  JWT YARDIMCILARI 
async function jwtOlustur(grup) {
    // JWT_SIRRI Vercel ENV'e girilmeli. Yoksa giriş sistemi devre dışıdır.
    const sirri = process.env.JWT_SIRRI || process.env.INTERNAL_API_KEY;
    if (!sirri) {
        console.error('[MİMARİ ALARM] JWT_SIRRI ENV değişkeni eksik! Giriş sistemi devre dışı.');
        throw new Error('Sistem yapılandırma hatası: JWT anahtarı tanımlı değil.');
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
    } catch (cryptoHata) {
        console.error('[JWT] Crypto hatası:', cryptoHata);
        throw new Error('JWT imzalama başarısız: Crypto API kullanılamıyor.');
    }
}

//  ANA HANDLER 
export async function POST(request) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'bilinmeyen';

        //  Rate Limit Kontrol (Kaba Kuvvet Engelleme)
        const limitDurum = await checkFailedAttempts(ip);
        if (limitDurum.isLocked) {
            return NextResponse.json(
                { hata: `ok fazla hatalı deneme. Yaklaşık ${Math.ceil(limitDurum.timeLeft / 60)} dakika bekleyin.`, kalanDeneme: 0 },
                { status: 429 }
            );
        }

        //  İstek Gvdesi 
        let pin, tip;
        try {
            const body = await request.json();
            pin = body?.pin?.trim();
            tip = body?.tip || 'uretim'; // 'uretim' | 'genel' | 'tam'
        } catch {
            return NextResponse.json({ hata: 'Geersiz istek formatı.' }, { status: 400 });
        }

        if (!pin || pin.length < 4) {
            return NextResponse.json({ hata: 'PIN en az 4 karakter olmalı.' }, { status: 400 });
        }

        //  PIN Doğrulama: tam > uretim > genel ncelik sırası 
        const temizle = (v) => v?.replace(/['"\\r\\n]/g, '').trim();

        const YETKI_SIRASI = [
            { pin: temizle(process.env.ADMIN_PIN), grup: 'tam' },        // Sistem sahibi — 474747
            { pin: temizle(process.env.COORDINATOR_PIN), grup: 'tam' },  // Koordinatr — 4747
            // TEST_COORDINATOR_PIN production'dan kaldırıldı (Mfettiş G2 FIX 19.03.2026)
            { pin: temizle(process.env.URETIM_PIN), grup: 'uretim' },
            { pin: temizle(process.env.GENEL_PIN), grup: 'genel' },
        ];

        const eslesen = YETKI_SIRASI.find(({ pin: p }) => p && p !== 'undefined' && p === pin);
        const grup = eslesen ? eslesen.grup : null;

        if (!grup) {
            // Hatalı deneme kaydet
            await recordFailedAttempt(ip);

            // Hatalı girişi logla — fire-and-forget
            (async () => {
                try {
                    await supabaseAdmin.from('b0_sistem_loglari').insert([{
                        olay: 'PIN_HATALI_GIRIS',
                        detay: `IP: ${ip} | İstek tipi: ${tip} | Saat: ${new Date().toISOString()}`,
                        seviye: 'uyari'
                    }]);
                } catch { }
            })();

            return NextResponse.json(
                { basarili: false, grup: null, mesaj: 'Yanlış PIN.' },
                { status: 401 }
            );
        }

        //  Başarılı Giriş — JWT Token Oluştur 
        const token = await jwtOlustur(grup);

        // Başarılı girişi logla — fire-and-forget
        (async () => {
            try {
                await supabaseAdmin.from('b0_sistem_loglari').insert([{
                    olay: 'PIN_BASARILI_GIRIS',
                    detay: `IP: ${ip} | Grup: ${grup} | Token sresi: 8 saat`,
                    seviye: 'bilgi'
                }]);
            } catch { }
        })();

        //  GVENLİK: HttpOnly Set-Cookie (XSS koruması) 
        const isProd = process.env.NODE_ENV === 'production';
        const cookieMaxAge = 8 * 3600; // 8 saat

        const response = NextResponse.json(
            { basarili: true, grup, tokenSuresi: cookieMaxAge },
            { status: 200 }
        );

        // 1. JWT Token cookie — HttpOnly + Secure + SameSite=Strict
        response.cookies.set('sb47_jwt_token', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'strict',
            path: '/',
            maxAge: cookieMaxAge,
        });

        // 2. Auth session cookie — Middleware sayfa koruması iin
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

    } catch (globalHata) {
        console.error('[PIN-DOGRULA KRİTİK HATA]', globalHata?.message, globalHata?.stack);
        return NextResponse.json(
            { hata: 'Sunucu hatası: ' + (globalHata?.message || 'bilinmeyen') },
            { status: 500 }
        );
    }
}
