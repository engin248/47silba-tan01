export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// â”€â”€â”€ BATCH GEMÄ°NÄ° ANALÄ°Z MOTORU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function bulkGeminiAnaliz(is_data_array, GEMINI_URL, controller) {
    if (!GEMINI_URL) return { error: 'Gemini API anahtarÄ± yok', results: [] };

    try {
        const pazar_urunleri = is_data_array.map(i => ({ id: i.kuyruk_id, ad: i.urunAdi, fiyat: i.fiyatSayi, data: i.ham_veri }));

        const prompt = `Sen THE ORDER tekstil ÅŸirketinin acÄ±masÄ±z pazar analistisin. 
AÅŸaÄŸÄ±daki liste, ${is_data_array.length} adet farklÄ± e-ticaret (Trendyol/Zara vb.) Ã¼rÃ¼n verisidir.
GÃ¶rev: Bu Ã¼rÃ¼nlerin HER BÄ°RÄ°NÄ° tekstil Ã¼retiminde kÃ¢rlÄ±lÄ±k ve risk aÃ§Ä±sÄ±ndan analiz et. SonuÃ§larÄ± kesinlikle aÅŸaÄŸÄ±daki formatta YALNIZCA BÄ°R JSON LÄ°STESÄ° (Array) olarak dÃ¶n. Ä°Ã§ine ekstra aÃ§Ä±klama ekleme.
[{
    "kuyruk_id": "Buraya Listedeki ÃœrÃ¼n ID'sini Yaz",
    "satis_buyumesi": 0-100 arasÄ± puan, "sosyal_medya_etkisi": 0-100 arasÄ± puan, "rakip_kullanim_hizi": 0-100 arasÄ± puan, "sezon_uyumu": 0-100 arasÄ± puan, "teorik_maliyet": TL cinsinden Ã¼retim maliyeti tahmini, "kumas_turu": "KumaÅŸ tÃ¼rÃ¼", "iscilik_zorlugu": "Kolay" veya "Orta" veya "Zor", "tedarik_riski_puani": 10-50 arasÄ± (dÃ¼ÅŸÃ¼k iyi), "uretim_karma_puani": 10-60 arasÄ± (dÃ¼ÅŸÃ¼k iyi), "risk_ozeti": "KÄ±sa risk uyarÄ±sÄ±", "agent_notu": "KÄ±sa Ã¼retilmeli mi analizi"
}]

HAM ÃœRÃœN LÄ°STESÄ°:
${JSON.stringify(pazar_urunleri)}`;

        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 2000, responseMimeType: 'application/json' },
            }),
        });

        if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        const sonuclarListesi = JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

        const totalTokens = data?.usage?.total_tokens || 1000;
        const resultTokenCost = Math.round(totalTokens / is_data_array.length);

        return { error: null, results: sonuclarListesi, resultTokenCost };
    } catch (err) {
        return { error: err.message, results: [] };
    }
}

