import { NextResponse } from 'next/server';
import { M1GelistirilmisTrendMotoru } from '@/services/M1TrendAnalizMotoru';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Scraper botların POST edeceği Webhook (Veri giriş kapısı)
export async function POST(req) {
    try {
        const body = await req.json();
        const rawData = body.rawData;

        if (!rawData) {
            return NextResponse.json({ error: 'rawData nesnesi bulunamadı. Lütfen M1 Görev Emri JSON formatına uyunuz.' }, { status: 400 });
        }

        // 1. Gelen ham veriyi The Order M1 Motoruna sor
        const motorSonucu = M1GelistirilmisTrendMotoru.trendiKoklaVeriEle(rawData);

        // 2. Güvenlik Filtresi (Sadece barajı geçenleri al)
        // İptalse veya skoru düşükse çöpe at (DB'ye kaydetme)
        if (motorSonucu.karar === 'IPTAL' || motorSonucu.toplamSkor < 65) {
            return NextResponse.json({
                basarili: true,
                mesaj: 'Ürün M1 Motoru tarafından elendi. Veritabanına kaydedilmedi.',
                alinanKarar: motorSonucu.karar,
                skor: motorSonucu.toplamSkor,
                sebep: motorSonucu.elenmeSebebi || 'Skor Barajı Geçilemedi'
            });
        }

        // 3. Geçerli Ürünü Supabase / b1_arge_trendler tablosuna kaydet
        const yeniTrend = {
            baslik: rawData.urunBasligi || 'Bilinmeyen Model (Scraper ID: ' + Date.now() + ')',
            platform: ['trendyol', 'amazon', 'instagram', 'pinterest', 'diger'].includes(rawData.platform) ? rawData.platform : 'diger',
            kategori: rawData.kategori || 'diger',
            hedef_kitle: 'kadın', // Varsayılan veya scrap edilen
            talep_skoru: Math.floor(motorSonucu.toplamSkor / 10), // 10 üzerinden puan (0-10)
            zorluk_derecesi: 5,
            referans_linkler: rawData.kaynakLink ? [rawData.kaynakLink] : null,
            aciklama: `[M1 Yapay Zeka Raporu]\nSkor: ${motorSonucu.toplamSkor}\nGüven Endeksi: ${motorSonucu.guvenSkoru}\nUyarılar:\n- ${motorSonucu.uyarılar.join('\n- ')}`,
            durum: motorSonucu.karar === 'URET' ? 'onaylandi' : 'inceleniyor'
        };

        const { error } = await supabaseAdmin.from('b1_arge_trendler').insert([yeniTrend]);

        if (error) {
            throw error;
        }

        // 4. Log Kaydı
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: 'Trend Kâşifi',
            islem_tipi: 'Otomize Scraper Motor Enjeksiyonu',
            mesaj: `Scraper Bot bir veri yükledi. AI analiz etti: Skor ${motorSonucu.toplamSkor}. Ürün sisteme ${motorSonucu.karar === 'URET' ? 'ONAYLI' : 'İNCELENİYOR'} olarak eklendi.`,
            sonuc: 'basarili',
            created_at: new Date().toISOString()
        }]);

        return NextResponse.json({
            basarili: true,
            mesaj: 'Ürün altın değerinde bulundu ve Karargah/Ar-Ge ekranlarına aktarıldı.',
            motorSonucu: motorSonucu
        });

    } catch (e) {
        console.error("WEBHOOK HATASI:", e);
        return NextResponse.json({ basarili: false, error: e.message }, { status: 500 });
    }
}
