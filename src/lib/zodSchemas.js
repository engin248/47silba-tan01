import { z } from "zod";

// ─── AJAN / AI ÇIKTI DOĞRULAMASI ──────────────────────────────
// Ajanların YZ çıktılarını doğrulamak için (Halüsinasyon Önleyici) Zırh
export const ajanRaporSchema = z.object({
    uyariSeviyesi: z.enum(["KRITIK", "ORTA", "NORMAL"]),
    mesaj: z.string().min(5).max(500),
    aksiyonOnerisi: z.string().optional(),
    tahminiZarar: z.number().nonnegative().optional()
});

// ─── GENEL FORM GİRİŞ DOĞRULAMASI ─────────────────────────────
// Veri tabanına (UI üzerinden) girilen spam'i engelleyen Doğrulama Kalıbı
export const formGirisSchema = z.object({
    islemId: z.string().uuid(),
    kullaniciUid: z.string().min(3),
    isimOrKumas: z.string().regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]+$/, "Özel/Zararlı karakter içeremez!"),
    girilenMiktar: z.number().int().positive(),
    hedefMiktar: z.number().int().positive()
});

// ─── KUMAŞ KAYIT ŞEMASI ────────────────────────────────────────
export const kumasSchema = z.object({
    kumas_kodu: z.string().min(1).max(50).regex(/^[A-Z0-9\-_]+$/, "Kod büyük harf, sayı ve - veya _ içerebilir"),
    kumas_adi: z.string().min(1).max(200),
    kumas_adi_ar: z.string().max(200).optional().nullable(),
    kumas_tipi: z.enum(['dokuma', 'orgu', 'denim', 'keten', 'ipek', 'sentetik', 'pamuk', 'polar', 'kase', 'viskon', 'diger']),
    kompozisyon: z.string().max(200).optional().nullable(),
    birim_maliyet_tl: z.number().nonnegative("Maliyet negatif olamaz"),
    genislik_cm: z.number().positive().optional().nullable(),
    gramaj_gsm: z.number().positive().optional().nullable(),
    esneme_payi_yuzde: z.number().min(0).max(100).optional().default(0),
    fotograf_url: z.string().url().optional().nullable().or(z.literal('')),
    tedarikci_adi: z.string().max(200).optional().nullable(),
    tedarikci_id: z.string().uuid().optional().nullable().or(z.literal('')),
    stok_mt: z.number().nonnegative("Stok negatif olamaz"),
    min_stok_mt: z.number().nonnegative().default(10),
});

// ─── AKSESUAR KAYIT ŞEMASI ─────────────────────────────────────
export const aksesuarSchema = z.object({
    aksesuar_kodu: z.string().min(1).max(50),
    aksesuar_adi: z.string().min(1).max(200),
    aksesuar_adi_ar: z.string().max(200).optional().nullable(),
    tip: z.enum(['dugme', 'fermuar', 'iplik', 'etiket', 'yikama_talimati', 'uti_malzeme', 'baski', 'nakis', 'lastik', 'biye', 'diger']),
    birim: z.enum(['adet', 'metre', 'kg', 'litre']),
    birim_maliyet_tl: z.number().nonnegative(),
    stok_adet: z.number().nonnegative(),
    min_stok: z.number().nonnegative().default(100),
    fotograf_url: z.string().url().optional().nullable().or(z.literal('')),
    tedarikci_adi: z.string().max(200).optional().nullable(),
});