// â”€â”€â”€ API ENDPOINT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(req) {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const GEMINI_URL = GEMINI_API_KEY ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}` : null;

        const { data: yargic_isleri, error: kuyrukErr } = await supabaseAdmin
            .from('b1_ai_is_kuyrugu')
            .select('*')
            .eq('istek_tipi', 'yargic_analizi')
            .eq('durum', 'bekliyor')
            .limit(10);

        if (kuyrukErr) throw kuyrukErr;

        if (!yargic_isleri || yargic_isleri.length === 0) {
            return NextResponse.json({ message: 'Ä°ÅŸlenecek kuyruk verisi yok.', basarili: true });
        }

        const islerimIDleri = yargic_isleri.map(j => j.id);
        await supabaseAdmin.from('b1_ai_is_kuyrugu').update({ durum: 'calisÄ±yor', islenme_tarihi: new Date().toISOString() }).in('id', islerimIDleri);

        const veriPaketi = yargic_isleri.map(j => ({
            kuyruk_id: j.id,
            urun_id: j.istek_datasi.urun_id,
            urunAdi: j.istek_datasi.urunAdi,
            fiyatSayi: j.istek_datasi.fiyatSayi,
            kaynak: j.istek_datasi.kaynak,
            ham_veri: j.istek_datasi.ham_veri
        }));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const aiBatchRes = await bulkGeminiAnaliz(veriPaketi, GEMINI_URL, controller);
        clearTimeout(timeoutId);

        if (aiBatchRes.error) {
            await supabaseAdmin.from('b1_ai_is_kuyrugu').update({ durum: 'hata', sonuc_datasi: { hata: aiBatchRes.error } }).in('id', islerimIDleri);
            throw new Error(`Toplu Gemini Analizi Ã‡Ã¶ktÃ¼: ${aiBatchRes.error}`);
        }

        for (const ai of aiBatchRes.results) {
            const isID = ai.kuyruk_id;
            const orgData = veriPaketi.find(v => v.kuyruk_id === isID);
            if (!orgData) continue;

            const trendSkoru = ((ai.satis_buyumesi || 50) * 0.35) + ((ai.sosyal_medya_etkisi || 50) * 0.30) + ((ai.rakip_kullanim_hizi || 50) * 0.20) + ((ai.sezon_uyumu || 50) * 0.15);
            const ortalamaRisk = ((ai.tedarik_riski_puani || 25) + (ai.uretim_karma_puani || 30)) / 2;
            const firsatSkoru = Math.max(0, Math.min(100, trendSkoru - (ortalamaRisk * 0.5)));

            let decision = '';
            if (firsatSkoru >= 85) decision = 'ÃœRETÄ°M';
            else if (firsatSkoru >= 70) decision = 'TEST ÃœRETÄ°MÄ° (Numune)';
            else if (firsatSkoru >= 50) decision = 'Ä°ZLEME';
            else decision = 'REDDET';

            const riskLevel = ortalamaRisk > 30 ? 'YÃ¼ksek' : ortalamaRisk > 15 ? 'Orta' : 'DÃ¼ÅŸÃ¼k';
            let timeRiskStr = '3-5 gÃ¼n';
            if (ai.iscilik_zorlugu === 'Zor') timeRiskStr = '10-15 gÃ¼n';
            else if (ai.iscilik_zorlugu === 'Orta') timeRiskStr = '7-10 gÃ¼n';

            const estimatedProfit = orgData.fiyatSayi ? Math.round(orgData.fiyatSayi * 0.45 * 100) : 0;

            if (decision === 'REDDET') {
                await supabaseAdmin.from('b1_arge_strategy').insert({
                    product_id: orgData.urun_id, product_name: orgData.urunAdi, platform: orgData.kaynak,
                    opportunity_score: firsatSkoru, nizam_decision: decision, risk_level: riskLevel,
                    supply_risk: ai.risk_ozeti || '', time_risk: timeRiskStr, estimated_profit: 0, outsource_cost: Number(ai.teorik_maliyet) || 0,
                    agent_note: ai.agent_notu || '', boss_approved: false, reason: 'Risk oranlarÄ± potansiyeli aÅŸtÄ±.'
                });
            } else {
                await supabaseAdmin.from('b1_arge_trend_data').insert({ product_id: orgData.urun_id, sales_growth: ai.satis_buyumesi, social_media_impact: ai.sosyal_medya_etkisi, competitor_usage: ai.rakip_kullanim_hizi, season_fit: ai.sezon_uyumu, trend_score: trendSkoru });
                await supabaseAdmin.from('b1_arge_cost_analysis').insert({ product_id: orgData.urun_id, estimated_fabric_cost: Number(ai.teorik_maliyet) * 0.6, estimated_labor_cost: Number(ai.teorik_maliyet) * 0.4, fabric_type_prediction: ai.kumas_turu || '', labor_difficulty: ai.iscilik_zorlugu || 'Orta' });
                await supabaseAdmin.from('b1_arge_risk_analysis').insert({ product_id: orgData.urun_id, supply_risk_score: ai.tedarik_riski_puani, production_risk_score: ai.uretim_karma_puani });

                await supabaseAdmin.from('b1_arge_strategy').insert({
                    product_id: orgData.urun_id, product_name: orgData.urunAdi, platform: orgData.kaynak, opportunity_score: firsatSkoru, nizam_decision: decision,
                    risk_level: riskLevel, supply_risk: ai.risk_ozeti || '', time_risk: timeRiskStr, estimated_profit: estimatedProfit, outsource_cost: Number(ai.teorik_maliyet) || 0,
                    agent_note: ai.agent_notu || '', boss_approved: false, reason: `Trend: %${trendSkoru.toFixed(1)}`
                });

                if (firsatSkoru >= 70) {
                    await supabaseAdmin.from('b1_arge_trendler').insert({
                        baslik: orgData.urunAdi, platform: orgData.kaynak.toLowerCase().includes('zara') ? 'zara' : 'trendyol', kategori: 'diger',
                        hedef_kitle: 'kadÄ±n', talep_skoru: Math.round(firsatSkoru / 10), zorluk_derecesi: ai.iscilik_zorlugu === 'Zor' ? 8 : 5,
                        aciklama: ai.agent_notu || '', durum: firsatSkoru >= 85 ? 'inceleniyor' : 'inceleniyor', referans_linkler: null
                    });
                }
            }

            await supabaseAdmin.from('b1_arge_products').update({
                islenen_durum: 'islendi',
                isleyen_ajan: 'BATCH_GEMINI',
                islendigi_tarih: new Date().toISOString()
            }).eq('id', orgData.urun_id);

            await supabaseAdmin.from('b1_ai_is_kuyrugu').update({
                durum: 'tamamlandi',
                sonuc_datasi: ai,
                ai_maliyeti_token: aiBatchRes.resultTokenCost
            }).eq('id', isID);
        }

        return NextResponse.json({
            basarili: true,
            mesaj: `${aiBatchRes.results.length} gÃ¶rev TEK BÄ°R API BULK (BATCH) paketi ile hesaplandÄ± ve daÄŸÄ±tÄ±ldÄ±.`
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
