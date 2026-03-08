// M2 TEST BOTU: Kumaş & Aksesuar Arşivi
// Çalıştır: node m2_kumas_test_bot.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const R = { ok: '\x1b[32m', er: '\x1b[31m', wr: '\x1b[33m', bl: '\x1b[36m', rs: '\x1b[0m', b: '\x1b[1m' };
const log = (m, t = 'bl') => console.log(`${R[t]}${m}${R.rs}`);
const h = (m) => console.log(`\n${R.b}${R.bl}${'='.repeat(55)}\n  ${m}\n${'='.repeat(55)}${R.rs}`);
let ok = 0, fail = 0;
const t = (name, pass, detail = '') => { if (pass) { ok++; log(`  ✅ GEÇT: ${name}`, 'ok'); } else { fail++; log(`  ❌ BAŞARISIZ: ${name}${detail ? ' → ' + detail : ''}`, 'er'); } };

async function run() {
    h('M2: KUMAŞ & AKSESUAR ARŞİVİ BOTU');
    log('KURAL 2: Bot %100 geçmeden M3\'e geçilmez\n', 'wr');
    let kumasId = null, aksId = null;

    // TEST 1: Tablo Erişimi
    h('TEST 1: Tablo Erişimi');
    const { error: e1a } = await sb.from('b1_kumas_arsivi').select('id').limit(1);
    t('b1_kumas_arsivi erişimi', !e1a, e1a?.message);
    const { error: e1b } = await sb.from('b1_aksesuar_arsivi').select('id').limit(1);
    t('b1_aksesuar_arsivi erişimi', !e1b, e1b?.message);
    if (e1a || e1b) { log('\n⛔ TABLOLAR YOK! SQL çalıştırılmalı.', 'er'); process.exit(1); }

    // TEST 2: Kumaş Ekleme
    h('TEST 2: Kumaş Kaydı Ekleme');
    const kumas = { kumas_kodu: 'TST-001', kumas_adi: '[BOT TEST] Yazlık Keten', kumas_adi_ar: '[اختبار] كتان صيفي', kumas_tipi: 'keten', kompozisyon: '%100 Keten', birim_maliyet_tl: 45.50, genislik_cm: 150, gramaj_gsm: 180, esneme_payi_yuzde: 2, stok_mt: 300, min_stok_mt: 50 };
    const { data: k2, error: e2 } = await sb.from('b1_kumas_arsivi').insert([kumas]).select().single();
    t('Kumaş kaydı eklendi', !e2 && k2?.id, e2?.message);
    if (k2?.id) { kumasId = k2.id; log(`     ID: ${kumasId}`, 'bl'); }

    // TEST 3: Kumaş Okuma
    h('TEST 3: Kumaş Alan Doğrulama');
    if (kumasId) {
        const { data: k3 } = await sb.from('b1_kumas_arsivi').select('*').eq('id', kumasId).single();
        t('Kumaş okundu', !!k3);
        t('TR adı doğru', k3?.kumas_adi === kumas.kumas_adi);
        t('AR adı doğru', k3?.kumas_adi_ar === kumas.kumas_adi_ar);
        t('Kumaş tipi doğru', k3?.kumas_tipi === 'keten');
        t('Maliyet doğru', parseFloat(k3?.birim_maliyet_tl) === 45.50);
        t('Stok doğru', parseFloat(k3?.stok_mt) === 300);
        t('created_at otomatik', !!k3?.created_at);
    }

    // TEST 4: Zorunlu Alan Kontrolleri
    h('TEST 4: Zorunlu Alan / ENUM Kontrolleri');
    const { error: e4a } = await sb.from('b1_kumas_arsivi').insert([{ kumas_tipi: 'pamuk', stok_mt: 100, min_stok_mt: 10 }]);
    t('Kodsuz kumaş reddedildi (kumas_kodu NOT NULL)', !!e4a);
    const { error: e4b } = await sb.from('b1_kumas_arsivi').insert([{ kumas_kodu: 'TST-ERR', kumas_tipi: 'GEÇERSIZ', stok_mt: 100, min_stok_mt: 10 }]);
    t('Geçersiz kumaş tipi reddedildi (ENUM)', !!e4b);
    // Mükerrer kod
    const { error: e4c } = await sb.from('b1_kumas_arsivi').insert([{ kumas_kodu: 'TST-001', kumas_adi: 'Kopyası', kumas_tipi: 'pamuk', stok_mt: 100, min_stok_mt: 10 }]);
    t('Mükerrer kumas_kodu reddedildi (UNIQUE)', !!e4c);

    // TEST 5: Stok Alarm Trigger
    h('TEST 5: Stok Alarm Trigger (Ajan 3)');
    await new Promise(r => setTimeout(r, 1500));
    // TST-001'in stoku 300, min 50 → alarm olmamalı
    const { data: uy1 } = await sb.from('b1_sistem_uyarilari').select('*').eq('kaynak_id', kumasId).eq('uyari_tipi', 'dusuk_stok');
    t('Normal stok → alarm YOK (stok 300 > min 50)', !uy1 || uy1.length === 0);
    // Düşük stok ekle → alarm gelmeli
    const { data: k_low, error: e5b } = await sb.from('b1_kumas_arsivi').insert([{ kumas_kodu: 'TST-LOW', kumas_adi: '[BOT] Düşük Stok Test', kumas_tipi: 'pamuk', birim_maliyet_tl: 10, stok_mt: 5, min_stok_mt: 50 }]).select().single();
    t('Düşük stok kumaş eklendi', !e5b, e5b?.message);
    if (k_low?.id) {
        await new Promise(r => setTimeout(r, 2000));
        const { data: uy2 } = await sb.from('b1_sistem_uyarilari').select('*').eq('kaynak_id', k_low.id).eq('uyari_tipi', 'dusuk_stok');
        t('Düşük stok → alarm TETİKLENDİ (stok 5 < min 50)', uy2?.length > 0);
        t('Alarm Arapça başlık var', !!uy2?.[0]?.baslik_ar);
        // Temizle
        await sb.from('b1_sistem_uyarilari').delete().eq('kaynak_id', k_low.id);
        await sb.from('b1_kumas_arsivi').delete().eq('id', k_low.id);
    }

    // TEST 6: Aksesuar Ekleme
    h('TEST 6: Aksesuar Kaydı');
    const aks = { aksesuar_kodu: 'AKS-001', aksesuar_adi: '[BOT TEST] Metal Düğme', aksesuar_adi_ar: '[اختبار] زر معدني', tip: 'dugme', birim: 'adet', birim_maliyet_tl: 2.50, stok_adet: 5000, min_stok: 500 };
    const { data: a6, error: e6 } = await sb.from('b1_aksesuar_arsivi').insert([aks]).select().single();
    t('Aksesuar kaydı eklendi', !e6 && a6?.id, e6?.message);
    if (a6?.id) aksId = a6.id;

    // TEST 7: Aksesuar Kontrolleri
    h('TEST 7: Aksesuar Alan Doğrulama');
    if (aksId) {
        const { data: a7 } = await sb.from('b1_aksesuar_arsivi').select('*').eq('id', aksId).single();
        t('Aksesuar okundu', !!a7);
        t('TR adı doğru', a7?.aksesuar_adi === aks.aksesuar_adi);
        t('Tip doğru (dugme)', a7?.tip === 'dugme');
        t('Birim doğru (adet)', a7?.birim === 'adet');
        t('Maliyet doğru', parseFloat(a7?.birim_maliyet_tl) === 2.50);
    }
    const { error: e7b } = await sb.from('b1_aksesuar_arsivi').insert([{ aksesuar_kodu: 'AKS-ERR', aksesuar_adi: 'Test', tip: 'GEÇERSIZ', birim: 'adet' }]);
    t('Geçersiz aksesuar tipi reddedildi (ENUM)', !!e7b);
    const { error: e7c } = await sb.from('b1_aksesuar_arsivi').insert([{ aksesuar_kodu: 'AKS-ERR', aksesuar_adi: 'Test', tip: 'dugme', birim: 'GEÇERSIZ' }]);
    t('Geçersiz birim reddedildi (ENUM)', !!e7c);

    // TEST 8: Filtreleme
    h('TEST 8: Filtreleme ve Sıralama');
    const { data: f1 } = await sb.from('b1_kumas_arsivi').select('*').eq('kumas_tipi', 'keten');
    t('Kumaş tipi filtresi çalışıyor', Array.isArray(f1));
    const { data: f2 } = await sb.from('b1_kumas_arsivi').select('*').lt('stok_mt', 100);
    t('Stok < 100 filtresi çalışıyor', Array.isArray(f2));
    const { data: f3 } = await sb.from('b1_aksesuar_arsivi').select('*').eq('tip', 'dugme');
    t('Aksesuar tip filtresi çalışıyor', Array.isArray(f3));

    // TEST 9: Temizlik
    h('TEST 9: Test Verisi Temizliği');
    if (kumasId) { const { error } = await sb.from('b1_kumas_arsivi').delete().eq('id', kumasId); t('Kumaş test verisi silindi', !error, error?.message); }
    if (aksId) { const { error } = await sb.from('b1_aksesuar_arsivi').delete().eq('id', aksId); t('Aksesuar test verisi silindi', !error, error?.message); }

    // SONUÇ
    const total = ok + fail;
    const gecti = fail === 0;
    console.log('\n' + '═'.repeat(55));
    if (gecti) {
        log(`\n🏆 M2 TEST: ${ok}/${total} — %100 BAŞARILI`, 'ok');
        log('✅ KURAL 2 ONAYLANDI: M2 Kumaş & Arşiv tamamlandı.', 'ok');
        log('📌 Sonraki: Koordinatör onayı → M3 Kalıp & Serileme\n', 'bl');
    } else {
        log(`\n⚠️ ${ok}/${total} geçti, ${fail} BAŞARISIZ`, 'er');
        log('❌ KURAL 2: M3\'e GEÇİLMİYOR.\n', 'er');
    }
    process.exit(gecti ? 0 : 1);
}
run().catch(e => { log('\n💥 BOT ÇÖKTÜ: ' + e.message, 'er'); process.exit(1); });
