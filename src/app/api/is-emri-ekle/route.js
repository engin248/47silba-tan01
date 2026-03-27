import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimitKontrol } from '@/lib/rateLimit';
import { isEmriSchema, veriDogrula } from '@/lib/zodSchemas';

//  POST /api/is-emri-ekle 
export async function POST(request) {
    try {
        // 1. RATE LIMIT
        const ip = (request.headers.get('x-forwarded-for') || 'bilinmeyen').split(',')[0].trim();
        if (!rateLimitKontrol(ip, 10, 60)) {
            return NextResponse.json({ hata: 'ok fazla istek. Ltfen bekleyin.' }, { status: 429 });
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

        // 4. MKERRER İŞ EMRİ KONTROL
        const { data: mevcut } = await supabaseAdmin
            .from('production_orders')
            .select('id')
            .eq('model_id', temizVeri.model_id)
            .in('status', ['pending', 'in_progress']);

        if (mevcut && mevcut.length > 0) {
            return NextResponse.json(
                { hata: 'Bu model iin halihazırda bekleyen veya retimde olan bir iş emri var!' },
                { status: 409 }
            );
        }

        // 5. INSERT
        const { data, error } = await supabaseAdmin
            .from('production_orders')
            .insert([{ ...temizVeri, status: 'pending' }])
            .select();

        if (error) throw error;

        // 6. KARA KUTU LOG
        await supabaseAdmin.from('b0_sistem_loglari').insert([{
            tablo_adi: 'production_orders',
            islem_tipi: 'EKLEME',
            kullanici_adi: 'Server API (Gvenli İş Emri)',
            eski_veri: { model_id: temizVeri.model_id, quantity: temizVeri.quantity }
        }]);

        return NextResponse.json({ basarili: true, isEmri: data?.[0] }, { status: 201 });

    } catch (error) {
        console.error('[/api/is-emri-ekle] Hata:', error.message);
        return NextResponse.json({ hata: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}
