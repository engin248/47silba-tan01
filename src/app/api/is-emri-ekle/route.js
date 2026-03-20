import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { supabaseAdmin } from '@/lib/supabaseAdmin';
=======
import { createClient } from '@supabase/supabase-js';
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
import { rateLimitKontrol } from '@/lib/rateLimit';
import { isEmriSchema, veriDogrula } from '@/lib/zodSchemas';

// ─── POST /api/is-emri-ekle ────────────────────────────────────
export async function POST(request) {
<<<<<<< HEAD
=======
    const supabaseAdmin = createClient(
        (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co').trim(),
        (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key').trim()
    );
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    try {
        // 1. RATE LIMIT
        const ip = (request.headers.get('x-forwarded-for') || 'bilinmeyen').split(',')[0].trim();
        if (!rateLimitKontrol(ip, 10, 60)) {
            return NextResponse.json({ hata: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });
        }

        // 2. BODY
        const body = await request.json();

        // 3. ZOD
        const dogrulama = veriDogrula(isEmriSchema, {
            model_id: body.model_id,
            quantity: parseInt(body.quantity),
            planned_start_date: body.planned_start_date || null,
            planned_end_date: body.planned_end_date || null,
        });

        if (!dogrulama.basarili) {
            return NextResponse.json({ hata: 'Veri doğrulama hatası', detay: dogrulama.error }, { status: 422 });
        }

        const temizVeri = dogrulama.data;

<<<<<<< HEAD
        // 4. MÜKERRER İŞ EMRİ KONTROLÜ
        const { data: mevcut } = await supabaseAdmin
            .from('production_orders')
            .select('id')
            .eq('model_id', temizVeri.model_id)
            .in('status', ['pending', 'in_progress']);
=======
        // 4. MÜKERRER İŞ EMRİ KONTROLÜ (b1_imalat_emirleri — canonical tablo)
        const { data: mevcut } = await supabaseAdmin
            .from('b1_imalat_emirleri')
            .select('id')
            .eq('model_id', temizVeri.model_id)
            .in('durum', ['bekliyor', 'uretimde']);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

        if (mevcut && mevcut.length > 0) {
            return NextResponse.json(
                { hata: 'Bu model için halihazırda bekleyen veya üretimde olan bir iş emri var!' },
                { status: 409 }
            );
        }

<<<<<<< HEAD
        // 5. INSERT
        const { data, error } = await supabaseAdmin
            .from('production_orders')
            .insert([{ ...temizVeri, status: 'pending' }])
=======
        // 5. INSERT (b1_imalat_emirleri — canonical tablo, C3 düzeltmesi)
        const { data, error } = await supabaseAdmin
            .from('b1_imalat_emirleri')
            .insert([{ ...temizVeri, durum: 'bekliyor' }])
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            .select();

        if (error) throw error;

        // 6. KARA KUTU LOG
        await supabaseAdmin.from('b0_sistem_loglari').insert([{
<<<<<<< HEAD
            tablo_adi: 'production_orders',
=======
            tablo_adi: 'b1_imalat_emirleri',
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            islem_tipi: 'EKLEME',
            kullanici_adi: 'Server API (Güvenli İş Emri)',
            eski_veri: { model_id: temizVeri.model_id, quantity: temizVeri.quantity }
        }]);

        return NextResponse.json({ basarili: true, isEmri: data?.[0] }, { status: 201 });

    } catch (error) {
        console.error('[/api/is-emri-ekle] Hata:', error.message);
        return NextResponse.json({ hata: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}
