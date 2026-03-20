/**
 * features/ayarlar/services/ayarlarApi.js
 *
 * Tüm Supabase sorguları tek yer.
 * Tablo: b1_sistem_ayarlari (JSON blob pattern)
 */
import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

const TABLO = 'b1_sistem_ayarlari';
const ANAHTAR = 'sistem_genel';

// ─── OKUMA ───────────────────────────────────────────────────────
/**
 * Sistem ayarlarını getir
 * @returns {Promise<object|null>}
 */
export async function ayarlariGetir() {
    const { data, error } = await supabase
        .from(TABLO)
        .select('*')
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    if (!data?.deger) return null;
    try { return JSON.parse(data.deger); } catch { return null; }
}

// ─── YAZMA ───────────────────────────────────────────────────────
/**
 * Sistem ayarlarını kaydet (upsert)
 * @param {object} ayarlar - tüm ayarlar objesi
 * @returns {Promise<{ok: boolean, mesaj: string}>}
 */
export async function ayarlariKaydet(ayarlar) {
    const deger = JSON.stringify(ayarlar);

    // Çevrimdışı
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await cevrimeKuyrugaAl({ tablo: TABLO, islem_tipi: 'UPSERT', veri: { anahtar: ANAHTAR, deger } });
        return { ok: true, mesaj: '✅ İnternet yok: Ayarlar kuyruğa alındı.' };
    }

    const { data: mevcut, error: readErr } = await supabase.from(TABLO).select('id').limit(1).maybeSingle();
    if (readErr) return { ok: false, mesaj: 'Okuma hatası: ' + readErr.message };

    const { error } = mevcut
        ? await supabase.from(TABLO).update({ deger, updated_at: new Date().toISOString() }).eq('id', mevcut.id)
        : await supabase.from(TABLO).insert([{ anahtar: ANAHTAR, deger }]);

    if (error) return { ok: false, mesaj: 'Kayıt hatası: ' + error.message };
    return { ok: true, mesaj: '✅ Ayarlar kaydedildi.' };
}

/**
 * Logo dosyası Supabase Storage'a yükle
 * @param {File} dosya
 * @param {string} firmaAdi
 * @returns {Promise<{ok: boolean, url?: string, mesaj: string}>}
 */
export async function logoYukle(dosya, firmaAdi = 'firma') {
    if (!dosya) return { ok: false, mesaj: 'Dosya seçilmedi.' };
    if (dosya.size > 2 * 1024 * 1024) return { ok: false, mesaj: 'Logo 2MB altında olmalı.' };
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(dosya.type)) {
        return { ok: false, mesaj: 'Sadece PNG, JPG, WebP veya SVG.' };
    }

    const uzanti = dosya.name.split('.').pop();
    const dosyaYolu = `logos/${firmaAdi.toLowerCase().replace(/\s/g, '_')}_${Date.now()}.${uzanti}`;

    const { error } = await supabase.storage.from('ayarlar').upload(dosyaYolu, dosya, {
        cacheControl: '3600',
        upsert: true,
    });
    if (error) return { ok: false, mesaj: 'Yükleme hatası: ' + error.message };

    const { data: urlData } = supabase.storage.from('ayarlar').getPublicUrl(dosyaYolu);
    return { ok: true, url: urlData.publicUrl, mesaj: '✅ Logo yüklendi.' };
}

/**
 * Realtime kanal kur
 * @param {Function} onChange
 * @returns kanal (cleanup için)
 */
export function ayarlarKanaliKur(onChange) {
    // @ts-ignore — supabase-js tip tanımı 'postgres_changes'i destekliyor ama TS tipi hatalı
    return supabase.channel('ayarlar-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLO }, onChange)
        .subscribe();
}
