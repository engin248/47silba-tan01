// M6 TEST BOTU: Üretim Bandı (5 Departman)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const R = { ok: '\x1b[32m', er: '\x1b[31m', wr: '\x1b[33m', bl: '\x1b[36m', rs: '\x1b[0m', b: '\x1b[1m' };
const log = (m, t = 'bl') => console.log(`${R[t]}${m}${R.rs}`);
const h = (m) => console.log(`\n${R.b}${R.bl}${'='.repeat(55)}\n  ${m}\n${'='.repeat(55)}${R.rs}`);
let ok = 0, fail = 0;
const t = (name, pass, detail = '') => { if (pass) { ok++; log(`  ✅ GEÇT: ${name}`, 'ok'); } else { fail++; log(`  ❌ BAŞARISIZ: ${name}${detail ? ' → ' + detail : ''}`, 'er'); } };

async function run() {
    h('M6: ÜRETİM BANDI BOTU (5 DEPARTMAN)');
    log('KURAL 2: Bot %100 geçmeden M7\'ye geçilmez\n', 'wr');
    let modelId = null, orderId = null, maliyetId = null;

    // ÖN HAZIRLIK: production_orders var mı kontrol
    h('ÖN HAZIRLIK: production_orders Tablo Kontrol');
    const { error: epo } = await sb.from('production_orders').select('id').limit(1);
    if (epo) {
        log('\n⚠️  production_orders tablosu yok!', 'wr');
        log('Supabase\'de şu SQL\'i çalıştırın:\n', 'bl');
        log(`CREATE TABLE IF NOT EXISTS public.production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES public.b1_model_taslaklari(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  status varchar(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  planned_start_date date,
  planned_end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);`, 'wr');
        log(`\nCREATE TRIGGER production_orders_ts BEFORE UPDATE ON public.production_orders FOR EACH ROW EXECUTE FUNCTION update_b1_timestamp();`, 'wr');
        t('production_orders erişimi', false, epo.message);
    } else {
        t('production_orders tablosu mevcut', true);
    }

    // TEST 1: Tüm M6 Tablolarını Kontrol
    h('TEST 1: M6 Tablo Erişimi');
    const { error: e1a } = await sb.from('b1_maliyet_kayitlari').select('id').limit(1);
    t('b1_maliyet_kayitlari erişimi', !e1a, e1a?.message);
    const { error: e1b } = await sb.from('b1_muhasebe_raporlari').select('id').limit(1);
    t('b1_muhasebe_raporlari erişimi', !e1b, e1b?.message);
    const { error: e1c } = await sb.from('b1_agent_loglari').select('id').limit(1);
    t('b1_agent_loglari erişimi', !e1c, e1c?.message);
    const { error: e1d } = await sb.from('b1_sistem_uyarilari').select('id').limit(1);
    t('b1_sistem_uyarilari erişimi', !e1d, e1d?.message);

    // TEST 2: Model ve İş Emri
    h('TEST 2: D-A — İş Emri Oluşturma');
    const { data: m0 } = await sb.from('b1_model_taslaklari').insert([{ model_kodu: 'M6-TEST-MDL', model_adi: '[M6-BOT] Test Modeli', hedef_kitle: 'kadin', sezon: 'yaz' }]).select().single();
    t('Test modeli oluşturuldu', !!m0?.id);
    modelId = m0?.id;

    if (!epo && modelId) {
        const { data: o2, error: e2 } = await sb.from('production_orders').insert([{ model_id: modelId, quantity: 500, status: 'pending' }]).select().single();
        t('İş emri oluşturuldu (D-A)', !e2 && o2?.id, e2?.message);
        if (o2?.id) orderId = o2.id;

        // TEST 3: İş Emri Alan Doğrulama
        h('TEST 3: İş Emri Alan ve ENUM Doğrulama');
        if (orderId) {
            const { data: o3 } = await sb.from('production_orders').select('*').eq('id', orderId).single();
            t('İş emri okundu', !!o3);
            t('Miktar doğru (500)', o3?.quantity === 500);
            t('Başlangıç durumu pending', o3?.status === 'pending');
            t('Model bağlantısı doğru', o3?.model_id === modelId);
        }
        const { error: e3a } = await sb.from('production_orders').insert([{ model_id: modelId, quantity: 0 }]);
        t('Adet 0 → reddedildi (CHECK > 0)', !!e3a);
        const { error: e3b } = await sb.from('production_orders').insert([{ model_id: modelId, quantity: 100, status: 'GEÇERSIZ' }]);
        t('Geçersiz status → reddedildi (ENUM)', !!e3b);
    }

    // TEST 4: D-A Durum Zinciri
    h('TEST 4: D-A — Durum Güncelleme Zinciri');
    if (orderId) {
        const { error: e4a } = await sb.from('production_orders').update({ status: 'in_progress' }).eq('id', orderId);
        t('pending → in_progress güncellendi', !e4a, e4a?.message);
        const { error: e4b } = await sb.from('production_orders').update({ status: 'completed' }).eq('id', orderId);
        t('in_progress → completed güncellendi', !e4b, e4b?.message);
        const { data: o4 } = await sb.from('production_orders').select('status').eq('id', orderId).single();
        t('Veritabanında completed kaydedildi', o4?.status === 'completed');
        // Geri al (maliyet için)
        await sb.from('production_orders').update({ status: 'in_progress' }).eq('id', orderId);
    }

    // TEST 5: D-D Maliyet Kanalları
    h('TEST 5: D-D — 3 Maliyet Kanalı Kaydı');
    if (orderId) {
        const maliyetler = [
            { order_id: orderId, maliyet_tipi: 'personel_iscilik', kalem_aciklama: 'Usta Ahmet — Yaka Dikimi', tutar_tl: 485.60 },
            { order_id: orderId, maliyet_tipi: 'isletme_gideri', kalem_aciklama: 'Sabit Gider Payı', tutar_tl: 125.00 },
            { order_id: orderId, maliyet_tipi: 'sarf_malzeme', kalem_aciklama: 'İplik 250mt × 0.08 TL', tutar_tl: 20.00 },
        ];
        const { data: m5, error: e5 } = await sb.from('b1_maliyet_kayitlari').insert(maliyetler).select();
        t('3 maliyet kanalı kaydedildi', !e5 && m5?.length === 3, e5?.message);
        if (m5?.[0]) maliyetId = m5[0].id;
        if (m5) {
            const toplam = m5.reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
            t('Toplam maliyet doğru (630.60 TL)', Math.abs(toplam - 630.60) < 0.01);
        }
        // ENUM kontrolü
        const { error: e5b } = await sb.from('b1_maliyet_kayitlari').insert([{ order_id: orderId, maliyet_tipi: 'GEÇERSIZ', tutar_tl: 100 }]);
        t('Geçersiz maliyet_tipi → reddedildi (ENUM)', !!e5b);
    }

    // TEST 6: D-D Maliyet Sorgulama
    h('TEST 6: D-D — Maliyet Sorgulama ve Gruplama');
    if (orderId) {
        const { data: m6, error: e6 } = await sb.from('b1_maliyet_kayitlari').select('*').eq('order_id', orderId);
        t('Siparişe ait maliyetler sorgulandı', !e6 && Array.isArray(m6), e6?.message);
        t('3 maliyet kalemi var', m6?.length === 3);
        const personelMaliyeti = m6?.filter(m => m.maliyet_tipi === 'personel_iscilik');
        t('Personel maliyeti filtrelendi', personelMaliyeti?.length === 1);
    }

    // TEST 7: D-E Muhasebe Raporu Oluşturma
    h('TEST 7: D-E — Devir Kapısı / Muhasebe Raporu');
    if (orderId) {
        const { data: r7, error: e7 } = await sb.from('b1_muhasebe_raporlari').insert([{
            order_id: orderId, hedeflenen_maliyet_tl: 600, gerceklesen_maliyet_tl: 630.60, net_uretilen_adet: 490, zayiat_adet: 10,
            rapor_durumu: 'taslak', devir_durumu: false
        }]).select().single();
        t('Muhasebe raporu oluşturuldu', !e7 && r7?.id, e7?.message);
        if (r7) {
            t('Fark hesabı otomatik (630.60-600=30.60)', Math.abs(parseFloat(r7.fark_tl) - 30.60) < 0.01);
            t('Başlangıç devir_durumu false', r7.devir_durumu === false);
            t('Rapor durumu taslak', r7.rapor_durumu === 'taslak');
        }
        // ENUM kontrolü
        const { error: e7b } = await sb.from('b1_muhasebe_raporlari').insert([{ order_id: orderId, rapor_durumu: 'GEÇERSIZ', net_uretilen_adet: 0, zayiat_adet: 0 }]);
        t('Geçersiz rapor_durumu → reddedildi (ENUM)', !!e7b);
    }

    // TEST 8: Sistem Uyarısı (Maliyet Aşımı Simülasyonu)
    h('TEST 8: Maliyet Aşım Kontrolü (%10 üstü)');
    if (orderId) {
        const { data: r8 } = await sb.from('b1_muhasebe_raporlari').select('*').eq('order_id', orderId).single();
        const asimYuzde = r8 ? ((parseFloat(r8.fark_tl) / parseFloat(r8.hedeflenen_maliyet_tl)) * 100).toFixed(1) : 0;
        t('Fark hesaplandı', !!r8);
        t(`Aşım %${asimYuzde} hesaplandı (Hedef: 600 TL, Gerçek: 630.60 TL)`, parseFloat(asimYuzde) > 0);
    }

    // TEST 9: Temizlik
    h('TEST 9: Temizlik');
    const { data: tRap } = await sb.from('b1_muhasebe_raporlari').select('id').eq('order_id', orderId || '00000000-0000-0000-0000-000000000000');
    if (tRap?.length) { await sb.from('b1_muhasebe_raporlari').delete().eq('order_id', orderId); t('Muhasebe raporları silindi', true); }
    const { data: tMal } = await sb.from('b1_maliyet_kayitlari').select('id').eq('order_id', orderId || '00000000-0000-0000-0000-000000000000');
    if (tMal?.length) { await sb.from('b1_maliyet_kayitlari').delete().eq('order_id', orderId); t('Maliyet kayıtları silindi', true); }
    if (orderId) { const { error } = await sb.from('production_orders').delete().eq('id', orderId); t('İş emri silindi', !error || epo, error?.message); }
    if (modelId) { const { error } = await sb.from('b1_model_taslaklari').delete().eq('id', modelId); t('Model silindi', !error, error?.message); }

    const total = ok + fail; const gecti = fail === 0;
    console.log('\n' + '═'.repeat(55));
    if (gecti) { log(`\n🏆 M6 TEST: ${ok}/${total} — %100 BAŞARILI`, 'ok'); log('✅ KURAL 2 ONAYLANDI: M6 Üretim Bandı tamamlandı.', 'ok'); log('📌 Sonraki → M7 Maliyet Merkezi\n', 'bl'); }
    else { log(`\n⚠️ ${ok}/${total} geçti, ${fail} BAŞARISIZ`, 'er'); log('❌ M7\'ye GEÇİLMİYOR\n', 'er'); }
    process.exit(gecti ? 0 : 1);
}
run().catch(e => { log('\n💥 BOT ÇÖKTÜ: ' + e.message, 'er'); process.exit(1); });
