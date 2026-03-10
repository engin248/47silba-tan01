/**
 * features/karargah/services/karargahApi.js
 * Dashboard — Tüm tablolardan özet metrikler
 */
import { supabase } from '@/lib/supabase';

export async function karargahMetrikleriGetir() {
    const [sipRes, uretimRes, stokRes, muhasRes, argeRes, ajanRes] = await Promise.allSettled([
        supabase.from('b2_siparisler').select('id,durum,created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('b1_model_taslaklari').select('id,durum,model_kodu,model_adi').order('created_at', { ascending: false }).limit(50),
        supabase.from('b2_urun_katalogu').select('id,urun_kodu,stok_adeti,min_stok').limit(100),
        supabase.from('b1_muhasebe_raporlari').select('id,rapor_durumu,gerceklesen_maliyet_tl').order('created_at', { ascending: false }).limit(20),
        supabase.from('b1_arge_trendler').select('id,durum').limit(50),
        supabase.from('b0_ajan_loglari').select('id,durum,created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    const val = (r) => r.status === 'fulfilled' ? r.value.data || [] : [];

    const siparisler = val(sipRes);
    const uretimler = val(uretimRes);
    const stoklar = val(stokRes);
    const muhasebe = val(muhasRes);
    const trendler = val(argeRes);
    const ajanLoglari = val(ajanRes);

    return {
        siparisler: {
            toplam: siparisler.length,
            bekleyen: siparisler.filter(s => s.durum === 'beklemede').length,
            uretimde: siparisler.filter(s => s.durum === 'uretimde').length,
        },
        uretim: {
            aktif: uretimler.filter(u => u.durum === 'uretimde').length,
            tamamlandi: uretimler.filter(u => u.durum === 'tamamlandi').length,
        },
        stok: {
            kritik: stoklar.filter(s => (s.stok_adeti || 0) <= (s.min_stok || 10)).length,
            toplam: stoklar.length,
        },
        muhasebe: {
            bekleyen: muhasebe.filter(m => m.rapor_durumu === 'sef_onay_bekliyor').length,
            toplamMaliyet: muhasebe.reduce((t, m) => t + parseFloat(m.gerceklesen_maliyet_tl || 0), 0),
        },
        arge: {
            onaylandi: trendler.filter(t => t.durum === 'onaylandi').length,
            inceleniyor: trendler.filter(t => t.durum === 'inceleniyor').length,
        },
        ajanlar: {
            sonDurum: ajanLoglari[0]?.durum || 'yok',
            toplamLog: ajanLoglari.length,
        },
    };
}

export function karargahKanaliKur(onChange) {
    return supabase.channel('karargah-realtime')
        .on('postgres_changes', { event: '*', schema: 'public' }, onChange)
        .subscribe();
}
