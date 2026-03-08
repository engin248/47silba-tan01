// M14 TEST BOTU: Personel & Prim
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const R = { ok: '\x1b[32m', er: '\x1b[31m', wr: '\x1b[33m', bl: '\x1b[36m', rs: '\x1b[0m', b: '\x1b[1m' };
const log = (m, t = 'bl') => console.log(`${R[t]}${m}${R.rs}`);
const h = (m) => console.log(`\n${R.b}${R.bl}${'='.repeat(55)}\n  ${m}\n${'='.repeat(55)}${R.rs}`);
let ok = 0, fail = 0;
const t = (name, pass, detail = '') => { if (pass) { ok++; log(`  ✅ GEÇT: ${name}`, 'ok'); } else { fail++; log(`  ❌ BAŞARISIZ: ${name}${detail ? ' → ' + detail : ''}`, 'er'); } };

async function run() {
    h('M14: PERSONEL & PRİM TEST BOTU');
    log('KURAL 2: Bot %100 geçmeden kontrollere geçilmez\n', 'wr');
    let prsId = null;

    // TEST 1: Tablo Erişimi
    h('TEST 1: b1_personel Tablo Erişimi');
    const { error: e1 } = await sb.from('b1_personel').select('id').limit(1);
    t('b1_personel erişimi', !e1, e1?.message);
    if (e1) { log('\n❌ TABLO YOK! Supabase\'de personel_tablosu.sql çalıştırın.', 'er'); process.exit(1); }

    // TEST 2: Personel Ekleme (farklı roller)
    h('TEST 2: Farklı Rollerde Personel Ekle');
    const { data: p2, error: e2 } = await sb.from('b1_personel').insert([{
        personel_kodu: 'BOT-PRS-001', ad_soyad: '[BOT] Test Dikişçi',
        ad_soyad_ar: 'خياط تجريبي', rol: 'dikisci',
        telefon: '+90 555 000 0001', gunluk_calisma_dk: 480,
        saatlik_ucret_tl: 45.00, ise_giris_tarihi: '2026-01-01', durum: 'aktif'
    }]).select().single();
    t('Dikişçi eklendi', !e2 && p2?.id, e2?.message);
    prsId = p2?.id;

    const { error: e2b } = await sb.from('b1_personel').insert([{ personel_kodu: 'BOT-PRS-002', ad_soyad: '[BOT] Test Kesimci', rol: 'kesimci', saatlik_ucret_tl: 55.00, gunluk_calisma_dk: 480 }]);
    t('Kesimci eklendi', !e2b, e2b?.message);
    const { error: e2c } = await sb.from('b1_personel').insert([{ personel_kodu: 'BOT-PRS-003', ad_soyad: '[BOT] Ustabaşı', rol: 'ustabaşı', saatlik_ucret_tl: 80.00, gunluk_calisma_dk: 480 }]);
    t('Ustabaşı eklendi', !e2c, e2c?.message);

    // TEST 3: Alan Doğrulama
    h('TEST 3: Alan Doğrulama');
    if (prsId) {
        const { data: p3 } = await sb.from('b1_personel').select('*').eq('id', prsId).single();
        t('Personel okundu', !!p3);
        t('Kod doğru', p3?.personel_kodu === 'BOT-PRS-001');
        t('Rol doğru (dikisci)', p3?.rol === 'dikisci');
        t('Saatlik ücret doğru (45)', parseFloat(p3?.saatlik_ucret_tl) === 45);
        t('Günlük dakika doğru (480)', p3?.gunluk_calisma_dk === 480);
        t('Durum default aktif', p3?.durum === 'aktif');
        t('Arapça ad kaydedildi', p3?.ad_soyad_ar === 'خياط تجريبي');
        t('created_at otomatik', !!p3?.created_at);
    }

    // TEST 4: Prim/Günlük Ücret Hesabı
    h('TEST 4: Günlük Ücret Hesabı (Saatlik × Saat)');
    if (prsId) {
        const { data: p4 } = await sb.from('b1_personel').select('saatlik_ucret_tl,gunluk_calisma_dk').eq('id', prsId).single();
        const gunlukUcret = parseFloat(p4?.saatlik_ucret_tl) * (p4?.gunluk_calisma_dk / 60);
        t('Günlük ücret hesabı (45 × 8 = 360)', gunlukUcret === 360, `Hesap: ${gunlukUcret}`);
    }

    // TEST 5: ENUM / NOT NULL Kontrolleri
    h('TEST 5: ENUM / NOT NULL / CHECK Kontrolleri');
    const { error: e5a } = await sb.from('b1_personel').insert([{ rol: 'dikisci', saatlik_ucret_tl: 40 }]);
    t('personel_kodu eksik → reddedildi (NOT NULL)', !!e5a);
    const { error: e5b } = await sb.from('b1_personel').insert([{ personel_kodu: 'BOT-X1', rol: 'GEÇERSIZ', saatlik_ucret_tl: 40, gunluk_calisma_dk: 480 }]);
    t('Geçersiz rol → reddedildi (ENUM)', !!e5b);
    const { error: e5c } = await sb.from('b1_personel').insert([{ personel_kodu: 'BOT-X2', rol: 'dikisci', saatlik_ucret_tl: -10, gunluk_calisma_dk: 480 }]);
    t('Negatif ücret → reddedildi (CHECK >= 0)', !!e5c);
    const { error: e5d } = await sb.from('b1_personel').insert([{ personel_kodu: 'BOT-PRS-001', rol: 'dikisci', saatlik_ucret_tl: 40, gunluk_calisma_dk: 480 }]);
    t('Duplicate kod → reddedildi (UNIQUE)', !!e5d);

    // TEST 6: Durum Değişikliği
    h('TEST 6: Durum Zincirleme (aktif→izinli→aktif)');
    if (prsId) {
        const { error: e6a } = await sb.from('b1_personel').update({ durum: 'izinli' }).eq('id', prsId);
        t('izinli olarak güncellendi', !e6a, e6a?.message);
        const { data: p6a } = await sb.from('b1_personel').select('durum').eq('id', prsId).single();
        t('DB\'de izinli kaydedildi', p6a?.durum === 'izinli');
        const { error: e6b } = await sb.from('b1_personel').update({ durum: 'aktif' }).eq('id', prsId);
        t('Tekrar aktif edildi', !e6b, e6b?.message);
    }

    // TEST 7: Düzenle (Ücret Güncelleme)
    h('TEST 7: Ücret Güncelleme (Düzenle)');
    if (prsId) {
        const { error: e7 } = await sb.from('b1_personel').update({ saatlik_ucret_tl: 55.00 }).eq('id', prsId);
        t('Ücret 55\'e güncellendi', !e7, e7?.message);
        const { data: p7 } = await sb.from('b1_personel').select('saatlik_ucret_tl').eq('id', prsId).single();
        t('DB\'de 55 kaydedildi', parseFloat(p7?.saatlik_ucret_tl) === 55);
    }

    // TEST 8: Rol Bazlı Filtreleme
    h('TEST 8: Rol Bazlı Filtreleme');
    const { data: f8a } = await sb.from('b1_personel').select('*').eq('rol', 'dikisci').like('personel_kodu', 'BOT-%');
    t('Dikişçi filtresi çalışıyor', f8a?.length >= 1);
    const { data: f8b } = await sb.from('b1_personel').select('*').eq('rol', 'kesimci').like('personel_kodu', 'BOT-%');
    t('Kesimci filtresi çalışıyor', f8b?.length >= 1);
    const { data: f8c } = await sb.from('b1_personel').select('*').eq('durum', 'aktif').like('personel_kodu', 'BOT-%');
    t('Aktif filtresi çalışıyor', f8c?.length >= 1);

    // TEST 9: Temizlik
    h('TEST 9: Temizlik');
    const { error: ec } = await sb.from('b1_personel').delete().like('personel_kodu', 'BOT-PRS-%');
    t('Test personeller silindi', !ec, ec?.message);

    const total = ok + fail; const gecti = fail === 0;
    console.log('\n' + '═'.repeat(55));
    if (gecti) { log(`\n🏆 M14 TEST: ${ok}/${total} — %100 BAŞARILI`, 'ok'); log('✅ KURAL 2 ONAYLANDI: M14 Personel tamamlandı.', 'ok'); log('📌 Sonraki → İşlem/Beceri Kontrolleri\n', 'bl'); }
    else { log(`\n⚠️ ${ok}/${total} geçti, ${fail} BAŞARISIZ`, 'er'); log('❌ Devam edilmiyor\n', 'er'); }
    process.exit(gecti ? 0 : 1);
}
run().catch(e => { log('\n💥 BOT ÇÖKTÜ: ' + e.message, 'er'); process.exit(1); });
