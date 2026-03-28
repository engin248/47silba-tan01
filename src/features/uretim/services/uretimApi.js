import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { idb } from '@/lib/idbKalkan';

export async function uretimKismiVeriGetir(dept) {
    const limits = { model: 500, orders: 200, personel: 100, log: 200, rapor: 100, perf: 100 };

    const otonomSync = async () => {
        const [mRes, oRes, pRes] = await Promise.allSettled([
            supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi,talep_skoru').limit(limits.model),
            supabase.from('production_orders').select('*').order('created_at', { ascending: false }).limit(limits.orders),
            supabase.from('b1_personel').select('id,personel_kodu,ad_soyad,rol,durum,saatlik_ucret_tl').eq('durum', 'aktif').order('ad_soyad').limit(limits.personel),
        ]);

        const resObj = {
            modeller: mRes.status === 'fulfilled' ? (mRes.value.data || []) : [],
            orders: oRes.status === 'fulfilled' ? (oRes.value.data || []) : [],
            personeller: pRes.status === 'fulfilled' ? (pRes.value.data || []) : [],
            maliyetler: [], raporlar: [], aktifOperasyonlar: []
        };

        if (dept === 'maliyet' || dept === 'devir' || dept === 'kesim') {
            const [malRes, rRes, perfRes] = await Promise.allSettled([
                supabase.from('b1_maliyet_kayitlari').select('*').order('created_at', { ascending: false }).limit(limits.log),
                supabase.from('b1_muhasebe_raporlari').select('*').order('created_at', { ascending: false }).limit(limits.rapor),
                supabase.from('b1_personel_performans').select('*, b1_personel(ad_soyad)').is('bitis_saati', null).limit(limits.perf),
            ]);
            if (malRes.status === 'fulfilled') resObj.maliyetler = malRes.value.data || [];
            if (rRes.status === 'fulfilled') resObj.raporlar = rRes.value.data || [];
            if (perfRes.status === 'fulfilled') resObj.aktifOperasyonlar = perfRes.value.data || [];
        }

        // IndexedDB Senkronizasyonu (Otonom)
        if (resObj.orders.length > 0) await idb.bulkUpsert('m7_uretim', resObj.orders);

        return resObj;
    };

    // Önce Local IDB Zırhından oku
    const localUretim = await idb.getAllWithLimit('m7_uretim', limits.orders, 0);

    if (!localUretim || localUretim.length === 0) {
        return await otonomSync();
    } else {
        otonomSync(); // Arka planda güncelle

        // Sadece IDB'den gelen siparişleri alıp, diğerleri için şimdilik boş dön. 
        // Modülün tamamında Offline zırh için "personeller, maliyetler" vs de idb'ye eklenebilir.
        return {
            modeller: [],
            orders: localUretim,
            personeller: [],
            maliyetler: [], raporlar: [], aktifOperasyonlar: []
        };
    }
}

export async function durumGuncelleApi(id, status) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('production_orders', 'UPDATE', { id, status });
        return { offline: true };
    }
    const { error } = await supabase.from('production_orders').update({ status }).eq('id', id);
    if (error) throw error;
    return { offline: false };
}

export async function uretimMaliyetEkle(payload) {
    const { error } = await supabase.from('b1_maliyet_kayitlari').insert([payload]);
    if (error) throw error;
}

export async function uretimPersonelPerformansGuncelle(id, veriler) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_personel_performans', 'UPDATE', { id, ...veriler });
        return { offline: true };
    }
    const { error } = await supabase.from('b1_personel_performans').update(veriler).eq('id', id);
    if (error) throw error;
    return { offline: false };
}

export async function uretimPersonelPerformansBaslat(veriler) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b1_personel_performans', 'INSERT', veriler);
        return { offline: true };
    }
    const { error } = await supabase.from('b1_personel_performans').insert([veriler]);
    if (error) throw error;
    return { offline: false };
}

export async function uretimIsEmriSorgulaOluştur(model_id, veriler) {
    const { data: mevcut } = await supabase.from('production_orders')
        .select('id').eq('model_id', model_id).in('status', ['pending', 'in_progress']);

    if (mevcut && mevcut.length > 0) throw new Error('⚠️ Bu model için bekleyen/üretimdeki iş emri mevcut!');

    const { error } = await supabase.from('production_orders').insert([veriler]);
    if (error) throw error;
}

export async function uretimIsEmriKaydet(veriler, id = null) {
    const { data: eskiKayit } = await supabase.from('production_orders').select('status').eq('id', id).single();
    if (eskiKayit?.status === 'completed') throw new Error('🔒 DİJİTAL ADALET: Tamamlanmış paket güncellenemez.');
    const { error } = await supabase.from('production_orders').update(veriler).eq('id', id);
    if (error) throw error;
}

export async function uretimTopluDurumGuncelle(ids, status) {
    const { error } = await supabase.from('production_orders').update({ status }).in('id', ids);
    if (error) throw error;
}

export async function uretimIsEmriArsivle(id, kullaniciAdi) {
    try {
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: 'production_orders', islem_tipi: 'ARŞİVLEME',
            kullanici_adi: kullaniciAdi, eski_veri: { is_emri_id: id }
        }]);
    } catch (e) { }
    const { error } = await supabase.from('production_orders').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw error;
}

export async function uretimDevirBaslat(orderId, pt, quantity) {
    const { data: mevcut } = await supabase.from('b1_muhasebe_raporlari').select('id').eq('order_id', orderId);
    if (mevcut && mevcut.length > 0) throw new Error('⚠️ Bu iş emri için devir raporu zaten mevcut!');

    const netAdet = quantity ? parseInt(quantity) : 1;

    const { error } = await supabase.from('b1_muhasebe_raporlari').insert([{
        order_id: orderId, gerceklesen_maliyet_tl: pt, net_uretilen_adet: netAdet, zayiat_adet: 0, rapor_durumu: 'taslak', devir_durumu: false
    }]);
    if (error) throw error;
}

export async function uretimOperasyonlariGetir(okunanBarkod) {
    const { data } = await supabase.from('b1_uretim_operasyonlari').select('id, model_id').eq('id', okunanBarkod).single();
    return data;
}

export async function defaultUretimOperasyonuGetir() {
    const { data } = await supabase.from('b1_uretim_operasyonlari').select('id').limit(1).single();
    return data;
}

export function uretimKanaliKur(onChange) {
    return supabase.channel('islem-gercek-zamanli-uretim')
        .on('postgres_changes', { event: '*', schema: 'public' }, onChange)
        .subscribe();
}
