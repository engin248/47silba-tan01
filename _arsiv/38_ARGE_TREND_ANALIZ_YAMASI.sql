-- ANALIZ_01_ARGE_TREND.md gereksinimlerine göre Altyapı Hazırlığı
-- Tablo: b1_arge_products (Ajanların yakaladığı ürünlerin vitrini/akışı)

-- 1. Satar / Satmaz ve Karar Üretim Sütunları
ALTER TABLE public.b1_arge_products ADD COLUMN IF NOT EXISTS ai_satis_karari text; -- "ÇOK_SATAR", "SATMAZ", "İZLE"
ALTER TABLE public.b1_arge_products ADD COLUMN IF NOT EXISTS trend_skoru numeric DEFAULT 0; -- 0-100 Arası Hız Puanı
ALTER TABLE public.b1_arge_products ADD COLUMN IF NOT EXISTS artis_yuzdesi numeric DEFAULT 0; -- % cinsinden (Örn: +45)
ALTER TABLE public.b1_arge_products ADD COLUMN IF NOT EXISTS hiz_delta_puani numeric DEFAULT 0; -- Bir önceki güne göre artış katsayısı
ALTER TABLE public.b1_arge_products ADD COLUMN IF NOT EXISTS erken_trend_mi boolean DEFAULT false; -- Düşük rekabet + Hızlı artış saptaması
ALTER TABLE public.b1_arge_products ADD COLUMN IF NOT EXISTS rekabet_durumu text; -- "DOYGUN", "FIRSAT", "BOŞ_ALAN"

-- 2. Hermania Açıklaması ve Güven Oranı (Loglar harici ürün kartında kalıcı olması için)
ALTER TABLE public.b1_arge_products ADD COLUMN IF NOT EXISTS hermania_karar_yorumu text;
ALTER TABLE public.b1_arge_products ADD COLUMN IF NOT EXISTS ai_guven_skoru numeric DEFAULT 0; -- % cinsinden (Örn: 92)

-- Açıklamalar (Altyapı dokümantasyonu için)
COMMENT ON COLUMN public.b1_arge_products.ai_satis_karari IS 'Gemini/Bingo Şefinin belirlediği nihai satış potansiyeli kararı.';
COMMENT ON COLUMN public.b1_arge_products.trend_skoru IS 'TikTok, Google, Meta reklam sinyallerinin harmanlanmış 100 üzerinden trend aciliyeti puanı.';
COMMENT ON COLUMN public.b1_arge_products.erken_trend_mi IS 'Sistem tespit ettiğinde henüz rekabet yoksa butonu işaretler (Erken Gir fırsatı).';
