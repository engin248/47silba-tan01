/**
 * features/katalog/services/katalogApi.js
 * 
 * Tüm Supabase sorguları tek yer — MainContainer doğrudan supabase.from() çağırmaz.
 * 
 * Tablo: b2_urun_katalogu
 */
import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

const TABLO = 'b2_urun_katalogu';
const LOG_TABLO = 'b0_sistem_loglari';
const USD_KUR = 32.5;

// ─── OKUMA ───────────────────────────────────────────────────────────────────

/**
 * Tüm ürünleri getir (realtime kanalı için ayrı kullanılır)
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function tumUrunleriGetir() {
    const { data, error } = await supabase
        .from(TABLO)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
    return { data: data || [], error };
}

/**
 * Fiyat geçmişini getir (KAT-05)
 * @param {string} urunKodu
 * @returns {Promise<Array>}
 */
export async function fiyatGecmisiniGetir(urunKodu) {
    const { data } = await supabase
        .from(TABLO)
        .select('satis_fiyati_tl, birim_maliyet_tl, updated_at')
        .eq('urun_kodu', urunKodu)
        .order('updated_at', { ascending: false })
        .limit(10);
    return data || [];
}

// ─── YAZMA ───────────────────────────────────────────────────────────────────

/**
 * Yeni ürün ekle veya mevcut ürünü güncelle
 * @param {object} payload  - form verisi (normalize edilmiş)
 * @param {string|null} duzenleId - null ise yeni kayıt
 * @returns {Promise<{ok: boolean, mesaj: string}>}
 */
export async function urunKaydet(payload, duzenleId = null) {
    const normalize = (f) => ({
        urun_kodu: f.urun_kodu.toUpperCase().trim(),
        urun_adi: f.urun_adi.trim(),
        urun_adi_ar: f.urun_adi_ar?.trim() || null,
        satis_fiyati_tl: parseFloat(f.satis_fiyati_tl) || 0,
        satis_fiyati_usd: f.satis_fiyati_usd
            ? parseFloat(f.satis_fiyati_usd)
            : (parseFloat(f.satis_fiyati_tl) / USD_KUR) || null,
        birim_maliyet_tl: parseFloat(f.birim_maliyet_tl) || 0,
        bedenler: f.bedenler?.trim() || null,
        renkler: f.renkler?.trim() || null,
        stok_adeti: parseInt(f.stok_adeti) || 0,
        min_stok: parseInt(f.min_stok) || 0,
        durum: f.durum,
        kategori_ust: f.kategori_ust || null,
        kategori_alt: f.kategori_alt || null,
        fotograf_url: f.fotograf_url?.trim() || null,
        fotograf_url2: f.fotograf_url2?.trim() || null,
        fotograf_url3: f.fotograf_url3?.trim() || null,
    });

    const data = normalize(payload);

    // Kâr marjı hesapla
    if (data.satis_fiyati_tl > 0 && data.birim_maliyet_tl > 0) {
        data.kar_marji_yuzde = ((data.satis_fiyati_tl - data.birim_maliyet_tl) / data.birim_maliyet_tl) * 100;
    } else {
        data.kar_marji_yuzde = 0;
    }

    // Çevrimdışı kontrol
    if (!navigator.onLine) {
<<<<<<< HEAD
        await cevrimeKuyrugaAl(TABLO, data);
=======
        await cevrimeKuyrugaAl(TABLO, 'INSERT', data);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        return { ok: true, mesaj: '✅ Çevrimdışı: Ürün kuyruğa eklendi.' };
    }

    // Çifte kayıt engeli (yeni kayıt ise)
    if (!duzenleId) {
        const { data: mevcut } = await supabase.from(TABLO).select('id').eq('urun_kodu', data.urun_kodu);
<<<<<<< HEAD
        if (mevcut?.length > 0) return { ok: false, mesaj: '⚠️ Bu Ürün Kodu zaten katalogda mevcut!' };
=======
        if ((mevcut?.length ?? 0) > 0) return { ok: false, mesaj: '⚠️ Bu Ürün Kodu zaten katalogda mevcut!' };
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    }

    const { error } = duzenleId
        ? await supabase.from(TABLO).update({ ...data, updated_at: new Date().toISOString() }).eq('id', duzenleId)
        : await supabase.from(TABLO).insert([data]);

    if (error) return { ok: false, mesaj: 'Kayıt hatası: ' + error.message };
    return { ok: true, mesaj: duzenleId ? '✅ Ürün güncellendi!' : '✅ Yeni ürün kataloğa eklendi!' };
}

/**
 * Ürün sil (KAT-LOG: silme logu yazar)
 * @param {string} id
 * @param {string} urunKodu
 * @param {string} kullaniciLabel
 * @returns {Promise<{ok: boolean, mesaj: string}>}
 */
export async function urunSil(id, urunKodu, kullaniciLabel = 'M9 Yetkilisi') {
    // Silme logu
    await supabase.from(LOG_TABLO).insert([{
        tablo_adi: TABLO,
        islem_tipi: 'SILME',
        kullanici_adi: kullaniciLabel,
        eski_veri: { durum: 'M9 Urun kalici silindi.', urun_kodu: urunKodu }
    }]);

    const { error } = await supabase.from(TABLO).delete().eq('id', id);
    if (error?.code === '23503') {
        return { ok: false, mesaj: 'HATA: Bu ürün siparişlerde kullanıldığı için silinemez. Durumunu "Pasif" yapın.' };
    }
    if (error) return { ok: false, mesaj: 'Silme hatası: ' + error.message };
    return { ok: true, mesaj: '✅ Ürün silindi.' };
}

/**
 * Realtime kanal kur — b2_urun_katalogu değişimlerini izle
 * @param {Function} onChange - değişince çağrılır
 * @returns {object} kanal (cleanup için)
 */
export function katalogKanaliKur(onChange) {
<<<<<<< HEAD
=======
    // @ts-ignore — supabase-js tip tanımı 'postgres_changes' eventini destekliyor ama TS tipi hatalı
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    return supabase.channel('m9-katalog-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLO }, onChange)
        .subscribe();
}

// ─── YARDIMCILAR ─────────────────────────────────────────────────────────────

/** KAT-01: Siparişler sayfasına URL parametresiyle otofill geçiş */
export function siparisOtofillUrl(urun) {
    const params = new URLSearchParams({
        urun_kodu: urun.urun_kodu,
        urun_adi: urun.urun_adi,
        fiyat: urun.satis_fiyati_tl,
        stok: urun.stok_adeti,
    });
    return `/siparisler?${params.toString()}`;
}

/** KAT-04: SKU kombinasyonu üret */
export function skuKombinasyonlariUret(urunKodu, bedenler, renkler) {
    const sonuc = [];
    bedenler.forEach(b => {
        renkler.forEach(r => {
            sonuc.push(`${urunKodu}-${b}-${r.substring(0, 2).toUpperCase()}`);
        });
    });
    return sonuc;
}

export { USD_KUR };
