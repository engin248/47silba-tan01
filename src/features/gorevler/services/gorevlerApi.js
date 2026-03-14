/**
 * features/gorevler/services/gorevlerApi.js
 * Tablo: b1_gorevler (NIZAM sistemi b1_ prefix standardı)
 * [DÜZELTİLDİ] b0_gorevler → b1_gorevler tablo adı tutarlı hale getirildi
 */
import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function gorevleriGetir(filtre = {}) {
    let q = supabase.from('b1_gorevler')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
    if (filtre.durum) q = q.eq('durum', filtre.durum);
    if (filtre.atanan) q = q.eq('atanan_kisi', filtre.atanan);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

export async function gorevEkle(payload) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_gorevler', 'INSERT', payload);
        return { offline: true };
    }
    const { error } = await supabase.from('b1_gorevler').insert([payload]);
    if (error) throw error;
    return { offline: false };
}

export async function gorevGuncelle(id, payload) {
    const { error } = await supabase.from('b1_gorevler').update(payload).eq('id', id);
    if (error) throw error;
}

export async function gorevSil(id) {
    const { error } = await supabase.from('b1_gorevler').delete().eq('id', id);
    if (error) throw error;
}

export function gorevKanaliKur(onChange) {
    return supabase.channel('gorevler-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_gorevler' }, onChange)
        .subscribe();
}

export const GOREV_DURUMLARI = ['bekliyor', 'devam', 'tamamlandi', 'iptal'];
export const GOREV_ONCELIKLERI = ['dusuk', 'normal', 'yuksek', 'kritik'];
