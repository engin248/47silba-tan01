import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cauptlsnqieegdrgotob.supabase.co';
const supabaseKey = 'sb_publishable_6htr6a2WnfuZuOG-zYVBHA_JcGE7s3R';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runUnit1Tests() {
    console.log("==========================================");
    console.log("🤖 ANTIGRAVITY - BİRİM 1 (İMALAT) TEST BİRİMİ");
    console.log("==========================================");
    console.log("KURAL 2 ÇALIŞTIRILIYOR: Ekrana konan her butonun Supabase bağlantısı Otonom Test Ajanları tarafından deneniyor...\n");

    let testResults = { passed: 0, failed: 0 };
    let tempModelId = null;
    let tempInventoryId = null;
    let tempOrderId = null;

    // TEST 1: AR-GE Trend Ekleme
    process.stdout.write("[Test 1] Ar-Ge Trend Ekleme (v2_models)... ");
    try {
        const { data, error } = await supabase.from('v2_models').insert([{
            model_name: 'Antigravity Test Model (Ajan)',
            description: 'Bu bir Otonom Ajan test kaydıdır.',
            difficulty_score: 5.0
        }]).select().single();

        if (error) throw error;
        tempModelId = data.id;
        console.log("✅ BAŞARILI");
        testResults.passed++;
    } catch (err) {
        console.log("⛔ BAŞARISIZ ->", err.message);
        testResults.failed++;
    }

    // TEST 2: Kumaş / Materyal Ekleme
    process.stdout.write("[Test 2] Master Veritabanı Materyal Ekleme (v2_inventory_items)... ");
    try {
        const { data, error } = await supabase.from('v2_inventory_items').insert([{
            item_name: 'Antigravity Test Kumaşı',
            item_type: 'fabric',
            unit_of_measure: 'Metre',
            current_stock: 500
        }]).select().single();

        if (error) throw error;
        tempInventoryId = data.id;
        console.log("✅ BAŞARILI");
        testResults.passed++;
    } catch (err) {
        console.log("⛔ BAŞARISIZ ->", err.message);
        testResults.failed++;
    }

    // TEST 3: Modelhane (Kesim Emri Fırlatma)
    process.stdout.write("[Test 3] Modelhane Kesim Emri Oluşturma (v2_production_orders)... ");
    try {
        if (!tempModelId) throw new Error("Önceki testten gelen Model ID yok.");
        const { data, error } = await supabase.from('v2_production_orders').insert([{
            order_code: 'TEST-ORD-001',
            model_id: tempModelId,
            quantity: 10,
            status: 'pending'
        }]).select().single();

        if (error) throw error;
        tempOrderId = data.id;
        console.log("✅ BAŞARILI");
        testResults.passed++;
    } catch (err) {
        console.log("⛔ BAŞARISIZ ->", err.message);
        testResults.failed++;
    }

    console.log("\n🧹 Test Verileri Temizleniyor...");
    // Temizlik (Cleanup)
    if (tempOrderId) await supabase.from('v2_production_orders').delete().eq('id', tempOrderId);
    if (tempInventoryId) await supabase.from('v2_inventory_items').delete().eq('id', tempInventoryId);
    if (tempModelId) await supabase.from('v2_models').delete().eq('id', tempModelId);
    console.log("🧹 Temizlik Tamamlandı.\n");

    console.log("==========================================");
    console.log(`📊 TEST RAPORU: ${testResults.passed} Başarılı, ${testResults.failed} Hata`);
    if (testResults.failed === 0) {
        console.log("🛡️ MÜFETTİŞ / TEST BOTU ONAYI: %100 BAŞARILI. SİSTEM ÇALIŞIYOR.");
    } else {
        console.log("⚠️ MÜFETTİŞ / TEST BOTU ONAYI: HATALAR VAR. KOORDİNATÖRE RED RAPORU!");
    }
    console.log("==========================================");
}

runUnit1Tests();
