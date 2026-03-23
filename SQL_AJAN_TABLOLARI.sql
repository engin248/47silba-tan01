-- ==============================================================================
-- NİZAM AJAN SİSTEMİ EKSİK KOLON VE TABLO YAMASI
-- Bu betik, Yargıç ve Ölü İşçi ajanlarının Supabase üzerinde çalışabilmesi için
-- gerekli tablo yapısını (b1_arge_products) günceller veya oluşturur.
-- ==============================================================================

-- 1. Eğer tablo hiç yoksa oluştur:
CREATE TABLE IF NOT EXISTS b1_arge_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aranan_kelime TEXT,
    veri_kaynagi TEXT,
    ham_veri JSONB,
    islenen_durum TEXT DEFAULT 'bekliyor',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    isleyen_ajan TEXT,
    islendigi_tarih TIMESTAMPTZ,
    extracted_data JSONB
);

-- 2. Eğer tablo zaten "b1_arge_products" adıyla varsa ama bazı ajan kolonları eksikse:
-- Yargıç botunun "column islenen_durum does not exist" hatasını çözer.
ALTER TABLE b1_arge_products ADD COLUMN IF NOT EXISTS islenen_durum TEXT DEFAULT 'bekliyor';
ALTER TABLE b1_arge_products ADD COLUMN IF NOT EXISTS ham_veri JSONB;
ALTER TABLE b1_arge_products ADD COLUMN IF NOT EXISTS isleyen_ajan TEXT;
ALTER TABLE b1_arge_products ADD COLUMN IF NOT EXISTS islendigi_tarih TIMESTAMPTZ;
ALTER TABLE b1_arge_products ADD COLUMN IF NOT EXISTS extracted_data JSONB;

-- 3. Trendler tablosu için olası eksikler (Yargıç analiz sonucunu buraya yazar)
CREATE TABLE IF NOT EXISTS b1_arge_trendler (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kaynak TEXT,
    urun_adi TEXT,
    baslik TEXT,
    fiyat NUMERIC,
    trend_kategorisi TEXT,
    ekstra_ozellikler JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    analiz_eden_ajan TEXT,
    ham_fiyat_metni TEXT
);

ALTER TABLE b1_arge_trendler ADD COLUMN IF NOT EXISTS analiz_eden_ajan TEXT;
ALTER TABLE b1_arge_trendler ADD COLUMN IF NOT EXISTS ham_fiyat_metni TEXT;

-- ÇALIŞTIRMA TALİMATI:
-- Supabase Dashboard -> SQL Editor menüsüne girip bu betiği çalıştırın.
