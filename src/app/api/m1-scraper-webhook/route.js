export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { M1GelistirilmisTrendMotoru } from '@/services/M1TrendAnalizMotoru';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Scraper botlarÄ±n POST edeceÄŸi Webhook (Veri giriÅŸ kapÄ±sÄ±)
export async function POST(req) {
    try {
        const body = await req.json();
        const rawData = body.rawData;

        if (!rawData) {
            return NextResponse.json({ error: 'rawData nesnesi bulunamadÄ±. LÃ¼tfen M1 GÃ¶rev Emri JSON formatÄ±na uyunuz.' }, { status: 400 });
        }

        // 1. Gelen ham veriyi The Order M1 Motoruna sor
        const motorSonucu = M1GelistirilmisTrendMotoru.trendiKoklaVeriEle(rawData);

        // 2. GÃ¼venlik Filtresi (Sadece barajÄ± geÃ§enleri al)
        // Ä°ptalse veya skoru dÃ¼ÅŸÃ¼kse Ã§Ã¶pe at (DB'ye kaydetme)
        if (motorSonucu.karar === 'IPTAL' || motorSonucu.toplamSkor < 65) {
            return NextResponse.json({
                basarili: true,
                mesaj: 'ÃœrÃ¼n M1 Motoru tarafÄ±ndan elendi. VeritabanÄ±na kaydedilmedi.',
                alinanKarar: motorSonucu.karar,
                skor: motorSonucu.toplamSkor,
                sebep: motorSonucu.elenmeSebebi || 'Skor BarajÄ± GeÃ§ilemedi'
            });
        }

        // 3. GeÃ§erli ÃœrÃ¼nÃ¼ Supabase / b1_arge_trendler tablosuna kaydet
        const yeniTrend = {
            baslik: rawData.urunBasligi || 'Bilinmeyen Model (Scraper ID: ' + Date.now() + ')',
            platform: ['trendyol', 'amazon', 'instagram', 'pinterest', 'diger'].includes(rawData.platform) ? rawData.platform : 'diger',
            kategori: rawData.kategori || 'diger',
            hedef_kitle: 'kadÄ±n', // VarsayÄ±lan veya scrap edilen
            talep_skoru: Math.floor(motorSonucu.toplamSkor / 10), // 10 Ã¼zerinden puan (0-10)
            zorluk_derecesi: 5,
            referans_linkler: rawData.kaynakLink ? [rawData.kaynakLink] : null,
            aciklama: `[M1 Yapay Zeka Raporu]\nSkor: ${motorSonucu.toplamSkor}\nGÃ¼ven Endeksi: ${motorSonucu.guvenSkoru}\nUyarÄ±lar:\n- ${motorSonucu.uyarÄ±lar.join('\n- ')}`,
            durum: motorSonucu.karar === 'URET' ? 'onaylandi' : 'inceleniyor'
        };

        const { error } = await supabaseAdmin.from('b1_arge_trendler').insert([yeniTrend]);

        if (error) {
            throw error;
        }

        // 4. Log KaydÄ±
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: 'Trend KÃ¢ÅŸifi',
            islem_tipi: 'Otomize Scraper Motor Enjeksiyonu',
            mesaj: `Scraper Bot bir veri yÃ¼kledi. AI analiz etti: Skor ${motorSonucu.toplamSkor}. ÃœrÃ¼n sisteme ${motorSonucu.karar === 'URET' ? 'ONAYLI' : 'Ä°NCELENÄ°YOR'} olarak eklendi.`,
            sonuc: 'basarili',
            created_at: new Date().toISOString()
        }]);

        return NextResponse.json({
            basarili: true,
            mesaj: 'ÃœrÃ¼n altÄ±n deÄŸerinde bulundu ve Karargah/Ar-Ge ekranlarÄ±na aktarÄ±ldÄ±.',
            motorSonucu: motorSonucu
        });

    } catch (e) {
        console.error("WEBHOOK HATASI:", e);
        return NextResponse.json({ basarili: false, error: e.message }, { status: 500 });
    }
}
