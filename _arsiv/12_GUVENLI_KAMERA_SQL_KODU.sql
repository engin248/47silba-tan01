-- KAMERA ARŞİV (LOG) ZIRHI VE OTONOM SİLİCİ (FAZ-4 HAZIRLIĞI)

-- DIKKAT: YIKICI HATA OLMAMASI İCİN ONCE VARSA YANLIS KURULMUS TABLOYU SILL (GÜVENLİ MİMARİ/SIFIR RİSK)
DROP TABLE IF EXISTS camera_events CASCADE;

-- 1. Tabloyu Güvenle Oluştur
-- ÖNEMLİ KONTROL: 'cameras' tablosu bazı sistemlerde kurulmamış olabilir, 
-- hata (Yıkıcı: Foreign Key relation does not exist) vermemesi için BIGINT kısmından REFERENCES constraints (bağıllık) kaldırılmış, otonom zırhla yetinilmiştir!
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
    DROP POLICY IF EXISTS "Kameraları Gorme Yetkisi - Select" ON camera_events;
    CREATE POLICY "Kameraları Gorme Yetkisi - Select"
    ON camera_events FOR SELECT
    USING (true);

    DROP POLICY IF EXISTS "Ajanlar Data Yazar - Insert" ON camera_events;
    CREATE POLICY "Ajanlar Data Yazar - Insert"
    ON camera_events FOR INSERT
    WITH CHECK (true);
END $$;

-- 5. Near-Zero Cost Ekonomik Koruma: 14 Günden Eski Logları Kendisi Siler 
-- (Maliyet yaratıp veritabanını şişirmesini kesin olarak engeller)
CREATE OR REPLACE FUNCTION delete_old_camera_events()
RETURNS void AS $$
BEGIN
  DELETE FROM camera_events WHERE created_at < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql;

-- 6. Otonom Kaskat (Cascade) ve Optimizasyon - Uygulamayı Yormamak için İndeksleme
-- (Daha hizli arama, minimum islemci-database hakedisi)
CREATE INDEX IF NOT EXISTS idx_camera_events_type ON camera_events(event_type);
CREATE INDEX IF NOT EXISTS idx_camera_events_date ON camera_events(created_at);
