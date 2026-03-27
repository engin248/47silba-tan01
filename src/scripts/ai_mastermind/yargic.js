// =========================================================================
// 2. EKİP: "MATEMATİKÇİ VE KARAR YARGICI (The Analyst / AI Mastermind)"
// GÖREVİ: 'b1_arge_products' tablosundaki ham veriyi Gemini AI ile analiz et,
//          skorla, karar ver ve veritabanına dağıt.
// ÇIKTI:  b1_arge_strategy (Test Paneli) + b1_arge_trendler (Ana Panel + M2 + Kalıphane)
// SINIR:  Sadece b1_arge_* tablolarında okuma ve yazma. UI veya Karargaha DOKUNAMAZ.
// HIZ:    Gemini çağrısına 3sn timeout. Timeout → mock fallback. Sistem asla donmaz.
// =========================================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env.local') });

// ─── GÜVENLİK DÜZELTME: Service Role Key kullanılıyor ─────────
// ESKİ: NEXT_PUBLIC_SUPABASE_ANON_KEY (RLS kısıtlamalarına takılır)
// YENİ: SUPABASE_SERVICE_ROLE_KEY (sunucu tarafı script — güvenle kullanılabilir)
// ─── SUPABASE BAĞLANTISI (Service Role Key — Ölü İşçi ile aynı standart) ───
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {

}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

// ─── GEMİNİ API AYARLARI ──────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = GEMINI_API_KEY
    ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`
    : null;

// ─── GEMİNİ ANALİZ MOTORU ─────────────────────────────────────
async function geminiAnaliz(hamVeriStr, fiyatStr) {
    // API key yoksa → direkt mock
    if (!GEMINI_URL) {

        return mockAnaliz(fiyatStr);
    }

    // 3 SANİYE HIZ KALKANI
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const prompt = `Sen THE ORDER tekstil şirketinin acımasız pazar analistisin.
Görevin: Aşağıdaki ham ürün verisini tekstil üretiminde kârlılık ve risk açısından analiz et.

HAM VERİ:
${hamVeriStr}

TAHMİNİ SATIŞ FİYATI: ${fiyatStr || 'Bilinmiyor'} TL

