// M13 TEST BOTU: Müşteri CRM
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const R = { ok: '\x1b[32m', er: '\x1b[31m', wr: '\x1b[33m', bl: '\x1b[36m', rs: '\x1b[0m', b: '\x1b[1m' };
const log = (m, t = 'bl') => console.log(`${R[t]}${m}${R.rs}`);
const h = (m) => console.log(`\n${R.b}${R.bl}${'='.repeat(55)}\n  ${m}\n${'='.repeat(55)}${R.rs}`);
let ok = 0, fail = 0;
const t = (name, pass, detail = '') => { if (pass) { ok++; log(`  ✅ GEÇT: ${name}`, 'ok'); } else { fail++; log(`  ❌ BAŞARISIZ: ${name}${detail ? ' → ' + detail : ''}`, 'er'); } };

async function run() {
    h('M13: MÜŞTERİ CRM TEST BOTU');
    log('KURAL 2: Bot %100 geçmeden kontrollere geçilmez\n', 'wr');
    let mstId = null;

    // TEST 1: Tablo Erişimi
    h('TEST 1: b2_musteriler Tablo Erişimi');
    const { error: e1 } = await sb.from('b2_musteriler').select('id').limit(1);
    t('b2_musteriler erişimi', !e1, e1?.message);

    // TEST 2: Müşteri Ekleme (3 tip)
    h('TEST 2: 3 Tip Müşteri Ekle (bireysel/toptan/magaza)');
    const { data: m2, error: e2 } = await sb.from('b2_musteriler').insert([{
        musteri_kodu: 'BOT-MST-001', ad_soyad: '[BOT] Test Müşteri',
        ad_soyad_ar: 'عميل تجريبي', musteri_tipi: 'bireysel',
        telefon: '+90 555 000 0001', email: 'bot@test.com',
        adres: 'Test Mah. İstanbul', vergi_no: '1234567890'
    }]).select().single();
    t('Bireysel müşteri eklendi', !e2 && m2?.id, e2?.message);
    mstId = m2?.id;

    const { error: e2b } = await sb.from('b2_musteriler').insert([{ musteri_kodu: 'BOT-MST-002', ad_soyad: '[BOT] Toptan Müşteri', musteri_tipi: 'toptan' }]);
    t('Toptan müşteri eklendi', !e2b, e2b?.message);
    const { error: e2c } = await sb.from('b2_musteriler').insert([{ musteri_kodu: 'BOT-MST-003', ad_soyad: '[BOT] Mağaza Müşteri', musteri_tipi: 'magaza' }]);
    t('Mağaza müşteri eklendi', !e2c, e2c?.message);

    // TEST 3: Alan Doğrulama
    h('TEST 3: Alan Doğrulama');
    if (mstId) {
        const { data: m3 } = await sb.from('b2_musteriler').select('*').eq('id', mstId).single();
        t('Müşteri okundu', !!m3);
        t('Müşteri kodu doğru', m3?.musteri_kodu === 'BOT-MST-001');
        t('Tip doğru (bireysel)', m3?.musteri_tipi === 'bireysel');
        t('Telefon kaydedildi', m3?.telefon === '+90 555 000 0001');
        t('Email kaydedildi', m3?.email === 'bot@test.com');
        t('Arapça ad kaydedildi', m3?.ad_soyad_ar === 'عميل تجريبي');
        t('Aktif default true', m3?.aktif === true);
        t('Borç default 0', parseFloat(m3?.toplam_borc_tl) === 0);
        t('created_at otomatik', !!m3?.created_at);
    }

    // TEST 4: ENUM / NOT NULL Kontrolleri
    h('TEST 4: ENUM / NOT NULL Kontrolleri');
    const { error: e4a } = await sb.from('b2_musteriler').insert([{ musteri_tipi: 'bireysel' }]);
    t('musteri_kodu eksik → reddedildi (NOT NULL)', !!e4a);
    const { error: e4b } = await sb.from('b2_musteriler').insert([{ musteri_kodu: 'BOT-X1', musteri_tipi: 'GEÇERSIZ' }]);
    t('Geçersiz musteri_tipi → reddedildi (ENUM)', !!e4b);
    const { error: e4c } = await sb.from('b2_musteriler').insert([{ musteri_kodu: 'BOT-MST-001' }]);
    t('Duplicate musteri_kodu → reddedildi (UNIQUE)', !!e4c);

    // TEST 5: Filtreleme
    h('TEST 5: Tip Bazlı Filtreleme');
    const { data: f5a } = await sb.from('b2_musteriler').select('*').eq('musteri_tipi', 'bireysel').like('musteri_kodu', 'BOT-%');
    t('Bireysel filtresi çalışıyor', f5a?.length >= 1);
    const { data: f5b } = await sb.from('b2_musteriler').select('*').eq('musteri_tipi', 'toptan').like('musteri_kodu', 'BOT-%');
    t('Toptan filtresi çalışıyor', f5b?.length >= 1);

    // TEST 6: Güncelleme (Düzenle)
    h('TEST 6: Güncelleme / Düzenle');
    if (mstId) {
        const { error: e6 } = await sb.from('b2_musteriler').update({ telefon: '+90 555 999 9999', aktif: false }).eq('id', mstId);
        t('Müşteri güncellendi', !e6, e6?.message);
        const { data: m6 } = await sb.from('b2_musteriler').select('telefon,aktif').eq('id', mstId).single();
        t('Telefon güncellendi', m6?.telefon === '+90 555 999 9999');
        t('Aktif false yapıldı', m6?.aktif === false);
    }

    // TEST 7: Borç Güncelleme
    h('TEST 7: Borç Takibi Güncelleme');
    if (mstId) {
        const { error: e7 } = await sb.from('b2_musteriler').update({ toplam_borc_tl: 1500.50 }).eq('id', mstId);
        t('Borç güncellendi', !e7, e7?.message);
        const { data: m7 } = await sb.from('b2_musteriler').select('toplam_borc_tl').eq('id', mstId).single();
        t('Borç DB\'de 1500.50', parseFloat(m7?.toplam_borc_tl) === 1500.50);
    }

    // TEST 8: Sipariş ile JOIN
    h('TEST 8: Müşteri → Siparişler JOIN');
    if (mstId) {
        const { data: j8, error: ej8 } = await sb.from('b2_musteriler').select('*, b2_siparisler(id,siparis_no,durum)').eq('id', mstId).single();
        t('Müşteri+Siparişler JOIN çalıştı', !ej8, ej8?.message);
        t('Siparişler array geldi', Array.isArray(j8?.b2_siparisler));
    }

    // TEST 9: Temizlik
    h('TEST 9: Temizlik');
    const { error: ec } = await sb.from('b2_musteriler').delete().like('musteri_kodu', 'BOT-MST-%');
    t('Test müşterileri silindi', !ec, ec?.message);

    const total = ok + fail; const gecti = fail === 0;
    console.log('\n' + '═'.repeat(55));
    if (gecti) { log(`\n🏆 M13 TEST: ${ok}/${total} — %100 BAŞARILI`, 'ok'); log('✅ KURAL 2 ONAYLANDI: M13 Müşteri CRM tamamlandı.', 'ok'); log('📌 Sonraki → M14 Personel\n', 'bl'); }
    else { log(`\n⚠️ ${ok}/${total} geçti, ${fail} BAŞARISIZ`, 'er'); log('❌ Devam edilmiyor\n', 'er'); }
    process.exit(gecti ? 0 : 1);
}
run().catch(e => { log('\n💥 BOT ÇÖKTÜ: ' + e.message, 'er'); process.exit(1); });
