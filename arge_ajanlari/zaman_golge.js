const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_YOK');
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'YOK';

/**
 * BOT 6: GÖLGE VE ZAMAN MAKİNESİ (Sıcak Takip & Diriliş Radarı)
 * YENİ (FAZ 1): 3-5 Gün Sonrasının E-ticaret Projeksiyonu Analizi Eklendi
 * SENTINEL UYUMLUDUR.
 */
async function bot6GolgeZamanMakinesi(hedefKavramiBozuk = null, job_id = null, telemetriFnc = null) {
    const telemetriAt = async (yuzde, mesaj, durum = 'çalışıyor') => {
        if (telemetriFnc && job_id) await telemetriFnc(job_id, yuzde, mesaj, durum);
        console.log(`[TELEMETRİ %${yuzde}] ${mesaj}`);
    };

    await telemetriAt(10, `[ZAMAN MAKİNESİ YÜKLENİYOR] Gölge ajan pusuya yattığı hedefleri arıyor...`);

    try {
        const { data: eskiUrunler, error } = await supabase
            .from('b1_arge_products')
            .select('*')
            .in('ai_satis_karari', ['SATMAZ', 'İZLE'])
            .order('created_at', { ascending: false })
            .limit(3);

        if (error || !eskiUrunler || eskiUrunler.length === 0) {
            await telemetriAt(100, `[GÖREV BİTTİ] Pusu hedefleri boş. Yeni av bekleniyor.`, 'onaylandı');
            return null;
        }

        const hedefler = eskiUrunler.map(u => u.urun_adi).join(', ');
        await telemetriAt(30, `[PUSU HEDEFLERİ] ${hedefler} için 3-5 Günlük Gelecek Projeksiyon Radarı açıldı...`);

        const guncellemeler = [];
        let dogruTahminSayisi = 0;

        for (const urun of eskiUrunler) {
            let gercekDurum = "Bilinmiyor";
            let perplexityRaporu = "";

            if (PERPLEXITY_API_KEY && PERPLEXITY_API_KEY !== 'YOK') {
                const p_prompt = `Geçmişte potansiyeli olmayan "${urun.urun_adi}" ürününü CANLI ve GELECEK odaklı tara.
                1. Son günlerde bu ölü ürün dirildi mi (şelale yayılımı oldu mu)?
                2. 3-5 Günlük E-Ticaret Gelecek Projeksiyonu ne gösteriyor? Markalar bunu birden üretip piyasaya vuracak mı?
                Bize net gerçekleri anlat. Tahmin değil, pazar okuması yap.`;

                const options = {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "sonar-reasoning",
                        messages: [{ role: "user", content: p_prompt }]
                    })
                };

                try {
                    const fetch = (await import('node-fetch')).default;
                    const p_res = await fetch('https://api.perplexity.ai/chat/completions', options);
                    const p_data = await p_res.json();
                    if (p_data.choices) perplexityRaporu = p_data.choices[0].message.content;
                } catch (perr) { }
            }

            await telemetriAt(65, `[ANALİZ] "${urun.urun_adi}" verileri çekildi. Yargıç kararı bekleniyor...`);

            let yeniKarar = urun.ai_satis_karari;
            let dirilisOlduMu = false;

            if (perplexityRaporu) {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const g_prompt = `Şu raporu oku: "${perplexityRaporu}". Eskiden durumu: "${urun.ai_satis_karari}".
                Eğer 3-5 günlük projeksiyon 'dikey yükseliş', 'yeniden trend oldu' diyorsa ÇOK_SATAR onayı ver.
                JSON Dön: { "guncel_durum": "ÖLÜ/YÜKSELİŞTE", "tahmin_tutmus_mu": true/false, "yeni_satis_karari": "SATMAZ/İZLE/ÇOK_SATAR", "kisa_ozet": "..." }`;

                try {
                    const g_res = await model.generateContent(g_prompt);
                    const analiz = JSON.parse(g_res.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

                    gercekDurum = analiz.guncel_durum;
                    yeniKarar = analiz.yeni_satis_karari === 'BİNGO' ? 'ÇOK_SATAR' : analiz.yeni_satis_karari;
                    dirilisOlduMu = (urun.ai_satis_karari === 'SATMAZ' || urun.ai_satis_karari === 'İZLE') && yeniKarar === 'ÇOK_SATAR';

                    if (analiz.tahmin_tutmus_mu) dogruTahminSayisi++;

                    guncellemeler.push({ isim: urun.urun_adi, dirilis: dirilisOlduMu });

                    // Sentinel sistemin gerçek kalbi, telemetri onayını Sentinel basacak
                    if (dirilisOlduMu) {
                        const yorum = `[ZAMAN MAKİNESİ / BİLEŞİK PROJEKSİYON] 3-5 günlük gelecek taramasında eski ölü ürünün DİRİLDİĞİ saptandı.`;
                        await supabase.from('b1_arge_products').update({ ai_satis_karari: 'ÇOK_SATAR', hermania_karar_yorumu: yorum }).eq('id', urun.id);
                        await telemetriAt(85, `[DİRİLİŞ] 🔥 "${urun.urun_adi}" dikey patlama yaptı ve diriltildi!`);
                    }
                } catch (e) { }
            }
        }

        const mlOrani = Math.round((dogruTahminSayisi / (eskiUrunler.length || 1)) * 100);
        await telemetriAt(100, `[GÖREV BİTTİ] Zaman Makinesi ve 3-5 Günlük Gelecek Projeksiyonu Bitti. ML: %${mlOrani}`, 'onaylandı');

        return { mlOrani, guncellemeler };

    } catch (e) {
        console.error(`[BOT 6 AĞIR HATA] Şebeke Çöküşü: ${e.message}`);
        await telemetriAt(0, `[ÇÖKME] Sistem Hatası: ${e.message}`, 'INFAZ_EDILDI');
        throw e;
    }
}

module.exports = { bot6GolgeZamanMakinesi };
