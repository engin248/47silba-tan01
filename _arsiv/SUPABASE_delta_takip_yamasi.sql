-- ============================================================
-- DELTA TAKIP SISTEMI — Supabase SQL 
-- Bu kodu Supabase SQL Editor'e yapistir ve calistir
-- ============================================================

-- ADIM 1: Mevcut UNIQUE kisitini kaldir (tek URL → tek ROW engeli)
ALTER TABLE public.b1_piyasa_gozlem
  DROP CONSTRAINT IF EXISTS b1_piyasa_gozlem_urun_linki_key;

-- ADIM 2: Gunluk benzersiz constraint — Ayni URL gunde 1 kez eklenebilir
DROP INDEX IF EXISTS idx_gozlem_url_gun;
CREATE UNIQUE INDEX idx_gozlem_url_gun
  ON public.b1_piyasa_gozlem(urun_linki, gozlem_tarihi);

-- ADIM 3: Delta alanlari ekle
ALTER TABLE public.b1_piyasa_gozlem
  ADD COLUMN IF NOT EXISTS yorum_delta  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favori_delta INTEGER DEFAULT 0;

-- Yorum:
-- yorum_delta  = bugunku yorum_sayisi - dunkü yorum_sayisi
-- favori_delta = bugunku urun_favorisi - dunkü urun_favorisi
-- Bu iki delta, Yargic (AI) tarafindan trend skoru hesaplamak icin kullanilir
-- Sinyal: favori_delta >> yorum_delta  =>  ISINIYOR, henuz patlamamis
