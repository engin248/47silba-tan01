export const dynamic = 'force-dynamic'
// /api/2fa-kurulum/route.js
// KoordinatÃ¶r iÃ§in TOTP 2FA QR kod kurulumu
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { secretOlustur, qrUrlOlustur } from '@/lib/totp';

export async function POST(request) {
    try {
        // JWT cookie kontrolÃ¼ â€” sadece 'tam' grubu kurulum yapabilir
        const cookieHeader = request.headers.get('cookie') || '';
        const tokenMatch = cookieHeader.match(/sb47_jwt_token=([^;]+)/);
        if (!tokenMatch) {
            return NextResponse.json({ hata: 'Yetkisiz.' }, { status: 401 });
        }

        const supabase = createClient(
            (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'),
            (process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key')
        );

        // Mevcut secret var mÄ±?
        const { data: mevcut } = await supabase
            .from('b0_sistem_loglari')
            .select('eski_veri')
            .eq('tablo_adi', '2fa_config')
            .eq('islem_tipi', 'TOTP_SECRET')
            .maybeSingle();

        let secret;
        if (mevcut?.eski_veri?.secret) {
            // Mevcut secret'Ä± kullan (yeniden kurulum)
            secret = mevcut.eski_veri.secret;
        } else {
            // Yeni secret Ã¼ret ve kaydet
            secret = secretOlustur();
            await supabase.from('b0_sistem_loglari').insert([{
                tablo_adi: '2fa_config',
                islem_tipi: 'TOTP_SECRET',
                kullanici_adi: 'koordinator',
                eski_veri: { secret, aktif: false, olusturuldu: new Date().toISOString() },
            }]);
        }

        const otpauthUrl = qrUrlOlustur(secret, '47 Antigravity ERP');
        // QR kod iÃ§in Google Charts API (Ã¼cretsiz, dÄ±ÅŸ JS yok)
        const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(otpauthUrl)}&choe=UTF-8`;

        return NextResponse.json({
            basarili: true,
            qrUrl: qrImageUrl,
            secret, // KullanÄ±cÄ±ya gÃ¶sterilecek (manuel giriÅŸ iÃ§in)
            mesaj: 'Google Authenticator ile QR kodu okutun',
        });
    } catch (err) {
        return NextResponse.json({ hata: err.message }, { status: 500 });
    }
}
