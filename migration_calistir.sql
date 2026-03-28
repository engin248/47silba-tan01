-- ============================================================
-- THE ORDER / NİZAM — Supabase Migration Scriptleri
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- 27.03.2026
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- #7 FIX: v2_users tablosu oluştur → /uretim sayfası kurtarılır
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS v2_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_soyad TEXT NOT NULL,
  rol TEXT DEFAULT 'personel',
  durum TEXT DEFAULT 'aktif' CHECK (durum IN ('aktif', 'pasif', 'izinli')),
  email TEXT,
  telefon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Sadece kimlik doğrulaması geçenler okuyabilir
ALTER TABLE v2_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "v2_users okuma" ON v2_users FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────
-- #7 FIX: v2_order_production_steps tablosu
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS v2_order_production_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siparis_id UUID,
  adim_adi TEXT NOT NULL,
  adim_sirasi INTEGER DEFAULT 1,
  durum TEXT DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'devam_ediyor', 'tamamlandi', 'iptal')),
  bg TEXT DEFAULT '#1a2408',       -- Karargah renk kodu
  renk TEXT DEFAULT '#507a1a',     -- Sınır rengi
  atanan_personel_id UUID,
  baslangic_tarihi TIMESTAMPTZ,
  bitis_tarihi TIMESTAMPTZ,
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- #12 FIX: b1_arge_products islenen_durum constraint güncelle
-- 'mock_islendi' durumu eklendi
-- ─────────────────────────────────────────────────────────
ALTER TABLE b1_arge_products
  DROP CONSTRAINT IF EXISTS islenen_durum_check;

ALTER TABLE b1_arge_products
  ADD CONSTRAINT islenen_durum_check
  CHECK (islenen_durum IN ('bekliyor', 'islendi', 'mock_islendi', 'hata'));

-- ─────────────────────────────────────────────────────────
-- #19 FIX: b0_api_spam_kalkani tablosuna kolon ekle
-- ─────────────────────────────────────────────────────────
ALTER TABLE b0_api_spam_kalkani
  ADD COLUMN IF NOT EXISTS son_mesaj_ozeti TEXT;

-- ─────────────────────────────────────────────────────────
-- Doğrulama: Tabloların oluşturulduğunu kontrol et
-- ─────────────────────────────────────────────────────────
SELECT
  table_name,
  COUNT(*) as kolon_sayisi
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('v2_users', 'v2_order_production_steps', 'b0_api_spam_kalkani', 'b1_arge_products')
GROUP BY table_name
ORDER BY table_name;
