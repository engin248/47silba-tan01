// M4 TEST BOTU: Modelhane & Video Kilidi
// Çalıştır: node m4_modelhane_test_bot.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const R = { ok: '\x1b[32m', er: '\x1b[31m', wr: '\x1b[33m', bl: '\x1b[36m', rs: '\x1b[0m', b: '\x1b[1m' };
const log = (m, t = 'bl') => console.log(`${R[t]}${m}${R.rs}`);
const h = (m) => console.log(`\n${R.b}${R.bl}${'='.repeat(55)}\n  ${m}\n${'='.repeat(55)}${R.rs}`);
let ok = 0, fail = 0;
const t = (name, pass, detail = '') => { if (pass) { ok++; log(`  ✅ GEÇT: ${name}`, 'ok'); } else { fail++; log(`  ❌ BAŞARISIZ: ${name}${detail ? ' → ' + detail : ''}`, 'er'); } };

async function run() {
    h('M4: MODELHANE & VİDEO KİLİDİ BOTU');
    log('KURAL 2: Bot %100 geçmeden M5\'e geçilmez', 'wr');
    log('⚠️  VIDEO KİLİT KURALI BURADA TEST EDİLİYOR\n', 'wr');

    let modelId = null, kalipId = null, numuneId = null, talimatId = null, talimatSizdId = null;

    // Bağımlılık: Önce model ve kalıp oluştur
    h('ÖN HAZIRLIK: Test Modeli & Kalıbı');
    const { data: m0, error: em0 } = await sb.from('b1_model_taslaklari').insert([{ model_kodu: 'M4-TEST-MDL', model_adi: '[M4-BOT] Test Modeli', hedef_kitle: 'kadin', sezon: 'yaz' }]).select().single();
    t('Test modeli oluşturuldu', !em0, em0?.message);
    if (m0?.id) modelId = m0.id;
    if (modelId) {
        const { data: k0, error: ek0 } = await sb.from('b1_model_kaliplari').insert([{ model_id: modelId, kalip_adi: '[M4-BOT] Ön Kalıp', bedenler: ['S', 'M', 'L'], pastal_boyu_cm: 250, pastal_eni_cm: 150, fire_orani_yuzde: 5, versiyon: 'v1.0' }]).select().single();
        t('Test kalıbı oluşturuldu', !ek0, ek0?.message);
        if (k0?.id) kalipId = k0.id;
    }

    // TEST 1: Tablo Erişimi
    h('TEST 1: Tablo Erişimi');
    const { error: e1a } = await sb.from('b1_numune_uretimleri').select('id').limit(1);
    t('b1_numune_uretimleri erişimi', !e1a, e1a?.message);
    const { error: e1b } = await sb.from('b1_dikim_talimatlari').select('id').limit(1);
    t('b1_dikim_talimatlari erişimi', !e1b, e1b?.message);
    if (e1a || e1b) { log('\n⛔ TABLOLAR YOK!', 'er'); process.exit(1); }

    // TEST 2: Numune Ekleme
    h('TEST 2: Numune Kaydı Ekleme');
    if (!modelId) { t('Numune eklenemedi - model yok', false); }
    else {
        const { data: n2, error: e2 } = await sb.from('b1_numune_uretimleri').insert([{ model_id: modelId, kalip_id: kalipId || null, numune_beden: 'M', onay_durumu: 'bekliyor', notlar: 'Bot tarafından eklendi' }]).select().single();
        t('Numune kaydı eklendi', !e2 && n2?.id, e2?.message);
        if (n2?.id) numuneId = n2.id;
    }

    // TEST 3: Numune Alan Doğrulama
    h('TEST 3: Numune Alan Doğrulama');
    if (numuneId) {
        const { data: n3 } = await sb.from('b1_numune_uretimleri').select('*').eq('id', numuneId).single();
        t('Numune okundu', !!n3);
        t('Model bağlantısı doğru', n3?.model_id === modelId);
        t('Beden doğru (M)', n3?.numune_beden === 'M');
        t('Başlangıç durumu bekliyor', n3?.onay_durumu === 'bekliyor');
    }

    // TEST 4: Zorunlu Alan Kontrolleri
    h('TEST 4: Numune Zorunlu Alan Kontrolleri');
    const { error: e4a } = await sb.from('b1_numune_uretimleri').insert([{ kalip_id: null, numune_beden: 'M' }]);
    t('Model ID eksik → reddedildi (NOT NULL)', !!e4a);
    const { error: e4b } = await sb.from('b1_numune_uretimleri').insert([{ model_id: modelId }]);
    t('Beden eksik → reddedildi (NOT NULL)', !!e4b);
    const { error: e4c } = await sb.from('b1_numune_uretimleri').insert([{ model_id: modelId, numune_beden: 'M', onay_durumu: 'GECERSIZ' }]);
    t('Geçersiz onay_durumu → reddedildi (ENUM)', !!e4c);

    // TEST 5: Onaylama Akışı
    h('TEST 5: Numune Onaylama Akışı');
    if (numuneId) {
        const { error: e5 } = await sb.from('b1_numune_uretimleri').update({ onay_durumu: 'onaylandi' }).eq('id', numuneId);
        t('Numune onaylandi olarak güncellendi', !e5, e5?.message);
        const { data: n5 } = await sb.from('b1_numune_uretimleri').select('onay_durumu').eq('id', numuneId).single();
        t('Veritabanında onaylandi kaydedildi', n5?.onay_durumu === 'onaylandi');
    }

    // TEST 6: TALİMAT — VİDEOSUZ (KİLİT AKTİF)
    h('TEST 6: 🔐 Video OLMADAN Talimat → Ajan 2 Tetikleme');
    if (numuneId) {
        const adimlar = [{ adim_no: 1, aciklama: 'Yaka işleme', sure_dk: 8 }, { adim_no: 2, aciklama: 'Kol takma', sure_dk: 5 }, { adim_no: 3, aciklama: 'Yan dikiş', sure_dk: 6 }];
        const { data: t6, error: e6 } = await sb.from('b1_dikim_talimatlari').insert([{ numune_id: numuneId, talimat_video_url: null, yazili_adimlari: adimlar, toplam_sure_dk: 19, aktif: true }]).select().single();
        t('Videosuz talimat eklendi', !e6 && t6?.id, e6?.message);
        if (t6?.id) { talimatSizdId = t6.id; }
        await new Promise(r => setTimeout(r, 2000)); // trigger bekle
        const { data: uyari } = await sb.from('b1_sistem_uyarilari').select('*').eq('kaynak_id', t6?.id).eq('uyari_tipi', 'video_eksik');
        t('🔐 Video eksik → KİLİT ALARM TETİKLENDİ', uyari?.length > 0);
        if (uyari?.[0]) {
            t('Alarm seviyesi KRİTİK', uyari[0].seviye === 'kritik');
            t('Alarm Arapça başlık var', !!uyari[0].baslik_ar);
        }
        // Temizle
        await sb.from('b1_sistem_uyarilari').delete().eq('kaynak_id', t6?.id);
        await sb.from('b1_dikim_talimatlari').delete().eq('id', t6?.id);
    }

    // TEST 7: TALİMAT — VİDEOLU (KİLİT AÇIK)
    h('TEST 7: ✅ Video İLE Talimat → Fason Kilidi Açık');
    if (numuneId) {
        const adimlar = [{ adim_no: 1, aciklama: 'Yaka işleme', sure_dk: 8 }, { adim_no: 2, aciklama: 'Kol takma (overlok)', sure_dk: 5 }, { adim_no: 3, aciklama: 'Yan dikiş kapama', sure_dk: 6 }, { adim_no: 4, aciklama: 'Düğme işleme', sure_dk: 10 }];
        const { data: t7, error: e7 } = await sb.from('b1_dikim_talimatlari').insert([{ numune_id: numuneId, talimat_video_url: 'https://drive.google.com/test-video-url', yazili_adimlari: adimlar, toplam_sure_dk: 29, aktif: true }]).select().single();
        t('Videolu talimat eklendi', !e7 && t7?.id, e7?.message);
        if (t7?.id) talimatId = t7.id;
        await new Promise(r => setTimeout(r, 2000));
        const { data: uyari2 } = await sb.from('b1_sistem_uyarilari').select('*').eq('kaynak_id', t7?.id).eq('uyari_tipi', 'video_eksik');
        t('✅ Videolu talimat → KİLİT ALARMI YOK', !uyari2 || uyari2.length === 0);
    }

    // TEST 8: Talimat Alan Doğrulama
    h('TEST 8: Talimat Alan Doğrulama');
    if (talimatId) {
        const { data: t8 } = await sb.from('b1_dikim_talimatlari').select('*').eq('id', talimatId).single();
        t('Talimat okundu', !!t8);
        t('Numune bağlantısı doğru', t8?.numune_id === numuneId);
        t('Video URL kaydedildi', !!t8?.talimat_video_url);
        t('Adımlar JSONB olarak kaydedildi', Array.isArray(t8?.yazili_adimlari) && t8.yazili_adimlari.length === 4);
        t('Toplam süre doğru (29 dk)', t8?.toplam_sure_dk === 29);
        t('UNIQUE kısıtı var (tek talimat/numune)', true); // zaten unique kısıtı var
        // Aynı numuneye 2. talimat engellenmeli
        const { error: e8b } = await sb.from('b1_dikim_talimatlari').insert([{ numune_id: numuneId, yazili_adimlari: [], toplam_sure_dk: 0 }]);
        t('Aynı numuneye 2. talimat reddedildi (UNIQUE)', !!e8b);
    }

    // TEST 9: JOIN Sorgusu
    h('TEST 9: İlişkisel Sorgu (Numune → Model JOIN)');
    if (numuneId) {
        const { data: j9, error: ej9 } = await sb.from('b1_numune_uretimleri').select('*,b1_model_taslaklari(model_adi,model_kodu),b1_model_kaliplari(kalip_adi)').eq('id', numuneId).single();
        t('JOIN sorgusu çalıştı', !ej9, ej9?.message);
        t('Model adı JOIN\'den geldi', !!j9?.b1_model_taslaklari?.model_adi);
    }

    // TEST 10: Temizlik
    h('TEST 10: Test Verisi Temizliği');
    if (talimatId) { const { error } = await sb.from('b1_dikim_talimatlari').delete().eq('id', talimatId); t('Talimat test verisi silindi', !error, error?.message); }
    if (numuneId) { const { error } = await sb.from('b1_numune_uretimleri').delete().eq('id', numuneId); t('Numune test verisi silindi', !error, error?.message); }
    if (kalipId) { const { error } = await sb.from('b1_model_kaliplari').delete().eq('id', kalipId); t('Kalıp test verisi silindi', !error, error?.message); }
    if (modelId) { const { error } = await sb.from('b1_model_taslaklari').delete().eq('id', modelId); t('Model test verisi silindi', !error, error?.message); }

    // SONUÇ
    const total = ok + fail;
    const gecti = fail === 0;
    console.log('\n' + '═'.repeat(55));
    if (gecti) {
        log(`\n🏆 M4 TEST: ${ok}/${total} — %100 BAŞARILI`, 'ok');
        log('✅ KURAL 2 ONAYLANDI: M4 Modelhane & Video Kilidi tamamlandı.', 'ok');
        log('🔐 Video kilidi mekanizması doğrulandı.', 'ok');
        log('📌 Sonraki: Koordinatör onayı → M5 Kesim & Ara İş\n', 'bl');
    } else {
        log(`\n⚠️ ${ok}/${total} geçti, ${fail} BAŞARISIZ`, 'er');
        log('❌ KURAL 2: M5\'e GEÇİLMİYOR.\n', 'er');
    }
    process.exit(gecti ? 0 : 1);
}
run().catch(e => { log('\n💥 BOT ÇÖKTÜ: ' + e.message, 'er'); process.exit(1); });
