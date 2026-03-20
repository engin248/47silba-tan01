const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cauptlsnqieegdrgotob.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake-key'; // Service role (Supabase güvenliğinden geçmek için arka planda yetkiliyiz)

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
        let sales_growth = Math.floor(Math.random() * 40) + 60; // 60-100 arası başarılı
        let social_growth = Math.floor(Math.random() * 40) + 60;
        let comp_usage = Math.floor(Math.random() * 40) + 30; // Rakipler yeni başlamış olabilir (30-70)
        let season_score = Math.floor(Math.random() * 20) + 80; // Sezona uygun (80-100)

        let trend_score = (sales_growth * 0.35) + (social_growth * 0.30) + (comp_usage * 0.20) + (season_score * 0.15);
        trend_score = Math.floor(trend_score);

        // RİSK VE MALİYET HESAPLAMASI
        let fabric_cost = Math.floor(Math.random() * 200) + 100;
        let labor_cost = Math.floor(Math.random() * 100) + 50;
        let production_cost = fabric_cost + labor_cost + 50;

        let production_risk = Math.floor(Math.random() * 30);
        let supply_risk = Math.floor(Math.random() * 30);

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
