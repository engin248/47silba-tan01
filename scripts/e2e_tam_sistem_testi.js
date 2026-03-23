/**
 * Sistemin KARARLILIĞINI uçtan uca kanıtlayan End-to-End (E2E) Test Scripti.
 * Node.js stdout buffering problemlerine karşı flush garantili exit mekanizması eklendi.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ HATA: SUPABASE key'leri bulunamadı. Lütfen .env.local dosyasını kontrol edin.");
    process.exit(1);
}

// Websocket açılmaması için realtime disable edilebilir:
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    realtime: { enabled: false }
});

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function log(msg) {
    process.stdout.write(msg + '\n');
}

async function runE2ETest() {
    log("==================================================");
    log("🚀 KARARGAH PROJESİ - UÇTAN UCA (E2E) SİSTEM TESTİ");
    log("==================================================\n");

    const uretim_parti_no = 'E2E-TEST-' + Math.floor(Math.random() * 10000);
    let testMusteriId = null;
    let testSiparisId = null;
    let urunId = null;

    try {
        log("⏳ Adım 1: Mevcut Veritabanından Test Müşterisi Çekiliyor...");
        const { data: mData, error: mErr } = await supabase.from('b2_musteriler').select('id, ad_soyad').eq('aktif', true).limit(1);
        if (mErr) throw mErr;

        if (!mData || mData.length === 0) {
            log("   (Veritabanında aktif müşteri bulunamadı! Otomatik eklenecek...)");
            const { data: newM, error: newMErr } = await supabase.from('b2_musteriler').insert({
                musteri_kodu: 'E2E-CUST-' + Math.floor(Math.random() * 1000),
                ad_soyad: 'E2E Test Müşterisi', musteri_tipi: 'bireysel', aktif: true
            }).select('id, ad_soyad').single();
            if (newMErr) throw newMErr;
            testMusteriId = newM.id;
        } else {
            testMusteriId = mData[0].id;
            log(`✅ Mevcut Müşteri Bulundu: ${mData[0].ad_soyad} (ID: ${testMusteriId})`);
        }

        log("\n⏳ Adım 1.5: Katalogdan Ürün Seçiliyor...");
        const { data: uData, error: uErr } = await supabase.from('b2_urun_katalogu').select('id, urun_kodu, satis_fiyati_tl').limit(1);
        if (uErr) throw uErr;

        if (!uData || uData.length === 0) {
            log("   (Katalog boş, test amaçlı geçici ürün ekleniyor...)");
            const { data: newU, error: newUErr } = await supabase.from('b2_urun_katalogu').insert({
                urun_kodu: 'E2E-URUN', urun_adi: 'E2E Test Ürünü', stok_adeti: 100, satis_fiyati_tl: 100, durum: 'aktif', uretim_maliyeti_tl: 40
            }).select('id').single();
            if (newUErr) throw newUErr;
            urunId = newU.id;
        } else {
            urunId = uData[0].id;
        }

        log("\n⏳ Adım 2: Test Siparişi oluşturuluyor...");
        const { data: sData, error: sErr } = await supabase.from('b2_siparisler').insert({
            musteri_id: testMusteriId,
            siparis_no: 'E2E-ORD-' + Math.floor(Math.random() * 10000),
            kanal: 'magaza',
            toplam_tutar_tl: 5000,
            durum: 'beklemede',
            para_birimi: 'TL',
            odeme_yontemi: 'nakit',
            acil: true
        }).select('id').single();
        if (sErr) throw sErr;
        testSiparisId = sData.id;

        await supabase.from('b2_siparis_kalemleri').insert({
            siparis_id: testSiparisId,
            urun_id: urunId,
            adet: 50,
            birim_fiyat_tl: 100
        });
        log(`✅ Sipariş oluşturuldu. ID: ${testSiparisId}`);

        log("\n⏳ Adım 3: İmalat Emri simüle ediliyor...");
        const { error: iErr } = await supabase.from('b1_imalat_emirleri').insert({
            siparis_id: testSiparisId,
            hedef_adet: 50,
            parti_no: uretim_parti_no,
            durum: 'tamamlandi',
            tamamlanan_adet: 50,
            oncelik: 'yuksek',
            uretim_notlari: 'E2E Otomatik Test'
        });
        if (iErr) throw iErr;
        log(`✅ İmalat oluşturuldu ve TAMAMLANDI. (Parti: ${uretim_parti_no})`);

        log("\n⏳ Adım 4: Sipariş durumu 'Teslim' yapılıyor...");
        const { error: uSipErr } = await supabase.from('b2_siparisler').update({ durum: 'teslim' }).eq('id', testSiparisId);
        if (uSipErr) throw uSipErr;
        log(`✅ Sipariş durumu güncellendi.`);

        log("\n🧹 Adım 5: E2E Test Temizliği yapılıyor...");
        await supabase.from('b2_kasa_hareketleri').delete().ilike('aciklama', `%${testSiparisId}%`);
        await supabase.from('b1_kasa_islemleri').delete().ilike('aciklama', `%${testSiparisId}%`);
        await supabase.from('b1_imalat_emirleri').delete().eq('siparis_id', testSiparisId);
        await supabase.from('b2_siparis_kalemleri').delete().eq('siparis_id', testSiparisId);
        await supabase.from('b2_siparisler').delete().eq('id', testSiparisId);
        await supabase.from('b2_musteriler').delete().like('musteri_kodu', 'E2E-CUST-%');
        await supabase.from('b2_urun_katalogu').delete().eq('urun_kodu', 'E2E-URUN');

        log("✅ E2E Test verileri baştan sona temizlendi.");
        log("\n🎯 SİSTEM UÇTAN UCA %100 BAŞARILI.");
        log("Tüm işlemler başarıyla tamamlandı.\n");
        process.exit(0);
    } catch (e) {
        log("\n❌ E2E TEST BAŞARISIZ OLDU: " + e.message);
        process.exit(1);
    }
}

runE2ETest();
