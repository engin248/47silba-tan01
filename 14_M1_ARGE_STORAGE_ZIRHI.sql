-- "arge_gorselleri" ADLI BUCKET'I OLUŞTUR VE YETKİLENDİR (SIFIR YÜK KORUMASI)

-- 1. Bucket'ı eğer yoksa güvenle oluştur:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'arge_gorselleri', 
  'arge_gorselleri', 
  true, 
  524288, -- 500 KB limit (Tablet/Saha fotoğrafı veritabanını şişirmesin diye)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Bucket için Select (Okuma) Politikası: Yüklenen resimleri herkes/sistem görebilir
CREATE POLICY "Gorselleri Herkes Gorebilir" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'arge_gorselleri' );

-- 3. Bucket için Insert (Yazma) Politikası: Ar-Ge ajanına upload yetkisi verir
CREATE POLICY "Zirhli Upload Izni" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'arge_gorselleri' );
