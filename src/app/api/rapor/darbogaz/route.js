import { NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseAdmin';

// ============================================================
// DARBOĞAZ (BOTTLENECK) TEŞHİSCİSİ — MİZANET
// /api/rapor/darbogaz
//
// GET  → Mevcut darboğaz analizini döner (Dashboard için)
// POST → Kamera Vision AI snapshot'ı kabul eder (Vision Gateway)
//        Gemini Vision API ile karedeki parça adedini sayar,
//        production_orders hedefiyle karşılaştırır.
// ============================================================

const EVRE_SURELER = {
    m3_m4: { evre: 'Kalıp → Modelhane', beklenen_gun: 3 },
    m4_m5: { evre: 'Modelhane → Kesim', beklenen_gun: 2 },
    m5_m6: { evre: 'Kesim → Üretim', beklenen_gun: 1 },
};

// ─── GET: Darboğaz raporu (Dashboard) ─────────────────────────
export async function GET(req) {
    try {
        const bugun = new Date();
        const otuzGunOnce = new Date(bugun.getTime() - 30 * 86400000).toISOString();
        const sonuclar = {};

        // ─ M3→M4: Kalıp tamamlanma → Modelhane başlama süresi ─
        const { data: kaliplar } = await sb
            .from('b1_model_taslaklari')
            .select('id, model_adi, updated_at, created_at, durum, zincir_bildirim_m4')
            .not('zincir_bildirim_m4', 'is', null)
            .gte('updated_at', otuzGunOnce)
            .limit(50);

        const m3m4Sureler = (kaliplar || []).map(k => {
            const diff = (new Date(k.zincir_bildirim_m4).getTime() - new Date(k.updated_at).getTime()) / 86400000;
            return { id: k.id, model: k.model_adi, gun: parseFloat(diff.toFixed(1)) };
        }).filter(k => k.gun > 0);

        const m3m4Ort = m3m4Sureler.length
            ? m3m4Sureler.reduce((s, k) => s + k.gun, 0) / m3m4Sureler.length
            : 0;

        sonuclar.m3_m4 = {
            ...EVRE_SURELER.m3_m4,
            ortalama_gun: parseFloat(m3m4Ort.toFixed(1)),
            kayit_sayisi: m3m4Sureler.length,
            darbogaz_var: m3m4Ort > EVRE_SURELER.m3_m4.beklenen_gun,
            en_uzun: m3m4Sureler.sort((a, b) => b.gun - a.gun)[0] || null,
            tum_kayitlar: m3m4Sureler.slice(0, 10),
        };

        // ─ M4→M5: Modelhane onayı → Kesim başlama süresi ─────
        const { data: modelhane } = await sb
            .from('b1_modelhane_kayitlari')
            .select('id, model_id, updated_at, zincir_bildirim_m5')
            .not('zincir_bildirim_m5', 'is', null)
            .gte('updated_at', otuzGunOnce)
            .limit(50);

        const m4m5Sureler = (modelhane || []).map(m => {
            const diff = (new Date(m.zincir_bildirim_m5).getTime() - new Date(m.updated_at).getTime()) / 86400000;
            return { id: m.id, model_id: m.model_id, gun: parseFloat(diff.toFixed(1)) };
        }).filter(m => m.gun > 0);

        const m4m5Ort = m4m5Sureler.length
            ? m4m5Sureler.reduce((s, m) => s + m.gun, 0) / m4m5Sureler.length
            : 0;

        sonuclar.m4_m5 = {
            ...EVRE_SURELER.m4_m5,
            ortalama_gun: parseFloat(m4m5Ort.toFixed(1)),
            kayit_sayisi: m4m5Sureler.length,
            darbogaz_var: m4m5Ort > EVRE_SURELER.m4_m5.beklenen_gun,
            tum_kayitlar: m4m5Sureler.slice(0, 10),
        };

        // ─ M5→M6: Kesim bitmesi → Üretim başlama süresi ──────
        // (b1_kesim_emirleri tablosu hazır olmadığı için şimdilik production_orders'dan)
        const { data: uretimler } = await sb
            .from('production_orders')
            .select('id, model_id, start_time, planned_start_date, status')
            .not('start_time', 'is', null)
            .not('planned_start_date', 'is', null)
            .gte('start_time', otuzGunOnce)
            .limit(50);

        const m5m6Sureler = (uretimler || []).map(u => {
            const diff = (new Date(u.start_time).getTime() - new Date(u.planned_start_date).getTime()) / 86400000;
            return { id: u.id, gun: parseFloat(diff.toFixed(1)), model_id: u.model_id };
        }).filter(u => u.gun > 0);

        const m5m6Ort = m5m6Sureler.length
            ? m5m6Sureler.reduce((s, u) => s + u.gun, 0) / m5m6Sureler.length
            : 0;

        sonuclar.m5_m6 = {
            ...EVRE_SURELER.m5_m6,
            ortalama_gun: parseFloat(m5m6Ort.toFixed(1)),
            kayit_sayisi: m5m6Sureler.length,
            darbogaz_var: m5m6Ort > EVRE_SURELER.m5_m6.beklenen_gun,
            tum_kayitlar: m5m6Sureler.slice(0, 10),
        };

        // ─ Son Vision AI kamera ölçümü ────────────────────────
        const { data: sonVision } = await sb
            .from('b1_agent_loglari')
            .select('created_at, mesaj')
            .ilike('islem_tipi', 'vision_kamera%')
            .order('created_at', { ascending: false })
            .limit(1);

        // ─ Özet ──────────────────────────────────────────────
        const darbogazlar = Object.values(sonuclar).filter(e => e.darbogaz_var);

        if (darbogazlar.length > 0) {
            await sb.from('b1_agent_loglari').insert([{
                ajan_adi: 'Darboğaz Teşhiscisi',
                islem_tipi: 'darbogaz_analiz',
                kaynak_tablo: 'b1_model_taslaklari',
                sonuc: 'uyari',
                mesaj: `⚠️ ${darbogazlar.length} evrede darboğaz tespit edildi: ${darbogazlar.map(d => d.evre).join(', ')}`,
            }]);
        }

        return NextResponse.json({
            basarili: true,
            ozet: {
                toplam_evre: 3,
                darbogaz_sayisi: darbogazlar.length,
                son_vision_olcum: sonVision?.[0] || null,
            },
            evreler: sonuclar,
            tarih: new Date().toISOString(),
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ─── POST: Vision AI Gateway (Kamera Snapshot → Gemini → Sayım) ──
// Bu endpoint kameradan gelen JPEG görüntüyü base64 olarak kabul eder.
// Gemini Vision API ile sahnedeki dikiş parçalarını sayar,
// production_orders hedefiyle karşılaştırır ve sonucu kaydeder.
export async function POST(req) {
    try {
        const body = await req.json();
        const {
            goruntu_base64,    // base64 JPEG frame (kameradan)
            kamera_id,         // Hangi kamera (ör: "band_1")
            model_id,          // Hangi model üretiliyor (production_orders.model_id)
            hedef_adet,        // Bu vardiyada üretilmesi beklenen toplam adet
            gecen_dakika,      // Vardiyanın başından bu yana geçen dakika
        } = body;

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        let sayilan_adet = null;
        let bant_aktif = null;
        let ai_guveni = 'low';
        let kaynak = 'mock';

        // ─── Gemini Vision Analizi ────────────────────────────
        if (GEMINI_API_KEY && goruntu_base64) {
            const visionPrompt = `Sen bir üretim bandı izleme yapay zekasısın.
Ekteki görüntü bir tekstil (giyim) üretim bandına ait.
Görevin:
1. Bantta ve masada gördüğün tamamlanmış veya yarım dikilmiş GİYİM PARÇASı sayısını say.
2. Bant aktif mi yoksa çalışanlar boşta mı? (aktif/boşta)
3. Tahminine olan güvenini belirt. (yuksek/orta/dusuk)

Sadece şu JSON formatında yanıt ver:
{"sayilan_adet": <sayi>, "bant_aktif": <true|false>, "ai_guveni": "yuksek|orta|dusuk", "gozlem": "<tek cümle>"}`;

            try {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);

                const res = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: visionPrompt },
                                ...(goruntu_base64 ? [{ inline_data: { mime_type: 'image/jpeg', data: goruntu_base64 } }] : []),
                            ]
                        }],
                        generationConfig: { temperature: 0.1, maxOutputTokens: 200, responseMimeType: 'application/json' },
                    }),
                });

                clearTimeout(timeout);

                if (res.ok) {
                    const data = await res.json();
                    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
                    const parsed = JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
                    sayilan_adet = Number(parsed.sayilan_adet) || 0;
                    bant_aktif = parsed.bant_aktif !== false;
                    ai_guveni = parsed.ai_guveni || 'dusuk';
                    kaynak = 'gemini_vision';
                }
            } catch (visionErr) {
                // Vision başarısız → mock
            }
        }

        // HermAI Gerçeklik Freni: Saçma değerleri reddet
        if (sayilan_adet !== null && hedef_adet && sayilan_adet > hedef_adet * 2) {
            sayilan_adet = null; // Halüsinasyon! Çöp kaydı engellendi.
            kaynak = 'herm_freni_reddetti';
        }

        // ─── Verimlilik Hesabı ────────────────────────────────
        let verimlilik_yuzde = null;
        let beklenen_bu_ana_kadar = null;

        if (sayilan_adet !== null && hedef_adet && gecen_dakika) {
            // Vardiya 480 dakika (8 saat) varsayımı
            beklenen_bu_ana_kadar = Math.round((gecen_dakika / 480) * hedef_adet);
            verimlilik_yuzde = Math.round((sayilan_adet / Math.max(beklenen_bu_ana_kadar, 1)) * 100);
        }

        // ─── Kaydet ──────────────────────────────────────────
        await sb.from('b1_agent_loglari').insert([{
            ajan_adi: 'Darboğaz Teşhiscisi (Vision)',
            islem_tipi: 'vision_kamera_olcum',
            kaynak_tablo: 'production_orders',
            kaynak_id: model_id || null,
            sonuc: verimlilik_yuzde === null ? 'bilgi' :
                verimlilik_yuzde >= 80 ? 'basarili' :
                    verimlilik_yuzde >= 50 ? 'uyari' : 'hata',
            mesaj: [
                `📷 Kamera: ${kamera_id || 'Belt-1'}`,
                `Sayılan parça: ${sayilan_adet ?? 'Ölçülemedi'} / Hedef bu ana: ${beklenen_bu_ana_kadar ?? '?'}`,
                `Bant durumu: ${bant_aktif ? '✅ Aktif' : '⚠️ Boşta'}`,
                `Verimlilik: ${verimlilik_yuzde !== null ? '%' + verimlilik_yuzde : 'Hesaplanamadı'}`,
                `AI Güven: ${ai_guveni} | Kaynak: ${kaynak}`,
            ].join(' | '),
        }]);

        // Düşük verimlilik alarmı
        if (verimlilik_yuzde !== null && verimlilik_yuzde < 50) {
            await sb.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'fire_yuksek',
                seviye: 'uyari',
                baslik: `⚠️ Bant Verimliliği Düşük: %${verimlilik_yuzde}`,
                mesaj: `Kamera (${kamera_id}) analizi: ${sayilan_adet} parça tamamlandı. Beklenen ${beklenen_bu_ana_kadar}. Model ID: ${model_id || '-'}`,
                kaynak_tablo: 'production_orders',
                kaynak_id: model_id || null,
                durum: 'aktif',
            }]);
        }

        return NextResponse.json({
            basarili: true,
            olcum: {
                kamera_id,
                sayilan_adet,
                bant_aktif,
                verimlilik_yuzde,
                beklenen_bu_ana_kadar,
                ai_guveni,
                kaynak,
            },
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
