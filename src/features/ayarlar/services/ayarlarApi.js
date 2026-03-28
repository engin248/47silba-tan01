import { supabase } from '@/lib/supabase';
import { idb } from '@/lib/idbKalkan';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { telegramBildirim } from '@/lib/utils';

export async function sistemAyarGetir(varsayilan) {
    const localZirh = await idb.getAllWithLimit('m_ayarlar', 1, 0);

    const otonomSync = async () => {
        let results;
        try {
            results = await Promise.race([
                supabase.from('b1_sistem_ayarlari').select('*').limit(1).maybeSingle(),
                new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000))
            ]);
        } catch (e) { return varsayilan; }

        if (results?.data?.deger) {
            try {
                const prs = JSON.parse(results.data.deger);
                const paket = { id: 'ayarlar_veri_zirhi', veri: { ...varsayilan, ...prs } };
                await idb.bulkUpsert('m_ayarlar', [paket]);
                return paket.veri;
            } catch (e) { return varsayilan; }
        }
        return varsayilan;
    };

    if (!localZirh || localZirh.length === 0) {
        return await otonomSync();
    } else {
        otonomSync();
        return localZirh[0].veri || varsayilan;
    }
}

export async function sistemAyarKaydet(ayarlar) {
    const deger = JSON.stringify(ayarlar);

    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_sistem_ayarlari', 'UPSERT', { anahtar: 'sistem_genel', deger });
        return { offline: true };
    }

    const { data: mevcut, error: eqErr } = await supabase.from('b1_sistem_ayarlari').select('id').limit(1).maybeSingle();
    if (eqErr) throw eqErr;

    let error;
    if (mevcut) {
        ({ error } = await supabase.from('b1_sistem_ayarlari').update({ deger, updated_at: new Date().toISOString() }).eq('id', mevcut.id));
    } else {
        ({ error } = await supabase.from('b1_sistem_ayarlari').insert([{ anahtar: 'sistem_genel', deger }]));
    }

    if (error) throw error;

    telegramBildirim(`⚙️ SİSTEM AYARLARI GÜNCELLENDİ\nPrim: %${(ayarlar.prim_orani * 100).toFixed(0)}\nDk Mlyt: ₺${ayarlar.dakika_basi_ucret}\nSistem parametreleri yönetici tarafından değiştirildi.`);
    return { offline: false };
}
