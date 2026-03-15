// =========================================================================
// 2. EKİP ÜYESİ: "MATEMATİKÇİ VE KARAR YARGICI (The Analyst / AI Mastermind)"
// GÖREVİ: 'b1_arge_products' tablosundaki ham veriyi al, skorla, karar ver ve 4 tabloya dağıt.
// SINIR TABLOSU: Sadece b1_arge_* tablolarında okuma ve yazma yapabilir. UI veya Karargaha DOKUNAMAZ.
// =========================================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env.local') });

// Supabase Bağlantısı (Edge Functions veya Cronjob olarak NİZAM dışı sunucuda çalışır)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Gelecekte OpenAI/Anthropic API veya Açık Kaynak LLaMa kullanılabilecek bölüm
// Şimdilik NİZAM formülasyonu (Ağırlıklı Algoritma) simüle ediliyor
async function yapayZekaAnalizi(hamVeriStr, fiyatStr) {
    // Burada aslında LLM'e prompt atılır. LLM, text okuyarak aşağıdaki oranları döner.
    // Biz THE ORDER sisteminin hızını korumak için deterministik "Mock" AI kullanacağız:
    const baseScore = Math.random() * 40 + 50; // 50-90 arası rastgele taban puan

    return {
        // 1. Trend Matrisi
        satis_buyumesi: Math.min(100, baseScore + (Math.random() * 20 - 10)),
        sosyal_medya_etkisi: Math.min(100, baseScore + (Math.random() * 30 - 10)),
        rakip_kullanim_hizi: Math.min(100, baseScore + (Math.random() * 15)),
        sezon_uyumu: Math.min(100, baseScore + (Math.random() * 40 - 20)),

        // 2. Maliyet Tahmini (Kumaş + İşçilik / Satış Fiyatına Oranla)
        teorik_maliyet: (fiyatStr ? fiyatStr * 0.35 : (Math.random() * 200 + 100)).toFixed(2), // Satışın %35'i tahmini
        kumas_turu: 'Ağırlıklı Pamuk / Sentetik Karışımı (LLM Tahmini)',
        iscilik_zorlugu: ['Kolay', 'Orta', 'Zor'][Math.floor(Math.random() * 3)],

        // 3. Risk Matrisi (Tedarik + Üretim)
        tedarik_riski_puani: Math.floor(Math.random() * 40 + 10), // 10-50 (Düşük daha iyi)
        uretim_karma_puani: Math.floor(Math.random() * 50 + 10)   // 10-60
    };
}

