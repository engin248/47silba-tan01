/**
 * features/guvenlik/services/guvenlikApi.js
 * Tablo: b0_sistem_loglari
 * [B-09b FIX] Servis dosyası oluşturuldu
 */
import { supabase } from '@/lib/supabase';

import { idb } from '@/lib/idbKalkan';

export async function sistemLoglariniGetir(limit = 100) {
    const localZirh = await idb.getAllWithLimit('m_guvenlik', 1, 0);

    const otonomSync = async () => {
        const timeout = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000));
        let results;
        try {
            results = await Promise.race([
                supabase.from('b0_sistem_loglari').select('*').order('created_at', { ascending: false }).limit(limit),
                timeout
            ]);
        } catch (e) { return []; }

        const data = results?.data || [];
        if (data.length > 0) await idb.bulkUpsert('m_guvenlik', [{ id: 'guvenlik_log_zirhi', data }]);
        return data;
    };

    if (!localZirh || localZirh.length === 0) return await otonomSync();
    otonomSync(); return localZirh[0].data || [];
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
