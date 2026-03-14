// /api/2fa-dogrula/route.js
// TOTP kodu doğrulama — PIN doğrulandıktan sonra çağrılır
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { totpDogrula } from '@/lib/totp';

// In-memory brute-force koruması (2FA)
const FA2_KILIT = new Map();

export async function POST(request) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'bilinmeyen';

    // ── 2FA brute-force koruması: 3 yanlış → 5 dakika kilit
    const kilit = FA2_KILIT.get(ip);
    if (kilit && Date.now() < kilit.bitis) {
        const kalan = Math.ceil((kilit.bitis - Date.now()) / 1000);
        return NextResponse.json({ hata: `2FA kilitlendi. ${kalan} saniye bekleyin.` }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { kod, temp_token } = body;

        if (!kod || kod.length !== 6 || !/^\d{6}$/.test(kod)) {
            return NextResponse.json({ hata: '6 haneli numerik kod gerekli.' }, { status: 400 });
        }

        // temp_token doğrula (pin-dogrula'dan dönen geçici token)
        if (!temp_token) {
            return NextResponse.json({ hata: 'Geçersiz istek — önce PIN doğrulama gerekli.' }, { status: 400 });
        }

        // Secret'ı Supabase'den al
        const supabase = createClient(
            (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'),
            (process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key')
        );

        const { data: config } = await supabase
            .from('b0_sistem_loglari')
            .select('eski_veri')
            .eq('tablo_adi', '2fa_config')
            .eq('islem_tipi', 'TOTP_SECRET')
            .maybeSingle();

        if (!config?.eski_veri?.secret) {
            // 2FA kurulmamış — geç (ilk kurulum)
            return NextResponse.json({ basarili: true, kurulmamis: true, mesaj: '2FA henüz kurulmamış, geç.' });
        }

        const secret = config.eski_veri.secret;
        const gecerli = await totpDogrula(secret, kod);

        if (!gecerli) {
            // Hatalı deneme sayacı
            const mevcut = FA2_KILIT.get(ip) || { sayi: 0 };
            mevcut.sayi++;
            if (mevcut.sayi >= 3) {
                mevcut.bitis = Date.now() + 5 * 60 * 1000;
                mevcut.sayi = 0;
            }
            FA2_KILIT.set(ip, mevcut);

            // Log
            await supabase.from('b0_sistem_loglari').insert([{
                tablo_adi: '2fa_config',
                islem_tipi: '2FA_HATALI',
                kullanici_adi: ip,
                eski_veri: { saat: new Date().toISOString() }
            }]).catch(() => { });

            return NextResponse.json({ basarili: false, hata: 'Yanlış 2FA kodu.' }, { status: 401 });
        }

        // Başarılı — kilidi sıfırla
        FA2_KILIT.delete(ip);

        // Log
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: '2fa_config',
            islem_tipi: '2FA_BASARILI',
            kullanici_adi: ip,
            eski_veri: { saat: new Date().toISOString() }
        }]).catch(() => { });

        return NextResponse.json({ basarili: true, mesaj: '2FA doğrulandı.' });
    } catch (err) {
        return NextResponse.json({ hata: err.message }, { status: 500 });
    }
}
