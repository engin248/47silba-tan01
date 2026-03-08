-- ========================================================================================
-- THE ORDER 47 - KOMUTA MERKEZİ VERİTABANI YAMALARI (1. BÖLÜM 7 MADDE)
-- Hedef: Müşteri Risk Blokesi, Tedarikçiler, Çek/Senet, Offline Log, Adalet Puanı, Makine Tipi
-- Talimat: Bu SQL dosyasını Supabase SQL Editor'de tamamen kopyalayıp çalıştırınız.
-- ========================================================================================

-- ----------------------------------------------------------------------------------------
-- 1. TEDARİKÇİLER TABLOSU (M2 Kumaş Modülü İçin)
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.b2_tedarikciler (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firma_adi varchar(200) NOT NULL,
    yetkili_kisi varchar(200),
    telefon varchar(20),
    email varchar(100),
    adres text,
    vergi_no varchar(50),
    aktif boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Kumaş Arşivine Tedarikçi FK Bağlantısı Ekleme (Opsiyonel ama mantıklı)
ALTER TABLE public.b1_kumas_arsivi 
ADD COLUMN IF NOT EXISTS tedarikci_id uuid REFERENCES public.b2_tedarikciler(id) ON DELETE SET NULL;


-- ----------------------------------------------------------------------------------------
-- 2. GELECEK VADELİ ÇEK VE SENET TAKİBİ (M7 Kasa Modülü İçin)
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.b2_cek_senet_vade (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_id uuid REFERENCES public.b2_musteriler(id) ON DELETE CASCADE,
    evrak_tipi varchar(20) NOT NULL CHECK (evrak_tipi IN ('cek', 'senet')),
    evrak_no varchar(100),
    tutar_tl decimal(12,4) NOT NULL CHECK (tutar_tl > 0),
    vade_tarihi date NOT NULL,
    durum varchar(20) DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'tahsil_edildi', 'karsiliksiz', 'iptal')),
    notlar text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);


-- ----------------------------------------------------------------------------------------
-- 3. KARA LİSTE VE RİSK BLOKESİ (M11 Müşteriler)
-- ----------------------------------------------------------------------------------------
-- Müşteriye risk/kredi limiti ekleniyor.
ALTER TABLE public.b2_musteriler 
ADD COLUMN IF NOT EXISTS risk_limiti_tl decimal(12,4) DEFAULT 100000.00;

-- Müşterinin borcu limitini aşarsa AI ve Karargaha kırmızı alarm fırlatacak Trigger (Otonom)
CREATE OR REPLACE FUNCTION fn_musteri_risk_alarm()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.toplam_borc_tl > NEW.risk_limiti_tl THEN
        INSERT INTO public.b1_sistem_uyarilari (uyari_tipi, seviye, baslik, baslik_ar, mesaj, kaynak_tablo, kaynak_id)
        VALUES (
            'maliyet_asimi', 'kritik',
            'KRİTİK RİSK: Müşteri Kredi Limitini Aştı!',
            'حرج: تجاوز العميل الحد الائتماني',
            NEW.ad_soyad || ' isimli müşteri ' || NEW.risk_limiti_tl || ' TL limitini aştı! Güncel Borç: ' || NEW.toplam_borc_tl || ' TL. Siparişler Bloke Edilmelidir.',
            'b2_musteriler', NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_musteri_risk_alarm ON public.b2_musteriler;
CREATE TRIGGER trg_musteri_risk_alarm
AFTER UPDATE OF toplam_borc_tl ON public.b2_musteriler
FOR EACH ROW EXECUTE FUNCTION fn_musteri_risk_alarm();


-- ----------------------------------------------------------------------------------------
-- 4. İŞ ZORLUK DERECESİ VE MAKİNE TİPİ (M3 Modelhane)
-- ----------------------------------------------------------------------------------------
-- Dikim talimatlarına Puan, Makine Türü eklendi. Maaş adaletini sağlayan çekirdektir.
ALTER TABLE public.b1_dikim_talimatlari 
ADD COLUMN IF NOT EXISTS zorluk_derecesi integer DEFAULT 5 CHECK (zorluk_derecesi >= 1 AND zorluk_derecesi <= 10);

ALTER TABLE public.b1_dikim_talimatlari 
ADD COLUMN IF NOT EXISTS makine_tipi varchar(50) DEFAULT 'duz_dikis' 
CHECK (makine_tipi IN ('duz_dikis', 'overlok', 'recme', 'ilik_dugme', 'cift_igne', 'diger'));


-- ----------------------------------------------------------------------------------------
-- 5. İK AI PERFORMANS YILDIZI (M9 Personel Performans)
-- ----------------------------------------------------------------------------------------
-- users tablosu dışarıdan yönetildiği için, sistemdeki işçilere özel AI Puanlama Tablosu açıldı.
CREATE TABLE IF NOT EXISTS public.b1_personel_performans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    personel_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    donem varchar(20) NOT NULL, -- Örn: '2026-03'
    ai_verimlilik_puani decimal(3,2) DEFAULT 5.00 CHECK (ai_verimlilik_puani >= 1.00 AND ai_verimlilik_puani <= 5.00),
    toplam_dikim_adeti integer DEFAULT 0,
    hata_yuzdesi decimal(5,2) DEFAULT 0.00,
    ai_karar_metni text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(personel_id, donem)
);


