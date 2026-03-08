// =========================================================================
// M1 TEST BOTU: Ar-Ge & Trend Modülü
// Çalıştırma: node m1_arge_test_bot.js
// =========================================================================
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const RENKLER = { basarili: '\x1b[32m', hata: '\x1b[31m', uyari: '\x1b[33m', bilgi: '\x1b[36m', reset: '\x1b[0m', kalin: '\x1b[1m' };
const log = (msg, tip = 'bilgi') => console.log(`${RENKLER[tip]}${msg}${RENKLER.reset}`);
const baslik = (msg) => console.log(`\n${RENKLER.kalin}${RENKLER.bilgi}${'='.repeat(60)}\n  ${msg}\n${'='.repeat(60)}${RENKLER.reset}`);

let gecen = 0, basarisiz = 0;
const test = (ad, durum, detay = '') => {
    if (durum) {
        gecen++;
        log(`  ✅ GEÇT: ${ad}`, 'basarili');
    } else {
        basarisiz++;
        log(`  ❌ BAŞARISIZ: ${ad}${detay ? ' → ' + detay : ''}`, 'hata');
    }
};

async function calistir() {
    baslik('M1: AR-GE & TREND BOTU BAŞLADI');
    log('Supabase bağlantısı test ediliyor...', 'bilgi');

    let testId = null;

    // ---------------------------------------------------------
    // TEST 1: Tablo Erişimi
    // ---------------------------------------------------------
    baslik('TEST 1: Tablo Erişimi');
    const { data: t1, error: e1 } = await supabase.from('b1_arge_trendler').select('id').limit(1);
    test('b1_arge_trendler tablosuna erişim', !e1, e1?.message);
    if (e1) {
        log('\n⛔ HATA: "b1_arge_trendler" tablosuna erişilemiyor!', 'hata');
        log('Lütfen aşağıdaki adımları takip ederek veritabanı şemasını oluşturun:', 'bilgi');
        log('1. Supabase projenizin paneline gidin.', 'bilgi');
        log('2. Sol menüden "SQL Editor" (SQL Düzenleyici) seçeneğine tıklayın.', 'bilgi');
        log('3. "New query" (Yeni sorgu) butonuna tıklayın.', 'bilgi');
        log('4. Projenizin kök dizininde bulunan "birim1_ek_tablolar.sql" dosyasının içeriğini kopyalayıp SQL düzenleyiciye yapıştırın.', 'bilgi');
        log('5. "RUN" (Çalıştır) butonuna tıklayarak sorguyu çalıştırın.', 'bilgi');
        log('6. İşlem tamamlandıktan sonra bu test botunu tekrar çalıştırın.', 'bilgi');
        process.exit(1);
    }

    // ---------------------------------------------------------
    // TEST 2: Kayıt Ekleme (zorunlu alanlarla)
    // ---------------------------------------------------------
    baslik('TEST 2: Geçerli Kayıt Ekleme');
    const testVerisi = {
        baslik: '[BOT TEST] Yazlık Keten Gömlek',
        baslik_ar: '[اختبار الروبوت] قميص كتان صيفي',
        platform: 'trendyol',
        kategori: 'gomlek',
        talep_skoru: 7,
        referans_linkler: ['https://trendyol.com/test'],
        aciklama: 'Test verisi - bot tarafından eklendi',
        aciklama_ar: 'بيانات الاختبار - أضافها الرobot',
        durum: 'inceleniyor',
    };
    const { data: t2, error: e2 } = await supabase.from('b1_arge_trendler').insert([testVerisi]).select().single();
    test('Geçerli trend kaydı eklendi', !e2 && t2?.id, e2?.message);
    if (t2?.id) { testId = t2.id; log(`     ID: ${testId}`, 'bilgi'); }

    // ---------------------------------------------------------
    // TEST 3: Okuma (geri çekme)
    // ---------------------------------------------------------
    baslik('TEST 3: Kayıt Okuma');
    if (testId) {
        const { data: t3, error: e3 } = await supabase.from('b1_arge_trendler').select('*').eq('id', testId).single();
        test('Eklenen kayıt okundu', !e3 && t3?.baslik === testVerisi.baslik, e3?.message);
        test("Türkçe başlık doğru", t3?.baslik === testVerisi.baslik);
        test("Arapça başlık doğru", t3?.baslik_ar === testVerisi.baslik_ar);
        test("Platform doğru", t3?.platform === 'trendyol');
        test("Talep skoru doğru", t3?.talep_skoru === 7);
        test("Durum 'inceleniyor'", t3?.durum === 'inceleniyor');
    }

    // ---------------------------------------------------------
    // TEST 4: KURAL 1 - Zorunlu Alan Kontrolü (baslik NOT NULL)
    // ---------------------------------------------------------
    baslik('TEST 4: KURAL 1 - Zorunlu Alan Kontrolü (baslik)');
    const { error: e4 } = await supabase.from('b1_arge_trendler').insert([{
        platform: 'amazon',
        kategori: 'pantolon',
        talep_skoru: 5
        // baslik YOK - NOT NULL alanı
    }]);
    test("Başlıksız kayıt reddedildi (baslik NOT NULL)", !!e4, e4?.message);

    // ---------------------------------------------------------
    // TEST 5: KURAL 2 - Platform Değeri Kontrolü (ENUM)
    // ---------------------------------------------------------
    baslik('TEST 5: KURAL 2 - Platform Değeri Kontrolü');
    const { error: e5 } = await supabase.from('b1_arge_trendler').insert([{
        baslik: 'Geçersiz Platform Testi',
        platform: 'GEÇERSIZ_PLATFORM', // Invalid ENUM
        kategori: 'gomlek',
        talep_skoru: 5
    }]);
    test("Geçersiz platform değeri reddedildi (ENUM)", !!e5, e5?.message);

    // ---------------------------------------------------------
    // TEST 6: KURAL 3 - Talep Skoru Aralığı Kontrolü (CHECK 1-10)
    // ---------------------------------------------------------
    baslik('TEST 6: KURAL 3 - Talep Skoru Aralığı Kontrolü');
    const { error: e6 } = await supabase.from('b1_arge_trendler').insert([{
        baslik: 'Skor Sınır Testi',
        platform: 'amazon',
        kategori: 'gomlek',
        talep_skoru: 11 // Max 10
    }]);
    test("Skor 11 reddedildi (CHECK 1-10)", !!e6, e6?.message);

    const { error: e6b } = await supabase.from('b1_arge_trendler').insert([{
        baslik: 'Skor Sınır Testi 2',
        platform: 'amazon',
        kategori: 'gomlek',
        talep_skoru: 0 // Min 1
    }]);
    test("Skor 0 reddedildi (CHECK 1-10)", !!e6b, e6b?.message);

    // ---------------------------------------------------------
    // TEST 7: KURAL 4 - Durum Değeri Kontrolü (ENUM)
    // ---------------------------------------------------------
    baslik('TEST 7: KURAL 4 - Durum Değeri Kontrolü');
    const { error: e7 } = await supabase.from('b1_arge_trendler').insert([{
        baslik: 'Geçersiz Durum Testi',
        platform: 'amazon',
        kategori: 'gomlek',
        talep_skoru: 5,
        durum: 'GEÇERSIZ_DURUM' // Invalid ENUM
    }]);
    test("Geçersiz durum değeri reddedildi (ENUM)", !!e7, e7?.message);

    // ---------------------------------------------------------
    // TEST 8: Durum Güncelleme (Onaylama)
    // ---------------------------------------------------------
    baslik('TEST 8: Onaylama → Ajan Tetikleme');
    if (testId) {
        const { error: e8 } = await supabase.from('b1_arge_trendler').update({ durum: 'onaylandi' }).eq('id', testId);
        test("Trend 'onaylandi' güncellendi", !e8, e8?.message);

        // Ajan logu tetiklendi mi?
        await new Promise(r => setTimeout(r, 1500)); // trigger için bekle
        const { data: loglar } = await supabase.from('b1_agent_loglari').select('*').eq('kaynak_id', testId).limit(1);
        test("Agent logu oluşturuldu", loglar?.length > 0);

        // Sistem uyarısı oluşturuldu mu?
        const { data: uyarilar } = await supabase.from('b1_sistem_uyarilari').select('*').eq('kaynak_id', testId).limit(1);
        test("Sistem uyarısı oluşturuldu", uyarilar?.length > 0);
    }

    // ---------------------------------------------------------
    // TEST 9: Filtreleme
    // ---------------------------------------------------------
    baslik('TEST 9: Filtreleme ve Sıralama');
    const { data: t9, error: e9 } = await supabase.from('b1_arge_trendler').select('*').eq('durum', 'onaylandi').order('talep_skoru', { ascending: false });
    test("Onaylı trendler filtrelendi", !e9 && Array.isArray(t9));

    // ---------------------------------------------------------
    // TEST 10: Temizlik (Test verisini sil)
    // ---------------------------------------------------------
    baslik('TEST 10: Temizlik');
    if (testId) {
        // Önce bağlı agent loglarını sil
        await supabase.from('b1_agent_loglari').delete().eq('kaynak_id', testId);
        await supabase.from('b1_sistem_uyarilari').delete().eq('kaynak_id', testId);
        const { error: e10 } = await supabase.from('b1_arge_trendler').delete().eq('id', testId);
        test("Test verisi temizlendi", !e10, e10?.message);
    }

    // ---------------------------------------------------------
    // SONUÇ
    // ---------------------------------------------------------
    const toplam = gecen + basarisiz;
    console.log('\n' + '='.repeat(60));
    if (basarisiz === 0) {
        log(`\n🏆 M1 TEST TAMAMLANDI: ${gecen}/${toplam} TEST GEÇTİ`, 'basarili');
        log('✅ M1: Ar-Ge & Trend modülü ONAYLANDI. M2\'ye geçilebilir.\n', 'basarili');
    } else {
        log(`\n⚠️  SONUÇ: ${gecen}/${toplam} geçti, ${basarisiz} BAŞARISIZ`, 'hata');
        log('❌ M2\'ye geçmeden önce başarısız testleri düzeltin.\n', 'hata');
    }

    process.exit(basarisiz === 0 ? 0 : 1);
}

calistir().catch(err => {
    log('\n💥 BOT ÇÖKTÜ: ' + err.message, 'hata');
    process.exit(1);
});
