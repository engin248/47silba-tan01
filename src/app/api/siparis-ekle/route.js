import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitKontrol } from '@/lib/rateLimit';
import { siparisSchema, siparisKalemSchema, veriDogrula } from '@/lib/zodSchemas';
import { hataBildir } from '@/lib/hataBildirim';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── POST /api/siparis-ekle ────────────────────────────────────
export async function POST(request) {
    try {
        const ip = (request.headers.get('x-forwarded-for') || 'bilinmeyen').split(',')[0].trim();
        if (!rateLimitKontrol(ip, 10, 60)) {
            return NextResponse.json({ hata: 'Çok fazla istek. Lütfen bekleyin.' }, { status: 429 });
        }

        const body = await request.json();
        const { siparis, kalemler } = body;

        if (!siparis || !kalemler || !Array.isArray(kalemler)) {
            return NextResponse.json({ hata: 'siparis ve kalemler zorunlu' }, { status: 400 });
        }
        if (kalemler.length === 0) {
            return NextResponse.json({ hata: 'En az 1 ürün kalemi zorunlu' }, { status: 400 });
        }
        if (kalemler.length > 50) {
            return NextResponse.json({ hata: 'Bir siparişte en fazla 50 kalem olabilir' }, { status: 400 });
        }

        // Zod doğrulama
        const siparisDog = veriDogrula(siparisSchema, siparis);
        if (!siparisDog.basarili) {
            return NextResponse.json({ hata: 'Sipariş verisi hatalı', detay: siparisDog.error }, { status: 422 });
        }

        // Mükerrer sipariş no kontrolü
        const { data: mevcut } = await supabaseAdmin
            .from('b2_siparisler').select('id').eq('siparis_no', siparisDog.data.siparis_no);
        if (mevcut && mevcut.length > 0) {
            return NextResponse.json({ hata: 'Bu sipariş numarası zaten kayıtlı!' }, { status: 409 });
        }

        // Sipariş başlığı ekle
        const { data: sipData, error: sipErr } = await supabaseAdmin
            .from('b2_siparisler')
            .insert([{ ...siparisDog.data, durum: 'beklemede' }])
            .select().single();
        if (sipErr) throw sipErr;

        // Kalemleri ekle (Zod ile tek tek doğrula)
        const temizKalemler = [];
        for (const k of kalemler) {
            const kalemDog = veriDogrula(siparisKalemSchema, { ...k, siparis_id: sipData.id });
            if (!kalemDog.basarili) {
                // Sipariş başlığını geri al
                await supabaseAdmin.from('b2_siparisler').delete().eq('id', sipData.id);
                return NextResponse.json({ hata: 'Kalem verisi hatalı', detay: kalemDog.error }, { status: 422 });
            }
            temizKalemler.push(kalemDog.data);
        }

        const { error: kalemErr } = await supabaseAdmin.from('b2_siparis_kalemleri').insert(temizKalemler);
        if (kalemErr) throw kalemErr;

        // Kara kutu log
        await supabaseAdmin.from('b0_sistem_loglari').insert([{
            tablo_adi: 'b2_siparisler',
            islem_tipi: 'EKLEME',
            kullanici_adi: 'Server API (Güvenli Sipariş)',
            eski_veri: { siparis_no: siparisDog.data.siparis_no, kalem_sayisi: kalemler.length }
        }]).catch(() => { });

        return NextResponse.json({ basarili: true, siparis: sipData }, { status: 201 });

    } catch (error) {
        console.error('[/api/siparis-ekle] Hata:', error.message);
        await hataBildir('/api/siparis-ekle', error);
        return NextResponse.json({ hata: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}