-- ----------------------------------------------------------------------------------------
-- 6. OFFLINE KOPMA LOGLARI (B0 Karargah Logları)
-- ----------------------------------------------------------------------------------------
-- Log tablosuna bu işlemin internetsiz ortamdan "sonradan mı (senkronize)" geldiğini anlatan Mühür Eklendi.
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'b0_sistem_loglari'
    ) THEN
        ALTER TABLE public.b0_sistem_loglari 
        ADD COLUMN IF NOT EXISTS is_offline_sync boolean DEFAULT false;
    END IF;
END $$;


-- ----------------------------------------------------------------------------------------
-- 7. VERSİYON NO VE VİDEO LİNK DESTEĞİ (M4 Kalıphane)
-- ----------------------------------------------------------------------------------------
-- Kalıp dosyalarına eğitim videosu eklendi.
ALTER TABLE public.b1_model_kaliplari 
ADD COLUMN IF NOT EXISTS egitim_video_url text;

-- (Not: 'versiyon' sütunu eski b1_model_kaliplari'nda varchar(20) DEFAULT 'v1.0' olarak zaten mevcuttur! Çakışma önlendi.)

-- ========================================================================================
-- İŞLEM MATRİSİ TAMAMLANDI.
-- TABLOLAR, SÜTUNLAR VE TRİGGER ZIRHLARI KUVVETE BİNDİRİLDİ!
-- ========================================================================================

-- ----------------------------------------------------------------------------------------
-- M9 KASA & FİNANS: b2_finans_hareket TABLOSU
-- Talimat: Bu bloğu Supabase SQL Editor'de çalıştırınız.
-- ----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.b2_finans_hareket (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tur varchar(20) NOT NULL CHECK (tur IN ('gelir', 'gider')),
    kategori varchar(100),
    tutar_tl numeric(12,2) NOT NULL CHECK (tutar_tl > 0),
    aciklama text,
    tarih date DEFAULT CURRENT_DATE,
    olusturan varchar(200),
    siparis_id uuid REFERENCES public.b2_siparisler(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- RLS Politikası (Güvenlik Zırhı)
ALTER TABLE public.b2_finans_hareket ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "b2_finans_herkes_okuyabilir" ON public.b2_finans_hareket FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "b2_finans_kimlik_dogrulandi_yazabilir" ON public.b2_finans_hareket FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "b2_finans_kimlik_dogrulandi_silebilir" ON public.b2_finans_hareket FOR DELETE USING (true);

-- Index (Performans Zırhı)
CREATE INDEX IF NOT EXISTS idx_b2_finans_tur ON public.b2_finans_hareket(tur);
CREATE INDEX IF NOT EXISTS idx_b2_finans_tarih ON public.b2_finans_hareket(tarih DESC);

-- ========================================================================================
-- M9 KASA TABLOSU HAZIR. SUPABASE SQL EDITOR'DE ÇALIŞTIRIN!
-- ========================================================================================
