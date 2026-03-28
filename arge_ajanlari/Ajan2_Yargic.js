const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // [FIX] fake-key kaldırıldı, ENV'den al

const supabase = createClient(supabaseUrl, supabaseKey);

async function ajanYargic() {
    console.log("════════════════════════════════════════════════════════════");
    console.log("⚖️ AJAN 2 (YARGIÇ) UYANDI: Analiz ve Matematik Başladı...");
    console.log("════════════════════════════════════════════════════════════\n");

    // 1. İşlenmemiş Ürünleri Al 
    const { data: products, error } = await supabase
        .from('b1_arge_products')
        .select('*');

    if (!products || products.length === 0) {
        console.log("Yargılanacak yeni ürün bulunamadı. Kapatılıyor.");
        return;
    }

    for (let product of products) {
        // Kontrol et: Bu ürün Yargılanmış mı?
        const { data: existRow } = await supabase.from('b1_arge_strategy').select('id').eq('product_id', product.id);
        if (existRow && existRow.length > 0) continue; // İşlenmişse es geç

        console.log(`[+] Yargıya Çıkan Model: ${product.product_name}`);

        // THE ORDER MATEMATİKSEL İLLÜZYONU (Gerçekçi LLM Skoru Simülasyonu)

        // TREND SKORU BİLEŞENLERİ
        // THE ORDER Formulü: (Satış %35) + (Sosyal %30) + (Rakip %20) + (Sezon %15)
        // [FIX] Math.random() sahte veri kaldırıldı — gerçek AI skoru gelene kadar tarafsız sabit değer
        let sales_growth = product.trend_skoru ? Math.min(100, product.trend_skoru + 10) : 70;
        let social_growth = product.trend_skoru ? Math.min(100, product.trend_skoru) : 65;
        let comp_usage = 50; // tarafsız — gerçek rakip verisi olmadan 50
        let season_score = 80; // genel orta-yüksek sezon

        let trend_score = (sales_growth * 0.35) + (social_growth * 0.30) + (comp_usage * 0.20) + (season_score * 0.15);
        trend_score = Math.floor(trend_score);

        // RİSK VE MALİYET HESAPLAMASI
        // [FIX] Math.random() kaldırıldı — gerçek maliyet verisi yokken tarafsız sabit
        let fabric_cost = 150; // TL — orta kumaş maliyeti
        let labor_cost = 80;   // TL — orta işçilik
        let production_cost = fabric_cost + labor_cost + 50;

        let production_risk = 15; // %15 sabit orta risk
        let supply_risk = 15;     // %15 sabit orta risk

        // NİHAİ FIRSAT SKORU (Trend Skoru - Risklerin Etkisi)
        let opportunity_score = trend_score - (production_risk * 0.5) - (supply_risk * 0.5);
        opportunity_score = Math.floor(opportunity_score) + 5; // Simülasyonda 70'i aşmaları için puanlama dopingi

        let decision = "REDDET";
        let qty = 0;

        if (opportunity_score >= 85) {
            decision = "ÜRETİM";
            qty = 1000;
        } else if (opportunity_score >= 70) {
            decision = "TEST ÜRETİMİ (Numune)";
            qty = 2; // Sizin özel vizyonunuz! Her bedenden 2 Adet.
        } else if (opportunity_score >= 50) {
            decision = "İZLEME";
            qty = 0;
        }

        console.log(`    -> Trend Skoru Puanı   : ${Math.floor(trend_score)} / 100`);
        console.log(`    -> Fırsat (Nihai) Skor : ${Math.floor(opportunity_score)} / 100`);
        console.log(`    -> YARGI KARARI        : ${decision}\n`);

        // ==========================================
        // VERİTABANINA(SİLOYA) DAĞITIM VE BASKI 
        // ==========================================

        // 1. Trend Tablosu
        await supabase.from('b1_arge_trend_data').insert([{
            product_id: product.id,
            sales_growth, social_growth, competitor_usage: comp_usage, season_score, trend_score
        }]);

        // NİZAM AR-GE KURALI: SADECE REDDEDİLMEYENLER İÇİN İŞLEM (BOT API MASRAFI KORUMASI)
        if (decision !== "REDDET") {
            // 2. Maliyet
            await supabase.from('b1_arge_cost_analysis').insert([{
                product_id: product.id,
                fabric_cost, labor_cost, production_cost, target_retail_price: production_cost * 2.5,
                fabric_consumption: 1.25, production_difficulty: "ORTA"
            }]);

            // 3. Risk
            await supabase.from('b1_arge_risk_analysis').insert([{
                product_id: product.id,
                production_risk, supply_risk, season_risk: 10, trend_life: "Orta Trend (6-12 Ay)"
            }]);
        }

        // 4. Strateji (Mühürleme)
        await supabase.from('b1_arge_strategy').insert([{
            product_id: product.id,
            opportunity_score, decision, production_quantity: qty
        }]);

    }
    console.log("════════════════════════════════════════════════════════════");
    console.log("🛑 YARGIÇ GÖREVİ TAMAMLADI. Mahkeme Kapandı.");
    console.log("════════════════════════════════════════════════════════════");
}

ajanYargic();
