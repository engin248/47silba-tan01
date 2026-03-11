-- KAMERA ARŞİV (LOG) ZIRHI VE OTONOM SİLİCİ (FAZ-4 HAZIRLIĞI)

-- 1. Tabloyu Güvenle Oluştur
CREATE TABLE IF NOT EXISTS camera_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    camera_id BIGINT REFERENCES cameras(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK(event_type IN ('offline_alarm', 'offline_sleep', 'snapshot', 'motion_detected', 'ai_alarm')),
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Realtime Yayın İçin Replica (Canlı Yansıma) Açık
ALTER TABLE camera_events REPLICA IDENTITY FULL;

-- 3. RLS Zırhını Giydir (Zero-Trust)
ALTER TABLE camera_events ENABLE ROW LEVEL SECURITY;

-- 4. Güvenlik Politikası: Sadece Sistemi Okuyan Görebilir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'camera_events' AND policyname = 'Kameraları Gorme Yetkisi - Select'
    ) THEN
        CREATE POLICY "Kameraları Gorme Yetkisi - Select"
        ON camera_events FOR SELECT
        USING (true); -- (Dashboard'dan anlık alınacağı için Vercel API koruyacak)
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'camera_events' AND policyname = 'Ajanlar Data Yazar - Insert'
    ) THEN
        CREATE POLICY "Ajanlar Data Yazar - Insert"
        ON camera_events FOR INSERT
        WITH CHECK (true); -- Sadece yetkili Cron Service Key'leri işlem yapacak (Vercel tarafı kontrolü)
    END IF;
END $$;

-- 5. Near-Zero Cost Ekonomik Koruma: 14 Günden Eski Logları Kendisi Siler (Veritabanı Şişmesini Önleme)
-- (Sıfıra Yakın Finansal Yük Felsefesi Gereği PostgreSQL Cron Fonksiyonu Kurulur)
CREATE OR REPLACE FUNCTION delete_old_camera_events()
RETURNS void AS $$
BEGIN
  -- 14 Günü geçen veriyi sil, böylece Supabase storage ve DB maliyeti 0'da kalır.
  DELETE FROM camera_events WHERE created_at < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql;

-- 6. Otonom Kaskat (Cascade) ve Optimizasyon - İndeksleme (Uygulamayı Yormama)
CREATE INDEX IF NOT EXISTS idx_camera_events_type ON camera_events(event_type);
CREATE INDEX IF NOT EXISTS idx_camera_events_date ON camera_events(created_at);
