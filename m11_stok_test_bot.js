// M11 TEST BOTU: Stok & Sevkiyat
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const R = { ok: '\x1b[32m', er: '\x1b[31m', wr: '\x1b[33m', bl: '\x1b[36m', rs: '\x1b[0m', b: '\x1b[1m' };
const log = (m, t = 'bl') => console.log(`${R[t]}${m}${R.rs}`);
const h = (m) => console.log(`\n${R.b}${R.bl}${'='.repeat(55)}\n  ${m}\n${'='.repeat(55)}${R.rs}`);
let ok = 0, fail = 0;
const t = (name, pass, detail = '') => { if (pass) { ok++; log(`  ✅ GEÇT: ${name}`, 'ok'); } else { fail++; log(`  ❌ BAŞARISIZ: ${name}${detail ? ' → ' + detail : ''}`, 'er'); } };

async function run() {
    h('M11: STOK & SEVKİYAT BOTU');
    log('KURAL 2: Bot %100 geçmeden M12\'e geçilmez\n', 'wr');
    let urunId = null, hareketIds = [];

    // ÖN HAZIRLIK
    h('ÖN HAZIRLIK');
    const { data: u0 } = await sb.from('b2_urun_katalogu').insert([{
        urun_kodu: 'BOT-STK-URN', urun_adi: '[BOT] Stok Test Ürünü', satis_fiyati_tl: 150,
        birim_maliyet_tl: 50, stok_adeti: 100, min_stok: 20, satis_kanali: 'magaza'
    }]).select().single();
    t('Test ürünü oluşturuldu', !!u0?.id);
    urunId = u0?.id;

    // TEST 1: Tablo Erişimi
    h('TEST 1: Stok Hareketleri Tablo Erişimi');
    const { error: e1 } = await sb.from('b2_stok_hareketleri').select('id').limit(1);
    t('b2_stok_hareketleri erişimi', !e1, e1?.message);

    // TEST 2: 5 Hareket Tipi Ekleme
    h('TEST 2: 5 Hareket Tipi (giris/cikis/iade/fire/sayim_duzelt)');
    const hareketler = [
        { urun_id: urunId, hareket_tipi: 'giris', adet: 200, referans_tip: 'uretim', aciklama: '1. Birimden devir' },
        { urun_id: urunId, hareket_tipi: 'cikis', adet: 50, referans_tip: 'siparis', aciklama: 'Trendyol sipariş' },
        { urun_id: urunId, hareket_tipi: 'iade', adet: 5, referans_tip: 'iade', aciklama: 'Müşteri iade' },
        { urun_id: urunId, hareket_tipi: 'fire', adet: 3, referans_tip: 'manuel', aciklama: 'Depo hasarı' },
        { urun_id: urunId, hareket_tipi: 'sayim_duzelt', adet: 2, referans_tip: 'manuel', aciklama: 'Sayım farkı' },
    ];
    const { data: h2, error: e2 } = await sb.from('b2_stok_hareketleri').insert(hareketler).select();
    t('5 farklı hareket tipi eklendi', !e2 && h2?.length === 5, e2?.message);
    if (h2) hareketIds = h2.map(h => h.id);

    // TEST 3: Alan Doğrulama
    h('TEST 3: Alan Doğrulama');
    if (hareketIds.length > 0) {
        const { data: h3 } = await sb.from('b2_stok_hareketleri').select('*').eq('id', hareketIds[0]).single();
        t('Hareket okundu', !!h3);
        t('Hareket tipi doğru (giris)', h3?.hareket_tipi === 'giris');
        t('Adet doğru (200)', h3?.adet === 200);
        t('Referans tip doğru (uretim)', h3?.referans_tip === 'uretim');
        t('Açıklama kaydedildi', h3?.aciklama?.includes('Birimden'));
        t('created_at otomatik', !!h3?.created_at);
    }

    // TEST 4: ENUM Kontrolleri
    h('TEST 4: ENUM / NOT NULL Kontrolleri');
    const { error: e4a } = await sb.from('b2_stok_hareketleri').insert([{ hareket_tipi: 'giris', adet: 10 }]);
    t('urun_id eksik → reddedildi (NOT NULL)', !!e4a);
    const { error: e4b } = await sb.from('b2_stok_hareketleri').insert([{ urun_id: urunId, hareket_tipi: 'GEÇERSIZ', adet: 10 }]);
    t('Geçersiz hareket_tipi → reddedildi (ENUM)', !!e4b);
    const { error: e4c } = await sb.from('b2_stok_hareketleri').insert([{ urun_id: urunId, hareket_tipi: 'giris', adet: 10, referans_tip: 'GEÇERSIZ' }]);
    t('Geçersiz referans_tip → reddedildi (ENUM)', !!e4c);
    const { error: e4d } = await sb.from('b2_stok_hareketleri').insert([{ urun_id: urunId, hareket_tipi: 'giris' }]);
    t('adet eksik → reddedildi (NOT NULL)', !!e4d);

    // TEST 5: Filtreleme
    h('TEST 5: Hareket Tipi Filtreleme');
    const { data: f5a } = await sb.from('b2_stok_hareketleri').select('*').eq('urun_id', urunId).eq('hareket_tipi', 'giris');
    t('Giriş filtresi çalışıyor', f5a?.length >= 1);
    const { data: f5b } = await sb.from('b2_stok_hareketleri').select('*').eq('urun_id', urunId).eq('hareket_tipi', 'cikis');
    t('Çıkış filtresi çalışıyor', f5b?.length >= 1);
    const { data: f5c } = await sb.from('b2_stok_hareketleri').select('*').eq('urun_id', urunId).eq('hareket_tipi', 'fire');
    t('Fire filtresi çalışıyor', f5c?.length >= 1);

    // TEST 6: JST NET STOK Hesabı (giriş+iade - çıkış-fire)
    h('TEST 6: Net Stok Hareketi Hesabı');
    if (urunId) {
        const { data: tumHar } = await sb.from('b2_stok_hareketleri').select('hareket_tipi,adet').eq('urun_id', urunId);
        const girisT = tumHar?.filter(h => ['giris', 'iade'].includes(h.hareket_tipi)).reduce((s, h) => s + h.adet, 0) || 0;
        const cikisT = tumHar?.filter(h => ['cikis', 'fire'].includes(h.hareket_tipi)).reduce((s, h) => s + Math.abs(h.adet), 0) || 0;
        t(`Giriş toplamı hesaplandı (200+5=205)`, girisT === 205, `Hesap: ${girisT}`);
        t(`Çıkış toplamı hesaplandı (50+3=53)`, cikisT === 53, `Hesap: ${cikisT}`);
        t('Net hareket hesaplanabilir', (girisT - cikisT) === 152);
    }

    // TEST 7: JOIN (Hareket → Ürün)
    h('TEST 7: JOIN — Hareket → Ürün');
    if (hareketIds.length > 0) {
        const { data: j7, error: ej7 } = await sb.from('b2_stok_hareketleri').select('*, b2_urun_katalogu:urun_id(urun_kodu,urun_adi,stok_adeti,min_stok)').eq('id', hareketIds[0]).single();
        t('Hareket + Ürün JOIN çalıştı', !ej7, ej7?.message);
        t('Ürün kodu JOIN\'den geldi', j7?.b2_urun_katalogu?.urun_kodu === 'BOT-STK-URN');
        t('Stok adeti JOIN\'den geldi', typeof j7?.b2_urun_katalogu?.stok_adeti === 'number');
    }

    // TEST 8: Stok Güncelleme (Ürün stoğunu stok hareketi sonrası güncelle)
    h('TEST 8: Ürün Stok Güncelleme');
    if (urunId) {
        const { error: e8 } = await sb.from('b2_urun_katalogu').update({ stok_adeti: 252 }).eq('id', urunId);
        t('Stok güncellendi (252)', !e8, e8?.message);
        const { data: u8 } = await sb.from('b2_urun_katalogu').select('stok_adeti').eq('id', urunId).single();
        t('Yeni stok DB\'de doğru (252)', u8?.stok_adeti === 252);
    }

    // TEST 9: Temizlik
    h('TEST 9: Temizlik');
    if (hareketIds.length) { const { error } = await sb.from('b2_stok_hareketleri').delete().in('id', hareketIds); t('Test hareketleri silindi', !error, error?.message); }
    // Stok uyarıları temizle
    if (urunId) await sb.from('b1_sistem_uyarilari').delete().eq('kaynak_id', urunId);
    if (urunId) { const { error } = await sb.from('b2_urun_katalogu').delete().eq('id', urunId); t('Test ürünü silindi', !error, error?.message); }

    const total = ok + fail; const gecti = fail === 0;
    console.log('\n' + '═'.repeat(55));
    if (gecti) { log(`\n🏆 M11 TEST: ${ok}/${total} — %100 BAŞARILI`, 'ok'); log('✅ KURAL 2 ONAYLANDI: M11 Stok & Sevkiyat tamamlandı.', 'ok'); log('📌 Sonraki → M12 Kasa & Tahsilat\n', 'bl'); }
    else { log(`\n⚠️ ${ok}/${total} geçti, ${fail} BAŞARISIZ`, 'er'); log('❌ M12\'e GEÇİLMİYOR\n', 'er'); }
    process.exit(gecti ? 0 : 1);
}
run().catch(e => { log('\n💥 BOT ÇÖKTÜ: ' + e.message, 'er'); process.exit(1); });
