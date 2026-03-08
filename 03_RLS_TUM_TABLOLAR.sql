-- =====================================================================
-- 47 SİL BAŞTAN — TÜM TABLOLAR İÇİN RLS POLİTİKALARI
-- Supabase SQL Editor'da TEK TEK çalıştırın (her blok ayrı sorgu)
-- =====================================================================

-- ─── BİRİNCİ SORGU: Tabloları oluştur (yoksa) ───────────────────────
CREATE TABLE IF NOT EXISTS public.b1_model_taslaklari (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_kodu text NOT NULL,
    model_adi text NOT NULL,
    aciklama text,
    durum text DEFAULT 'taslak',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b1_arge_trendler (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik_tr text NOT NULL,
    baslik_ar text,
    kategori text DEFAULT 'genel',
    trend_skoru integer DEFAULT 50,
    kaynak_url text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b1_kumas_arsivi (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kumas_kodu text NOT NULL,
    kumas_adi text NOT NULL,
    renk text,
    stok_metre numeric DEFAULT 0,
    birim_fiyat_tl numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b1_personel (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    personel_kodu text UNIQUE NOT NULL,
    ad_soyad text NOT NULL,
    rol text DEFAULT 'calisan',
    durum text DEFAULT 'aktif',
    saatlik_ucret_tl numeric DEFAULT 0,
    izin_bakiyesi integer DEFAULT 15,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b1_personel_devam (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    personel_id uuid REFERENCES public.b1_personel(id),
    tarih date DEFAULT CURRENT_DATE,
    durum text DEFAULT 'geldi',
    baslangic_saati time,
    bitis_saati time,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b1_muhasebe_raporlari (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid,
    toplam_maliyet_tl numeric DEFAULT 0,
    satis_fiyati_tl numeric DEFAULT 0,
    kar_tl numeric DEFAULT 0,
    devir_durumu boolean DEFAULT false,
    notlar text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2_musteriler (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_kodu text UNIQUE NOT NULL,
    ad_soyad text NOT NULL,
    telefon text,
    email text,
    aktif boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2_urun_katalogu (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    urun_kodu text UNIQUE NOT NULL,
    urun_adi text NOT NULL,
    kategori_id uuid,
    satis_fiyati_tl numeric DEFAULT 0,
    stok_adeti integer DEFAULT 0,
    min_stok integer DEFAULT 5,
    durum text DEFAULT 'aktif',
    rapor_id uuid,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2_kategoriler (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kategori_adi text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2_siparisler (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_id uuid REFERENCES public.b2_musteriler(id),
    siparis_no text UNIQUE NOT NULL,
    kanal text DEFAULT 'magaza',
    toplam_tutar_tl numeric DEFAULT 0,
    durum text DEFAULT 'beklemede',
    kargo_takip_no text,
    notlar text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2_siparis_kalemleri (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    siparis_id uuid REFERENCES public.b2_siparisler(id),
    urun_id uuid REFERENCES public.b2_urun_katalogu(id),
    beden text,
    renk text,
    adet integer DEFAULT 1,
    birim_fiyat_tl numeric DEFAULT 0,
    iskonto_pct numeric DEFAULT 0,
    tutar_tl numeric GENERATED ALWAYS AS (adet * birim_fiyat_tl * (1 - iskonto_pct / 100)) STORED,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2_stok_hareketleri (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    urun_id uuid REFERENCES public.b2_urun_katalogu(id),
    hareket_tipi text NOT NULL,
    miktar integer NOT NULL,
    aciklama text,
    onay_durumu text DEFAULT 'beklemede',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2_kasa_hareketleri (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_id uuid REFERENCES public.b2_musteriler(id),
    siparis_id uuid REFERENCES public.b2_siparisler(id),
    hareket_tipi text NOT NULL,
    tutar_tl numeric NOT NULL,
    aciklama text,
    onay_durumu text DEFAULT 'beklemede',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.b2_musteri_iletisim (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_id uuid REFERENCES public.b2_musteriler(id),
    kanal text DEFAULT 'telefon',
    not_metni text,
    tarih timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);
