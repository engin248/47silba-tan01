<<<<<<< HEAD
// ╔══════════════════════════════════════════════════════════════════╗
// ║ [ARŞİV] Bu dosya 16.03.2026'da yargic.js ile birleştirildi.   ║
// ║ AKTİF DEĞİLDİR. Referans olarak korunmaktadır.                ║
// ║ Güncel versiyon: src/scripts/ai_mastermind/yargic.js            ║
// ╚══════════════════════════════════════════════════════════════════╝
=======
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
/**
 * THE ORDER - EKİP 2 KOMUTANLIĞI: MATEMATİKÇİ VE KARAR YARGICI
 * Tarih: 16.03.2026
 *
 * GÖREV EMRİ:
 * 1. Ekip 1 (Ölü İşçi) tarafından 'b1_arge_products' (products) tablosuna yığılan verileri dinler.
 * 2. Gemini LLM tahmini ile THE ORDER Algoritmasını (Satış %35, Sosyal %30, Rakip %20, Sezon %15) çalıştırır.
 * 3. Hata payı olmadan Trend Skoru, Maliyet ve Risk hesaplar.
 * 4. Puanları b1_arge_strategy tablosundaki 'opportunity_score' kolonuna basar.
 * 5. Mühür (Hakim Tokmağı):
 *    > 85 Puan: TEST ÜRETİMİ
 *   70-85 Puan: İZLEME
 *    < 70 Puan: REDDET
 * 
 * DURUM: Arka plan (Backend) Motoru. Arayüz (UI) içermez.
 */

import { createClient } from '@supabase/supabase-js';

// NİZAM Veritabanı (M1 Ar-Ge Tabloları)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sandbox.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake-admin-key'
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'api-key-tanimsiz';

export class Ekip2_MatematikciYargic {
    constructor() {
<<<<<<< HEAD

=======
        console.log("[EKİP 2 - MATEMATİKÇİ YARGIÇ] Uyandırıldı. Çamurlu ham veriler THE ORDER formülüyle yıkanacak.");
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    }

    /**
     * Motoru ateşleyen ana fonksiyon (Cron veya Trigger ile çağrılır)
     */
    async yargiMotorunuCalistir() {
<<<<<<< HEAD
=======
        console.log("[EKİP 2] b1_arge_products tablosundaki işlenmemiş ürünler mercek altına alınıyor...");
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

        // 1. Ekip 1'in getirdiği ham ürünleri çek (Sadece strateji tablosunda karar verilmemiş olanlar)
        const { data: hamUrunler, error } = await supabase
            .from('products')
            .select(`
                id, product_name, category, price_range,
                strategy ( product_id )
            `)
            .limit(10); // Döngüsel yığılma olmaması için limitli çekim

        if (error || !hamUrunler || hamUrunler.length === 0) {
<<<<<<< HEAD

=======
            console.log("[EKİP 2] İşlenecek yeni veri havuzu bulunamadı. Sessizliğe dönüyorum.");
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            return;
        }

        // Filtre: Daha önce stratejisi belirlenmişleri atla (Inner Join kontrolü)
        const islenecekUrunler = hamUrunler.filter(u => u.strategy === null || u.strategy.length === 0);
<<<<<<< HEAD
=======
        console.log(`[EKİP 2] Yargı Kürsüsüne ${islenecekUrunler.length} adet ham veri yatırıldı.`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

        for (const urun of islenecekUrunler) {
            await this.matematikselAlgoritmaVeKarar(urun);
        }

<<<<<<< HEAD
=======
        console.log("[EKİP 2] Masadaki tüm dosyalar imzalandı, mühürler basıldı. İstirahate geçiliyor.");
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    }

    /**
     * Tekil ürün bazında THE ORDER formülünü işleyen çekirdek yapı
     */
    async matematikselAlgoritmaVeKarar(urun) {
<<<<<<< HEAD

=======
        console.log(`\n---------------------------------------------------------`);
        console.log(`[->] YARGILANAN MODEL: ${urun.product_name} (Fiyat: ${urun.price_range})`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

        // 2. Gemini LLM ile Tahmin & Sayısal Puan Çıkarımı
        const prompt = `
            Sen THE ORDER sisteminin 2. Ekip üyesisin (Matematikçi Yargıç, Analist).
            Aşağıdaki piyasa ürün verisini analiz edeceksin:
            Ürün: ${urun.product_name}
            Kategori: ${urun.category}
            Pazar Fiyatı: ${urun.price_range} TL

            Lütfen THE ORDER veritabanına yazılmak üzere aşağıdaki metrikleri tahmin et (0 ile 100 arası puan).
            SADECE JSON döndür:
            {
                "satis_buyumesi": 0-100 arasi rakam,
                "sosyal_medya_hacmi": 0-100 arasi rakam,
                "rakip_rekabet_orani": 0-100 arasi rakam,
                "sezon_uyumu": 0-100 arasi rakam,
                "risk_skoru": 0-100 arasi (Üretim/Tedarik/Trend ömrü riski toplamı),
                "kumas_maliyeti_tl": tahmini tl degeri,
                "iscilik_maliyeti_tl": tahmini tl degeri,
                "kar_firsat_puani": 0-100 arasi (Maliyet ve Piyasa fiyatı arasındaki makas kârlılığı)
            }
        `.trim();

        let llmAnaliz;
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
                })
            });
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            llmAnaliz = JSON.parse(text);
        } catch (e) {
            console.error(`[EKİP 2] LLM Analiz Motoru Bağlantı Hatası (${urun.product_name}):`, e.message);
            return; // Hata durumunda atla, çöp veri basma.
        }

        // 3. THE ORDER MATEMATİKSEL ALGORİTMA İŞLETİMİ
        const satisPuan = (llmAnaliz.satis_buyumesi || 0) * 0.35;
        const sosyalPuan = (llmAnaliz.sosyal_medya_hacmi || 0) * 0.30;
        const rakipPuan = (llmAnaliz.rakip_rekabet_orani || 0) * 0.20;
        const sezonPuan = (llmAnaliz.sezon_uyumu || 0) * 0.15;

        let trend_score = satisPuan + sosyalPuan + rakipPuan + sezonPuan;
        trend_score = parseFloat(trend_score.toFixed(2)); // Örn: 82.45

        const risk_score = parseFloat((llmAnaliz.risk_skoru || 0).toFixed(2));
        const kar_marji_puani = parseFloat((llmAnaliz.kar_firsat_puani || 0).toFixed(2));

        // NİHAİ FIRSAT SKORU (Opportunity Score)
        // Formül: TrendSkoru - RiskSkoru + KarFırsatıPuani (100 üzerinden normalize edilir)
        let f_skor = trend_score - risk_score + kar_marji_puani;
        let opportunity_score = Math.max(0, Math.min(100, f_skor));
        opportunity_score = parseFloat(opportunity_score.toFixed(2));

        // 4. KARAR MÜHRÜ BASTIRILIYOR (NİZAM KURALLARI)
        // 85 üstü = TEST ÜRETİMİ | 70-85 arası = İZLEME | 70 altı = REDDET
        let decision = "REDDET";
        if (opportunity_score > 85) {
            decision = "TEST ÜRETİMİ";
        } else if (opportunity_score >= 70) {
            decision = "İZLEME";
        }

