import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cauptlsnqieegdrgotob.supabase.co';
const supabaseKey = 'sb_publishable_6htr6a2WnfuZuOG-zYVBHA_JcGE7s3R';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fullUnit1Test() {
    console.log("==========================================");
    console.log("🤖 ANTIGRAVITY - BİRİM 1 FULL SİSTEM TESTİ");
    console.log("==========================================");
    console.log("KURAL 4 ÇALIŞTIRILIYOR: 1. Birim (İmalat/Üretim) zinciri tam anlamıyla kanıtlanmadan başka konuya geçilmeyecek.\n");

    let testResults = { passed: 0, failed: 0 };
    let d = {
        modelId: null,
        machineId: null,
        stepId: null,
        workflowId: null,
        itemId: null,
        orderId: null,
        orderStepId: null,
        downtimeId: null,
        alertId: null
    };

    try {
        // 1. MODEL TESTİ (v2_models)
        process.stdout.write("[Test 1] Yeni Ürün Modeli Ekleme (v2_models)... ");
        const { data: mData, error: mErr } = await supabase.from('v2_models').insert([{
            model_name: 'TEST_AGENT_MODEL_' + Date.now(),
            difficulty_score: 7.5,
            description: 'Full system test model'
        }]).select().single();
        if (mErr) throw new Error("v2_models hatası: " + mErr.message);
        d.modelId = mData.id;
        console.log("✅"); testResults.passed++;

        // 2. ENVANTER TESTİ (v2_inventory_items)
        process.stdout.write("[Test 2] Envanter Malzeme Ekleme (v2_inventory_items)... ");
        const { data: iData, error: iErr } = await supabase.from('v2_inventory_items').insert([{
            item_name: 'TEST_FABRIC_' + Date.now(),
            item_type: 'fabric',
            unit_of_measure: 'Metre',
            current_stock: 1000
        }]).select().single();
        if (iErr) throw new Error("v2_inventory_items hatası: " + iErr.message);
        d.itemId = iData.id;
        console.log("✅"); testResults.passed++;

        // 3. MAKİNE TESTİ (v2_machines)
        process.stdout.write("[Test 3] Makine Tanımlama (v2_machines)... ");
        const { data: mcData, error: mcErr } = await supabase.from('v2_machines').insert([{
            name: 'TEST_MACHINE_' + Date.now(),
            status: 'idle'
        }]).select().single();
        if (mcErr) throw new Error("v2_machines hatası: " + mcErr.message);
        d.machineId = mcData.id;
        console.log("✅"); testResults.passed++;

        // 4. EVRENSEL ÜRETİM ADIMI TESTİ (v2_production_steps)
        process.stdout.write("[Test 4] Evrensel Üretim Adımı (v2_production_steps)... ");
        const { data: psData, error: psErr } = await supabase.from('v2_production_steps').insert([{
            step_name: 'TEST_STEP_' + Date.now(),
            requires_proof: true,
            estimated_duration_minutes: 15
        }]).select().single();
        if (psErr) throw new Error("v2_production_steps hatası: " + psErr.message);
        d.stepId = psData.id;
        console.log("✅"); testResults.passed++;

        // 5. İŞ AKIŞI / WORKFLOW TESTİ (v2_model_workflows)
        process.stdout.write("[Test 5] Modele Dinamik İş Akışı Bağlama (v2_model_workflows)... ");
        const { data: wfData, error: wfErr } = await supabase.from('v2_model_workflows').insert([{
            model_id: d.modelId,
            step_id: d.stepId,
            step_order: 1
        }]).select().single();
        if (wfErr) throw new Error("v2_model_workflows hatası: " + wfErr.message);
        d.workflowId = wfData.id;
        console.log("✅"); testResults.passed++;

        // 6. MALZEME İHTİYACI TESTİ (v2_model_material_requirements)
        process.stdout.write("[Test 6] Modele Malzeme Bağlama (v2_model_material_requirements)... ");
        const { data: mmrData, error: mmrErr } = await supabase.from('v2_model_material_requirements').insert([{
            model_id: d.modelId,
            step_id: d.stepId,
            item_id: d.itemId,
            quantity_needed: 2.5
        }]).select().single();
        if (mmrErr) throw new Error("v2_model_material_requirements hatası: " + mmrErr.message);
        console.log("✅"); testResults.passed++;

        // 7. SİPARİŞ / ÜRETİM EMRİ TESTİ (v2_production_orders)
        process.stdout.write("[Test 7] Üretim Emri Oluşturma (v2_production_orders)... ");
        const { data: oData, error: oErr } = await supabase.from('v2_production_orders').insert([{
            order_code: 'TEST-ORD-' + Date.now(),
            model_id: d.modelId,
            quantity: 50,
            status: 'pending'
        }]).select().single();
        if (oErr) throw new Error("v2_production_orders hatası: " + oErr.message);
        d.orderId = oData.id;
        console.log("✅"); testResults.passed++;

        // 8. BANT / SAHA OPERASYONU TESTİ (v2_order_production_steps)
        process.stdout.write("[Test 8] Saha Operasyon Adımı Oluşturma (v2_order_production_steps)... ");
        const { data: opsData, error: opsErr } = await supabase.from('v2_order_production_steps').insert([{
            order_id: d.orderId,
            model_workflow_id: d.workflowId,
            machine_id: d.machineId,
            status: 'not_started'
        }]).select().single();
        if (opsErr) throw new Error("v2_order_production_steps hatası: " + opsErr.message);
        d.orderStepId = opsData.id;
        console.log("✅"); testResults.passed++;

        // 9. SİSTEM UYARISI / İHBAR TESTİ (v2_alerts)
        process.stdout.write("[Test 9] Müfettiş İhbar Kaydı (v2_alerts)... ");
        const { data: alData, error: alErr } = await supabase.from('v2_alerts').insert([{
            alert_type: 'other',
            message: 'Ajan Sistem Test İhbarı',
            severity: 'info',
            related_machine_id: d.machineId
        }]).select().single();
        if (alErr) throw new Error("v2_alerts hatası: " + alErr.message);
        d.alertId = alData.id;
        console.log("✅"); testResults.passed++;

    } catch (err) {
        console.log("⛔ BAŞARISIZ ->", err.message);
        testResults.failed++;
    }

    console.log("\n🧹 Test Verileri Hiyerarşik Temizleniyor...");
    try {
        if (d.alertId) await supabase.from('v2_alerts').delete().eq('id', d.alertId);
        if (d.orderStepId) await supabase.from('v2_order_production_steps').delete().eq('id', d.orderStepId);
        if (d.orderId) await supabase.from('v2_production_orders').delete().eq('id', d.orderId);
        if (d.itemId) await supabase.from('v2_model_material_requirements').delete().eq('item_id', d.itemId);
        if (d.workflowId) await supabase.from('v2_model_workflows').delete().eq('id', d.workflowId);
        if (d.itemId) await supabase.from('v2_inventory_items').delete().eq('id', d.itemId);
        if (d.stepId) await supabase.from('v2_production_steps').delete().eq('id', d.stepId);
        if (d.machineId) await supabase.from('v2_machines').delete().eq('id', d.machineId);
        if (d.modelId) await supabase.from('v2_models').delete().eq('id', d.modelId);
        console.log("🧹 Temizlik Tamamlandı.\n");
    } catch (err) {
        console.log("🧹 Temizlik Hatası! Supabase Foreign Key kısıtlamalarına dikkat et.", err.message);
    }

    console.log("==========================================");
    console.log(`📊 TEST RAPORU: ${testResults.passed} Başarılı, ${testResults.failed} Hata`);
    if (testResults.passed === 9 && testResults.failed === 0) {
        console.log("🛡️ 1. BİRİM SUPABASE ALTYAPISI (TABLOLAR, İLİŞKİLER) %100 ÇALIŞIYOR!");
        console.log("✅ TEST BOTU ONAYI VERDİ.");
    } else {
        console.log("⚠️ BİRİM 1 FONKSİYONLARINDA EKSİKLER VAR! 2. BİRİME GEÇİŞ REDDEDİLDİ!");
    }
    console.log("==========================================");
}

fullUnit1Test();
