-- ============================================================
-- SUPABASE STORAGE KURULUM
-- Bu SQL'i Supabase → SQL Editor'da çalıştırın
-- ============================================================

-- 1) Storage bucket oluştur (teknik föy fotoğrafları için)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'teknik-foyler',
  'teknik-foyler', 
  true,
  10485760,  -- 10MB maksimum dosya boyutu
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2) Herkese görüntüleme izni (public bucket)
CREATE POLICY IF NOT EXISTS "Herkes gorebilir"
ON storage.objects FOR SELECT
USING (bucket_id = 'teknik-foyler');

-- 3) Kimliği doğrulanmış kullanıcılar yükleyebilir
CREATE POLICY IF NOT EXISTS "Herkes yukleyebilir"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'teknik-foyler');

-- 4) Yükleyen silebilir
CREATE POLICY IF NOT EXISTS "Herkes silebilir"
ON storage.objects FOR DELETE
USING (bucket_id = 'teknik-foyler');

-- Kontrol: bucket oluştu mu?
SELECT id, name, public FROM storage.buckets WHERE id = 'teknik-foyler';
