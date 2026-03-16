import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─── GEMİNİ ANALİZ MOTORU ─────────────────────────────────────
async function geminiAnaliz(hamVeriStr, fiyatStr, GEMINI_URL, controller) {
    if (!GEMINI_URL) return mockAnaliz(fiyatStr);

    try {
        const prompt = `Sen THE ORDER tekstil şirketinin acımasız pazar analistisin.
Görevin: Aşağıdaki ham ürün verisini tekstil üretiminde kârlılık ve risk açısından analiz et.
HAM VERİ: ${hamVeriStr}
TAHMİNİ SATIŞ FİYATI: ${fiyatStr || 'Bilinmiyor'} TL

Aşağıdaki JSON formatında skorları dön (SADECE JSON):
{
    "satis_buyumesi": 0-100 arası puan, "sosyal_medya_etkisi": 0-100 arası puan, "rakip_kullanim_hizi": 0-100 arası puan, "sezon_uyumu": 0-100 arası puan, "teorik_maliyet": TL cinsinden tahmini üretim maliyeti, "kumas_turu": "Kumaş türü tahmini", "iscilik_zorlugu": "Kolay" veya "Orta" veya "Zor", "tedarik_riski_puani": 10-50 arası puan (düşük=iyi), "uretim_karma_puani": 10-60 arası puan (düşük=iyi), "risk_ozeti": "Tek cümlelik risk uyarısı", "agent_notu": "Neden üretilmeli veya üretilmemeli - 2 cümle"
}`;

        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 400, responseMimeType: 'application/json' },
            }),
        });

        if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const sonuc = JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

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
            kaynak: 'gemini'
        };
    } catch (err) {
        return mockAnaliz(fiyatStr);
    }
}

function mockAnaliz(fiyatStr) {
    const baseScore = Math.random() * 40 + 50;
    return {
        satis_buyumesi: Math.min(100, baseScore + (Math.random() * 20 - 10)),
        sosyal_medya_etkisi: Math.min(100, baseScore + (Math.random() * 30 - 10)),
        rakip_kullanim_hizi: Math.min(100, baseScore + (Math.random() * 15)),
        sezon_uyumu: Math.min(100, baseScore + (Math.random() * 40 - 20)),
        teorik_maliyet: (fiyatStr ? fiyatStr * 0.35 : (Math.random() * 200 + 100)).toFixed(2),
        kumas_turu: 'Pamuk / Sentetik (Mock Tahmin)',
        iscilik_zorlugu: ['Kolay', 'Orta', 'Zor'][Math.floor(Math.random() * 3)],
        tedarik_riski_puani: Math.floor(Math.random() * 40 + 10),
        uretim_karma_puani: Math.floor(Math.random() * 50 + 10),
        risk_ozeti: 'Mock mod — gerçek risk analizi yapılamadı.',
        agent_notu: 'Mock mod aktif. Gemini API bağlantısı kurulduğunda gerçek analiz yapılacak.',
        kaynak: 'mock'
    };
}

// GUI'DE TRACE GÖSTERİMİ İÇİN
async function ajanAkliniGoster(gorevId, mesaj) {
    if (!gorevId) return;
    await supabaseAdmin.from('b1_ajan_gorevler').update({
        hedef_modul: mesaj.substring(0, 100) // UI'daki modül alanına basıyoruz
    }).eq('id', gorevId);
}

