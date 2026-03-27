import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimitKontrol } from '@/lib/rateLimit';
import { siparisSchema, siparisKalemSchema, veriDogrula } from '@/lib/zodSchemas';
import { hataBildir } from '@/lib/hataBildirim';

//  POST /api/siparis-ekle 
export async function POST(request) {
    try {
        const ip = (request.headers.get('x-forwarded-for') || 'bilinmeyen').split(',')[0].trim();
        if (!rateLimitKontrol(ip, 10, 60)) {
            return NextResponse.json({ hata: 'ok fazla istek. Ltfen bekleyin.' }, { status: 429 });
        }

        const body = await request.json();
        const { siparis, kalemler } = body;

        if (!siparis || !kalemler || !Array.isArray(kalemler)) {
            return NextResponse.json({ hata: 'siparis ve kalemler zorunlu' }, { status: 400 });
        }
        if (kalemler.length === 0) {
            return NextResponse.json({ hata: 'En az 1 rn kalemi zorunlu' }, { status: 400 });
        }
        if (kalemler.length > 50) {
            return NextResponse.json({ hata: 'Bir siparişte en fazla 50 kalem olabilir' }, { status: 400 });
        }

        // Zod doğrulama
        const siparisDog = veriDogrula(siparisSchema, siparis);
        if (!siparisDog.basarili) {
            return NextResponse.json({ hata: 'Sipariş verisi hatalı', detay: siparisDog.error }, { status: 422 });
        }

        // Mkerrer sipariş no kontrol
        const { data: mevcut } = await supabaseAdmin
            .from('b2_siparisler').select('id').eq('siparis_no', siparisDog.data.siparis_no);
        if (mevcut && mevcut.length > 0) {
            return NextResponse.json({ hata: 'Bu sipariş numarası zaten kayıtlı!' }, { status: 409 });
        }

        // [M12 - ZIRH #1]: Kara Liste (Blacklist) Kontrol
        if (siparisDog.data.musteri_id) {
            const { data: musteriData } = await supabaseAdmin
                .from('b2_musteriler').select('kara_liste').eq('id', siparisDog.data.musteri_id).single();
            if (musteriData && musteriData.kara_liste) {
                return NextResponse.json({ hata: ' DİKKAT: Seilen mşteri KARA LİSTEDE! Sipariş onaylanamaz. Finans departmanıyla grşn.' }, { status: 403 });
            }
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
        try {
            await supabaseAdmin.from('b0_sistem_loglari').insert([{
                tablo_adi: 'b2_siparisler',
                islem_tipi: 'EKLEME',
                kullanici_adi: 'Server API (Gvenli Sipariş)',
                eski_veri: { siparis_no: siparisDog.data.siparis_no, kalem_sayisi: kalemler.length }
            }]);
        } catch (e) { console.error('[KR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: route.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }

        // [M9 - ZIRH #2]: Mşteri Cari Bakiyesi ve M7 Kasa Entegrasyonu (Finans Zırhı)
        if (siparisDog.data.musteri_id) {
            const islemTutari = parseFloat(siparisDog.data.toplam_tutar_tl || 0);
            if (islemTutari > 0) {
                // Cari Bakiye Gncelle (Tutar kadar bor eklenir, deme yaptıysa o an kasa/tahsilatla dşmesi theOrder standardıdır)
                // Yada peşin ise bakiye değişmez. Biz standart olarak bakiyeye bindirip anında kasadan tahsilat dşebiliriz.
                // Burada en doğrusu theOrder mantığında: Sipariş cirosunu bakiyeye(borca) ekle.
                const { data: musteriData } = await supabaseAdmin.from('b2_musteriler').select('toplam_borc_tl').eq('id', siparisDog.data.musteri_id).single();
                if (musteriData) {
                    await supabaseAdmin.from('b2_musteriler').update({ toplam_borc_tl: (parseFloat(musteriData.toplam_borc_tl || 0) + islemTutari) }).eq('id', siparisDog.data.musteri_id);
                }
            }
        }

        // M7 Kasa Otomatik Tahsilat (Nakit/Kredi Kartı ise anında tahsilat logu)
        const islemTutari = parseFloat(siparisDog.data.toplam_tutar_tl || 0);
        if (islemTutari > 0 && ['nakit', 'kredi_karti', 'eft'].includes(siparisDog.data.odeme_yontemi)) {
            await supabaseAdmin.from('b2_kasa_hareketleri').insert([{
                musteri_id: siparisDog.data.musteri_id || null,
                siparis_id: sipData.id,
                hareket_tipi: 'tahsilat',
                odeme_yontemi: siparisDog.data.odeme_yontemi,
                tutar_tl: islemTutari,
                aciklama: `Sipariş #${siparisDog.data.siparis_no} (Peşin Tahsilat)`,
                onay_durumu: 'onaylandi'
            }]);

            // Otomatik Tahsilat yapıldığı iin Mşteri borcunu geri dş (nk peşin verdi)
            if (siparisDog.data.musteri_id) {
                const { data: musteriData } = await supabaseAdmin.from('b2_musteriler').select('toplam_borc_tl').eq('id', siparisDog.data.musteri_id).single();
                if (musteriData) {
                    await supabaseAdmin.from('b2_musteriler').update({ toplam_borc_tl: Math.max(0, parseFloat(musteriData.toplam_borc_tl || 0) - islemTutari) }).eq('id', siparisDog.data.musteri_id);
                }
            }
        }

        return NextResponse.json({ basarili: true, siparis: sipData }, { status: 201 });

    } catch (error) {
        console.error('[/api/siparis-ekle] Hata:', error.message);
        await hataBildir('/api/siparis-ekle', error);
        return NextResponse.json({ hata: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}
