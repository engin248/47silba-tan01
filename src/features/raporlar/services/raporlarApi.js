/**
 * features/raporlar/services/raporlarApi.js
 * KN-4: Bölgesel Satış, Haftalık Sipariş Trendi, Model Performansı
 * Recharts için hazır veri döndürür.
 */
import { supabase } from '@/lib/supabase';

import { idb } from '@/lib/idbKalkan';

export async function bolgeselSatisGetir() {
    const defaultData = await idb.getAllWithLimit('m_raporlar', 1, 0);

    const otonomSync = async () => {
        let results;
        try {
            results = await Promise.race([
                supabase.from('b2_siparisler').select('kanal,toplam_tutar_tl,created_at,durum').neq('durum', 'iptal').order('created_at', { ascending: false }).limit(500),
                new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000))
            ]);
        } catch (e) { return []; }

        const data = results?.data || [];
        const kanalMap = {};
        data.forEach(s => {
            const k = s.kanal || 'diger';
            if (!kanalMap[k]) kanalMap[k] = { kanal: k, toplam: 0, adet: 0 };
            kanalMap[k].toplam += parseFloat(s.toplam_tutar_tl || 0);
            kanalMap[k].adet += 1;
        });
        const ans = Object.values(kanalMap).sort((a, b) => b.toplam - a.toplam);
        if (ans.length > 0) await idb.bulkUpsert('m_raporlar', [{ id: 'rapor_bolgesel', data: ans }]);
        return ans;
    };

    if (!defaultData || defaultData.length === 0) return await otonomSync();
    otonomSync(); return defaultData[0].data || [];
}

// Haftalık sipariş trendi (son 8 hafta) — LineChart için
export async function haftalikSiparisGetir() {
    const sekizHaftaOnce = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
        .from('b2_siparisler')
        .select('created_at,toplam_tutar_tl,durum')
        .gte('created_at', sekizHaftaOnce)
        .order('created_at', { ascending: true });
    if (error) throw error;

    // Haftaya göre gruplama
    const haftaMap = {};
    (data || []).forEach(s => {
        const d = new Date(s.created_at);
        const yil = d.getFullYear();
        const hafta = Math.ceil((d.getDate() + new Date(yil, d.getMonth(), 1).getDay()) / 7);
        const key = `${yil}-H${hafta}`;
        if (!haftaMap[key]) haftaMap[key] = { hafta: key, toplam: 0, adet: 0, iptal: 0 };
        if (s.durum === 'iptal') haftaMap[key].iptal += 1;
        else { haftaMap[key].toplam += parseFloat(s.toplam_tutar_tl || 0); haftaMap[key].adet += 1; }
    });
    return Object.values(haftaMap);
}

// Model Performansı — BarChart için
export async function modelPerformansGetir() {
    const { data, error } = await supabase
        .from('b1_model_taslaklari')
        .select('model_kodu,model_adi,hedef_adet,durum,created_at')
        .order('hedef_adet', { ascending: false })
        .limit(20);
    if (error) throw error;
    return (data || []).map(m => ({
        name: m.model_kodu,
        hedef: m.hedef_adet || 0,
        durum: m.durum,
    }));
}

// Maliyet vs. Gelir (son 6 ay) — AreaChart için
export async function maliyetGelirGetir() {
    const altiAyOnce = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    const [malRes, sipRes] = await Promise.allSettled([
        supabase.from('b1_maliyet_kayitlari').select('tutar_tl,created_at').gte('created_at', altiAyOnce),
        supabase.from('b2_siparisler').select('toplam_tutar_tl,created_at').gte('created_at', altiAyOnce).neq('durum', 'iptal'),
    ]);
    const maliyetler = malRes.status === 'fulfilled' ? malRes.value.data || [] : [];
    const siparisler = sipRes.status === 'fulfilled' ? sipRes.value.data || [] : [];

    const ayMap = {};
    const ayAdi = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    maliyetler.forEach(m => { const d = new Date(m.created_at); const k = `${d.getFullYear()}-${d.getMonth() + 1}`; if (!ayMap[k]) ayMap[k] = { ay: ayAdi[d.getMonth()], maliyet: 0, gelir: 0 }; ayMap[k].maliyet += parseFloat(m.tutar_tl || 0); });
    siparisler.forEach(s => { const d = new Date(s.created_at); const k = `${d.getFullYear()}-${d.getMonth() + 1}`; if (!ayMap[k]) ayMap[k] = { ay: ayAdi[d.getMonth()], maliyet: 0, gelir: 0 }; ayMap[k].gelir += parseFloat(s.toplam_tutar_tl || 0); });

    return Object.values(ayMap);
}

export function raporlarKanaliKur(onChange) {
    return supabase.channel('raporlar-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_siparisler' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_maliyet_kayitlari' }, onChange)
        .subscribe();
}