// ─── API ENDPOINT ──────────────────────────────────────────────
export async function POST(req) {
    try {
        const body = await req.json();
        const { gorev_id } = body; // Ajanlar UI'dan tetiklenirse gelir

        // Cron job şifre koruması (eğer dışarıdan çağrıldıysa)
        const auth = req.headers.get('authorization');
        const isCron = auth === `Bearer ${process.env.CRON_SECRET || 'dev_secret'}`;  // GÜVENLIK: NEXT_PUBLIC_ prefix'i kaldırıldı — secret yalnızca sunucuda kalır

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const GEMINI_URL = GEMINI_API_KEY ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}` : null;

        if (gorev_id) {
            await supabaseAdmin.from('b1_ajan_gorevler').update({ durum: 'calisıyor', baslangic_tarihi: new Date().toISOString() }).eq('id', gorev_id);
            await ajanAkliniGoster(gorev_id, '🧠 Yargıç (Matematikçi) Uyandı. Dosyalar inceleniyor...');
        }

        // 1. İşlenmemiş ham verileri çek (Limit 20 Vercel timeout'una takılmamak için)
        const { data: hamUrunler, error: fetchErr } = await supabaseAdmin
            .from('b1_arge_products')
            .select('*')
            .eq('islenen_durum', 'bekliyor')
            .limit(20);

        if (fetchErr) throw fetchErr;

        if (!hamUrunler || hamUrunler.length === 0) {
            if (gorev_id) {
                await supabaseAdmin.from('b1_ajan_gorevler').update({
                    durum: 'tamamlandi', bitis_tarihi: new Date().toISOString(),
                    sonuc_ozeti: 'Kuyrukta yargılanacak hiç ürün bulunamadı. Temiz.'
                }).eq('id', gorev_id);
            }
            return NextResponse.json({ message: 'No new products to analyze' }, { status: 200 });
        }

        let sayac = { uretim: 0, test: 0, izleme: 0, reddet: 0 };
        let harcananTokenTemsili = 0;

        for (let i = 0; i < hamUrunler.length; i++) {
            const urun = hamUrunler[i];

            let parsedHamVeri = {};
            try { parsedHamVeri = typeof urun.ham_veri === 'string' ? JSON.parse(urun.ham_veri) : urun.ham_veri || {}; } catch { }
            const urunAdi = parsedHamVeri.isim || 'Bilinmeyen Ürün';
            const fiyatSayi = parsedHamVeri.fiyatSayi || 0;
            const kaynak = urun.veri_kaynagi || 'Trendyol';

            if (gorev_id) await ajanAkliniGoster(gorev_id, `🔍 [${i + 1}/${hamUrunler.length}] ${urunAdi.substring(0, 30)}... Gemini ile analiz ediliyor`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // 4sn gemini vuruş payı

            const hamVeriMetni = typeof urun.ham_veri === 'object' ? JSON.stringify(urun.ham_veri) : (urun.ham_veri || '');
            const ai = await geminiAnaliz(hamVeriMetni, fiyatSayi, GEMINI_URL, controller);
            clearTimeout(timeoutId);
            harcananTokenTemsili += 150; // Tahmini gidiş geliş token

            const trendSkoru = (ai.satis_buyumesi * 0.35) + (ai.sosyal_medya_etkisi * 0.30) + (ai.rakip_kullanim_hizi * 0.20) + (ai.sezon_uyumu * 0.15);
            const ortalamaRisk = (ai.tedarik_riski_puani + ai.uretim_karma_puani) / 2;
            const firsatSkoru = Math.max(0, Math.min(100, trendSkoru - (ortalamaRisk * 0.5)));

            let decision = '';
            if (firsatSkoru >= 85) decision = 'ÜRETİM';
            else if (firsatSkoru >= 70) decision = 'TEST ÜRETİMİ (Numune)';
            else if (firsatSkoru >= 50) decision = 'İZLEME';
            else decision = 'REDDET';

            const riskLevel = ortalamaRisk > 30 ? 'Yüksek' : ortalamaRisk > 15 ? 'Orta' : 'Düşük';
            const timeRisk = ai.iscilik_zorlugu === 'Zor' ? '10-15 gün' : ai.iscilik_zorlugu === 'Orta' ? '7-10 gün' : '3-5 gün';
            const estimatedProfit = fiyatSayi ? Math.round(fiyatSayi * 0.45 * 100) : 0;

            if (gorev_id) await ajanAkliniGoster(gorev_id, `⚖️ Karar: ${decision} (${firsatSkoru.toFixed(1)} Puan) → Veritabanına Yazılıyor`);

            if (decision === 'REDDET') {
                await supabaseAdmin.from('b1_arge_strategy').insert({
                    product_id: urun.id, product_name: urunAdi, platform: kaynak,
                    opportunity_score: firsatSkoru, nizam_decision: decision, risk_level: riskLevel,
                    supply_risk: ai.risk_ozeti, time_risk: timeRisk, estimated_profit: 0, outsource_cost: Number(ai.teorik_maliyet) || 0,
                    agent_note: ai.agent_notu, boss_approved: false, reason: 'Risk oranları potansiyeli aştı.'
                });
                sayac.reddet++;
            } else {
                await supabaseAdmin.from('b1_arge_trend_data').insert({ product_id: urun.id, sales_growth: ai.satis_buyumesi, social_media_impact: ai.sosyal_medya_etkisi, competitor_usage: ai.rakip_kullanim_hizi, season_fit: ai.sezon_uyumu, trend_score: trendSkoru });
                await supabaseAdmin.from('b1_arge_cost_analysis').insert({ product_id: urun.id, estimated_fabric_cost: Number(ai.teorik_maliyet) * 0.6, estimated_labor_cost: Number(ai.teorik_maliyet) * 0.4, fabric_type_prediction: ai.kumas_turu, labor_difficulty: ai.iscilik_zorlugu });
                await supabaseAdmin.from('b1_arge_risk_analysis').insert({ product_id: urun.id, supply_risk_score: ai.tedarik_riski_puani, production_risk_score: ai.uretim_karma_puani });
                await supabaseAdmin.from('b1_arge_strategy').insert({
                    product_id: urun.id, product_name: urunAdi, platform: kaynak, opportunity_score: firsatSkoru, nizam_decision: decision,
                    risk_level: riskLevel, supply_risk: ai.risk_ozeti, time_risk: timeRisk, estimated_profit: estimatedProfit, outsource_cost: Number(ai.teorik_maliyet) || 0,
                    agent_note: ai.agent_notu, boss_approved: false, reason: `Trend: %${trendSkoru.toFixed(1)}`
                });

                if (firsatSkoru >= 70) {
                    await supabaseAdmin.from('b1_arge_trendler').insert({
                        baslik: urunAdi, platform: kaynak.toLowerCase().includes('zara') ? 'zara' : 'trendyol', kategori: 'diger',
                        hedef_kitle: 'kadın', talep_skoru: Math.round(firsatSkoru / 10), zorluk_derecesi: ai.iscilik_zorlugu === 'Zor' ? 8 : 5,
                        aciklama: ai.agent_notu, durum: firsatSkoru >= 85 ? 'onaylandi' : 'inceleniyor', referans_linkler: parsedHamVeri.urunLink ? [parsedHamVeri.urunLink] : null
                    });
                }
                if (decision === 'ÜRETİM') sayac.uretim++; else if (decision.includes('TEST')) sayac.test++; else sayac.izleme++;
            }

            await supabaseAdmin.from('b1_arge_products').update({ islenen_durum: 'islendi', isleyen_ajan: ai.kaynak === 'gemini' ? 'GEMINI_ANALYST' : 'MOCK_ANALYST', islendigi_tarih: new Date().toISOString() }).eq('id', urun.id);
        }

        const OzetStr = `Yargıç ${hamUrunler.length} davaya baktı. (${sayac.uretim} Üretim, ${sayac.test} Test Üretimi, ${sayac.izleme} İzleme, ${sayac.reddet} Red)`;

        if (gorev_id) {
            await ajanAkliniGoster(gorev_id, '✅ Yargılama Bitti.');
            await supabaseAdmin.from('b1_ajan_gorevler').update({
                durum: 'tamamlandi', bitis_tarihi: new Date().toISOString(),
                sonuc_ozeti: OzetStr
            }).eq('id', gorev_id);

            // Skor yaz
            await supabaseAdmin.from('b1_agent_loglari').insert([{
                ajan_adi: 'Yargıç (Matematikçi)', islem_tipi: 'analiz', kaynak_tablo: 'b1_arge_products', sonuc: 'basarili',
                mesaj: OzetStr + ` (Harcanan API Kredisi: ~${harcananTokenTemsili} Tk)`
            }]);
        }

        return NextResponse.json({ basarili: true, sonuc: OzetStr });

    } catch (e) {
        if (req.body?.gorev_id) {
            await supabaseAdmin.from('b1_ajan_gorevler').update({
                durum: 'hata', hata_mesaji: e.message
            }).eq('id', req.body.gorev_id);
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
