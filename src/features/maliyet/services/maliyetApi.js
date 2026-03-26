/**
 * features/maliyet/services/maliyetApi.js
 * Tablo: b1_maliyet_kayitlari, b1_model_taslaklari
 */
import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function maliyetleriGetir(orderId = null) {
    let q = supabase.from('b1_maliyet_kayitlari').select('*, b1_model_taslaklari:order_id(model_kodu,model_adi)').order('created_at', { ascending: false }).limit(300);
    if (orderId) q = q.eq('order_id', orderId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

export async function modelleriGetir() {
    const { data, error } = await supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return data || [];
}

export async function maliyetKaydet(payload) {
    if (!navigator.onLine) { await cevrimeKuyrugaAl('b1_maliyet_kayitlari', 'INSERT', payload); return { offline: true }; }
    const { error } = await supabase.from('b1_maliyet_kayitlari').insert([payload]);
    if (error) throw error;
    return { offline: false };
}

export async function maliyetGuncelle(id, payload) {
    const { error } = await supabase.from('b1_maliyet_kayitlari').update(payload).eq('id', id);
    if (error) throw error;
}

export async function maliyetSil(id, kullaniciLabel) {
    await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_maliyet_kayitlari', islem_tipi: 'SILME', kullanici_adi: kullaniciLabel || 'Maliyet Sorumlusu', eski_veri: { id } }]);
    const { error } = await supabase.from('b1_maliyet_kayitlari').delete().eq('id', id);
    if (error) throw error;
}

export function maliyetKanaliKur(onChange) {
    return supabase.channel('maliyet-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'b1_maliyet_kayitlari' }, onChange).subscribe();
}

// [ML-05] Dönemsel Maliyet Trendi — Son 12 Ay
export async function maliyetTrendiGetir() {
    const baslangic = new Date();
    baslangic.setMonth(baslangic.getMonth() - 11);
    baslangic.setDate(1);
    baslangic.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('b1_maliyet_kayitlari')
        .select('created_at, tutar_tl, maliyet_tipi')
        .gte('created_at', baslangic.toISOString())
        .order('created_at', { ascending: true });

    if (error || !data?.length) return [];

    // Aylık gruplama
    const aylikMap = {};
    data.forEach(k => {
        const tarih = new Date(k.created_at);
        const ayKey = `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, '0')}`;
        if (!aylikMap[ayKey]) aylikMap[ayKey] = { ay: ayKey, toplam: 0, personel: 0, isletme: 0, sarf: 0, fire: 0 };
        const tutar = parseFloat(k.tutar_tl || 0);
        aylikMap[ayKey].toplam += tutar;
        if (k.maliyet_tipi === 'personel_iscilik') aylikMap[ayKey].personel += tutar;
        else if (k.maliyet_tipi === 'isletme_gideri') aylikMap[ayKey].isletme += tutar;
        else if (k.maliyet_tipi === 'sarf_malzeme') aylikMap[ayKey].sarf += tutar;
        else if (k.maliyet_tipi === 'fire_kaybi') aylikMap[ayKey].fire += tutar;
    });

    return Object.values(aylikMap).sort((a, b) => a.ay.localeCompare(b.ay));
}

export const KALEM_TIPLERI = ['personel_iscilik', 'isletme_gideri', 'sarf_malzeme', 'fire_kaybi'];
export const BOSH_FORM = { order_id: '', maliyet_tipi: 'personel_iscilik', kalem_aciklama: '', tutar_tl: '', miktar: '', birim: 'adet' };

