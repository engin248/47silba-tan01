/**
 * features/arge/services/argeApi.js
 * Tablolar: b1_arge_trendler, b1_agent_loglari
 * Hook: useArge.js (165 satır, zaten tam)
 */
import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

const SAYFA_BOYUTU = 50;

// ─── OKUMA ────────────────────────────────────────────────────────
export async function trendleriGetir(sayfa = 0) {
    const from = sayfa * SAYFA_BOYUTU;
    const to = from + SAYFA_BOYUTU - 1;
    const [trendRes, logRes] = await Promise.allSettled([
        supabase.from('b1_arge_trendler')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false }).range(from, to),
        supabase.from('b1_agent_loglari')
            .select('id, ajan_adi, mesaj, sonuc, created_at')
            .eq('ajan_adi', 'Trend Kâşifi')
            .order('created_at', { ascending: false }).limit(5),
    ]);
    return {
        trendler: trendRes.status === 'fulfilled' ? (trendRes.value.data || []) : [],
        toplamSayisi: trendRes.status === 'fulfilled' ? (trendRes.value.count || 0) : 0,
        sayfaBoyutu: SAYFA_BOYUTU,
        agentLoglari: logRes.status === 'fulfilled' ? (logRes.value.data || []) : [],
    };
}

// ─── YAZMA ────────────────────────────────────────────────────────
export async function trendKaydet(payload, duzenleId) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_arge_trendler', duzenleId ? 'UPDATE' : 'INSERT',
            duzenleId ? { ...payload, id: duzenleId } : payload);
        return { offline: true };
    }
    const { error } = duzenleId
        ? await supabase.from('b1_arge_trendler').update(payload).eq('id', duzenleId)
        : await supabase.from('b1_arge_trendler').insert([payload]);
    if (error) throw error;
    return { offline: false };
}

export async function aiTrendKaydet(sonuc) {
    const { data: mevcutlar } = await supabase
        .from('b1_arge_trendler').select('id').eq('baslik', sonuc.baslik);
    if (mevcutlar?.length > 0) throw new Error('Bu trend zaten sisteme kaydedilmiş!');
    const { error } = await supabase.from('b1_arge_trendler').insert([{
        baslik: sonuc.baslik,
        platform: ['trendyol', 'amazon', 'instagram', 'pinterest', 'diger'].includes(sonuc.platform) ? sonuc.platform : 'diger',
        kategori: 'diger', hedef_kitle: 'kadın',
        talep_skoru: parseInt(sonuc.talep_skoru) || 5,
        zorluk_derecesi: 5,
        referans_linkler: sonuc.kaynak ? [sonuc.kaynak] : null,
        aciklama: sonuc.aciklama || null,
        durum: 'inceleniyor',
    }]);
    if (error) throw error;
}

export async function durumGuncelle(id, yeniDurum) {
    const { error } = await supabase.from('b1_arge_trendler')
        .update({ durum: yeniDurum }).eq('id', id);
    if (error) throw error;
}

export async function trendSil(id, kullaniciAd) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_arge_trendler', 'DELETE', { id });
        return { offline: true };
    }
    const { data: silinecek } = await supabase.from('b1_arge_trendler').select('*').eq('id', id).single();
    if (silinecek) {
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: 'b1_arge_trendler', islem_tipi: 'SILME',
            eski_veri: silinecek, kullanici_adi: kullaniciAd || 'Atölye Lideri'
        }]);
    }
    const { error } = await supabase.from('b1_arge_trendler').delete().eq('id', id);
    if (error) throw error;
    return { offline: false };
}

// ─── TREND ARAMA (Perplexity API) ────────────────────────────────
export async function trendAra(sorgu) {
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch('/api/trend-ara', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sorgu }), signal: controller.signal,
    });
    clearTimeout(tId);
    const data = await res.json();
    return data;
}

// ─── REALTIME ─────────────────────────────────────────────────────
export function argeKanaliKur(onChange) {
    return supabase.channel('arge-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_arge_trendler' }, onChange)
        .subscribe();
}
