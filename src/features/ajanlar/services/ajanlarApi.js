/**
 * features/ajanlar/services/ajanlarApi.js
 * AI Ajan Komuta Merkezi — Çevrimdışı Zırhlı Servis Motoru (LocalFirst)
 */
import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { idb } from '@/lib/idbKalkan';

// Tüm Ajan Verilerini, Çevrimdışı (IDB) + Supabase Otonom senkron ile çeker
export const ajanVerileriniGetir = async (timeoutPromise) => {
    const localZirh = await idb.getAllWithLimit('m1_ajanlar', 50, 0);

    const otonomSync = async () => {
        let results = [];
        try {
            results = await Promise.race([Promise.allSettled([
                supabase.from('b1_ajan_gorevler').select('*').order('created_at', { ascending: false }).limit(50)
            ]), timeoutPromise]);
        } catch (error) {
            console.error('[KÖR NOKTA ZIRHI - Ajanlar] timeout:', error);
            return { data: null };
        }

        const [gorevlerRes] = results;
        const data = (gorevlerRes?.status === 'fulfilled') ? gorevlerRes.value.data || [] : [];

        if (data.length > 0) await idb.bulkUpsert('m1_ajanlar', data);
        return { data };
    };

    if (!localZirh || localZirh.length === 0) {
        return await otonomSync();
    } else {
        otonomSync(); // Otonom güncelle
        return { data: localZirh, isCached: true };
    }
};

export const ajanGorevEkle = async (form) => {
    // Aynı isimde bekleyen var mı kontrolü
    const { data: mevcutGorev } = await supabase.from('b1_ajan_gorevler').select('id').ilike('gorev_adi', form.gorev_adi.trim()).eq('durum', 'bekliyor');
    if (mevcutGorev && mevcutGorev.length > 0) throw new Error('Bu görev adıyla bekleyen kayıt var!');

    const payload = { ...form, durum: 'bekliyor' };

    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_ajan_gorevler', 'INSERT', payload);
        return { offline: true, data: { id: Date.now() } };
    }

    const { data, error } = await supabase.from('b1_ajan_gorevler').insert([payload]).select().single();
    if (error) throw error;
    return { offline: false, data };
};

export const ajanGorevSil = async (id, kullaniciAdi) => {
    // B0 Kara Kutu Log
    try {
        await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_ajan_gorevler', islem_tipi: 'SILME', kullanici_adi: kullaniciAdi, eski_veri: { durum: 'Silindi', id } }]);
    } catch { }

    const { error } = await supabase.from('b1_ajan_gorevler').delete().eq('id', id);
    if (error) throw error;
};

export const ajanGercekZamanliKur = (onDegisiklik) => {
    return supabase.channel('islem-gercek-zamanli-ai')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_ajan_gorevler' }, onDegisiklik)
        .subscribe();
};
