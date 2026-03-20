import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { supabaseAdmin } from '@/lib/supabaseAdmin';
=======
import { createClient } from '@supabase/supabase-js';
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
import { rateLimitKontrol } from '@/lib/rateLimit';
import { personelSchema, veriDogrula } from '@/lib/zodSchemas';
import { hataBildir } from '@/lib/hataBildirim';

// ─── POST /api/personel-ekle ───────────────────────────────────
export async function POST(request) {
<<<<<<< HEAD
=======
    const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key')?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    try {
        const ip = (request.headers.get('x-forwarded-for') || 'bilinmeyen').split(',')[0].trim();
        if (!rateLimitKontrol(ip, 10, 60)) {
            return NextResponse.json({ hata: 'Çok fazla istek.' }, { status: 429 });
        }

        const body = await request.json();

        const dogrulama = veriDogrula(personelSchema, {
            personel_kodu: body.personel_kodu,
            ad_soyad: body.ad_soyad,
            rol: body.rol,
            durum: body.durum || 'aktif',
            telefon: body.telefon || null,
            saatlik_ucret_tl: parseFloat(body.saatlik_ucret_tl) || 0,
            prim_yuzdesi: parseFloat(body.prim_yuzdesi) || 0,
            ise_giris_tarihi: body.ise_giris_tarihi || null,
        });

        if (!dogrulama.basarili) {
            return NextResponse.json({ hata: 'Veri doğrulama hatası', detay: dogrulama.error }, { status: 422 });
        }

        // Mükerrer personel kodu kontrolü
        const { data: mevcut } = await supabaseAdmin
            .from('b1_personel').select('id').eq('personel_kodu', dogrulama.data.personel_kodu);
        if (mevcut && mevcut.length > 0) {
            return NextResponse.json({ hata: 'Bu personel kodu zaten kayıtlı!' }, { status: 409 });
        }

        const { data, error } = await supabaseAdmin
            .from('b1_personel').insert([dogrulama.data]).select();
        if (error) throw error;

        await supabaseAdmin.from('b0_sistem_loglari').insert([{
            tablo_adi: 'b1_personel',
            islem_tipi: 'EKLEME',
            kullanici_adi: 'Server API (Güvenli Personel Kaydı)',
            eski_veri: { personel_kodu: dogrulama.data.personel_kodu }
        }]);

        return NextResponse.json({ basarili: true, personel: data?.[0] }, { status: 201 });

    } catch (error) {
        console.error('[/api/personel-ekle] Hata:', error.message);
        await hataBildir('/api/personel-ekle', error);
        return NextResponse.json({ hata: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}
