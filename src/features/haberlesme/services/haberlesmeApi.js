import { supabase } from '@/lib/supabase';
import { shaSifrele } from './shaUtils'; // Optional abstraction
import { telegramBildirim } from '@/lib/utils';
import { mesajSifrele, mesajCoz } from '@/lib/mesajSifrele';

export const fetchModeller = async () => {
    const { data } = await supabase.from('b1_model_taslaklari').select('id, model_kodu, model_adi').order('created_at', { ascending: false }).limit(500);
    return data || [];
};

import { idb } from '@/lib/idbKalkan';

export const fetchMesajlar = async (sekme, kullaniciModul, kullaniciAdi, tamArsivYetkisi) => {
    const localZirh = await idb.getAllWithLimit('m_haberlesme', 1, 0);

    const otonomSync = async () => {
        const URETIM_BIRIMLERI = ['uretim', 'kesim', 'kalip', 'arge', 'modelhane', 'tasarim'];
        const uretimBirimiMi = (modul) => URETIM_BIRIMLERI.includes(modul);

        let query = supabase.from('b1_ic_mesajlar').select('*').order('created_at', { ascending: false }).limit(200);

        if (sekme === 'gelen') {
            const temelFiltre = `alici_grup.eq.${kullaniciModul},alici_grup.eq.hepsi`;
            if (uretimBirimiMi(kullaniciModul)) query = query.or(`${temelFiltre},urun_id.not.is.null`);
            else query = query.or(temelFiltre);
        } else if (sekme === 'gonderilen') {
            query = query.eq('gonderen_modul', kullaniciModul);
            if (kullaniciAdi !== 'Bilinmeyen') query = query.eq('gonderen_adi', kullaniciAdi);
        } else if (sekme === 'arsiv') {
            if (tamArsivYetkisi) { }
            else if (uretimBirimiMi(kullaniciModul)) {
                query = query.or(`gonderen_modul.eq.${kullaniciModul},alici_grup.eq.${kullaniciModul},urun_id.not.is.null`);
            } else {
                query = query.or(`gonderen_modul.eq.${kullaniciModul},alici_grup.eq.${kullaniciModul}`);
            }
        } else if (sekme === 'cop') {
            query = query.eq('copte', true);
        }

        const timeout = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000));
        let results;
        try {
            results = await Promise.race([query, timeout]);
        } catch (e) { return []; }

        const data = results?.data || [];
        const paketId = `haberlesme_${sekme}_${kullaniciModul}`;
        if (data.length > 0) await idb.bulkUpsert('m_haberlesme', [{ id: paketId, veri: data }]);
        return data;
    };

    if (!localZirh || localZirh.length === 0) return await otonomSync();

    // Spesifik cache bulma statik arama
    const cacheLine = localZirh.find(z => z.id === `haberlesme_${sekme}_${kullaniciModul}`);
    otonomSync();
    return cacheLine ? cacheLine.veri : [];
};

export const markMesajOkundu = async (id) => {
    await supabase.from('b1_ic_mesajlar').update({
        durum: 'okundu',
        okundu_at: new Date().toISOString(),
    }).eq('id', id);
};

export const sendMesaj = async (payload, oncelik, alici_grup_label, kullaniciAdi, kullaniciModul) => {
    const { error } = await supabase.from('b1_ic_mesajlar').insert([payload]);
    if (error) throw error;

    if (oncelik === 'kritik' || oncelik === 'acil') {
        telegramBildirim(
            `📨 ${oncelik === 'kritik' ? '🔴 KRİTİK' : '🟡 ACİL'} MESAJ\n` +
            `Gönderen: ${kullaniciAdi} (${kullaniciModul})\n` +
            `Alıcı: ${alici_grup_label}\n` +
            `Konu: ${payload.konu}`
        );
    }
};

export const deleteMesaj = async (m, tamArsivYetkisi, kullaniciAdi, referansNotaMi) => {
    await supabase.from('b1_ic_mesajlar').update({
        copte: true,
        cop_tarihi: new Date().toISOString()
    }).eq('id', m.id);

    if (tamArsivYetkisi) {
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: 'b1_ic_mesajlar',
            islem_tipi: referansNotaMi ? 'KOORDINATOR_REF_NOT_COPE_ATTI' : 'KOORDINATOR_COPE_ATTI',
            kullanici_adi: kullaniciAdi,
            eski_veri: { mesaj_id: m.id, konu: m.konu, gonderen: m.gonderen_adi, referans_mi: referansNotaMi },
        }]);
    }
};

export const restoreMesaj = async (id) => {
    await supabase.from('b1_ic_mesajlar').update({
        copte: false,
        cop_tarihi: null
    }).eq('id', id);
};

export const replyMesaj = async (payload, acikMesajId) => {
    const { error } = await supabase.from('b1_ic_mesajlar').insert([payload]);
    if (error) throw error;

    await supabase.from('b1_ic_mesajlar')
        .update({ durum: 'islem_alindi' }).eq('id', acikMesajId);
};

export const approveMesaj = async (mesajId, karar, onayNotu, kullaniciId, kullaniciAdi) => {
    await supabase.from('b1_ic_mesajlar').update({
        onay_durumu: karar,
        onaylayan_id: kullaniciId,
        onaylayan_adi: kullaniciAdi,
        onay_notu: onayNotu,
        onaylandi_at: new Date().toISOString(),
        durum: 'kapatildi',
    }).eq('id', mesajId);

    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b1_ic_mesajlar',
        islem_tipi: karar === 'onaylandi' ? 'ONAY' : 'RED',
        kullanici_adi: kullaniciAdi,
        eski_veri: { mesaj_id: mesajId, karar, not: onayNotu },
    }]);
};