<<<<<<< HEAD

=======
        console.log(`     [Skor Tahtası] Trend: ${trend_score} || Risk: ${risk_score} || Kar Puanı: ${kar_marji_puani}`);
        console.log(`     [NİHAİ FIRSAT SKORU] => ${opportunity_score}`);
        console.log(`     [KARAR MÜHRÜ] -> *** ${decision} ***`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

        // 5. VERİTABANI (SUPABASE) INSERT/UPDATE SÜREÇLERİ
        try {
            // A. b1_arge_trend_data (Trend Puanları) Tablosu
            await supabase.from('trend_data').insert({
                product_id: urun.id,
                sales_growth: llmAnaliz.satis_buyumesi,
                social_growth: llmAnaliz.sosyal_medya_hacmi,
                competitor_usage: llmAnaliz.rakip_rekabet_orani,
                season_score: llmAnaliz.sezon_uyumu,
                trend_score: trend_score
            });

            // B. b1_arge_cost_analysis (Maliyet) Tablosu
            const uretim_toplam_tl = (llmAnaliz.kumas_maliyeti_tl || 0) + (llmAnaliz.iscilik_maliyeti_tl || 0);
            await supabase.from('cost_analysis').insert({
                product_id: urun.id,
                fabric_cost: llmAnaliz.kumas_maliyeti_tl,
                labor_cost: llmAnaliz.iscilik_maliyeti_tl,
                production_cost: uretim_toplam_tl
            });

            // C. b1_arge_risk_analysis (Risk) Tablosu
            await supabase.from('risk_analysis').insert({
                product_id: urun.id,
                production_risk: risk_score,
                supply_risk: Math.max(0, risk_score - 15), // Tahmini yan risk
                trend_life: trend_score >= 75 ? 'Mega Trend / 2 Yıl' : 'Mikro Trend / 3 Ay'
            });

            // D. EN KRİTİK GÖREV: b1_arge_strategy (Fırsat Skoru ve Karar) Tablosu
            await supabase.from('strategy').insert({
                product_id: urun.id,
                opportunity_score: opportunity_score,
                decision: decision,
                production_quantity: decision === 'TEST ÜRETİMİ' ? 150 : 0
            });

<<<<<<< HEAD
=======
            console.log(`     [BAŞARILI] Ürün dosyası veritabanı mühürleriyle arşivlendi.`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        } catch (dbError) {
            console.error(`     [HATA] Veritabanına mühür basılamadı:`, dbError.message);
        }
    }
}
