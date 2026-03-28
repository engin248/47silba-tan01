import { supabase } from '@/lib/supabase';
import { idb } from '@/lib/idbKalkan';

export const USD_KUR = 32.5;

// Log teklif
export const logWhatsappTeklif = async (payload) => {
    return supabase.from('b2_teklif_logs').insert([payload]);
};

// Ürünleri Çek (IndexedDB Destekli Zırh)
export const fetchKatalogUrunleri = async (timeoutPromise) => {
    const otonomSync = async () => {
        const req = supabase.from('b2_urun_katalogu').select('*').order('created_at', { ascending: false }).limit(500);
        const { data, error } = timeoutPromise ? await Promise.race([req, timeoutPromise]) : await req;
        if (error) throw error;
        if (data && data.length > 0) {
            await idb.bulkUpsert('m10_katalog', data);
        }
        return data || [];
    };

    const localData = await idb.getAllWithLimit('m10_katalog', 500, 0);
    if (!localData || localData.length === 0) {
        return await otonomSync();
    } else {
        otonomSync(); // Arkadan günceli çek, UI'ı bloklama
        return localData;
    }
};

// Fiyat Geçmişi Çek
export const fetchFiyatGecmisi = async (urun_kodu) => {
    const { data, error } = await supabase
        .from('b2_urun_katalogu')
        .select('satis_fiyati_tl, birim_maliyet_tl, updated_at')
        .eq('urun_kodu', urun_kodu)
        .order('updated_at', { ascending: false })
        .limit(10);
    if (error) throw error;
    return data;
};

// SKUs ve Stok Çek
export const fetchVaryantStok = async (urun_id) => {
    const { data, error } = await supabase.from('b2_urun_varyant_stok').select('beden, renk, stok_adeti').eq('urun_id', urun_id);
    if (error) throw error;
    return data;
};

// SKUs ve Stok Kaydet
export const upsertVaryantStok = async (payloadArray) => {
    const { error } = await supabase.from('b2_urun_varyant_stok').upsert(payloadArray, { onConflict: 'urun_id, beden, renk' });
    if (error) throw error;
    return true;
};

// M8'den Maliyet Çek ve Katalogda Güncelle
export const syncMaliyetFromM8 = async () => {
    const { data: muhRapor, error: errR } = await supabase
        .from('b1_muhasebe_raporlari')
        .select('urun_kodu, toplam_maliyet_tl, net_uretim_miktari, created_at, ek_maliyet_tl')
        .eq('durum', 'MUHASEBECI_KILITLI')
        .not('urun_kodu', 'is', null)
        .order('created_at', { ascending: false });

    if (errR) throw errR;
    if (!muhRapor || muhRapor.length === 0) return { count: 0, message: 'Rapor bulunamadı' };

    const enGuncelMaliyetler = {};
    muhRapor.forEach(r => {
        if (!enGuncelMaliyetler[r.urun_kodu] && r.net_uretim_miktari > 0) {
            const topMal = parseFloat(r.toplam_maliyet_tl || 0) + parseFloat(r.ek_maliyet_tl || 0);
            enGuncelMaliyetler[r.urun_kodu] = parseFloat((topMal / r.net_uretim_miktari).toFixed(2));
        }
    });

    const { data: katalogUrunleri, error: errK } = await supabase.from('b2_urun_katalogu').select('id, urun_kodu, satis_fiyati_tl, birim_maliyet_tl');
    if (errK) throw errK;

    const guncellenecekler = [];
    katalogUrunleri.forEach(u => {
        const yeniMaliyet = enGuncelMaliyetler[u.urun_kodu];
        if (yeniMaliyet && yeniMaliyet !== parseFloat(u.birim_maliyet_tl)) {
            const kar = yeniMaliyet > 0 ? ((parseFloat(u.satis_fiyati_tl) - yeniMaliyet) / yeniMaliyet) * 100 : 0;
            guncellenecekler.push({
                id: u.id,
                birim_maliyet_tl: yeniMaliyet,
                kar_marji_yuzde: parseFloat(kar.toFixed(2)),
                updated_at: new Date().toISOString()
            });
        }
    });

    if (guncellenecekler.length === 0) return { count: 0, message: 'Maliyetler zaten güncel.' };

    const sliceSize = 50;
    for (let i = 0; i < guncellenecekler.length; i += sliceSize) {
        const chunk = guncellenecekler.slice(i, i + sliceSize);
        const { error: err2 } = await supabase.from('b2_urun_katalogu').upsert(chunk);
        if (err2) throw err2;
    }

    return { count: guncellenecekler.length, guncellenecekler };
};

