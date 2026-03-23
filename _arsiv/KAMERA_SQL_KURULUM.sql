-- ═══════════════════════════════════════════════════════
-- KAMERA SİSTEMİ — TAM SQL KURULUM (NİZAM M15)
-- Supabase SQL Editor'da çalıştır
-- ═══════════════════════════════════════════════════════

-- 1. KAMERA LİSTESİ TABLOSU
CREATE TABLE IF NOT EXISTS cameras (
    id          SERIAL PRIMARY KEY,
    nvr_kanal   VARCHAR(10),
    name        VARCHAR(100) NOT NULL,
    src         VARCHAR(50)  NOT NULL,
    role        VARCHAR(30)  DEFAULT 'processing',
    status      VARCHAR(20)  DEFAULT 'online',
    work_center VARCHAR(100),
    ip          VARCHAR(20),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Başlangıç verileri (12 kamera)
INSERT INTO cameras (nvr_kanal, name, src, role, status, work_center, ip) VALUES
('D1',  'Ana Giriş',         'd1',  'security',   'offline', 'Güvenlik',  '192.168.1.201'),
('D2',  'Kesim Masası A',    'd2',  'processing',  'online',  'Kesimhane', '192.168.1.202'),
('D3',  'Dikim Bandı 1',     'd3',  'processing',  'online',  'İmalat',    '192.168.1.203'),
('D4',  'Dikim Bandı 2',     'd4',  'processing',  'online',  'İmalat',    '192.168.1.204'),
('D5',  'Kalite Kontrol',    'd5',  'qa',          'online',  'KK Birimi', '192.168.1.205'),
('D6',  'Ütü & Paketleme',   'd6',  'qa',          'online',  'KK Birimi', '192.168.1.206'),
('D7',  'Kumaş Deposu',      'd7',  'storage',     'online',  'Depo',      '192.168.1.207'),
('D8',  'Yükleme Alanı',     'd8',  'storage',     'online',  'Depo',      '192.168.1.208'),
('D9',  'Üretim Koridoru',   'd9',  'security',    'online',  'Güvenlik',  '192.168.1.209'),
('D10', 'Depo Girişi',       'd10', 'storage',     'online',  'Depo',      '192.168.1.210'),
('D11', 'Makine Alanı',      'd11', 'processing',  'online',  'İmalat',    '192.168.1.211'),
('D12', 'Ofis / Yönetim',    'd12', 'security',    'online',  'Güvenlik',  '192.168.1.212')
ON CONFLICT DO NOTHING;

ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kamera Listesi Goruntule" ON cameras;
CREATE POLICY "Kamera Listesi Goruntule"
    ON cameras FOR SELECT
    USING (auth.role() IN ('authenticated', 'anon'));

-- ─────────────────────────────────────────────────────
-- 2. KAMERA OLAYLARI TABLOSU (AI Hareket & Anomali)
CREATE TABLE IF NOT EXISTS camera_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id   INTEGER REFERENCES cameras(id),
    event_type  VARCHAR(50) NOT NULL,
    video_url   TEXT,
    metadata    JSONB,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE camera_events REPLICA IDENTITY FULL;
ALTER TABLE camera_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kamera Olaylari Goruntule" ON camera_events;
CREATE POLICY "Kamera Olaylari Goruntule"
    ON camera_events FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Sistem Olay Yazar" ON camera_events;
CREATE POLICY "Sistem Olay Yazar"
    ON camera_events FOR INSERT
    WITH CHECK (true);

CREATE OR REPLACE FUNCTION delete_old_camera_events()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM camera_events WHERE created_at < NOW() - INTERVAL '14 days';
END;
$$;

CREATE INDEX IF NOT EXISTS idx_camera_events_type ON camera_events(event_type);
CREATE INDEX IF NOT EXISTS idx_camera_events_date ON camera_events(created_at);

-- ─────────────────────────────────────────────────────
-- 3. ERİŞİM LOG TABLOSU
CREATE TABLE IF NOT EXISTS camera_access_log (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID,
    kullanici_adi VARCHAR(100),
    islem_tipi    VARCHAR(100),
    kamera_adi    VARCHAR(100),
    ip_adresi     VARCHAR(50),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE camera_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Erisim Log Yaz" ON camera_access_log;
CREATE POLICY "Erisim Log Yaz"
    ON camera_access_log FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Erisim Log Goruntule" ON camera_access_log;
CREATE POLICY "Erisim Log Goruntule"
    ON camera_access_log FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_access_log_date ON camera_access_log(created_at);

-- ═══════════════════════════════════════════════════════
-- KURULUM TAMAM — 3 tablo hazır
-- cameras · camera_events · camera_access_log
-- ═══════════════════════════════════════════════════════
