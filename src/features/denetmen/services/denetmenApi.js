import { supabase } from '@/lib/supabase';

export const fetchDenetmenHaberleri = async () => {
    const [uyariSonuc, logSonuc] = await Promise.allSettled([
        supabase.from('b1_sistem_uyarilari').select('*').eq('durum', 'aktif').order('olusturma', { ascending: false }).limit(100),
        supabase.from('b1_agent_loglari').select('*').order('created_at', { ascending: false }).limit(20)
    ]);

    return {
        uyarilar: uyariSonuc.status === 'fulfilled' && uyariSonuc.value.data ? uyariSonuc.value.data : [],
        loglar: logSonuc.status === 'fulfilled' && logSonuc.value.data ? logSonuc.value.data : []
    };
};

export const runOtoTarama = async () => {
    let yeniUyari = 0;

    // Stok tarama
    const { data: urunler } = await supabase
        .from('b2_urun_katalogu')
        .select('id, urun_adi_tr, stok_adeti, min_stok_alarm')
        .eq('aktif', true)
        .not('min_stok_alarm', 'is', null)
        .limit(500);

    for (const u of (urunler || [])) {
        if (u.stok_adeti <= u.min_stok_alarm) {
            const { data: var_ } = await supabase
                .from('b1_sistem_uyarilari')
                .select('id')
                .eq('uyari_tipi', 'dusuk_stok')
                .eq('kaynak_id', u.id)
                .eq('durum', 'aktif')
                .limit(1);
            if (!var_?.length) {
                await supabase.from('b1_sistem_uyarilari').insert([{
                    uyari_tipi: 'dusuk_stok',
                    seviye: u.stok_adeti === 0 ? 'kritik' : 'uyari',
                    baslik: `${u.stok_adeti === 0 ? 'Stok Sfr' : 'Dşk Stok'}: ${u.urun_adi_tr}`,
                    mesaj: `${u.stok_adeti} adet | Min: ${u.min_stok_alarm} adet`,
                    kaynak_tablo: 'b2_urun_katalogu',
                    kaynak_id: u.id,
                    durum: 'aktif',
                }]);
                yeniUyari++;
            }
        }
    }

    // Maliyet tarama
    const { data: raporlar } = await supabase
        .from('b1_muhasebe_raporlari')
        .select('id, hedeflenen_maliyet_tl, gerceklesen_maliyet_tl, fark_tl')
        .not('hedeflenen_maliyet_tl', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

    for (const r of (raporlar || [])) {
        const hedef = parseFloat(r.hedeflenen_maliyet_tl || 0);
        const fark = parseFloat(r.fark_tl || 0);
        if (hedef <= 0) continue;
        const yuzde = (fark / hedef) * 100;
        if (yuzde > 10) {
            const { data: var_ } = await supabase
                .from('b1_sistem_uyarilari')
                .select('id').eq('uyari_tipi', 'maliyet_asimi').eq('kaynak_id', r.id).eq('durum', 'aktif').limit(1);
            if (!var_?.length) {
                await supabase.from('b1_sistem_uyarilari').insert([{
                    uyari_tipi: 'maliyet_asimi',
                    seviye: yuzde > 25 ? 'kritik' : 'uyari',
                    baslik: `Maliyet Aşm: %${yuzde.toFixed(1)}`,
                    mesaj: `Hedef: ${hedef.toFixed(0)} | Gerğek: ${parseFloat(r.gerceklesen_maliyet_tl).toFixed(0)} | Fark: +${fark.toFixed(0)}`,
                    kaynak_tablo: 'b1_muhasebe_raporlari',
                    kaynak_id: r.id,
                    durum: 'aktif',
                }]);
                yeniUyari++;
            }
        }
    }

    return yeniUyari;
};

export const runAiAnalizi = async (ozet) => {
    const res = await fetch('/api/trend-ara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sorgu: `Bir tekstil atlyesinde şu sistem uyarlar var:\n${ozet}\n\nBunlar ncelik srasna gre deşerlendir ve ksa Trkğe ğzm nerileri sun. Sadece pratik ve uygulanabilir neriler ver.`
        }),
    });
    const data = await res.json();
    return data.ozet || data.sonuclar?.[0]?.aciklama || 'Analiz tamamland.';
};

export const markUyariAsCozuldu = async (id) => {
    const { error } = await supabase.from('b1_sistem_uyarilari').update({ durum: 'cozuldu', cozum_tarihi: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
};

export const markUyariAsGozArdi = async (id) => {
    const { error } = await supabase.from('b1_sistem_uyarilari').update({ durum: 'goz_ardi' }).eq('id', id);
    if (error) throw error;
};

export const sendTelegramNotification = (mesaj_metni) => {
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 10000);
    fetch('/api/telegram-bildirim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesaj: mesaj_metni }),
        signal: controller.signal
    }).finally(() => clearTimeout(tId)).catch(() => null);
};
