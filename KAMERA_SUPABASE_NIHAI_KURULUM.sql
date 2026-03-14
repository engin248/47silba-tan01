-- ════════════════════════════════════════════════════════════════════
-- THE ORDER / NIZAM — KAMERA SİSTEMİ NİHAİ SUPABASE KURULUMU
-- Tarih: 13 Mart 2026
-- Hedef: cameras · camera_events · camera_access_log · b0_api_spam_kalkani
-- Talimat: Supabase SQL Editor'de TÜM bu dosyayı kopyalayıp çalıştır.
-- GÜVENLI: Tüm komutlar IF NOT EXISTS ile korunmuştur. Mevcut veri SİLİNMEZ.
-- ════════════════════════════════════════════════════════════════════


-- ── ADIM 1: cameras TABLOSU ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cameras (
    id          BIGSERIAL PRIMARY KEY,
    nvr_kanal   VARCHAR(10),
    name        VARCHAR(100) NOT NULL,
    src         VARCHAR(50)  NOT NULL,
    role        VARCHAR(30)  DEFAULT 'processing',
    status      VARCHAR(20)  DEFAULT 'online',
    work_center VARCHAR(100),
    ip          VARCHAR(20),
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- RLS
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;

-- Politikalar (IF NOT EXISTS yöntemi)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cameras' AND policyname = 'cameras_select') THEN
        CREATE POLICY "cameras_select" ON public.cameras FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cameras' AND policyname = 'cameras_insert') THEN
        CREATE POLICY "cameras_insert" ON public.cameras FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cameras' AND policyname = 'cameras_update') THEN
        CREATE POLICY "cameras_update" ON public.cameras FOR UPDATE USING (true);
    END IF;
END $$;

-- Başlangıç verileri (sadece boşsa ekle)
INSERT INTO public.cameras (nvr_kanal, name, src, role, status, work_center, ip)
SELECT * FROM (VALUES
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
) AS v(nvr_kanal, name, src, role, status, work_center, ip)
WHERE NOT EXISTS (SELECT 1 FROM public.cameras LIMIT 1);


-- ── ADIM 2: camera_events TABLOSU ────────────────────────────────────
-- Dikkat: cameras tablosuna FOREIGN KEY yok intentionally
-- (cameras tablosu bazen kurulmamış olabilir → cascade error önlenir)
CREATE TABLE IF NOT EXISTS public.camera_events (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id   BIGINT,     -- cameras(id) referansı ama FK olmadan (güvenli mimari)
    event_type  TEXT        NOT NULL CHECK (event_type IN (
                    'offline_alarm', 'offline_sleep', 'snapshot',
                    'motion_detected', 'ai_alarm', 'anomaly'
                )),
    video_url   TEXT,
    metadata    JSONB       DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Realtime (canlı yayın için zorunlu)
ALTER TABLE public.camera_events REPLICA IDENTITY FULL;

-- RLS
ALTER TABLE public.camera_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'camera_events' AND policyname = 'camera_events_select') THEN
        CREATE POLICY "camera_events_select" ON public.camera_events FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'camera_events' AND policyname = 'camera_events_insert') THEN
        CREATE POLICY "camera_events_insert" ON public.camera_events FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- İndeksler (performans)
CREATE INDEX IF NOT EXISTS idx_camera_events_type ON public.camera_events(event_type);
CREATE INDEX IF NOT EXISTS idx_camera_events_date ON public.camera_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_camera_events_camera_id ON public.camera_events(camera_id);

-- 14 günden eski logları sil (maliyet = 0)
CREATE OR REPLACE FUNCTION public.delete_old_camera_events()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM public.camera_events WHERE created_at < NOW() - INTERVAL '14 days';
END;
$$;


-- ── ADIM 3: camera_access_log TABLOSU ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.camera_access_log (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID,
    kullanici_adi VARCHAR(100),
    islem_tipi    VARCHAR(100),
    kamera_adi    VARCHAR(100),
    ip_adresi     VARCHAR(50),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.camera_access_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'camera_access_log' AND policyname = 'camera_access_log_select') THEN
        CREATE POLICY "camera_access_log_select" ON public.camera_access_log FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'camera_access_log' AND policyname = 'camera_access_log_insert') THEN
        CREATE POLICY "camera_access_log_insert" ON public.camera_access_log FOR INSERT WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_camera_access_log_date ON public.camera_access_log(created_at DESC);


-- ── ADIM 4: b0_api_spam_kalkani TABLOSU ──────────────────────────────
-- Telegram bildirim API'sinin spam kalkanı — bu olmadan bildirimler çalışmaz
CREATE TABLE IF NOT EXISTS public.b0_api_spam_kalkani (
    ip_adresi      TEXT PRIMARY KEY,
    spam_sayaci    INTEGER DEFAULT 1,
    son_vurus_saati TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.b0_api_spam_kalkani ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'b0_api_spam_kalkani' AND policyname = 'spam_select') THEN
        CREATE POLICY "spam_select" ON public.b0_api_spam_kalkani FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'b0_api_spam_kalkani' AND policyname = 'spam_insert') THEN
        CREATE POLICY "spam_insert" ON public.b0_api_spam_kalkani FOR INSERT TO anon WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'b0_api_spam_kalkani' AND policyname = 'spam_update') THEN
        CREATE POLICY "spam_update" ON public.b0_api_spam_kalkani FOR UPDATE TO anon USING (true);
    END IF;
END $$;


-- ── ADIM 5: KURULUMU DOĞRULA (Sonuçları Gör) ─────────────────────────
SELECT
    table_name,
    'VAR ✅' AS durum
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'cameras',
    'camera_events',
    'camera_access_log',
    'b0_api_spam_kalkani'
)
ORDER BY table_name;

-- ════════════════════════════════════════════════════════════════════
-- KURULUM TAMAM.
-- Beklenen çıktı: 4 satır — cameras, camera_events, camera_access_log, b0_api_spam_kalkani
-- ════════════════════════════════════════════════════════════════════