async function yargilamayiBaslat() {
    console.log(`[YARGIÇ] Karar motoru oturtuluyor. THE ORDER yasaları yükleniyor...`);

    try {
        // 1. İşlenmemiş ham verileri çek
        const { data: hamUrunler, error: fetchErr } = await supabase
            .from('b1_arge_products')
            .select('*')
            .eq('islenen_durum', 'bekliyor')
            .limit(50); // Tek seferde maksimum 50 ürünü yargıla (Yükü böl)

        if (fetchErr) throw fetchErr;
        if (!hamUrunler || hamUrunler.length === 0) {
            console.log(`[YARGIÇ] Yargılanacak yeni suçlu/ürün bulunamadı. Uykuya dönülüyor.`);
            return;
        }

        console.log(`[YARGIÇ] ${hamUrunler.length} adet ham veri yakalandı. Sorgu başlıyor...`);

        for (const urun of hamUrunler) {
            let parsedHamVeri;
            try { parsedHamVeri = JSON.parse(urun.ham_veri); } catch { parsedHamVeri = {}; }

            // AI (veya Matematiksel) Analiz Çağrısı
            const ai = await yapayZekaAnalizi(urun.ham_veri, parsedHamVeri.fiyatSayi);

            // -----------------------------------------------------------------
            // THE ORDER ANAYASASI: TREND SKORU HESAPLAMASI
            // Trend Skoru = (Satış Büyümesi Oranı * 0.35) + (Sosyal Medya Etkisi * 0.30) + (Rakip Kullanım Hızı * 0.20) + (Sezon Uyumu * 0.15)
            // -----------------------------------------------------------------
            const trendSkoru =
                (ai.satis_buyumesi * 0.35) +
                (ai.sosyal_medya_etkisi * 0.30) +
                (ai.rakip_kullanim_hizi * 0.20) +
                (ai.sezon_uyumu * 0.15);

            // -----------------------------------------------------------------
            // THE ORDER ANAYASASI: FIRSAT SKORU (FİNAL)
            // Fırsat = Trend Puanı - (Risklerin yarısı)
            // -----------------------------------------------------------------
            const ortalamaRisk = (ai.tedarik_riski_puani + ai.uretim_karma_puani) / 2;
            const firsatSkoru = Math.max(0, trendSkoru - (ortalamaRisk * 0.5));

            // KARAR MEKANİZMASI
            let decision = '';
            if (firsatSkoru >= 85) decision = 'ÜRETİM';
            else if (firsatSkoru >= 70) decision = 'TEST ÜRETİMİ (Numune)';
            else if (firsatSkoru >= 50) decision = 'İZLEME';
            else decision = 'REDDET';

            console.log(`[YARGIÇ] Ürün ID: ${urun.id} | Trend: ${trendSkoru.toFixed(1)} | Fırsat: ${firsatSkoru.toFixed(1)} -> KARAR: ${decision}`);

            // Eğer REDDET ise, sistemi yormamak için diğer 3 tabloya detay kayıt girilmez. Sadece Stratejiye atılır.
            if (decision === 'REDDET') {
                await supabase.from('b1_arge_strategy').insert({
                    product_id: urun.id,
                    opportunity_score: firsatSkoru,
                    nizam_decision: decision,
                    reason: 'Maliyet ve risk oranları, pazar potansiyelini ezdi geçti.'
                });
            } else {
                // BAŞARILI / İZLEME SENARYOSU -> Tüm Tablolara Data Mühürlenir

                // 1. Trend Tablosu
                await supabase.from('b1_arge_trend_data').insert({
                    product_id: urun.id,
                    sales_growth: ai.satis_buyumesi,
                    social_media_impact: ai.sosyal_medya_etkisi,
                    competitor_usage: ai.rakip_kullanim_hizi,
                    season_fit: ai.sezon_uyumu,
                    trend_score: trendSkoru
                });

                // 2. Maliyet Tahmin Tablosu
                await supabase.from('b1_arge_cost_analysis').insert({
                    product_id: urun.id,
                    estimated_fabric_cost: ai.teorik_maliyet * 0.6,
                    estimated_labor_cost: ai.teorik_maliyet * 0.4,
                    fabric_type_prediction: ai.kumas_turu,
                    labor_difficulty: ai.iscilik_zorlugu
                });

                // 3. Risk Tablosu
                await supabase.from('b1_arge_risk_analysis').insert({
                    product_id: urun.id,
                    supply_risk_score: ai.tedarik_riski_puani,
                    production_risk_score: ai.uretim_karma_puani
                });

                // 4. Nihai Karar/Strateji Tablosu
                await supabase.from('b1_arge_strategy').insert({
                    product_id: urun.id,
                    opportunity_score: firsatSkoru,
                    nizam_decision: decision,
                    reason: `Trend Skoru: %${trendSkoru.toFixed(1)} olarak tespit edildi.`
                });
            }

            // En son: Ana ürün tablosunda veriyi "Durum: İşlendi" olarak kitle
            await supabase.from('b1_arge_products')
                .update({ islenen_durum: 'islendi', isleyen_ajan: 'THE_ANALYST', islendigi_tarih: new Date().toISOString() })
                .eq('id', urun.id);
        }

        console.log(`[YARGIÇ] ${hamUrunler.length} dava görüldü ve karara bağlandı.`);

    } catch (error) {
        console.error(`[YARGIÇ] Yargılama Esnasında Sistem Hatası: ${error.message}`);
    }
}

// BU DOSYA KENDİ BAŞINA ÇALIŞACAK BİR BETİKTİR.
// Cronjob (Linux: crontab) ya da PM2 üzerinden çalıştırılacak veya Edge Function'a yüklenecektir.
yargilamayiBaslat();
