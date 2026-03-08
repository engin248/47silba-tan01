// ============================================================
// AJAN MOTORU — 47 Sil Baştan
// Supabase okur → karar verir → Supabase yazar
// Dışarıya sıfır bağlantı
// ============================================================
import { supabase } from '@/lib/supabase';

// Gerçek tablo kolonları (birim1_ek_tablolar.sql'den):
// b1_sistem_uyarilari:
//   uyari_tipi: 'dusuk_stok'|'liyakat_uyari'|'maliyet_asimi'|'fire_yuksek'|'video_eksik'|'malzeme_eksik'|'diger'
//   seviye: 'bilgi'|'uyari'|'kritik'
//   baslik, baslik_ar, mesaj, kaynak_tablo, kaynak_id, durum, olusturma

// ------------------------------------------------------------
// YARDIMCI: Uyarı yaz (son 2 saatte aynı kaynak için duplicate yok)
// ------------------------------------------------------------
async function uyariYaz(uyari_tipi, seviye, baslik, mesaj, kaynak_tablo, kaynak_id) {
    const ikiSaatOnce = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: var_ } = await supabase
        .from('b1_sistem_uyarilari')
        .select('id')
        .eq('uyari_tipi', uyari_tipi)
        .eq('kaynak_id', kaynak_id || '00000000-0000-0000-0000-000000000000')
        .eq('durum', 'aktif')
        .gte('olusturma', ikiSaatOnce)
        .limit(1);

    if (var_?.length > 0) return null;

    const { data } = await supabase.from('b1_sistem_uyarilari').insert([{
        uyari_tipi,
        seviye,
        baslik,
        mesaj,
        kaynak_tablo,
        kaynak_id: kaynak_id || null,
        durum: 'aktif',
    }]).select().single();

    // Agent log
    await supabase.from('b1_agent_loglari').insert([{
        ajan_adi: 'Sistem Ajani',
        islem_tipi: uyari_tipi,
        kaynak_tablo,
        kaynak_id: kaynak_id || null,
        sonuc: 'basarili',
        mesaj: baslik,
    }]);

    return data;
}

// ------------------------------------------------------------
// AJAN 1: Stok Alarm — b2_urun_katalogu tarar
// ------------------------------------------------------------
export async function stokAlarmAjani() {
    const sonuc = { tarandi: 0, uyarilar: [] };
    try {
        const { data: urunler } = await supabase
            .from('b2_urun_katalogu')
            .select('id, urun_adi_tr, stok_adeti, min_stok_alarm, urun_kodu')
            .eq('aktif', true)
            .not('min_stok_alarm', 'is', null);

        if (!urunler) return sonuc;
        sonuc.tarandi = urunler.length;

        for (const u of urunler) {
            if (u.stok_adeti <= u.min_stok_alarm) {
                const sifir = u.stok_adeti === 0;
                const uyari = await uyariYaz(
                    'dusuk_stok',
                    sifir ? 'kritik' : 'uyari',
                    `${sifir ? 'Stok Sıfır' : 'Düşük Stok'}: ${u.urun_adi_tr}`,
                    `${u.stok_adeti} adet | Min: ${u.min_stok_alarm} adet`,
                    'b2_urun_katalogu',
                    u.id
                );
                if (uyari) sonuc.uyarilar.push(uyari);
            }
        }
    } catch (e) { console.error('[Stok Ajan]', e.message); }
    return sonuc;
}

// ------------------------------------------------------------
// AJAN 2: Maliyet Aşım — b1_muhasebe_raporlari tarar
// ------------------------------------------------------------
export async function maliyetAjani() {
    const sonuc = { tarandi: 0, uyarilar: [] };
    try {
        const { data: raporlar } = await supabase
            .from('b1_muhasebe_raporlari')
            .select('id, hedeflenen_maliyet_tl, gerceklesen_maliyet_tl, fark_tl')
            .not('hedeflenen_maliyet_tl', 'is', null)
            .neq('rapor_durumu', 'kilitlendi')
            .order('created_at', { ascending: false })
            .limit(50);

        if (!raporlar) return sonuc;
        sonuc.tarandi = raporlar.length;

        for (const r of raporlar) {
            const hedef = parseFloat(r.hedeflenen_maliyet_tl || 0);
            const fark = parseFloat(r.fark_tl || 0);
            if (hedef <= 0) continue;
            const yuzde = (fark / hedef) * 100;
            if (yuzde > 10) {
                const uyari = await uyariYaz(
                    'maliyet_asimi',
                    yuzde > 25 ? 'kritik' : 'uyari',
                    `Maliyet Aşımı: %${yuzde.toFixed(1)}`,
                    `Hedef: ₺${hedef.toFixed(0)} | Gerçek: ₺${parseFloat(r.gerceklesen_maliyet_tl).toFixed(0)} | Fark: +₺${fark.toFixed(0)}`,
                    'b1_muhasebe_raporlari',
                    r.id
                );
                if (uyari) sonuc.uyarilar.push(uyari);
            }
        }
    } catch (e) { console.error('[Maliyet Ajan]', e.message); }
    return sonuc;
}

// ------------------------------------------------------------
// AJAN 3: Gecikmiş İş Emri — production_orders tarar
// ------------------------------------------------------------
export async function gecikmeAjani() {
    const sonuc = { tarandi: 0, uyarilar: [] };
    try {
        const bugun = new Date().toISOString().split('T')[0];
        const { data: emirler } = await supabase
            .from('production_orders')
            .select('id, quantity, planned_end_date, status, b1_model_taslaklari:model_id(model_adi, model_kodu)')
            .in('status', ['pending', 'in_progress'])
            .not('planned_end_date', 'is', null)
            .lt('planned_end_date', bugun);

        if (!emirler) return sonuc;
        sonuc.tarandi = emirler.length;

        for (const e of emirler) {
            const gun = Math.floor((Date.now() - new Date(e.planned_end_date)) / 86400000);
            const model = e.b1_model_taslaklari?.model_kodu || '?';
            const uyari = await uyariYaz(
                'diger',
                gun > 7 ? 'kritik' : 'uyari',
                `Gecikme: ${model} — ${gun} gün`,
                `Hedef bitiş: ${e.planned_end_date} | Durum: ${e.status} | Adet: ${e.quantity}`,
                'production_orders',
                e.id
            );
            if (uyari) sonuc.uyarilar.push(uyari);
        }
    } catch (e) { console.error('[Gecikme Ajan]', e.message); }
    return sonuc;
}

// ------------------------------------------------------------
// TÜM AJANLARI ÇALIŞTIR
// ------------------------------------------------------------
export async function tumAjanlariCalistir() {
    const [stok, maliyet, gecikme] = await Promise.all([
        stokAlarmAjani(),
        maliyetAjani(),
        gecikmeAjani(),
    ]);
    return { stok, maliyet, gecikme };
}

// ------------------------------------------------------------
// AKTİF UYARILARI GETİR (Denetmen sayfası)
// ------------------------------------------------------------
export async function aktifUyarilariGetir(limit = 100) {
    const { data } = await supabase
        .from('b1_sistem_uyarilari')
        .select('*')
        .eq('durum', 'aktif')
        .order('olusturma', { ascending: false })
        .limit(limit);
    return data || [];
}

export async function uyariCoz(id) {
    await supabase.from('b1_sistem_uyarilari')
        .update({ durum: 'cozuldu', cozum_tarihi: new Date().toISOString() })
        .eq('id', id);
}

export async function uyariGozArd(id) {
    await supabase.from('b1_sistem_uyarilari')
        .update({ durum: 'goz_ardi' })
        .eq('id', id);
}
