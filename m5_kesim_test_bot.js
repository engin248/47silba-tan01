// M5 TEST BOTU: Kesim & Ara İşçilik
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const R = { ok: '\x1b[32m', er: '\x1b[31m', wr: '\x1b[33m', bl: '\x1b[36m', rs: '\x1b[0m', b: '\x1b[1m' };
const log = (m, t = 'bl') => console.log(`${R[t]}${m}${R.rs}`);
const h = (m) => console.log(`\n${R.b}${R.bl}${'='.repeat(55)}\n  ${m}\n${'='.repeat(55)}${R.rs}`);
let ok = 0, fail = 0;
const t = (name, pass, detail = '') => { if (pass) { ok++; log(`  ✅ GEÇT: ${name}`, 'ok'); } else { fail++; log(`  ❌ BAŞARISIZ: ${name}${detail ? ' → ' + detail : ''}`, 'er'); } };

async function run() {
    h('M5: KESİM & ARA İŞÇİLİK BOTU');
    log('KURAL 2: Bot %100 geçmeden M6\'ya geçilmez\n', 'wr');
    let modelId = null, numuneId = null, kesimId = null, araId = null;

    // ÖN HAZIRLIK
    h('ÖN HAZIRLIK');
    const { data: m0 } = await sb.from('b1_model_taslaklari').insert([{ model_kodu: 'M5-TEST-MDL', model_adi: '[M5-BOT] Test Modeli', hedef_kitle: 'erkek', sezon: 'yaz' }]).select().single();
    t('Test modeli oluşturuldu', !!m0?.id);
    modelId = m0?.id;
    if (modelId) {
        const { data: n0 } = await sb.from('b1_numune_uretimleri').insert([{ model_id: modelId, numune_beden: 'L', onay_durumu: 'onaylandi' }]).select().single();
        t('Test numunesi oluşturuldu', !!n0?.id);
        numuneId = n0?.id;
    }

    // TEST 1: Tablo Erişimi
    h('TEST 1: Tablo Erişimi');
    const { error: e1a } = await sb.from('b1_kesim_is_emirleri').select('id').limit(1);
    t('b1_kesim_is_emirleri erişimi', !e1a, e1a?.message);
    const { error: e1b } = await sb.from('b1_ara_is_emirleri').select('id').limit(1);
    t('b1_ara_is_emirleri erişimi', !e1b, e1b?.message);

    // TEST 2: Kesim İş Emri Ekleme
    h('TEST 2: Kesim İş Emri Ekleme');
    if (numuneId) {
        const { data: k2, error: e2 } = await sb.from('b1_kesim_is_emirleri').insert([{ numune_id: numuneId, uretilecek_adet: 500, kullanilan_mt: 180.5, kesim_durumu: 'planlandi' }]).select().single();
        t('Kesim iş emri eklendi', !e2 && k2?.id, e2?.message);
        if (k2?.id) kesimId = k2.id;
    }

    // TEST 3: Alan Doğrulama
    h('TEST 3: Kesim Emri Alan Doğrulama');
    if (kesimId) {
        const { data: k3 } = await sb.from('b1_kesim_is_emirleri').select('*').eq('id', kesimId).single();
        t('Kesim emri okundu', !!k3);
        t('Numune bağlantısı doğru', k3?.numune_id === numuneId);
        t('Adet doğru (500)', k3?.uretilecek_adet === 500);
        t('Başlangıç durumu planlandi', k3?.kesim_durumu === 'planlandi');
        t('Kullanılan mt doğru', parseFloat(k3?.kullanilan_mt) === 180.5);
    }

    // TEST 4: Zorunlu Alan Kontrolleri
    h('TEST 4: Zorunlu Alan / ENUM / CHECK Kontrolleri');
    const { error: e4a } = await sb.from('b1_kesim_is_emirleri').insert([{ uretilecek_adet: 100 }]);
    t('Numune ID eksik → reddedildi (NOT NULL)', !!e4a);
    const { error: e4b } = await sb.from('b1_kesim_is_emirleri').insert([{ numune_id: numuneId, uretilecek_adet: 0 }]);
    t('Adet 0 → reddedildi (CHECK > 0)', !!e4b);
    const { error: e4c } = await sb.from('b1_kesim_is_emirleri').insert([{ numune_id: numuneId, uretilecek_adet: -5 }]);
    t('Adet negatif → reddedildi (CHECK > 0)', !!e4c);
    const { error: e4d } = await sb.from('b1_kesim_is_emirleri').insert([{ numune_id: numuneId, uretilecek_adet: 100, kesim_durumu: 'GEÇERSIZ' }]);
    t('Geçersiz kesim_durumu → reddedildi (ENUM)', !!e4d);

    // TEST 5: Durum Güncellemesi
    h('TEST 5: Kesim Durumu Zincirleme');
    if (kesimId) {
        const { error: e5 } = await sb.from('b1_kesim_is_emirleri').update({ kesim_durumu: 'devam_ediyor' }).eq('id', kesimId);
        t('devam_ediyor olarak güncellendi', !e5, e5?.message);
        const { error: e5b } = await sb.from('b1_kesim_is_emirleri').update({ kesim_durumu: 'tamamlandi' }).eq('id', kesimId);
        t('tamamlandi olarak güncellendi', !e5b, e5b?.message);
        const { data: k5 } = await sb.from('b1_kesim_is_emirleri').select('kesim_durumu').eq('id', kesimId).single();
        t('Veritabanında tamamlandi kaydedildi', k5?.kesim_durumu === 'tamamlandi');
    }

    // TEST 6: Ara İşçilik Ekleme
    h('TEST 6: Ara İşçilik Kaydı');
    if (kesimId) {
        const { data: a6, error: e6 } = await sb.from('b1_ara_is_emirleri').insert([{ kesim_emri_id: kesimId, islem_tipi: 'baski', aciklama: 'Ön sırt logo baskısı', adet: 500, durum: 'bekliyor' }]).select().single();
        t('Ara işçilik eklendi', !e6 && a6?.id, e6?.message);
        if (a6?.id) araId = a6.id;
    }

    // TEST 7: Ara İş Alan Doğrulama
    h('TEST 7: Ara İş Alan Doğrulama');
    if (araId) {
        const { data: a7 } = await sb.from('b1_ara_is_emirleri').select('*').eq('id', araId).single();
        t('Ara iş okundu', !!a7);
        t('Kesim emri bağlantısı doğru', a7?.kesim_emri_id === kesimId);
        t('İşlem tipi doğru (baski)', a7?.islem_tipi === 'baski');
        t('Adet doğru (500)', a7?.adet === 500);
        t('Başlangıç durumu bekliyor', a7?.durum === 'bekliyor');
        const { error: e7b } = await sb.from('b1_ara_is_emirleri').insert([{ kesim_emri_id: kesimId, islem_tipi: 'GEÇERSIZ', aciklama: 'test', adet: 100 }]);
        t('Geçersiz işlem tipi → reddedildi (ENUM)', !!e7b);
        const { error: e7c } = await sb.from('b1_ara_is_emirleri').insert([{ islem_tipi: 'baski', aciklama: 'test', adet: 100 }]);
        t('Kesim emri ID eksik → reddedildi (NOT NULL)', !!e7c);
    }

    // TEST 8: JOIN Sorgusu
    h('TEST 8: İlişkisel Sorgu (Ara İş → Kesim → Numune → Model)');
    if (araId) {
        const { data: j8, error: ej8 } = await sb.from('b1_ara_is_emirleri')
            .select('*,b1_kesim_is_emirleri(uretilecek_adet,b1_numune_uretimleri(b1_model_taslaklari(model_kodu,model_adi)))').eq('id', araId).single();
        t('3 seviyeli JOIN çalıştı', !ej8, ej8?.message);
        t('Model adı en derin JOIN\'den geldi', !!j8?.b1_kesim_is_emirleri?.b1_numune_uretimleri?.b1_model_taslaklari?.model_adi);
    }

    // TEST 9: Temizlik
    h('TEST 9: Temizlik');
    if (araId) { const { error } = await sb.from('b1_ara_is_emirleri').delete().eq('id', araId); t('Ara iş silindi', !error, error?.message); }
    if (kesimId) { const { error } = await sb.from('b1_kesim_is_emirleri').delete().eq('id', kesimId); t('Kesim emri silindi', !error, error?.message); }
    if (numuneId) { const { error } = await sb.from('b1_numune_uretimleri').delete().eq('id', numuneId); t('Numune silindi', !error, error?.message); }
    if (modelId) { const { error } = await sb.from('b1_model_taslaklari').delete().eq('id', modelId); t('Model silindi', !error, error?.message); }

    const total = ok + fail; const gecti = fail === 0;
    console.log('\n' + '═'.repeat(55));
    if (gecti) { log(`\n🏆 M5 TEST: ${ok}/${total} — %100 BAŞARILI`, 'ok'); log('✅ KURAL 2 ONAYLANDI: M5 Kesim & Ara İş tamamlandı.', 'ok'); log('📌 Sonraki → M6 Üretim Bandı\n', 'bl'); }
    else { log(`\n⚠️ ${ok}/${total} geçti, ${fail} BAŞARISIZ`, 'er'); log('❌ M6\'ya GEÇİLMİYOR\n', 'er'); }
    process.exit(gecti ? 0 : 1);
}
run().catch(e => { log('\n💥 BOT ÇÖKTÜ: ' + e.message, 'er'); process.exit(1); });