// ─── İŞ EMRİ ŞEMASI ───────────────────────────────────────────
export const isEmriSchema = z.object({
    model_id: z.string().uuid("Geçerli bir model seçilmeli"),
    quantity: z.number().int().positive("Adet en az 1 olmalı").max(100000),
    planned_start_date: z.string().optional().nullable(),
    planned_end_date: z.string().optional().nullable(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
});

// ─── KESİM OPERASYONU ŞEMASI ───────────────────────────────────
export const kesimSchema = z.object({
    model_id: z.string().uuid().optional().nullable(),
    kesim_kodu: z.string().min(1).max(50),
    kesilen_parca_sayisi: z.number().int().positive(),
    kumas_id: z.string().uuid().optional().nullable(),
    kullanilan_metre: z.number().positive().optional().nullable(),
    fire_metre: z.number().nonnegative().default(0),
    notlar: z.string().max(500).optional().nullable(),
});

// ─── GÖREV ŞEMASI ─────────────────────────────────────────────
export const gorevSchema = z.object({
    baslik: z.string().min(1).max(200),
    aciklama: z.string().max(500).optional().nullable(),
    oncelik: z.enum(['dusuk', 'normal', 'yuksek', 'kritik']).default('normal'),
    atanan_personel_id: z.string().uuid().optional().nullable(),
    bitis_tarihi: z.string().optional().nullable(),
});

// ─── SİPARİŞ ŞEMASI ───────────────────────────────────────────
export const siparisSchema = z.object({
    siparis_no: z.string().min(1).max(50).regex(/^[A-Z0-9\-_]+$/i, "Sipariş no geçersiz karakter içeriyor"),
    musteri_id: z.string().uuid().optional().nullable().or(z.literal('')),
    kanal: z.enum(['trendyol', 'amazon', 'magaza', 'toptan', 'diger']),
    notlar: z.string().max(300).optional().nullable(),
    acil: z.boolean().default(false),
    para_birimi: z.enum(['TL', 'USD', 'EUR']).default('TL'),
    toplam_tutar_tl: z.number().nonnegative().default(0),
});

export const siparisKalemSchema = z.object({
    siparis_id: z.string().uuid(),
    urun_id: z.string().uuid("Ürün seçilmeli"),
    beden: z.string().max(20).optional().nullable(),
    renk: z.string().max(30).optional().nullable(),
    adet: z.number().int().positive("Adet en az 1 olmalı").max(99999),
    birim_fiyat_tl: z.number().nonnegative("Fiyat negatif olamaz"),
    iskonto_pct: z.number().min(0).max(100).default(0),
});

// ─── PERSONEL ŞEMASI ──────────────────────────────────────────
export const personelSchema = z.object({
    personel_kodu: z.string().min(1).max(20).regex(/^[A-Z0-9\-]+$/i),
    ad_soyad: z.string().min(2).max(100),
    rol: z.string().min(1).max(50),
    durum: z.enum(['aktif', 'izinli', 'cikti', 'deneme']).default('aktif'),
    telefon: z.string().max(20).optional().nullable(),
    saatlik_ucret_tl: z.number().nonnegative().default(0),
    prim_yuzdesi: z.number().min(0).max(100).default(0),
    ise_giris_tarihi: z.string().optional().nullable(),
});

// ─── MÜŞTERİ ŞEMASI ───────────────────────────────────────────
export const musteriSchema = z.object({
    musteri_kodu: z.string().min(1).max(20),
    ad_soyad: z.string().min(2).max(100),
    telefon: z.string().max(20).optional().nullable(),
    email: z.string().email("Geçerli e-posta giriniz").optional().nullable().or(z.literal('')),
    adres: z.string().max(500).optional().nullable(),
    ulke: z.string().max(100).default('Türkiye'),
    bolge_sehir: z.string().max(100).optional().nullable(),
    musteri_tipi: z.enum(['bireysel', 'kurumsal', 'toptan']).default('bireysel'),
    aktif: z.boolean().default(true),
    notlar: z.string().max(500).optional().nullable(),
});

// ─── STOK HAREKETİ ŞEMASI ─────────────────────────────────────
export const stokHareketiSchema = z.object({
    urun_id: z.string().uuid("Ürün seçilmeli"),
    hareket_tipi: z.enum(['giris', 'cikis', 'sayim', 'iade', 'fire']),
    adet: z.number().int().positive("Adet en az 1 olmalı"),
    aciklama: z.string().max(300).optional().nullable(),
    referans_no: z.string().max(50).optional().nullable(),
});

// ─── KASA HAREKETİ ŞEMASI ─────────────────────────────────────
export const kasaHareketiSchema = z.object({
    hareket_tipi: z.enum(['gelir', 'gider', 'virman']),
    tutar_tl: z.number().positive("Tutar 0'dan büyük olmalı"),
    kategori: z.string().min(1).max(50),
    aciklama: z.string().max(300).optional().nullable(),
    tarih: z.string().optional().nullable(),
    odeme_yontemi: z.enum(['nakit', 'kart', 'havale', 'cek', 'diger']).default('nakit'),
});

// ─── MALİYET KAYDI ŞEMASI ─────────────────────────────────────
export const maliyetSchema = z.object({
    production_order_id: z.string().uuid().optional().nullable(),
    maliyet_tipi: z.string().min(1).max(50),
    tutar_tl: z.number().nonnegative("Tutar negatif olamaz"),
    aciklama: z.string().max(300).optional().nullable(),
    tarih: z.string().optional().nullable(),
});

/**
 * Verilen datayı ZOD schema'dan geçirir. Hata varsa UI'ı çökertmeden fallback döner.
 */
export function veriDogrula(schema, data) {
    try {
        const dogrulanmis = schema.parse(data);
        return { basarili: true, data: dogrulanmis };
    } catch (e) {
        console.error("Zod Siber Kalkanı Devrede. Hack veya Halüsinasyon Engellendi:", e.errors);
        return { basarili: false, error: e.errors };
    }
}
