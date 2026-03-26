/**
 * features/kumas/services/kumasApi.js
 * Tablolar: b1_kumas_arsivi, b1_aksesuar_arsivi, b2_tedarikciler
 */
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

// ─── OKUMA ────────────────────────────────────────────────────────
export async function kumaslariGetir() {
    const [kumasRes, tedarikciRes] = await Promise.allSettled([
        supabase.from('b1_kumas_arsivi')
            .select('*, b2_tedarikciler(firma_adi)')
            .order('created_at', { ascending: false }).limit(200),
        supabase.from('b2_tedarikciler')
            .select('id, firma_adi').eq('aktif_mi', true).order('firma_adi'),
    ]);
    return {
        kumaslar: kumasRes.status === 'fulfilled' ? (kumasRes.value.data || []).filter(k => k.aktif !== false) : [],
        tedarikciler: tedarikciRes.status === 'fulfilled' ? (tedarikciRes.value.data || []) : [],
    };
}

export async function aksesuarlariGetir() {
    const { data, error } = await supabase.from('b1_aksesuar_arsivi')
        .select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return (data || []).filter(a => a.aktif !== false);
}

export async function gorselArsivGetir() {
    const [kRes, aRes] = await Promise.allSettled([
        supabase.from('b1_kumas_arsivi').select('id,kumas_adi,fotograf_url').not('fotograf_url', 'is', null).limit(100),
        supabase.from('b1_aksesuar_arsivi').select('id,aksesuar_adi,fotograf_url').not('fotograf_url', 'is', null).limit(100),
    ]);
    const k = kRes.status === 'fulfilled' ? kRes.value.data || [] : [];
    const a = aRes.status === 'fulfilled' ? aRes.value.data || [] : [];
    return [
        ...k.map(x => ({ ...x, tip: 'kumas', ad: x.kumas_adi })),
        ...a.map(x => ({ ...x, tip: 'aksesuar', ad: x.aksesuar_adi })),
    ];
}

export async function m1TalepleriGetir() {
    const { data, error } = await supabase.from('b1_arge_trendler')
        .select('*')
        .eq('durum', 'onaylandi')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function firsatlariGetir() {
    const { data, error } = await supabase.from('b2_malzeme_katalogu')
        .select('*')
        .eq('is_firsat', true)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

// ─── YAZMA (API route üzerinden + offline fallback) ───────────────
export async function kumasKaydet(payload) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_kumas_arsivi', 'INSERT', payload);
        return { offline: true };
    }
    const res = await fetch('/api/kumas-ekle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip: 'kumas', veri: payload }),
    });
    const sonuc = await res.json().catch(() => ({}));
    if (res.status === 409) throw new Error('⚠️ ' + sonuc.hata);
    if (res.status === 429) throw new Error('⏳ Çok fazla istek!');
    if (!res.ok) throw new Error(sonuc.hata || 'Sunucu hatası');
    telegramBildirim(`📦 YENİ KUMAŞ\n${payload.kumas_adi} (${payload.kumas_kodu})\n₺${payload.birim_maliyet_tl}/mt | ${payload.stok_mt}mt`);
    return { offline: false };
}

export async function kumasGuncelle(id, payload) {
    const { error } = await supabase.from('b1_kumas_arsivi').update(payload).eq('id', id);
    if (error) throw error;
}

export async function aksesuarKaydet(payload, duzenleId) {
    if (!navigator.onLine && !duzenleId) {
        await cevrimeKuyrugaAl('b1_aksesuar_arsivi', 'INSERT', payload);
        return { offline: true };
    }
    if (duzenleId) {
        const { error } = await supabase.from('b1_aksesuar_arsivi').update(payload).eq('id', duzenleId);
        if (error) throw error;
        return { offline: false };
    }
    const res = await fetch('/api/kumas-ekle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip: 'aksesuar', veri: payload }),
    });
    const sonuc = await res.json().catch(() => ({}));
    if (res.status === 409) throw new Error('⚠️ ' + sonuc.hata);
    if (!res.ok) throw new Error(sonuc.hata || 'Sunucu hatası');
    return { offline: false };
}

export async function kumasSil(tablo, id) {
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: tablo, islem_tipi: 'SILME',
        kullanici_adi: 'Saha Yetkilisi',
        eski_veri: { durum: 'Soft delete öncesi log' }
    }]);
    const { error } = await supabase.from(tablo).update({ aktif: false }).eq('id', id);
    if (error) throw error;
    telegramBildirim(`📂 ARŞİVE KALDIRILDI\nTablo: ${tablo} | ID: ${id}`);
}

// [KU-05] Kumaş Minimum Stok Alarmı
export async function kumasStokAlarmKontrol() {
    const { data, error } = await supabase
        .from('b1_kumas_arsivi')
        .select('id, kumas_kodu, kumas_adi, stok_mt, min_stok_mt, tedarikci_adi')
        .eq('aktif', true)
        .not('stok_mt', 'is', null)
        .not('min_stok_mt', 'is', null);

    if (error || !data?.length) return { kritikSayisi: 0, kritikler: [] };

    const kritikler = data.filter(k => parseFloat(k.stok_mt || 0) < parseFloat(k.min_stok_mt || 0));

    if (kritikler.length > 0) {
        const liste = kritikler.slice(0, 5).map(k =>
            `• ${k.kumas_kodu} — ${k.stok_mt}m (Min: ${k.min_stok_mt}m)`
        ).join('\n');
        telegramBildirim(`⚠️ KUMAŞ STOK ALARMI!\n${kritikler.length} kumaş kritik seviyede:\n${liste}`);
    }

    return { kritikSayisi: kritikler.length, kritikler };
}

// ─── REALTIME ─────────────────────────────────────────────────────
export function kumasKanaliKur(onChange) {
    return supabase.channel('kumas-realtime')
        .on('postgres_changes', { event: '*', schema: 'public' }, onChange)
        .subscribe();
}


// ─── SABİTLER ─────────────────────────────────────────────────────
export const KUMAS_TIPLERI = ['dokuma', 'orgu', 'denim', 'keten', 'ipek', 'sentetik', 'pamuk', 'polar', 'kase', 'viskon', 'diger'];
export const AKSESUAR_TIPLERI = ['dugme', 'fermuar', 'iplik', 'etiket', 'yikama_talimati', 'uti_malzeme', 'baski', 'nakis', 'lastik', 'biye', 'diger'];
export const BIRIMLER = ['adet', 'metre', 'kg', 'litre'];
export const BOSH_KUMAS = { kumas_kodu: '', kumas_adi: '', kumas_adi_ar: '', kumas_tipi: 'pamuk', kompozisyon: '', birim_maliyet_tl: '', genislik_cm: '', gramaj_gsm: '', esneme_payi_yuzde: '0', fotograf_url: '', tedarikci_adi: '', tedarikci_id: '', stok_mt: '', min_stok_mt: '10' };
export const BOSH_AKS = { aksesuar_kodu: '', aksesuar_adi: '', aksesuar_adi_ar: '', tip: 'dugme', birim: 'adet', birim_maliyet_tl: '', stok_adet: '', min_stok: '100', fotograf_url: '', tedarikci_adi: '' };

// ─── ALIAS (useKumas.js uyumluluğu için) ─────────────────────────
export const fetchKumas = kumaslariGetir;
export const fetchAksesuar = aksesuarlariGetir;
export const fetchM1Talepleri = m1TalepleriGetir;
export const fetchGorselArsiv = gorselArsivGetir;
export const fetchFirsatlar = firsatlariGetir;
export const kaydiSil = kumasSil;
