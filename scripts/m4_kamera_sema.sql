-- M4: Otonom Kamera ve Görüntü İşleme Logları Tablosu
-- Lokal ağdaki (Edge) Raspberry Pi veya işletme bilgisayarlarından akan 
-- AI görüş/sayım sonuçlarını bulutta tutar.

CREATE TABLE IF NOT EXISTS public.b1_kamera_olaylari (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kamera_ip TEXT NOT NULL,
    kamera_adi TEXT,
    olay_tipi TEXT NOT NULL, -- 'gecis', 'hata', 'yogunluk', 'personel_tespiti'
    guven_skoru NUMERIC,     -- Edge AI tahmin skoru (0-1 arası)
    resim_url TEXT,          -- İsteğe bağlı: Anomali durumunda çekilen ekran görüntüsü url'si
    ek_bilgi JSONB DEFAULT '{}'::jsonb, -- Model detayları, koordinatlar vb.
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Güvenlik Politikaları
ALTER TABLE public.b1_kamera_olaylari ENABLE ROW LEVEL SECURITY;

-- Okuma (Read): Sadece sisteme giriş yapmış yetkili personeller
CREATE POLICY "Sadece yetkili personeller kamera olaylarını görebilir"
ON public.b1_kamera_olaylari FOR SELECT
USING ( auth.role() = 'authenticated' );

-- Yazma (Insert): Edge cihazlar servis anahtarıyla anonim (veyahut role bazlı) veri basabilir
-- Kural: Insert için şimdilik authenticated veya spesifik service_role izni yeterli.
CREATE POLICY "Servis rolleri ve Edge cihazları kayıt atabilir"
ON public.b1_kamera_olaylari FOR INSERT
WITH CHECK ( true ); -- (Pratikte Service Role veya Bearer Token ile koruyacağız API'yi)

-- Güncelleme/Silme (Update/Delete): Güvenlik gereği eski kamera logları değiştirilemez.
CREATE POLICY "Kamera logları silinemez"
ON public.b1_kamera_olaylari FOR DELETE
USING ( false );

CREATE POLICY "Kamera logları güncellenemez"
ON public.b1_kamera_olaylari FOR UPDATE
USING ( false );

-- Endeksler (Performans optimizasyonu)
CREATE INDEX IF NOT EXISTS idx_kamera_olaylari_tarih ON public.b1_kamera_olaylari (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kamera_olaylari_tur ON public.b1_kamera_olaylari (olay_tipi);
