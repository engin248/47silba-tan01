/**
 * features/guvenlik/services/guvenlikApi.js
 * Tablo: b0_sistem_loglari
 * [B-09b FIX] Servis dosyası oluşturuldu
 */
import { supabase } from '@/lib/supabase';

export async function sistemLoglariniGetir(limit = 100) {
    const { data, error } = await supabase
        .from('b0_sistem_loglari')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data || [];
}

export async function sistemLoguEkle(olay, detay, seviye = 'bilgi') {
    const { error } = await supabase.from('b0_sistem_loglari').insert([{
        olay, detay, seviye,
    }]);
    if (error) throw error;
}

export async function sistemLoglariniTemizle() {
    const { error } = await supabase
        .from('b0_sistem_loglari')
        .delete()
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    if (error) throw error;
}

export function guvenlikKanaliKur(onChange) {
    return supabase.channel('guvenlik-loglari')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b0_sistem_loglari' }, onChange)
        .subscribe();
}
