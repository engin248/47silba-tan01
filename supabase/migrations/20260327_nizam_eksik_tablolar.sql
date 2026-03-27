-- ============================================================
-- NİZAM — EKSİK TABLOLAR MİGRASYONU
-- Tarih: 27 Mart 2026
-- Çalıştırma: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- TABLO 1: M4 Finansal Kasa Arşivi (m4_muhasebe_ajani.js tarafından kullanılıyor)
CREATE TABLE IF NOT EXISTS m4_finansal_kasa_arsivi (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    islem_yonu  TEXT        NOT NULL CHECK (islem_yonu IN ('GELIR', 'GIDER')),
    aciklama    TEXT,
    tutar_try   NUMERIC,
    cari_hesap  TEXT,
    resmi_fis_no TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE m4_finansal_kasa_arsivi ENABLE ROW LEVEL SECURITY;
-- Yalnızca service_role erişebilir (anon erişemez)
DROP POLICY IF EXISTS "service_only_muhasebe" ON m4_finansal_kasa_arsivi;
CREATE POLICY "service_only_muhasebe" ON m4_finansal_kasa_arsivi
    USING (false) WITH CHECK (false);

-- TABLO 2: M4 Fiziksel Satın Almalar (m4_satin_alma_ajani.js tarafından kullanılıyor)
CREATE TABLE IF NOT EXISTS m4_fiziksel_satin_almalar (
    id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    urun_adi           TEXT,
    kumas_turu         TEXT,
    istenen_metraj     NUMERIC,
    tahmini_fatura_tl  NUMERIC,
    b2b_siparis_kodu   TEXT,
    tedarikci_adres    TEXT,
    durum              TEXT        DEFAULT 'TOPTANCIYA_EMIR_GITTI',
    created_at         TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE m4_fiziksel_satin_almalar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_only_satin_alma" ON m4_fiziksel_satin_almalar;
CREATE POLICY "service_only_satin_alma" ON m4_fiziksel_satin_almalar
    USING (false) WITH CHECK (false);

-- TABLO 3: Sistem Parametreleri (worker.js ve ajanlar tarafından okunuyor)
CREATE TABLE IF NOT EXISTS sistem_parametreleri (
    id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    anahtar    TEXT        UNIQUE NOT NULL,
    deger      TEXT        NOT NULL,
    aciklama   TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE sistem_parametreleri ENABLE ROW LEVEL SECURITY;
-- service_role yazar, authenticated okur
DROP POLICY IF EXISTS "service_yazma" ON sistem_parametreleri;
CREATE POLICY "service_yazma" ON sistem_parametreleri
    FOR ALL USING (false) WITH CHECK (false);

-- Başlangıç değerleri
INSERT INTO sistem_parametreleri (anahtar, deger, aciklama) VALUES
    ('kumas_metre_fiyati', '140', 'Varsayılan kumaş metre fiyatı (TL)'),
    ('hedef_satis_fiyati', '900', 'Hedef satış fiyatı (TL)')
ON CONFLICT (anahtar) DO NOTHING;

-- DOĞRULAMA
SELECT 'BAŞARILI: m4_finansal_kasa_arsivi' AS durum WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'm4_finansal_kasa_arsivi');
SELECT 'BAŞARILI: m4_fiziksel_satin_almalar' AS durum WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'm4_fiziksel_satin_almalar');
SELECT 'BAŞARILI: sistem_parametreleri' AS durum WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sistem_parametreleri');
