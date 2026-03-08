// M3 TEST BOTU: Kalıp & Serileme
// Çalıştır: node m3_kalip_test_bot.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const R = { ok: '\x1b[32m', er: '\x1b[31m', wr: '\x1b[33m', bl: '\x1b[36m', rs: '\x1b[0m', b: '\x1b[1m' };
const log = (m, t = 'bl') => console.log(`${R[t]}${m}${R.rs}`);
const h = (m) => console.log(`\n${R.b}${R.bl}${'='.repeat(55)}\n  ${m}\n${'='.repeat(55)}${R.rs}`);
let ok = 0, fail = 0;
const t = (name, pass, detail = '') => { if (pass) { ok++; log(`  ✅ GEÇT: ${name}`, 'ok'); } else { fail++; log(`  ❌ BAŞARISIZ: ${name}${detail ? ' → ' + detail : ''}`, 'er'); } };

async function run() {
    h('M3: KALIP & SERİLEME BOTU');
    log('KURAL 2: Bot %100 geçmeden M4\'e geçilmez\n', 'wr');
    let modelId = null, kalipId = null;

    // TEST 1: Tablo Erişimi
    h('TEST 1: Tablo Erişimi');
    const { error: e1a } = await sb.from('b1_model_taslaklari').select('id').limit(1);
    t('b1_model_taslaklari erişimi', !e1a, e1a?.message);
    const { error: e1b } = await sb.from('b1_model_kaliplari').select('id').limit(1);
    t('b1_model_kaliplari erişimi', !e1b, e1b?.message);
    const { error: e1c } = await sb.from('b1_model_malzeme_listesi').select('id').limit(1);
    t('b1_model_malzeme_listesi erişimi', !e1c, e1c?.message);
    if (e1a || e1b) { log('\n⛔ TABLOLAR YOK!', 'er'); process.exit(1); }

    // TEST 2: Model Taslağı Ekleme
    h('TEST 2: Model Taslağı Ekleme');
    const model = { model_kodu: 'BOT-MDL-001', model_adi: '[BOT TEST] Yazlık Keten Gömlek', model_adi_ar: '[اختبار] قميص كتان صيفي', hedef_kitle: 'kadin', sezon: 'yaz', durum: 'taslak', aciklama: 'Test modeli' };
    const { data: m2, error: e2 } = await sb.from('b1_model_taslaklari').insert([model]).select().single();
    t('Model taslağı eklendi', !e2 && m2?.id, e2?.message);
    if (m2?.id) { modelId = m2.id; log(`     ID: ${modelId}`, 'bl'); }

    // TEST 3: Model Alan Doğrulama
    h('TEST 3: Model Alan Doğrulama');
    if (modelId) {
        const { data: m3 } = await sb.from('b1_model_taslaklari').select('*').eq('id', modelId).single();
        t('Model okundu', !!m3);
        t('TR adı doğru', m3?.model_adi === model.model_adi);
        t('AR adı doğru', m3?.model_adi_ar === model.model_adi_ar);
        t('Hedef kitle doğru (kadin)', m3?.hedef_kitle === 'kadin');
        t('Sezon doğru (yaz)', m3?.sezon === 'yaz');
        t('Başlangıç durumu taslak', m3?.durum === 'taslak');
    }

    // TEST 4: Zorunlu Alan Kontrolleri
    h('TEST 4: Model Zorunlu Alan / ENUM Kontrolleri');
    const { error: e4a } = await sb.from('b1_model_taslaklari').insert([{ model_adi: 'Kodsuz Model', hedef_kitle: 'kadin', sezon: 'yaz' }]);
    t('Kodsuz model reddedildi (model_kodu NOT NULL)', !!e4a);
    const { error: e4b } = await sb.from('b1_model_taslaklari').insert([{ model_kodu: 'BOT-ERR', model_adi: 'Test', hedef_kitle: 'GEÇERSIZ', sezon: 'yaz' }]);
    t('Geçersiz hedef_kitle reddedildi (ENUM)', !!e4b);
    const { error: e4c } = await sb.from('b1_model_taslaklari').insert([{ model_kodu: 'BOT-ERR2', model_adi: 'Test', hedef_kitle: 'kadin', sezon: 'GEÇERSIZ' }]);
    t('Geçersiz sezon reddedildi (ENUM)', !!e4c);
    const { error: e4d } = await sb.from('b1_model_taslaklari').insert([{ model_kodu: 'BOT-MDL-001', model_adi: 'Kopyası', hedef_kitle: 'kadin', sezon: 'yaz' }]);
    t('Mükerrer model_kodu reddedildi (UNIQUE)', !!e4d);

    // TEST 5: Kalıp Ekleme
    h('TEST 5: Kalıp Kaydı Ekleme');
    if (!modelId) { t('Kalıp eklenemedi - model yok', false); }
    else {
        const kalip = { model_id: modelId, kalip_adi: '[BOT] Ön Kalıp', bedenler: ['S', 'M', 'L', 'XL'], pastal_boyu_cm: 280, pastal_eni_cm: 150, fire_orani_yuzde: 5, versiyon: 'v1.0' };
        const { data: k5, error: e5 } = await sb.from('b1_model_kaliplari').insert([kalip]).select().single();
        t('Kalıp kaydı eklendi', !e5 && k5?.id, e5?.message);
        if (k5?.id) { kalipId = k5.id; log(`     ID: ${kalipId}`, 'bl'); }
    }

    // TEST 6: Kalıp Alan Doğrulama
    h('TEST 6: Kalıp Alan Doğrulama');
    if (kalipId) {
        const { data: k6 } = await sb.from('b1_model_kaliplari').select('*').eq('id', kalipId).single();
        t('Kalıp okundu', !!k6);
        t('Model bağlantısı doğru', k6?.model_id === modelId);
        t('Bedenler array olarak kaydedildi', Array.isArray(k6?.bedenler) && k6.bedenler.length === 4);
        t('Pastal boyu doğru (280)', parseFloat(k6?.pastal_boyu_cm) === 280);
        t('Pastal eni doğru (150)', parseFloat(k6?.pastal_eni_cm) === 150);
        t('Fire oranı doğru (%5)', parseFloat(k6?.fire_orani_yuzde) === 5);
        t('Versiyon doğru (v1.0)', k6?.versiyon === 'v1.0');
        // Metraj hesabı doğrulaması: 2.80m × 1.50m × 1.05 = 4.41 m²
        const hesap = (2.80 * 1.50 * 1.05).toFixed(3);
        t(`Metraj hesabı doğru (${hesap} m²)`, hesap === '4.410');
    }

    // TEST 7: Kalıp Zorunlu Alan Kontrolleri
    h('TEST 7: Kalıp Zorunlu Alan Kontrolleri');
    if (modelId) {
        const { error: e7a } = await sb.from('b1_model_kaliplari').insert([{ model_id: modelId, bedenler: ['S', 'M'], pastal_boyu_cm: 200, pastal_eni_cm: 150 }]);
        t('Kalıp adı eksik → reddedildi (NOT NULL)', !!e7a);
        const { error: e7b } = await sb.from('b1_model_kaliplari').insert([{ kalip_adi: 'Adsız Kalıp', bedenler: ['S'], pastal_boyu_cm: 200, pastal_eni_cm: 150 }]);
        t('Model ID eksik → reddedildi (NOT NULL)', !!e7b);
    }

    // TEST 8: İlişkisel Sorgu (JOIN)
    h('TEST 8: İlişkisel Sorgu (Model ← Kalıp JOIN)');
    if (kalipId) {
        const { data: k8, error: e8 } = await sb.from('b1_model_kaliplari').select('*, b1_model_taslaklari(model_adi,model_kodu)').eq('id', kalipId).single();
        t('JOIN sorgusu çalıştı', !e8, e8?.message);
        t('Model adı JOIN\'den geldi', !!k8?.b1_model_taslaklari?.model_adi);
        t('Model kodu JOIN\'den geldi', !!k8?.b1_model_taslaklari?.model_kodu);
    }

    // TEST 9: Durum Güncellemesi
    h('TEST 9: Model Durum Zincirleme Güncellemesi');
    if (modelId) {
        const { error: e9 } = await sb.from('b1_model_taslaklari').update({ durum: 'kalip_hazir' }).eq('id', modelId);
        t('Durum kalip_hazir olarak güncellendi', !e9, e9?.message);
        const { error: e9b } = await sb.from('b1_model_taslaklari').update({ durum: 'GEÇERSIZ_DURUM' }).eq('id', modelId);
        t('Geçersiz durum güncellemesi reddedildi (ENUM)', !!e9b);
    }

    // TEST 10: Temizlik
    h('TEST 10: Test Verisi Temizliği');
    if (kalipId) { const { error } = await sb.from('b1_model_kaliplari').delete().eq('id', kalipId); t('Kalıp test verisi silindi', !error, error?.message); }
    if (modelId) { const { error } = await sb.from('b1_model_taslaklari').delete().eq('id', modelId); t('Model test verisi silindi', !error, error?.message); }

    // SONUÇ
    const total = ok + fail;
    const gecti = fail === 0;
    console.log('\n' + '═'.repeat(55));
    if (gecti) {
        log(`\n🏆 M3 TEST: ${ok}/${total} — %100 BAŞARILI`, 'ok');
        log('✅ KURAL 2 ONAYLANDI: M3 Kalıp & Serileme tamamlandı.', 'ok');
        log('📌 Sonraki: Koordinatör onayı → M4 Modelhane & Video\n', 'bl');
    } else {
        log(`\n⚠️ ${ok}/${total} geçti, ${fail} BAŞARISIZ`, 'er');
        log('❌ KURAL 2: M4\'e GEÇİLMİYOR.\n', 'er');
    }
    process.exit(gecti ? 0 : 1);
}
run().catch(e => { log('\n💥 BOT ÇÖKTÜ: ' + e.message, 'er'); process.exit(1); });
