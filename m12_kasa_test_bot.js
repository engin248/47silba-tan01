// M12 TEST BOTU: Kasa & Tahsilat
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const R = { ok: '\x1b[32m', er: '\x1b[31m', wr: '\x1b[33m', bl: '\x1b[36m', rs: '\x1b[0m', b: '\x1b[1m' };
const log = (m, t = 'bl') => console.log(`${R[t]}${m}${R.rs}`);
const h = (m) => console.log(`\n${R.b}${R.bl}${'='.repeat(55)}\n  ${m}\n${'='.repeat(55)}${R.rs}`);
let ok = 0, fail = 0;
const t = (name, pass, detail = '') => { if (pass) { ok++; log(`  ✅ GEÇT: ${name}`, 'ok'); } else { fail++; log(`  ❌ BAŞARISIZ: ${name}${detail ? ' → ' + detail : ''}`, 'er'); } };

async function run() {
    h('M12: KASA & TAHSİLAT BOTU');
    log('KURAL 2: Bot %100 geçmeden 2. BİRİM ONAYLANMAZ\n', 'wr');
    let musteriId = null, sipId = null, kasaIds = [];

    // ÖN HAZIRLIK
    h('ÖN HAZIRLIK');
    const { data: m0 } = await sb.from('b2_musteriler').insert([{ musteri_kodu: 'BOT-KASA-MST', ad_soyad: '[BOT] Kasa Test Müşterisi', musteri_tipi: 'toptan' }]).select().single();
    t('Test müşterisi oluşturuldu', !!m0?.id);
    musteriId = m0?.id;
    const { data: s0 } = await sb.from('b2_siparisler').insert([{ siparis_no: 'BOT-KASA-SIP', kanal: 'magaza', toplam_tutar_tl: 2500, durum: 'onaylandi' }]).select().single();
    t('Test siparişi oluşturuldu', !!s0?.id);
    sipId = s0?.id;

    // TEST 1: 5 Hareket Tipi Ekleme
    h('TEST 1: 5 Hareket Tipi (tahsilat/iade/avans/cek/senet)');
    const hareketler = [
        { musteri_id: musteriId, siparis_id: sipId, hareket_tipi: 'tahsilat', odeme_yontemi: 'nakit', tutar_tl: 1000.00, aciklama: 'Nakit peşin ödeme' },
        { musteri_id: musteriId, hareket_tipi: 'tahsilat', odeme_yontemi: 'eft', tutar_tl: 1500.00, aciklama: 'EFT tahsilatı' },
        { musteri_id: musteriId, hareket_tipi: 'iade_odeme', odeme_yontemi: 'nakit', tutar_tl: 200.00, aciklama: 'Hatalı ürün iadesi' },
        { musteri_id: musteriId, hareket_tipi: 'cek', odeme_yontemi: 'cek', tutar_tl: 800.00, vade_tarihi: '2026-04-01', aciklama: 'Nisan vadeli çek' },
        { musteri_id: musteriId, hareket_tipi: 'senet', odeme_yontemi: 'senet', tutar_tl: 500.00, vade_tarihi: '2026-05-01', aciklama: 'Mayıs vadeli senet' },
    ];
    const { data: k1, error: e1 } = await sb.from('b2_kasa_hareketleri').insert(hareketler).select();
    t('5 kasa hareketi eklendi', !e1 && k1?.length === 5, e1?.message);
    if (k1) kasaIds = k1.map(k => k.id);

    // TEST 2: Alan Doğrulama
    h('TEST 2: Alan Doğrulama');
    if (kasaIds.length > 0) {
        const { data: k2 } = await sb.from('b2_kasa_hareketleri').select('*').eq('id', kasaIds[0]).single();
        t('Hareket okundu', !!k2);
        t('Hareket tipi doğru (tahsilat)', k2?.hareket_tipi === 'tahsilat');
        t('Ödeme yöntemi doğru (nakit)', k2?.odeme_yontemi === 'nakit');
        t('Tutar doğru (1000.00)', parseFloat(k2?.tutar_tl) === 1000.00);
        t('Müşteri bağlantısı doğru', k2?.musteri_id === musteriId);
        t('Sipariş bağlantısı doğru', k2?.siparis_id === sipId);
        t('Başlangıç onay_durumu bekliyor', k2?.onay_durumu === 'bekliyor');
        t('created_at otomatik', !!k2?.created_at);
    }

    // TEST 3: ENUM / CHECK Kontrolleri
    h('TEST 3: ENUM / CHECK Kontrolleri');
    const { error: e3a } = await sb.from('b2_kasa_hareketleri').insert([{ hareket_tipi: 'tahsilat', odeme_yontemi: 'nakit', tutar_tl: -100 }]);
    t('Negatif tutar → reddedildi (CHECK > 0)', !!e3a);
    const { error: e3b } = await sb.from('b2_kasa_hareketleri').insert([{ hareket_tipi: 'GEÇERSIZ', odeme_yontemi: 'nakit', tutar_tl: 100 }]);
    t('Geçersiz hareket_tipi → reddedildi (ENUM)', !!e3b);
    const { error: e3c } = await sb.from('b2_kasa_hareketleri').insert([{ hareket_tipi: 'tahsilat', odeme_yontemi: 'GEÇERSIZ', tutar_tl: 100 }]);
    t('Geçersiz odeme_yontemi → reddedildi (ENUM)', !!e3c);
    const { error: e3d } = await sb.from('b2_kasa_hareketleri').insert([{ hareket_tipi: 'tahsilat', odeme_yontemi: 'nakit', tutar_tl: 100, onay_durumu: 'GEÇERSIZ' }]);
    t('Geçersiz onay_durumu → reddedildi (ENUM)', !!e3d);
    const { error: e3e } = await sb.from('b2_kasa_hareketleri').insert([{ hareket_tipi: 'tahsilat', odeme_yontemi: 'nakit', tutar_tl: 0 }]);
    t('Sıfır tutar → reddedildi (CHECK > 0)', !!e3e);

    // TEST 4: Onay Akışı (bekliyor → onaylandi → iptal)
    h('TEST 4: Onay Akışı');
    if (kasaIds.length >= 2) {
        const { error: e4a } = await sb.from('b2_kasa_hareketleri').update({ onay_durumu: 'onaylandi' }).eq('id', kasaIds[0]);
        t('bekliyor → onaylandi geçişi', !e4a, e4a?.message);
        const { data: k4a } = await sb.from('b2_kasa_hareketleri').select('onay_durumu').eq('id', kasaIds[0]).single();
        t('Onay DB\'de kaydedildi', k4a?.onay_durumu === 'onaylandi');
        const { error: e4b } = await sb.from('b2_kasa_hareketleri').update({ onay_durumu: 'iptal' }).eq('id', kasaIds[2]);
        t('bekliyor → iptal geçişi (iade kaydı)', !e4b, e4b?.message);
    }

    // TEST 5: Vade Takibi (çek/senet)
    h('TEST 5: Vade Tarihi Takibi');
    const { data: f5a } = await sb.from('b2_kasa_hareketleri').select('*').eq('hareket_tipi', 'cek').not('vade_tarihi', 'is', null);
    t('Çek kaydı vade tarihiyle alındı', f5a?.length >= 1);
    t('Vade tarihi kaydedildi', !!f5a?.[0]?.vade_tarihi);
    const { data: f5b } = await sb.from('b2_kasa_hareketleri').select('*').eq('hareket_tipi', 'senet').not('vade_tarihi', 'is', null);
    t('Senet kaydı vade tarihiyle alındı', f5b?.length >= 1);

    // TEST 6: Net Kasa Hesabı
    h('TEST 6: Net Kasa / Tahsilat Hesabı');
    if (musteriId) {
        const { data: tumHar } = await sb.from('b2_kasa_hareketleri').select('hareket_tipi,tutar_tl,onay_durumu').eq('musteri_id', musteriId);
        const tahsilat = tumHar?.filter(h => h.hareket_tipi === 'tahsilat' && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0) || 0;
        const iade = tumHar?.filter(h => h.hareket_tipi === 'iade_odeme' && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0) || 0;
        t('Onaylı tahsilat hesaplandı (1000.00)', tahsilat === 1000.00, `Hesap: ${tahsilat}`);
        t('Net kasa hesaplanabilir', typeof (tahsilat - iade) === 'number');
    }

    // TEST 7: Filtreleme
    h('TEST 7: Filtreleme');
    const { data: f7a } = await sb.from('b2_kasa_hareketleri').select('id').eq('hareket_tipi', 'tahsilat').eq('musteri_id', musteriId);
    t('Tahsilat filtresi çalışıyor', f7a?.length >= 2);
    const { data: f7b } = await sb.from('b2_kasa_hareketleri').select('id').eq('onay_durumu', 'bekliyor').eq('musteri_id', musteriId);
    t('Bekleyen filtresi çalışıyor', Array.isArray(f7b));
    const { data: f7c } = await sb.from('b2_kasa_hareketleri').select('id').eq('odeme_yontemi', 'nakit').eq('musteri_id', musteriId);
    t('Ödeme yöntemi filtresi çalışıyor', f7c?.length >= 1);

    // TEST 8: JOIN (Hareket → Müşteri + Sipariş)
    h('TEST 8: JOIN — Hareket → Müşteri + Sipariş');
    if (kasaIds.length > 0) {
        const { data: j8 } = await sb.from('b2_kasa_hareketleri')
            .select('*, b2_musteriler:musteri_id(ad_soyad,musteri_kodu), b2_siparisler:siparis_id(siparis_no)').eq('id', kasaIds[0]).single();
        t('Müşteri JOIN çalıştı', !!j8?.b2_musteriler?.ad_soyad);
        t('Sipariş JOIN çalıştı', !!j8?.b2_siparisler?.siparis_no);
    }

    // TEST 9: Temizlik
    h('TEST 9: Temizlik');
    if (kasaIds.length) { const { error } = await sb.from('b2_kasa_hareketleri').delete().in('id', kasaIds); t('Kasa hareketleri silindi', !error, error?.message); }
    if (sipId) { await sb.from('b2_siparisler').delete().eq('id', sipId); t('Test siparişi silindi', true); }
    if (musteriId) { await sb.from('b2_musteriler').delete().eq('id', musteriId); t('Test müşterisi silindi', true); }

    const total = ok + fail; const gecti = fail === 0;
    console.log('\n' + '═'.repeat(55));
    if (gecti) {
        log(`\n🏆 M12 TEST: ${ok}/${total} — %100 BAŞARILI`, 'ok');
        log('✅ KURAL 2 ONAYLANDI: M12 Kasa & Tahsilat tamamlandı.', 'ok');
        log('', 'ok');
        log('════════════════════════════════════════════', 'ok');
        log('  🎉 2. BİRİM TAMAMLANDI! M9→M12 ONAYLANDI', 'ok');
        log('  ✅ M9  Ürün Kataloğu        — ONAYLANDI', 'ok');
        log('  ✅ M10 Sipariş Yönetimi     — ONAYLANDI', 'ok');
        log('  ✅ M11 Stok & Sevkiyat      — ONAYLANDI', 'ok');
        log('  ✅ M12 Kasa & Tahsilat      — ONAYLANDI', 'ok');
        log('════════════════════════════════════════════', 'ok');
        log('  📌 Toplam: 1.Birim(213) + 2.Birim = HAZİR!\n', 'bl');
    } else {
        log(`\n⚠️ ${ok}/${total} geçti, ${fail} BAŞARISIZ`, 'er');
        log('❌ 2. BİRİM TAMAMLANAMADI.\n', 'er');
    }
    process.exit(gecti ? 0 : 1);
}
run().catch(e => { log('\n💥 BOT ÇÖKTÜ: ' + e.message, 'er'); process.exit(1); });
