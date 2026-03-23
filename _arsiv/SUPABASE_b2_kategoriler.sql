-- ============================================================
-- b2_kategoriler TABLOSU
-- Ürün Kataloğu için dinamik kategori yönetimi
-- Supabase SQL Editor'a yapıştır ve çalıştır
-- ============================================================

CREATE TABLE IF NOT EXISTS b2_kategoriler (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad          TEXT NOT NULL,
  renk        TEXT DEFAULT '#6366f1',
  ikon        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS aktif et (erişim kontrolü)
ALTER TABLE b2_kategoriler ENABLE ROW LEVEL SECURITY;

-- Tüm işlemlere izin ver (uygulama kendi auth'unu yönetiyor)
CREATE POLICY "allow_all" ON b2_kategoriler FOR ALL USING (true) WITH CHECK (true);

-- b2_urun_katalogu tablosuna kategori_id kolonu ekle
ALTER TABLE b2_urun_katalogu
  ADD COLUMN IF NOT EXISTS kategori_id UUID REFERENCES b2_kategoriler(id) ON DELETE SET NULL;

-- Örnek kategoriler
INSERT INTO b2_kategoriler (ad, renk, ikon) VALUES
  ('Gomlek', '#3b82f6', null),
  ('Pantolon', '#8b5cf6', null),
  ('Etek', '#ec4899', null),
  ('Abiye', '#f59e0b', null),
  ('Esofman', '#10b981', null)
ON CONFLICT DO NOTHING;
