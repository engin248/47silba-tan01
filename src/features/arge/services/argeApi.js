/**
 * features/arge/services/argeApi.js
 * Arge (M1/M2) Gölge İstihbarat — Çevrimdışı Zırhlı Servis Motoru
 */
import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { idb } from '@/lib/idbKalkan';

export const argeVerileriniGetir = async (timeoutPromise) => {
    // 1. Önce IDB (Local DB) üzerinden anında (0ms) okuma
    const localZirh = await idb.getAllWithLimit('m2_arge', 1, 0);

    const otonomSync = async () => {
        let results = [];
        try {
            results = await Promise.race([Promise.allSettled([
                supabase.from('b1_arge_products').select('*').order('created_at', { ascending: false }).limit(50),
                supabase.from('b1_agent_loglari').select('*').order('created_at', { ascending: false }).limit(10)
            ]), timeoutPromise]);
        } catch (error) {
            console.error('[KÖR NOKTA ZIRHI - Arge] timeout:', error);
            return { data: null };
        }

        const [prodRes, logRes] = results;
        const productsData = prodRes?.status === 'fulfilled' ? prodRes.value.data || [] : [];
        const logsData = logRes?.status === 'fulfilled' ? logRes.value.data || [] : [];

        const paket = { id: 'arge_veri_zirhi', products: productsData, agentLoglari: logsData };

        if (productsData.length > 0) await idb.bulkUpsert('m2_arge', [paket]);
        return { data: paket };
    };

    if (!localZirh || localZirh.length === 0) {
        return await otonomSync();
    } else {
        otonomSync(); // Arkada asenkron bırak
        return { data: localZirh[0], isCached: true };
    }
};

export const argeKararVer = async (id, yeniDurum, p) => {
    const islem = yeniDurum === 'uretim_onay' ? 'KARAR: ÜRETİME ALINDI' : 'KARAR: İPTAL (%30 MARJ/RİSK)';
    const islemSonuc = yeniDurum === 'uretim_onay' ? 'basarili' : 'uyari';

    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_arge_products', 'UPDATE', { id, status: yeniDurum });
        await cevrimeKuyrugaAl('b1_agent_loglari', 'INSERT', {
            ajan_adi: 'M1 Karar Motoru (Offline Zırhlı)',
            islem_tipi: islem,
            mesaj: `Koordinatör kararı kuyruğa alındı. Ref ID: ${id}`,
            sonuc: islemSonuc
        });

        if (yeniDurum === 'uretim_onay' && p) {
            await cevrimeKuyrugaAl('b1_model_taslaklari', 'INSERT', {
                model_kodu: p.model_kodu || ('MDL-' + String(id).substring(0, 5).toUpperCase()),
                model_adi: p.isim_orjinal || p.isim || 'ARGE Taslak',
                durum: 'taslak',
            });
        }
        return { offline: true };
    }

    try {
        await supabase.from('b1_arge_products').update({ status: yeniDurum }).eq('id', id);

        if (yeniDurum === 'uretim_onay' || yeniDurum === 'red' || yeniDurum === 'iptal') {
            await supabase.from('b1_agent_loglari').insert([{
                ajan_adi: 'M1 Karar Motoru (Manuel)',
                islem_tipi: islem,
                mesaj: `Koordinatör kararı uygulandı. Ürün referans ID: ${id}`,
                sonuc: islemSonuc
            }]);

            if (yeniDurum === 'uretim_onay' && p) {
                await supabase.from('b1_model_taslaklari').insert([{
                    model_kodu: p.model_kodu || ('MDL-' + String(id).substring(0, 5).toUpperCase()),
                    model_adi: p.isim_orjinal || p.isim || 'ARGE Taslak',
                    durum: 'taslak',
                }]);
            }
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
    return { offline: false };
};

export const argeGercekZamanliKur = (onProdChange) => {
    return supabase.channel('m1-arge-products-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_arge_products' }, onProdChange)
        .subscribe();
};
