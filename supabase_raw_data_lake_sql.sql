-- ═══════════════════════════════════════════════════════════
-- DİĞER VERİTABANI: RAW DATA LAKE (Çöplük / Ham Veri Arşivi)
-- "Gereksiz Veriyi Karargaha Almamak İçin Ayrı Bir Tablo"
-- ═══════════════════════════════════════════════════════════

-- Bu tablo HTML kodu, sayfa DOM ağaçları, karmaşık verileri tutar.
-- Gemini Token maliyeti bu sayede %95 düşürülmektedir.
-- THE ORDER NIZAM ETL Pipeline

CREATE TABLE IF NOT EXISTS public.b1_raw_data_lake (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    kaynak_url text NOT NULL,
    kaynak_platform text DEFAULT 'Bilinmeyen',
    ham_json jsonb NOT NULL,
    islenme_durumu text DEFAULT 'bekliyor', -- bekliyor, islendi, iptal
    eklenme_tarihi timestamp with time zone DEFAULT now()
);

-- Hızlı URL taraması için index
CREATE INDEX IF NOT EXISTS idx_b1_raw_lake_url ON public.b1_raw_data_lake (kaynak_url);
CREATE INDEX IF NOT EXISTS idx_b1_raw_lake_platform ON public.b1_raw_data_lake (kaynak_platform);

-- Gereksiz yere sonsuza kadar veri dolmasını önlemek için, 
-- İsteğe bağlı 3 aylık temizleme cron tablosu (Önerilen)
-- Bunu ileride Vercel Cron ile temizleyeceğiz.
