-- ============================================================
-- 47 SİL BAŞTAN — Eksik Tablo Migration
-- Tarih: 2026-03-25
-- Tablolar: b1_arge_trendler, b1_sistem_uyarilari
-- Supabase Dashboard > SQL Editor'e yapıştırın
-- ============================================================

-- ─── 1. b1_arge_trendler ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b1_arge_trendler (
    id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    baslik                TEXT NOT NULL,
    platform              TEXT DEFAULT 'trendyol',
    kategori              TEXT DEFAULT 'diger',
    talep_skoru           INTEGER DEFAULT 7 CHECK (talep_skoru BETWEEN 1 AND 10),
    aciklama              TEXT,
    durum                 TEXT DEFAULT 'inceleniyor'
                          CHECK (durum IN ('inceleniyor', 'onaylandi', 'reddedildi', 'uretimde')),
    -- Zincirci bildirimleri (M1 → M2 geçişi)
    zincir_bildirim_m2    TIMESTAMPTZ,
    -- Hedef tablo (ajan orkestrator için)
    hedef_tablo           TEXT DEFAULT 'b1_arge_trendler',
    -- Audit
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_b1_arge_trendler_durum
    ON public.b1_arge_trendler (durum);
CREATE INDEX IF NOT EXISTS idx_b1_arge_trendler_created_at
    ON public.b1_arge_trendler (created_at DESC);

-- RLS
ALTER TABLE public.b1_arge_trendler ENABLE ROW LEVEL SECURITY;

-- Service role tam erişim (ajan çağrıları)
CREATE POLICY "service_role_all" ON public.b1_arge_trendler
    FOR ALL USING (auth.role() = 'service_role');

-- Authenticated kullanıcılar okuyabilir
CREATE POLICY "authenticated_select" ON public.b1_arge_trendler
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon'));

-- Authenticated kullanıcılar yazabilir
CREATE POLICY "authenticated_insert" ON public.b1_arge_trendler
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_update" ON public.b1_arge_trendler
    FOR UPDATE USING (auth.role() = 'authenticated');


-- ─── 2. b1_sistem_uyarilari ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b1_sistem_uyarilari (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uyari_tipi    TEXT NOT NULL DEFAULT 'diger'
                  CHECK (uyari_tipi IN ('dusuk_stok', 'maliyet_asimi', 'gecikme', 'diger')),
    seviye        TEXT NOT NULL DEFAULT 'bilgi'
                  CHECK (seviye IN ('bilgi', 'uyari', 'kritik')),
    oncelik       TEXT GENERATED ALWAYS AS (seviye) STORED,  -- health.js compat
    baslik        TEXT NOT NULL,
    mesaj         TEXT,
    kaynak_tablo  TEXT,
    kaynak_id     UUID,
    durum         TEXT DEFAULT 'aktif'
                  CHECK (durum IN ('aktif', 'okundu', 'kapatildi')),
    olusturma     TIMESTAMPTZ DEFAULT now(),  -- ajanlar-v2.js compat
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_b1_sistem_uyarilari_durum
    ON public.b1_sistem_uyarilari (durum);
CREATE INDEX IF NOT EXISTS idx_b1_sistem_uyarilari_seviye
    ON public.b1_sistem_uyarilari (seviye);
CREATE INDEX IF NOT EXISTS idx_b1_sistem_uyarilari_uyari_tipi
    ON public.b1_sistem_uyarilari (uyari_tipi, kaynak_id, durum, olusturma);
CREATE INDEX IF NOT EXISTS idx_b1_sistem_uyarilari_created_at
    ON public.b1_sistem_uyarilari (created_at DESC);

-- Realtime (dashboard anlık güncelleme için)
ALTER PUBLICATION supabase_realtime ADD TABLE public.b1_sistem_uyarilari;
ALTER PUBLICATION supabase_realtime ADD TABLE public.b1_arge_trendler;

-- RLS
ALTER TABLE public.b1_sistem_uyarilari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.b1_sistem_uyarilari
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "authenticated_select" ON public.b1_sistem_uyarilari
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon'));

CREATE POLICY "authenticated_insert" ON public.b1_sistem_uyarilari
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_update" ON public.b1_sistem_uyarilari
    FOR UPDATE USING (auth.role() = 'authenticated');


-- ─── 3. Updated_at otomatik trigger ─────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_b1_arge_trendler_updated_at ON public.b1_arge_trendler;
CREATE TRIGGER trg_b1_arge_trendler_updated_at
    BEFORE UPDATE ON public.b1_arge_trendler
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_b1_sistem_uyarilari_updated_at ON public.b1_sistem_uyarilari;
CREATE TRIGGER trg_b1_sistem_uyarilari_updated_at
    BEFORE UPDATE ON public.b1_sistem_uyarilari
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Doğrulama ───────────────────────────────────────────────
SELECT 'b1_arge_trendler' as tablo, COUNT(*) as satirlar FROM public.b1_arge_trendler
UNION ALL
SELECT 'b1_sistem_uyarilari', COUNT(*) FROM public.b1_sistem_uyarilari;
