export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ success: false, error: 'Supabase yapÄ±landÄ±rma hatasÄ±.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const payload = await req.json();
        const { personel_id, operasyon_id, adet, kalite_puani, kaynak_cihaz } = payload;

        if (!personel_id || !operasyon_id) {
            return NextResponse.json({ success: false, error: 'personel_id ve operasyon_id zorunludur.' }, { status: 400 });
        }

        const islemAdeti = Math.max(1, parseInt(adet) || 1);
        const kalite = Math.min(10, Math.max(0, parseFloat(kalite_puani) || 8.0));

        // 1. Operasyonun deÄŸer bilgilerini Ã§ek
        const { data: opData, error: opErr } = await supabase
            .from('b1_operasyon_tanimlari')
            .select('isletmeye_kattigi_deger_tl, baz_prim_tl, zorluk_derecesi, operasyon_adi')
            .eq('id', operasyon_id)
            .single();

        if (opErr || !opData) {
            return NextResponse.json({ success: false, error: 'Operasyon bulunamadÄ±.' }, { status: 404 });
        }

        const katilanDeger = islemAdeti * parseFloat(opData.isletmeye_kattigi_deger_tl || 0);

        // 2. Personelin bu ay toplam biriktirdiÄŸi deÄŸeri ve aylÄ±k maliyetini Ã§ek
        const date = new Date();
        const ilkGun = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();

        const [{ data: personelData }, { data: perfLogs }] = await Promise.all([
            supabase.from('b1_personel').select('aylik_maliyet_tl').eq('id', personel_id).single(),
            supabase.from('b1_personel_performans')
                .select('isletmeye_katilan_deger')
                .eq('personel_id', personel_id)
                .gte('created_at', ilkGun)
        ]);

        const aylikMaliyet = parseFloat(personelData?.aylik_maliyet_tl || 0);
        const mevcutBirikis = (perfLogs || []).reduce((acc, r) => acc + parseFloat(r.isletmeye_katilan_deger || 0), 0);
        const yeniBirikis = mevcutBirikis + katilanDeger;

        // 3. Prim hesabÄ±: sadece maliyet kotasÄ± aÅŸÄ±lmÄ±ÅŸsa prim yaz
        // FormÃ¼l: Adet Ã— Zorluk Ã‡arpanÄ± Ã— Baz Prim TL
        let kazanilanPrim = 0;
        const primYazildiMi = yeniBirikis >= aylikMaliyet && aylikMaliyet > 0;
        if (primYazildiMi) {
            const zorluk = parseFloat(opData.zorluk_derecesi || 1);
            const bazPrim = parseFloat(opData.baz_prim_tl || 0);
            kazanilanPrim = parseFloat((islemAdeti * zorluk * bazPrim).toFixed(2));
        }

        // 4. Performans kaydÄ±nÄ± INSERT et
        const { error: perfErr } = await supabase
            .from('b1_personel_performans')
            .insert([{
                personel_id,
                operasyon_id,
                uretilen_adet: islemAdeti,
                isletmeye_katilan_deger: katilanDeger,
                kazanilan_prim: kazanilanPrim,
                kalite_puani: kalite,
                otonom_tespit: true,
                kaynak_cihaz: kaynak_cihaz || 'Kamera-Bilinmeyen'
            }]);

        if (perfErr) {
            return NextResponse.json({ success: false, error: perfErr.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            isletmeyeKatilanDeger: katilanDeger,
            primYazildiMi,
            kazanilanPrim,
            toplamBirikis: yeniBirikis,
            aylikMaliyet,
            amortiYuzdesi: aylikMaliyet > 0 ? ((yeniBirikis / aylikMaliyet) * 100).toFixed(1) : 'SÄ±nÄ±rsÄ±z'
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
