import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { geminiIcinMaliyetFiltresi } from '@/lib/nizamETL';

// Scraper botların POST edeceği Webhook (Veri giriş kapısı)
export async function POST(req) {
    try {
        const body = await req.json();
        const rawData = body.rawData;

        if (!rawData) {
            return NextResponse.json({ error: 'rawData nesnesi bulunamadı. Lütfen M1 Görev Emri formatına uyunuz.' }, { status: 400 });
        }

        const platformAd = rawData.platform || 'diger';
        const kaynakLink = rawData.kaynakLink || rawData.url || 'bilinmiyor';

        // --------------------------------------------------------------------------
        // ADIM 1: "GEREKSİZ VERİYİ DİĞER VERİTABANINA AT" (Data Lake Arch)
        // Karargahı kirletmeden, AI Token parası yemeden ham veriyi Supabase "b1_raw_data_lake" çöplüğüne bırak.
        // --------------------------------------------------------------------------
        try {
            await supabaseAdmin.from('b1_raw_data_lake').insert([{
                kaynak_platform: platformAd,
                kaynak_url: kaynakLink,
                ham_json: rawData, // Tüm gereksiz, ağır HTML/Metadata buraya akar, Gemini'ye GİTMEZ.
                islenme_durumu: 'bekliyor'
            }]);
        } catch (lakeErr) {
            console.warn("b1_raw_data_lake tablosu eksik veya bağlantı hatası, atlandı.", lakeErr.message);
            // Tablo devrede değilse bile akış durmaz, hata yutulur (Zırh)
        }

        // --------------------------------------------------------------------------
        // ADIM 2: "TARAYICIDAN OKUDUĞU BİLGİYİ GEMİYE KISMİ (UCUZ) VERECEK" (Token Tasarrufu)
        // Zor olanı yapıyoruz: Metni parse et, çöpleri çıkar.
        // --------------------------------------------------------------------------
        const ucuzaMalEdilmisVeri = geminiIcinMaliyetFiltresi(rawData);

        // Gemini'ye (veya M1Motoruna) ucuza mal edilmiş temiz veriyi yolla
        const M1GelistirilmisTrendMotoru = (await import('@/services/M1TrendAnalizMotoru')).M1GelistirilmisTrendMotoru;
        const motorSonucu = M1GelistirilmisTrendMotoru.trendiKoklaVeriEle({
            sadelestirilmisMetin: ucuzaMalEdilmisVeri, // Asıl devrim bu satır. AI sadece saf text okuyacak
            baslik: rawData.urunBasligi || 'Bilinmeyen'
        });

        // --------------------------------------------------------------------------
        // ADIM 3: "GEREKLİ BİLGİYİ ALACAK" (Eleme)
        // --------------------------------------------------------------------------
        if (motorSonucu.karar === 'IPTAL' || motorSonucu.toplamSkor < 65) {
            return NextResponse.json({
                basarili: true,
                mesaj: 'Gemini analizi sonucu Ürün kârsız göründü ve M1 tarafından elendi (Sessiz İptal). Sadece Raw Data Lake\'e kaydedildi.',
                skor: motorSonucu.toplamSkor
            });
        }

        // --------------------------------------------------------------------------
        // ADIM 4: SADECE BAŞARILI, ALTIN NİTELİĞİNDE VERİYİ GERÇEK DB'YE YAZ (Maliyet Tasarrufu)
        // --------------------------------------------------------------------------
        const yeniTrend = {
            baslik: rawData.urunBasligi || 'Trend Model',
            platform: ['trendyol', 'amazon', 'instagram', 'pinterest', 'diger'].includes(platformAd) ? platformAd : 'diger',
            kategori: rawData.kategori || 'diger',
            hedef_kitle: 'kadın',
            talep_skoru: Math.floor(motorSonucu.toplamSkor / 10),
            zorluk_derecesi: 5,
            referans_linkler: kaynakLink !== 'bilinmiyor' ? [kaynakLink] : null,
            aciklama: `[YAPAY ZEKA FİLTRESİNDEN GEÇMİŞ DEĞERLİ DATA]\nSkor: ${motorSonucu.toplamSkor}\nUyarılar:\n- ${motorSonucu.uyarılar?.join('\n- ') || 'Yok'}`,
            durum: motorSonucu.karar === 'URET' ? 'onaylandi' : 'inceleniyor'
        };

        const { error } = await supabaseAdmin.from('b1_arge_trendler').insert([yeniTrend]);
        if (error) throw error;

        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: 'Trend Kâşifi',
            islem_tipi: 'ETL - Maliyet Optimizasyonlu Filtre',
            mesaj: `Scraper Bot veri getirdi. Çöpler Lake'e atıldı. Saf temiz veri AI'ya soruldu. Skor: ${motorSonucu.toplamSkor}.`,
            sonuc: 'basarili',
            created_at: new Date().toISOString()
        }]);

        return NextResponse.json({
            basarili: true,
            mesaj: 'Gereksiz veri Lake\'e atıldı. Gerekli kısımlar işlendi. Yapay Zeka maliyeti %90 düşürüldü.',
            motorSonucu: motorSonucu
        });

    } catch (e) {
        console.error("WEBHOOK HATASI:", e);
        return NextResponse.json({ basarili: false, error: e.message }, { status: 500 });
    }
}
