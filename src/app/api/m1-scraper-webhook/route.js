import { NextResponse } from 'next/server';
import { M1GelistirilmisTrendMotoru } from '@/services/M1TrendAnalizMotoru';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Scraper botların POST edeceği Webhook (Veri giriş kapısı)
export async function POST(req) {
    try {
        const body = await req.json();
        const rawData = body.rawData;

        if (!rawData) {
            return NextResponse.json({ error: 'rawData nesnesi bulunamadı. Ltfen M1 Grev Emri JSON formatına uyunuz.' }, { status: 400 });
        }

        // 1. Gelen ham veriyi The Order M1 Motoruna sor
        const motorSonucu = M1GelistirilmisTrendMotoru.trendiKoklaVeriEle(rawData);

        // 2. Gvenlik Filtresi (Sadece barajı geenleri al)
        // İptalse veya skoru dşkse pe at (DB'ye kaydetme)
        if (motorSonucu.karar === 'IPTAL' || motorSonucu.toplamSkor < 65) {
            return NextResponse.json({
                basarili: true,
                mesaj: 'rn M1 Motoru tarafından elendi. Veritabanına kaydedilmedi.',
                alinanKarar: motorSonucu.karar,
                skor: motorSonucu.toplamSkor,
                sebep: motorSonucu.elenmeSebebi || 'Skor Barajı Geilemedi'
            });
        }

        // 3. Geerli rn Supabase / b1_arge_trendler tablosuna kaydet
        const yeniTrend = {
            baslik: rawData.urunBasligi || 'Bilinmeyen Model (Scraper ID: ' + Date.now() + ')',
            platform: ['trendyol', 'amazon', 'instagram', 'pinterest', 'diger'].includes(rawData.platform) ? rawData.platform : 'diger',
            kategori: rawData.kategori || 'diger',
            hedef_kitle: 'kadın', // Varsayılan veya scrap edilen
            talep_skoru: Math.floor(motorSonucu.toplamSkor / 10), // 10 zerinden puan (0-10)
            zorluk_derecesi: 5,
            referans_linkler: rawData.kaynakLink ? [rawData.kaynakLink] : null,
            aciklama: `[M1 Yapay Zeka Raporu]\nSkor: ${motorSonucu.toplamSkor}\nGven Endeksi: ${motorSonucu.guvenSkoru}\nUyarılar:\n- ${motorSonucu.uyarılar.join('\n- ')}`,
            durum: motorSonucu.karar === 'URET' ? 'onaylandi' : 'inceleniyor'
        };

        const { error } = await supabaseAdmin.from('b1_arge_trendler').insert([yeniTrend]);

        if (error) {
            throw error;
        }

        // 4. Log Kaydı
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: 'Trend Kşifi',
            islem_tipi: 'Otomize Scraper Motor Enjeksiyonu',
            mesaj: `Scraper Bot bir veri ykledi. AI analiz etti: Skor ${motorSonucu.toplamSkor}. rn sisteme ${motorSonucu.karar === 'URET' ? 'ONAYLI' : 'İNCELENİYOR'} olarak eklendi.`,
            sonuc: 'basarili',
            created_at: new Date().toISOString()
        }]);

        return NextResponse.json({
            basarili: true,
            mesaj: 'rn altın değerinde bulundu ve Karargah/Ar-Ge ekranlarına aktarıldı.',
            motorSonucu: motorSonucu
        });

    } catch (e) {
        console.error("WEBHOOK HATASI:", e);
        return NextResponse.json({ basarili: false, error: e.message }, { status: 500 });
    }
}
