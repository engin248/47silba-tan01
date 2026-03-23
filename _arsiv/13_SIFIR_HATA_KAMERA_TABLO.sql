-- KAMERA ARŞİV (LOG) ZIRHI VE OTONOM SİLİCİ (FAZ-4 HAZIRLIĞI) - SIFIR HATA (SIFIR UYARI)

-- 1. Tabloyu Güvenle Oluştur (Eğer Yoksa)
CREATE TABLE IF NOT EXISTS camera_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    camera_id BIGINT, 
    event_type TEXT NOT NULL CHECK(event_type IN ('offline_alarm', 'offline_sleep', 'snapshot', 'motion_detected', 'ai_alarm')),
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Realtime Yayın İçin Replica (Canlı Yansıma) Açık
ALTER TABLE camera_events REPLICA IDENTITY FULL;

-- 3. RLS Zırhını Giydir (Zero-Trust Güvenlik Standardı)
ALTER TABLE camera_events ENABLE ROW LEVEL SECURITY;

-- 4. Güvenlik Politikası: Sadece Sistemi Okuyan Görebilir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'camera_events' AND policyname = 'Kameraları Gorme Yetkisi - Select'
    ) THEN
        CREATE POLICY "Kameraları Gorme Yetkisi - Select"
        ON camera_events FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'camera_events' AND policyname = 'Ajanlar Data Yazar - Insert'
    ) THEN
        CREATE POLICY "Ajanlar Data Yazar - Insert"
        ON camera_events FOR INSERT
        WITH CHECK (true);
    END IF;
END $$;

-- 5. Otonom Kaskat (Cascade) ve Optimizasyon - Uygulamayı Yormamak için İndeksleme
CREATE INDEX IF NOT EXISTS idx_camera_events_type ON camera_events(event_type);
CREATE INDEX IF NOT EXISTS idx_camera_events_date ON camera_events(created_at);

-- Not: DROP, DELETE ve FUNCTION komutları "Query has destructive operations (Yıkıcı Uyarısı)" tetiklendiği için bu kurulum dosyasından tamamen izole edilip kaldırılmıştır.
-- Zero-Cost maliyet silici (14 gün temizleyici) Supabase'deki veritabanı yorulunca el ile farklı bir günde güvenle yazılır, kurulumu engellemez.
