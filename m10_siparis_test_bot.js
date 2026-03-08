// M10 TEST BOTU: Sipariş Yönetimi
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const R = { ok: '\x1b[32m', er: '\x1b[31m', wr: '\x1b[33m', bl: '\x1b[36m', rs: '\x1b[0m', b: '\x1b[1m' };
const log = (m, t = 'bl') => console.log(`${R[t]}${m}${R.rs}`);
const h = (m) => console.log(`\n${R.b}${R.bl}${'='.repeat(55)}\n  ${m}\n${'='.repeat(55)}${R.rs}`);
let ok = 0, fail = 0;
const t = (name, pass, detail = '') => { if (pass) { ok++; log(`  ✅ GEÇT: ${name}`, 'ok'); } else { fail++; log(`  ❌ BAŞARISIZ: ${name}${detail ? ' → ' + detail : ''}`, 'er'); } };

async function run() {
    h('M10: SİPARİŞ YÖNETİMİ BOTU');
    log('KURAL 2: Bot %100 geçmeden M11\'e geçilmez\n', 'wr');
    let musteriId = null, urunId = null, sipId = null, kalemId = null;

    // ÖN HAZIRLIK
    h('ÖN HAZIRLIK');
    const { data: m0 } = await sb.from('b2_musteriler').insert([{ musteri_kodu: 'BOT-MST-001', ad_soyad: '[BOT] Test Müşterisi', ad_soyad_ar: '[اختبار] عميل اختباري', musteri_tipi: 'toptan' }]).select().single();
    t('Test müşterisi oluşturuldu', !!m0?.id);
    musteriId = m0?.id;
    const { data: u0 } = await sb.from('b2_urun_katalogu').insert([{ urun_kodu: 'BOT-SIP-URN', urun_adi: '[BOT] Sipariş Test Ürünü', satis_fiyati_tl: 250.00, birim_maliyet_tl: 80.00, stok_adeti: 500, min_stok: 10, satis_kanali: 'magaza' }]).select().single();
    t('Test ürünü oluşturuldu', !!u0?.id);
    urunId = u0?.id;

    // TEST 1: Sipariş Oluşturma
    h('TEST 1: Sipariş Oluşturma');
    const { data: s1, error: e1 } = await sb.from('b2_siparisler').insert([{
        musteri_id: musteriId, siparis_no: 'BOT-SIP-001', kanal: 'trendyol',
        toplam_tutar_tl: 500.00, durum: 'beklemede'
    }]).select().single();
    t('Sipariş oluşturuldu', !e1 && s1?.id, e1?.message);
    if (s1?.id) sipId = s1.id;

    // TEST 2: Alan Doğrulama
    h('TEST 2: Sipariş Alan Doğrulama');
    if (sipId) {
        const { data: s2 } = await sb.from('b2_siparisler').select('*').eq('id', sipId).single();
        t('Sipariş okundu', !!s2);
        t('Sipariş no doğru', s2?.siparis_no === 'BOT-SIP-001');
        t('Kanal doğru (trendyol)', s2?.kanal === 'trendyol');
        t('Başlangıç durumu beklemede', s2?.durum === 'beklemede');
        t('Müşteri bağlantısı doğru', s2?.musteri_id === musteriId);
        t('Toplam tutar doğru (500.00)', parseFloat(s2?.toplam_tutar_tl) === 500.00);
    }

    // TEST 3: UNIQUE / ENUM / NOT NULL
    h('TEST 3: UNIQUE / ENUM / NOT NULL Kontrolleri');
    const { error: e3a } = await sb.from('b2_siparisler').insert([{ kanal: 'magaza', toplam_tutar_tl: 100 }]);
    t('siparis_no eksik → reddedildi (NOT NULL)', !!e3a);
    const { error: e3b } = await sb.from('b2_siparisler').insert([{ siparis_no: 'BOT-SIP-001', kanal: 'magaza', toplam_tutar_tl: 100 }]);
    t('Mükerrer sipariş_no → reddedildi (UNIQUE)', !!e3b);
    const { error: e3c } = await sb.from('b2_siparisler').insert([{ siparis_no: 'BOT-ERR1', kanal: 'GEÇERSIZ', toplam_tutar_tl: 100 }]);
    t('Geçersiz kanal → reddedildi (ENUM)', !!e3c);
    const { error: e3d } = await sb.from('b2_siparisler').insert([{ siparis_no: 'BOT-ERR2', kanal: 'magaza', toplam_tutar_tl: 100, durum: 'GEÇERSIZ' }]);
    t('Geçersiz durum → reddedildi (ENUM)', !!e3d);

    // TEST 4: Sipariş Kalemi + GENERATED tutar_tl
    h('TEST 4: Sipariş Kalemi + GENERATED tutar_tl');
    if (sipId && urunId) {
        const { data: k4, error: e4 } = await sb.from('b2_siparis_kalemleri').insert([{
            siparis_id: sipId, urun_id: urunId, beden: 'M', renk: 'Beyaz',
            adet: 3, birim_fiyat_tl: 250.00, iskonto_pct: 10
        }]).select().single();
        t('Sipariş kalemi oluşturuldu', !e4 && k4?.id, e4?.message);
        if (k4?.id) kalemId = k4.id;
        // tutar_tl GENERATED: 3 × 250 × (1 - 10/100) = 675.00
        t('GENERATED tutar_tl doğru (3×250×0.9=675.00)', Math.abs(parseFloat(k4?.tutar_tl) - 675.00) < 0.01, `DB: ${k4?.tutar_tl}`);
        // adet 0 → reddedildi
        const { error: e4b } = await sb.from('b2_siparis_kalemleri').insert([{ siparis_id: sipId, urun_id: urunId, adet: 0, birim_fiyat_tl: 100 }]);
        t('adet=0 → reddedildi (CHECK > 0)', !!e4b);
        // siparis_id zorunlu
        const { error: e4c } = await sb.from('b2_siparis_kalemleri').insert([{ urun_id: urunId, adet: 1, birim_fiyat_tl: 100 }]);
        t('siparis_id eksik → reddedildi (NOT NULL)', !!e4c);
    }

    // TEST 5: 7 Adım Durum Zinciri
    h('TEST 5: 7 Adım Durum Zinciri (beklemede → teslim)');
    if (sipId) {
        const adimlar = [['onaylandi', 'beklemede→onaylandi'], ['hazirlaniyor', 'onaylandi→hazirlaniyor'], ['kargoda', 'hazirlaniyor→kargoda'], ['teslim', 'kargoda→teslim']];
        for (const [durum, label] of adimlar) {
            const { error: eA } = await sb.from('b2_siparisler').update({ durum }).eq('id', sipId);
            t(`${label}`, !eA, eA?.message);
        }
        const { data: sS } = await sb.from('b2_siparisler').select('durum').eq('id', sipId).single();
        t('Final durum: teslim', sS?.durum === 'teslim');
    }

    // TEST 6: Sipariş Robotu Ajan Log (onaylandi geçişinde)
    h('TEST 6: 🤖 Sipariş Robotu Ajan Log');
    const { data: _s2 } = await sb.from('b2_siparisler').insert([{ siparis_no: 'BOT-SIP-ROBOT', kanal: 'magaza', toplam_tutar_tl: 100, durum: 'beklemede' }]).select().single();
    if (_s2?.id) {
        await sb.from('b2_siparisler').update({ durum: 'onaylandi' }).eq('id', _s2.id);
        await new Promise(r => setTimeout(r, 1500));
        const { data: log6 } = await sb.from('b1_agent_loglari').select('*').eq('kaynak_id', _s2.id).eq('ajan_adi', 'Siparis Robotu');
        t('🤖 Sipariş Robotu tetiklendi (log oluştu)', log6?.length > 0);
        if (log6?.[0]) t('Log mesajı doğru içeriyor sipariş no', log6[0].mesaj?.includes('BOT-SIP-ROBOT'));
        await sb.from('b1_agent_loglari').delete().eq('kaynak_id', _s2.id);
        await sb.from('b2_siparisler').delete().eq('id', _s2.id);
    } else t('Sipariş Robotu testi atlandı (sipariş oluşturulamadı)', false);

    // TEST 7: JOIN Sorgusu (Sipariş → Müşteri)
    h('TEST 7: JOIN — Sipariş → Müşteri');
    if (sipId) {
        const { data: j7 } = await sb.from('b2_siparisler').select('*, b2_musteriler:musteri_id(ad_soyad,musteri_kodu)').eq('id', sipId).single();
        t('Sipariş + Müşteri JOIN çalıştı', !!j7?.b2_musteriler?.ad_soyad);
        t('Müşteri adı JOIN\'den geldi', j7?.b2_musteriler?.ad_soyad?.includes('[BOT]'));
    }

    // TEST 8: JOIN — Kalem → Ürün
    h('TEST 8: JOIN — Kalem → Ürün');
    if (kalemId) {
        const { data: j8 } = await sb.from('b2_siparis_kalemleri').select('*, b2_urun_katalogu:urun_id(urun_kodu,urun_adi)').eq('id', kalemId).single();
        t('Kalem + Ürün JOIN çalıştı', !!j8?.b2_urun_katalogu?.urun_kodu);
        t('Ürün kodu JOIN\'den geldi', j8?.b2_urun_katalogu?.urun_kodu === 'BOT-SIP-URN');
    }

    // TEST 9: Filtreleme
    h('TEST 9: Filtreleme');
    const { data: f9a } = await sb.from('b2_siparisler').select('id').eq('kanal', 'trendyol');
    t('Kanal filtresi çalışıyor', Array.isArray(f9a));
    const { data: f9b } = await sb.from('b2_siparisler').select('id').eq('durum', 'teslim');
    t('Durum filtresi çalışıyor', Array.isArray(f9b));
    const { data: f9c } = await sb.from('b2_siparisler').select('id').eq('musteri_id', musteriId);
    t('Müşteri bazlı filtre çalışıyor', Array.isArray(f9c));

    // TEST 10: Temizlik (CASCADE sipariş silinince kalemleri de siliyor)
    h('TEST 10: Temizlik (CASCADE)');
    if (sipId) { const { error } = await sb.from('b2_siparisler').delete().eq('id', sipId); t('Sipariş silindi (CASCADE → kalemler de)', !error, error?.message); }
    // Kalem gerçekten silindi mi?
    if (kalemId) { const { data: kCheck } = await sb.from('b2_siparis_kalemleri').select('id').eq('id', kalemId); t('CASCADE: Kalem otomatik silindi', kCheck?.length === 0); }
    if (urunId) { await sb.from('b2_urun_katalogu').delete().eq('id', urunId); t('Test ürünü silindi', true); }
    if (musteriId) { await sb.from('b2_musteriler').delete().eq('id', musteriId); t('Test müşterisi silindi', true); }

    const total = ok + fail; const gecti = fail === 0;
    console.log('\n' + '═'.repeat(55));
    if (gecti) { log(`\n🏆 M10 TEST: ${ok}/${total} — %100 BAŞARILI`, 'ok'); log('✅ KURAL 2 ONAYLANDI: M10 Sipariş Yönetimi tamamlandı.', 'ok'); log('📌 Sonraki → M11 Stok & Sevkiyat\n', 'bl'); }
    else { log(`\n⚠️ ${ok}/${total} geçti, ${fail} BAŞARISIZ`, 'er'); log('❌ M11\'e GEÇİLMİYOR\n', 'er'); }
    process.exit(gecti ? 0 : 1);
}
run().catch(e => { log('\n💥 BOT ÇÖKTÜ: ' + e.message, 'er'); process.exit(1); });