Aşağıdaki JSON formatında skorları dön (SADECE JSON, açıklama yazma):
{
    "satis_buyumesi": 0-100 arası puan,
    "sosyal_medya_etkisi": 0-100 arası puan,
    "rakip_kullanim_hizi": 0-100 arası puan,
    "sezon_uyumu": 0-100 arası puan,
    "teorik_maliyet": TL cinsinden tahmini üretim maliyeti,
    "kumas_turu": "Kumaş türü tahmini",
    "iscilik_zorlugu": "Kolay" veya "Orta" veya "Zor",
    "tedarik_riski_puani": 10-50 arası puan (düşük=iyi),
    "uretim_karma_puani": 10-60 arası puan (düşük=iyi),
    "risk_ozeti": "Tek cümlelik risk uyarısı",
    "agent_notu": "Neden üretilmeli veya üretilmemeli - kısa 2 cümle analiz"
}`;

        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 400,
                    responseMimeType: 'application/json',
                },
            }),
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const sonuc = JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

        // Güvenlik: Tüm değerleri sayı sınırlarına kilitle
        return {
            satis_buyumesi: Math.min(100, Math.max(0, Number(sonuc.satis_buyumesi) || 50)),
            sosyal_medya_etkisi: Math.min(100, Math.max(0, Number(sonuc.sosyal_medya_etkisi) || 50)),
            rakip_kullanim_hizi: Math.min(100, Math.max(0, Number(sonuc.rakip_kullanim_hizi) || 50)),
            sezon_uyumu: Math.min(100, Math.max(0, Number(sonuc.sezon_uyumu) || 50)),
            teorik_maliyet: Number(sonuc.teorik_maliyet) || (fiyatStr ? fiyatStr * 0.35 : 150),
            kumas_turu: String(sonuc.kumas_turu || 'Bilinmiyor (Gemini Tahmini)'),
            iscilik_zorlugu: ['Kolay', 'Orta', 'Zor'].includes(sonuc.iscilik_zorlugu) ? sonuc.iscilik_zorlugu : 'Orta',
            tedarik_riski_puani: Math.min(50, Math.max(10, Number(sonuc.tedarik_riski_puani) || 25)),
            uretim_karma_puani: Math.min(60, Math.max(10, Number(sonuc.uretim_karma_puani) || 30)),
            risk_ozeti: String(sonuc.risk_ozeti || 'Risk analizi yapılamadı.'),
            agent_notu: String(sonuc.agent_notu || 'Detaylı analiz mevcut değil.'),
            kaynak: 'gemini' // İzleme için
        };
    } catch (err) {
        clearTimeout(timeout);
        const sebep = err.name === 'AbortError' ? 'TIMEOUT (3sn)' : err.message;
        console.warn(`[YARGIÇ] ⚠️ Gemini timeout/hata: ${sebep} → Mock analiz devreye girdi`);
        return { ...mockAnaliz(fiyatStr), _mockSebep: sebep }; // [U-12 FIX] mock olduğunu işaretle
    }
}

// ─── YEDEK MOTOR (MOCK) — Gemini çökerse devreye girer ────────
function mockAnaliz(fiyatStr) {
    const baseScore = Math.random() * 40 + 50;
    return {
        satis_buyumesi: Math.min(100, baseScore + (Math.random() * 20 - 10)),
        sosyal_medya_etkisi: Math.min(100, baseScore + (Math.random() * 30 - 10)),
        rakip_kullanim_hizi: Math.min(100, baseScore + (Math.random() * 15)),
        sezon_uyumu: Math.min(100, baseScore + (Math.random() * 40 - 20)),
        teorik_maliyet: (fiyatStr ? fiyatStr * 0.35 : (Math.random() * 200 + 100)).toFixed(2),
        kumas_turu: 'Pamuk / Sentetik Karışımı (Mock Tahmin)',
        iscilik_zorlugu: ['Kolay', 'Orta', 'Zor'][Math.floor(Math.random() * 3)],
        tedarik_riski_puani: Math.floor(Math.random() * 40 + 10),
        uretim_karma_puani: Math.floor(Math.random() * 50 + 10),
        risk_ozeti: 'Mock mod — gerçek risk analizi yapılamadı.',
        agent_notu: 'Mock mod aktif. Gemini API bağlantısı kurulduğunda gerçek analiz yapılacak.',
        kaynak: 'mock'
    };
}

// ─── ANA YARGILAMA MOTORU ─────────────────────────────────────
async function yargilamayiBaslat() {


    try {
        // 1. İşlenmemiş ham verileri çek
        // [#12 FIX] 'mock_islendi' da sorguya eklendi — mock kararlar yeniden işlenir
        const { data: hamUrunler, error: fetchErr } = await supabase
            .from('b1_arge_products')
            .select('*')
            .in('islenen_durum', ['bekliyor', 'mock_islendi'])
            .limit(50);

        if (fetchErr) throw fetchErr;
        if (!hamUrunler || hamUrunler.length === 0) {

            return;
        }

        let sayac = { uretim: 0, test: 0, izleme: 0, reddet: 0 };

        for (const urun of hamUrunler) {
            let parsedHamVeri = {};
            try {
                if (urun.ham_veri) {
                    parsedHamVeri = typeof urun.ham_veri === 'string' ? JSON.parse(urun.ham_veri) : urun.ham_veri;
                }
            } catch { /* ham veri parse edilemedi */ }

            if (!parsedHamVeri) parsedHamVeri = {}; // null koruması

            // ─── GEMİNİ ANALİZ ÇAĞRISI ─────────────────────────
            const hamVeriMetni = typeof urun.ham_veri === 'object' ? JSON.stringify(urun.ham_veri) : (urun.ham_veri || '');
            const ai = await geminiAnaliz(hamVeriMetni, parsedHamVeri.fiyatSayi || 0);

            // ─── THE ORDER ANAYASASI: TREND SKORU ───────────────
            const trendSkoru =
                (ai.satis_buyumesi * 0.35) +
                (ai.sosyal_medya_etkisi * 0.30) +
                (ai.rakip_kullanim_hizi * 0.20) +
                (ai.sezon_uyumu * 0.15);

            // ─── THE ORDER ANAYASASI: FIRSAT SKORU ──────────────
            const ortalamaRisk = (ai.tedarik_riski_puani + ai.uretim_karma_puani) / 2;
            const firsatSkoru = Math.max(0, Math.min(100, trendSkoru - (ortalamaRisk * 0.5)));

            // ─── KARAR MEKANİZMASI ──────────────────────────────
            let decision = '';
            if (firsatSkoru >= 85) decision = 'ÜRETİM';
            else if (firsatSkoru >= 70) decision = 'TEST ÜRETİMİ (Numune)';
            else if (firsatSkoru >= 50) decision = 'İZLEME';
            else decision = 'REDDET';

            // Risk seviyesi hesapla
            const riskLevel = ortalamaRisk > 30 ? 'Yüksek' : ortalamaRisk > 15 ? 'Orta' : 'Düşük';

            // Zaman riski
            const timeRisk = ai.iscilik_zorlugu === 'Zor'
                ? 'Karmaşık dikim — 10-15 gün'
                : ai.iscilik_zorlugu === 'Orta'
                    ? 'Standart dikim — 7-10 gün'
                    : 'Basit dikim — 3-5 gün';

            // Tahmini kâr
            const estimatedProfit = parsedHamVeri.fiyatSayi
                ? Math.round(parsedHamVeri.fiyatSayi * 0.45 * 100) // 100 adet üzerinden
                : 0;

            const urunAdi = parsedHamVeri.isim || 'Bilinmeyen Ürün';
            const kaynak = urun.veri_kaynagi || 'Trendyol';

            // ─── VERİTABANI YAZMA İŞLEMLERİ ─────────────────────

            if (decision === 'REDDET') {
                // Reddedilenlere minimal kayıt
                await supabase.from('b1_arge_strategy').insert({
                    product_id: urun.id,
                    product_name: urunAdi,
                    platform: kaynak,
                    opportunity_score: firsatSkoru,
                    nizam_decision: decision,
                    risk_level: riskLevel,
                    supply_risk: ai.risk_ozeti,
                    time_risk: timeRisk,
                    estimated_profit: 0,
                    outsource_cost: Number(ai.teorik_maliyet) || 0,
                    agent_note: ai.agent_notu,
                    boss_approved: false,
                    reason: 'Maliyet ve risk oranları pazar potansiyelini aştı.'
                });
                sayac.reddet++;
            } else {
                // ─── BAŞARILI SENARYO: TÜM TABLOLARA MÜHÜRLENİR ───

                // 1. Trend Tablosu
                await supabase.from('b1_arge_trend_data').insert({
                    product_id: urun.id,
                    sales_growth: ai.satis_buyumesi,
                    social_media_impact: ai.sosyal_medya_etkisi,
                    competitor_usage: ai.rakip_kullanim_hizi,
                    season_fit: ai.sezon_uyumu,
                    trend_score: trendSkoru
                });

                // 2. Maliyet Tablosu
                await supabase.from('b1_arge_cost_analysis').insert({
                    product_id: urun.id,
                    estimated_fabric_cost: Number(ai.teorik_maliyet) * 0.6,
                    estimated_labor_cost: Number(ai.teorik_maliyet) * 0.4,
                    fabric_type_prediction: ai.kumas_turu,
                    labor_difficulty: ai.iscilik_zorlugu
                });

                // 3. Risk Tablosu
                await supabase.from('b1_arge_risk_analysis').insert({
                    product_id: urun.id,
                    supply_risk_score: ai.tedarik_riski_puani,
                    production_risk_score: ai.uretim_karma_puani
                });

                // 4. Strateji Tablosu (TEST PANELİ — 10 alan tam)
                await supabase.from('b1_arge_strategy').insert({
                    product_id: urun.id,
                    product_name: urunAdi,
                    platform: kaynak,
                    opportunity_score: firsatSkoru,
                    nizam_decision: decision,
                    risk_level: riskLevel,
                    supply_risk: ai.risk_ozeti,
                    time_risk: timeRisk,
                    estimated_profit: estimatedProfit,
                    outsource_cost: Number(ai.teorik_maliyet) || 0,
                    agent_note: ai.agent_notu,
                    boss_approved: false,
                    reason: `Trend: %${trendSkoru.toFixed(1)} | AI: ${ai.kaynak}`
                });

                // 5. 🌉 ANA PANEL KÖPRÜSÜ — b1_arge_trendler (skor ≥70 → /arge + M2 + Kalıphane)
                if (firsatSkoru >= 70) {
                    await supabase.from('b1_arge_trendler').insert({
                        baslik: urunAdi,
                        platform: kaynak.toLowerCase().includes('zara') ? 'zara' : 'trendyol',
                        kategori: 'diger',
                        hedef_kitle: 'kadın',
                        talep_skoru: Math.round(firsatSkoru / 10),
                        zorluk_derecesi: ai.iscilik_zorlugu === 'Zor' ? 8 : ai.iscilik_zorlugu === 'Orta' ? 5 : 3,
                        aciklama: ai.agent_notu || `Fırsat Skoru: ${firsatSkoru.toFixed(1)}/100`,
                        durum: firsatSkoru >= 85 ? 'onaylandi' : 'inceleniyor',
                        referans_linkler: parsedHamVeri.urunLink ? [parsedHamVeri.urunLink] : null
                    });

                }

                // Sayaç
                if (decision === 'ÜRETİM') sayac.uretim++;
                else if (decision.includes('TEST')) sayac.test++;
                else sayac.izleme++;
            }

            // Ana ürün tablosunu işaretle
            // [#12 FIX] Mock analiz 'islendi' değil 'mock_islendi' olarak işaretlenir
            // → Sonraki yargic çalışmasında yeniden işlenir, kalıcı yanlış karar kalmaz
            await supabase.from('b1_arge_products')
                .update({
                    islenen_durum: ai.kaynak === 'gemini' ? 'islendi' : 'mock_islendi',
                    isleyen_ajan: ai.kaynak === 'gemini' ? 'GEMINI_ANALYST' : 'MOCK_ANALYST',
                    islendigi_tarih: new Date().toISOString()
                })
                .eq('id', urun.id);
        }




    } catch (error) {
        console.error(`[YARGIÇ] ❌ Yargılama Hatası: ${error.message}`);
    }
}

// BU DOSYA KENDİ BAŞINA ÇALIŞACAK BİR BETİKTİR.
// Çalıştırma: node src/scripts/ai_mastermind/yargic.js
yargilamayiBaslat();
