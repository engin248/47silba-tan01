/**
 * features/modelhane/services/modelhaneApi.js
 * Tablo: b1_model_taslaklari, b1_modelhane_videolari
 * [B-09c FIX] Servis dosyası oluşturuldu
 */
import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function modelleriGetir() {
    const { data, error } = await supabase
        .from('b1_model_taslaklari')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
    if (error) throw error;
    return data || [];
}

export async function modelEkle(payload) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_model_taslaklari', 'INSERT', payload);
        return { offline: true };
    }
    const { error } = await supabase.from('b1_model_taslaklari').insert([payload]);
    if (error) throw error;
    return { offline: false };
}

export async function modelGuncelle(id, payload) {
    const { error } = await supabase.from('b1_model_taslaklari').update(payload).eq('id', id);
    if (error) throw error;
}

export async function modelSil(id) {
    const { error } = await supabase.from('b1_model_taslaklari').delete().eq('id', id);
    if (error) throw error;
}

export function modelhaneKanaliKur(onChange) {
    return supabase.channel('modelhane-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_taslaklari' }, onChange)
        .subscribe();
}
