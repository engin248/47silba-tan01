import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitKontrol } from '@/lib/rateLimit';
import { isEmriSchema, veriDogrula } from '@/lib/zodSchemas';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── POST /api/is-emri-ekle ────────────────────────────────────
export async function POST(request) {
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

        // 4. MÜKERRER İŞ EMRİ KONTROLÜ
        const { data: mevcut } = await supabaseAdmin
            .from('production_orders')
            .select('id')
            .eq('model_id', temizVeri.model_id)
            .in('status', ['pending', 'in_progress']);

        if (mevcut && mevcut.length > 0) {
            return NextResponse.json(
                { hata: 'Bu model için halihazırda bekleyen veya üretimde olan bir iş emri var!' },
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
            kullanici_adi: 'Server API (Güvenli İş Emri)',
            eski_veri: { model_id: temizVeri.model_id, quantity: temizVeri.quantity }
        }]).catch(() => { });

        return NextResponse.json({ basarili: true, isEmri: data?.[0] }, { status: 201 });

    } catch (error) {
        console.error('[/api/is-emri-ekle] Hata:', error.message);
        return NextResponse.json({ hata: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}
