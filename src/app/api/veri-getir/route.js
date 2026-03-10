import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
    try {
        const { tablo, filtreler, sutunlar, limit, order } = await request.json();

        const IZINLI_TABLOLAR = [
            'b2_musteriler', 'b2_siparisler', 'b2_siparis_kalemleri',
            'b2_urun_katalogu', 'b2_stok_hareketleri', 'b2_tedarikciler',
            'b2_cek_senet_vade', 'b2_teklif_logs', 'notifications',
            'b2_personel', 'b2_gorevler', 'b2_operasyonlar', 'b2_is_emirleri',
            'b2_kumas_arsiv', 'b2_kalip_arsiv', 'b2_maliyet_merkezi',
            'b0_sistem_loglari', 'b3_operasyonlar',
        ];

        if (!IZINLI_TABLOLAR.includes(tablo)) {
            return NextResponse.json({ hata: 'Bu tabloya erisim izni yok.' }, { status: 403 });
        }

        let sorgu = supabaseAdmin.from(tablo).select(sutunlar || '*');

        if (filtreler && typeof filtreler === 'object') {
            for (const [alan, deger] of Object.entries(filtreler)) {
                if (deger !== undefined && deger !== null) {
                    sorgu = sorgu.eq(alan, deger);
                }
            }
        }

        if (order?.alan) {
            sorgu = sorgu.order(order.alan, { ascending: order.artan ?? false });
        }

        if (limit) {
            sorgu = sorgu.limit(Number(limit));
        }

        const { data, error } = await sorgu;
        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ hata: error.message }, { status: 500 });
    }
}