// Toplu Fiyat Güncelle (M10 Motor)
export const applyTopluFiyat = async (kategori, yuzde, usdKur) => {
    let query = supabase.from('b2_urun_katalogu').select('id, satis_fiyati_tl, birim_maliyet_tl');
    if (kategori !== 'tumu') query = query.eq('kategori_ust', kategori);

    const { data: list, error: err1 } = await query;
    if (err1) throw err1;
    if (!list || list.length === 0) return { count: 0 };

    const guncellemeler = list.map(u => {
        const yeniFiyat = u.satis_fiyati_tl * (1 + (yuzde / 100));
        const kar = u.birim_maliyet_tl > 0 ? ((yeniFiyat - u.birim_maliyet_tl) / u.birim_maliyet_tl) * 100 : 0;
        return {
            id: u.id,
            satis_fiyati_tl: parseFloat(yeniFiyat.toFixed(2)),
            satis_fiyati_usd: parseFloat((yeniFiyat / usdKur).toFixed(2)),
            kar_marji_yuzde: parseFloat(kar.toFixed(2)),
            updated_at: new Date().toISOString()
        };
    });

    const sliceSize = 50;
    for (let i = 0; i < guncellemeler.length; i += sliceSize) {
        const chunk = guncellemeler.slice(i, i + sliceSize);
        const { error: err2 } = await supabase.from('b2_urun_katalogu').upsert(chunk);
        if (err2) throw err2;
    }
    return { count: list.length };
};

// Ürün Çifte Kayıt Kontrolü ve Kaydetme
export const saveUrun = async (duzenleId, payload) => {
    if (!duzenleId) {
        const { data: mevcut } = await supabase.from('b2_urun_katalogu').select('id').eq('urun_kodu', payload.urun_kodu);
        if (mevcut && mevcut.length > 0) throw new Error('BU_KOD_MEVCUT');
        const { error } = await supabase.from('b2_urun_katalogu').insert([payload]);
        if (error) throw error;
        return { action: 'inserted' };
    } else {
        const { error } = await supabase.from('b2_urun_katalogu').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', duzenleId);
        if (error) throw error;
        return { action: 'updated' };
    }
};

// Excel Toplu Katalog Yükleme
export const insertBulkUrunler = async (payloadlar) => {
    const { error } = await supabase.from('b2_urun_katalogu').insert(payloadlar);
    if (error) throw error;
    return true;
};

// Ürün Silme ve B0 System Log'a Yazma
export const deleteUrun = async (id, urun_kodu, kullanici) => {
    try {
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: 'b2_urun_katalogu',
            islem_tipi: 'SILME',
            kullanici_adi: kullanici?.ad || kullanici?.email || 'M9 Yetkilisi',
            eski_veri: { urun_kodu: urun_kodu, urun_id: id, silme_zamani: new Date().toISOString() }
        }]);
    } catch (e) { }
    const { error } = await supabase.from('b2_urun_katalogu').delete().eq('id', id);
    if (error) throw error;
    return true;
};

// --- LEGACY (USEKATALOG.JS) KÖPRÜ METOTLARI ---

export const tumUrunleriGetir = async () => {
    try {
        const data = await fetchKatalogUrunleri();
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

export const urunKaydet = async (form, duzenleId) => {
    try {
        await saveUrun(duzenleId, form);
        return { ok: true, mesaj: 'Başarılı' };
    } catch (e) {
        return { ok: false, mesaj: e.message === 'BU_KOD_MEVCUT' ? 'Bu Kod Zaten Mevcut!' : e.message };
    }
};

export const urunSil = async (id, urunKodu, userLabel) => {
    try {
        await deleteUrun(id, urunKodu, { label: userLabel });
        return { ok: true, mesaj: 'Silindi' };
    } catch (e) {
        return { ok: false, mesaj: e.message };
    }
};

export const fiyatGecmisiniGetir = async (urun_kodu) => {
    try {
        return await fetchFiyatGecmisi(urun_kodu);
    } catch (e) { return []; }
};

export const katalogKanaliKur = (cb) => {
    return supabase.channel('katalog-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_urun_katalogu' }, cb)
        .subscribe();
};

export const siparisOtofillUrl = (u) => {
    const params = new URLSearchParams({
        urun_kodu: u.urun_kodu,
        urun_adi: u.urun_adi,
        fiyat: u.satis_fiyati_tl,
        stok: u.stok_adeti
    });
    return `/siparisler?${params.toString()}`;
};

export const skuKombinasyonlariUret = (bedenler, renkler) => {
    const bList = bedenler ? bedenler.split(',').map(s => s.trim()).filter(Boolean) : [];
    const rList = renkler ? renkler.split(',').map(s => s.trim()).filter(Boolean) : [];
    const arr = [];
    bList.forEach(b => rList.forEach(r => arr.push(`${b}-${r}`)));
    return arr;
};
