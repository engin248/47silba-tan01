// M9 TEST BOTU: Ürün Kataloğu
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const R = { ok: '\x1b[32m', er: '\x1b[31m', wr: '\x1b[33m', bl: '\x1b[36m', rs: '\x1b[0m', b: '\x1b[1m' };
const log = (m, t = 'bl') => console.log(`${R[t]}${m}${R.rs}`);
const h = (m) => console.log(`\n${R.b}${R.bl}${'='.repeat(55)}\n  ${m}\n${'='.repeat(55)}${R.rs}`);
let ok = 0, fail = 0;
const t = (name, pass, detail = '') => { if (pass) { ok++; log(`  ✅ GEÇT: ${name}`, 'ok'); } else { fail++; log(`  ❌ BAŞARISIZ: ${name}${detail ? ' → ' + detail : ''}`, 'er'); } };

async function run() {
    h('M9: ÜRÜN KATALOĞU BOTU — 2. BİRİM BAŞLIYOR');
    log('KURAL 2: Bot %100 geçmeden M10\'a geçilmez\n', 'wr');
    let urunId = null, urunId2 = null;

    // TEST 1: Tablo Erişimi
    h('TEST 1: 2. Birim Tablo Erişimi');
    const { error: e1a } = await sb.from('b2_urun_katalogu').select('id').limit(1);
    t('b2_urun_katalogu erişimi', !e1a, e1a?.message);
    const { error: e1b } = await sb.from('b2_musteriler').select('id').limit(1);
    t('b2_musteriler erişimi', !e1b, e1b?.message);
    const { error: e1c } = await sb.from('b2_siparisler').select('id').limit(1);
    t('b2_siparisler erişimi', !e1c, e1c?.message);
    const { error: e1d } = await sb.from('b2_siparis_kalemleri').select('id').limit(1);
    t('b2_siparis_kalemleri erişimi', !e1d, e1d?.message);
    const { error: e1e } = await sb.from('b2_stok_hareketleri').select('id').limit(1);
    t('b2_stok_hareketleri erişimi', !e1e, e1e?.message);
    const { error: e1f } = await sb.from('b2_kasa_hareketleri').select('id').limit(1);
    t('b2_kasa_hareketleri erişimi', !e1f, e1f?.message);
    if (e1a) { log('\n⛔ TABLOLAR YOK!', 'er'); process.exit(1); }

    // TEST 2: Ürün Ekleme
    h('TEST 2: Ürün Kataloğu Ekleme');
    const { data: u2, error: e2 } = await sb.from('b2_urun_katalogu').insert([{
        urun_kodu: 'BOT-URN-001', urun_adi: '[BOT] Yazlık Keten Gömlek', urun_adi_ar: '[اختبار] قميص كتان',
        birim_maliyet_tl: 45.6700, satis_fiyati_tl: 149.90,
        bedenler: ['S', 'M', 'L', 'XL'], renkler: ['Beyaz', 'Lacivert'],
        stok_adeti: 200, min_stok: 20, satis_kanali: 'trendyol', durum: 'aktif'
    }]).select().single();
    t('Ürün eklendi', !e2 && u2?.id, e2?.message);
    if (u2?.id) urunId = u2.id;

    // TEST 3: Alan Doğrulama + GENERATED Kar Marjı
    h('TEST 3: Alan Doğrulama + Kar Marjı (GENERATED ALWAYS)');
    if (urunId) {
        const { data: u3 } = await sb.from('b2_urun_katalogu').select('*').eq('id', urunId).single();
        t('Ürün okundu', !!u3);
        t('TR adı doğru', u3?.urun_adi === '[BOT] Yazlık Keten Gömlek');
        t('AR adı doğru', u3?.urun_adi_ar === '[اختبار] قميص كتان');
        t('Birim maliyet doğru', parseFloat(u3?.birim_maliyet_tl) === 45.67);
        t('Satış fiyatı doğru', parseFloat(u3?.satis_fiyati_tl) === 149.90);
        // Kar marjı: (149.90 - 45.67) / 149.90 * 100 = 69.53
        const beklenenMarj = ((149.90 - 45.67) / 149.90 * 100).toFixed(2);
        t(`Kar marjı GENERATED doğru (%${beklenenMarj})`, Math.abs(parseFloat(u3?.kar_marji_yuzde) - parseFloat(beklenenMarj)) < 0.1, `DB: ${u3?.kar_marji_yuzde}`);
        t('Bedenler array kaydedildi', Array.isArray(u3?.bedenler) && u3.bedenler.length === 4);
        t('Renkler array kaydedildi', Array.isArray(u3?.renkler) && u3.renkler.length === 2);
        t('Kanal doğru (trendyol)', u3?.satis_kanali === 'trendyol');
        t('Stok doğru (200)', u3?.stok_adeti === 200);
        t('Min stok doğru (20)', u3?.min_stok === 20);
        t('Başlangıç durumu aktif', u3?.durum === 'aktif');
    }

    // TEST 4: Zorunlu Alan / ENUM Kontrolleri
    h('TEST 4: Zorunlu Alan / ENUM / CHECK Kontrolleri');
    const { error: e4a } = await sb.from('b2_urun_katalogu').insert([{ urun_adi: 'Kodsuz', satis_fiyati_tl: 100 }]);
    t('Kodsuz ürün reddedildi (NOT NULL)', !!e4a);
    const { error: e4b } = await sb.from('b2_urun_katalogu').insert([{ urun_kodu: 'BOT-ERR1', urun_adi: 'Test', satis_fiyati_tl: 100, satis_kanali: 'GEÇERSIZ' }]);
    t('Geçersiz kanal → reddedildi (ENUM)', !!e4b);
    const { error: e4c } = await sb.from('b2_urun_katalogu').insert([{ urun_kodu: 'BOT-ERR2', urun_adi: 'Test', satis_fiyati_tl: 100, durum: 'GEÇERSIZ' }]);
    t('Geçersiz durum → reddedildi (ENUM)', !!e4c);
    const { error: e4d } = await sb.from('b2_urun_katalogu').insert([{ urun_kodu: 'BOT-URN-001', urun_adi: 'Kopyası', satis_fiyati_tl: 100 }]);
    t('Mükerrer urun_kodu → reddedildi (UNIQUE)', !!e4d);

    // TEST 5: Düşük Stok → Stok Bekçisi Alarmı
    h('TEST 5: 🔔 Düşük Stok → Stok Bekçisi Ajani Tetikleme');
    const { data: u5, error: e5 } = await sb.from('b2_urun_katalogu').insert([{
        urun_kodu: 'BOT-URN-DUSUK', urun_adi: '[BOT] Düşük Stoklu Ürün', urun_adi_ar: '[اختبار] منتج مخزون منخفض',
        satis_fiyati_tl: 99.90, stok_adeti: 3, min_stok: 20, satis_kanali: 'magaza', durum: 'aktif'
    }]).select().single();
    t('Düşük stoklu ürün eklendi', !e5 && u5?.id, e5?.message);
    if (u5?.id) urunId2 = u5.id;
    await new Promise(r => setTimeout(r, 2000));
    const { data: uyari5 } = await sb.from('b1_sistem_uyarilari').select('*').eq('kaynak_id', u5?.id).eq('uyari_tipi', 'dusuk_stok');
    t('🔔 Stok Bekçisi tetiklendi (alarm oluştu)', uyari5?.length > 0);
    if (uyari5?.[0]) {
        t('Alarm seviyesi kritik', uyari5[0].seviye === 'kritik');
        t('Alarm Arapça başlık var', !!uyari5[0].baslik_ar);
    }
    // Temizle
    if (uyari5?.length) await sb.from('b1_sistem_uyarilari').delete().eq('kaynak_id', u5?.id);

    // TEST 6: Durum Güncelleme
    h('TEST 6: Ürün Durum Güncelleme (aktif → pasif → arsiv)');
    if (urunId) {
        const { error: e6a } = await sb.from('b2_urun_katalogu').update({ durum: 'pasif' }).eq('id', urunId);
        t('aktif → pasif güncellendi', !e6a, e6a?.message);
        const { error: e6b } = await sb.from('b2_urun_katalogu').update({ durum: 'arsiv' }).eq('id', urunId);
        t('pasif → arsiv güncellendi', !e6b, e6b?.message);
        const { error: e6c } = await sb.from('b2_urun_katalogu').update({ durum: 'GEÇERSIZ' }).eq('id', urunId);
        t('Geçersiz durum güncellemesi → reddedildi', !!e6c);
    }

    // TEST 7: Filtreleme
    h('TEST 7: Kanal ve Durum Filtreleme');
    const { data: f7a } = await sb.from('b2_urun_katalogu').select('id').eq('satis_kanali', 'trendyol');
    t('Trendyol kanalı filtresi çalışıyor', Array.isArray(f7a));
    const { data: f7b } = await sb.from('b2_urun_katalogu').select('id').eq('durum', 'aktif');
    t('Aktif ürünler filtresi çalışıyor', Array.isArray(f7b));
    const { data: f7c } = await sb.from('b2_urun_katalogu').select('id').lt('stok_adeti', 10);
    t('Düşük stok sorgusu çalışıyor (stok<10)', Array.isArray(f7c));

    // TEST 8: Temizlik
    h('TEST 8: Temizlik');
    if (urunId2) { const { error } = await sb.from('b2_urun_katalogu').delete().eq('id', urunId2); t('Düşük stoklu test ürünü silindi', !error, error?.message); }
    if (urunId) { const { error } = await sb.from('b2_urun_katalogu').delete().eq('id', urunId); t('Test ürünü silindi', !error, error?.message); }

    const total = ok + fail; const gecti = fail === 0;
    console.log('\n' + '═'.repeat(55));
    if (gecti) { log(`\n🏆 M9 TEST: ${ok}/${total} — %100 BAŞARILI`, 'ok'); log('✅ KURAL 2 ONAYLANDI: M9 Ürün Kataloğu tamamlandı.', 'ok'); log('📌 Sonraki → M10 Sipariş Yönetimi\n', 'bl'); }
    else { log(`\n⚠️ ${ok}/${total} geçti, ${fail} BAŞARISIZ`, 'er'); log('❌ M10\'a GEÇİLMİYOR\n', 'er'); }
    process.exit(gecti ? 0 : 1);
}
run().catch(e => { log('\n💥 BOT ÇÖKTÜ: ' + e.message, 'er'); process.exit(1); });
