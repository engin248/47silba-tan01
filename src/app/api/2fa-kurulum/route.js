// /api/2fa-kurulum/route.js
// Koordinatr iin TOTP 2FA QR kod kurulumu
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { secretOlustur, qrUrlOlustur } from '@/lib/totp';

export async function POST(request) {
    try {
        // JWT cookie kontrol — sadece 'tam' grubu kurulum yapabilir
        const cookieHeader = request.headers.get('cookie') || '';
        const tokenMatch = cookieHeader.match(/sb47_jwt_token=([^;]+)/);
        if (!tokenMatch) {
            return NextResponse.json({ hata: 'Yetkisiz.' }, { status: 401 });
        }

        const { data: mevcut } = await supabaseAdmin
            .from('b0_sistem_loglari')
            .select('eski_veri')
            .eq('tablo_adi', '2fa_config')
            .eq('islem_tipi', 'TOTP_SECRET')
            .maybeSingle();

        let secret;
        if (mevcut?.eski_veri?.secret) {
            // Mevcut secret'ı kullan (yeniden kurulum)
            secret = mevcut.eski_veri.secret;
        } else {
            // Yeni secret ret ve kaydet
            secret = secretOlustur();
            await supabaseAdmin.from('b0_sistem_loglari').insert([{
                tablo_adi: '2fa_config',
                islem_tipi: 'TOTP_SECRET',
                kullanici_adi: 'koordinator',
                eski_veri: { secret, aktif: false, olusturuldu: new Date().toISOString() },
            }]);
        }

        const otpauthUrl = qrUrlOlustur(secret, '47 Antigravity ERP');
        // QR kod iin Google Charts API (cretsiz, dış JS yok)
        const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(otpauthUrl)}&choe=UTF-8`;

        return NextResponse.json({
            basarili: true,
            qrUrl: qrImageUrl,
            secret, // Kullanıcıya gsterilecek (manuel giriş iin)
            mesaj: 'Google Authenticator ile QR kodu okutun',
        });
    } catch (err) {
        return NextResponse.json({ hata: err.message }, { status: 500 });
    }
}
