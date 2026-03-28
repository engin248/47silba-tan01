import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { idb } from '@/lib/idbKalkan';

export const musteriVerileriniGetir = async (timeoutPromise) => {
    // 1. Otonom Sync Fonksiyonu
    const otonomSync = async () => {
        const reqs = Promise.allSettled([
            supabase.from('b2_musteriler').select('*').order('created_at', { ascending: false }).limit(500)
        ]);
        const res = await Promise.race([reqs, timeoutPromise]);

        // 2. Local DB Güncelleniyor (Background)
        if (res[0]?.status === 'fulfilled' && res[0].value.data) {
            await idb.bulkUpsert('m2_musteri', res[0].value.data);
        }
        return res;
    };

    // 3. Local DB'den anında oku
    const localMusteriler = await idb.getAllWithLimit('m2_musteri', 500, 0);

    if (!localMusteriler || localMusteriler.length === 0) {
        return await otonomSync();
    } else {
        otonomSync(); // UI bloklamadan arka planda güncelle (Lazy fetch)
        return [{ status: 'fulfilled', value: { data: localMusteriler } }];
    }
};

export const musteriEkleGuncelle = async (duzenleId, payload) => {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b2_musteriler', duzenleId ? 'UPDATE' : 'INSERT', duzenleId ? { id: duzenleId, ...payload } : payload);
        return { offline: true };
    }

    if (duzenleId) {
        const { data: cakisan } = await supabase.from('b2_musteriler').select('id').eq('musteri_kodu', payload.musteri_kodu).neq('id', duzenleId);
        if (cakisan && cakisan.length > 0) throw new Error('Bu müşteri kodu başka bir kayıtta kullanılıyor!');

        const { error } = await supabase.from('b2_musteriler').update(payload).eq('id', duzenleId);
        if (error) throw error;
        return { offline: false, mod: 'UPDATE' };
    } else {
        const { data: mevcut } = await supabase.from('b2_musteriler').select('id').eq('musteri_kodu', payload.musteri_kodu);
        if (mevcut && mevcut.length > 0) throw new Error('Bu müşteri kodu zaten kayıtlı!');

        const { error } = await supabase.from('b2_musteriler').insert([payload]);
        if (error) throw error;
        return { offline: false, mod: 'INSERT' };
    }
};

export const musteriKaraListeDurumDegistir = async (id, yeniDurum) => {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b2_musteriler', 'UPDATE', { id, kara_liste: yeniDurum });
        return { offline: true };
    }
    const { error } = await supabase.from('b2_musteriler').update({ kara_liste: yeniDurum }).eq('id', id);
    if (error) throw error;
    return { offline: false };
};

export const musteriSil = async (id, kod, kullaniciAdi) => {
    try {
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: 'b2_musteriler', islem_tipi: 'SILME',
            kullanici_adi: kullaniciAdi,
            eski_veri: { musteri_kodu: kod, mesaj: 'Müşteri kaydı kalıcı olarak silindi.' }
        }]);
    } catch (e) { console.error('[SILME LOG HATASI]', e); }

    await idb.deleteRecord('m2_musteri', id); // LocalDB'den de sil
    const { error } = await supabase.from('b2_musteriler').delete().eq('id', id);
    if (error) throw error;
};

export const musteriGecmisiniGetir = async (musteriKodu) => {
    const { data } = await supabase.from('b0_sistem_loglari')
        .select('*')
        .eq('tablo_adi', 'b2_musteriler')
        .contains('eski_veri', { musteri_kodu: musteriKodu })
        .order('created_at', { ascending: false });
    return data || [];
};

export const musteriGecmisineNotEkle = async (musteriKodu, mesaj, kullaniciAdi) => {
    const { error } = await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b2_musteriler',
        islem_tipi: 'NOT',
        kullanici_adi: kullaniciAdi,
        eski_veri: { musteri_kodu: musteriKodu, mesaj }
    }]);
    if (error) throw error;
};
