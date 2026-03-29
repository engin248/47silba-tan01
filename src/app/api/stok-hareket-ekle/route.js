import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimitKontrol } from '@/lib/rateLimit';
import { stokHareketiSchema, veriDogrula } from '@/lib/zodSchemas';
import { hataBildir } from '@/lib/hataBildirim';

export async function POST(request) {

    try {
        const ip = (request.headers.get('x-forwarded-for') || 'bilinmeyen').split(',')[0].trim();
        if (!(request.headers.get('x-internal-api-key') === process.env.INTERNAL_API_KEY || rateLimitKontrol(ip, 20, 60))) {
            return NextResponse.json({ hata: 'ok fazla stok hareketi isteği. Ltfen bekleyin.' }, { status: 429 });
        }

        const body = await request.json();

        // Zod Validator
        const dogrulama = veriDogrula(stokHareketiSchema, body);
        if (!dogrulama.basarili) {
            return NextResponse.json({ hata: 'Geersiz stok tahsisi.', detay: dogrulama.error }, { status: 422 });
        }

        const payload = dogrulama.data;

        // DB Insert with Service Role
        const { data, error } = await supabaseAdmin
            .from('b2_stok_hareketleri')
            .insert([payload])
            .select('*')
            .single();

        if (error) throw error;

        // Sistem Log İşlemi
        try {
            await supabaseAdmin.from('b0_sistem_loglari').insert([{
                tablo_adi: 'b2_stok_hareketleri',
                islem_tipi: 'EKLEME',
                kullanici_adi: 'Server API (Otonom Zırh)',
                eski_veri: { urun: payload.urun_id, islem: payload.hareket_tipi, adet: payload.adet }
            }]);
        } catch (e) { console.error('[KR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: route.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }

        return NextResponse.json({ mesaj: 'Başarılı', veri: data });
    } catch (error) {
        hataBildir('stok-hareket-ekle_API', error);
        return NextResponse.json({ hata: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}
