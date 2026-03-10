/**
 * features/musteriler/services/musterilerApi.js
 * Tablo: b2_musteriler
 * [B-09d FIX] Servis dosyası oluşturuldu
 */
import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function musterileriGetir(aramaMetni = '') {
    let q = supabase
        .from('b2_musteriler')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
    if (aramaMetni) {
        q = q.or(`musteri_adi.ilike.%${aramaMetni}%,telefon.ilike.%${aramaMetni}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

export async function musteriEkle(payload) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b2_musteriler', 'INSERT', payload);
        return { offline: true };
    }
    const { error } = await supabase.from('b2_musteriler').insert([payload]);
    if (error) throw error;
    return { offline: false };
}

export async function musteriGuncelle(id, payload) {
    const { error } = await supabase.from('b2_musteriler').update(payload).eq('id', id);
    if (error) throw error;
}

export async function musteriSil(id, kullaniciLabel) {
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b2_musteriler',
        islem_tipi: 'SILME',
        kullanici_adi: kullaniciLabel || 'CRM Sorumlusu',
        eski_veri: { id },
    }]).catch(() => { });
    const { error } = await supabase.from('b2_musteriler').delete().eq('id', id);
    if (error) throw error;
}

export function musteriKanaliKur(onChange) {
    return supabase.channel('musteriler-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_musteriler' }, onChange)
        .subscribe();
}
