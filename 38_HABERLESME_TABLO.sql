-- ═══════════════════════════════════════════════════════
-- b1_askeri_haberlesme TABLOSU (AES-256-GCM Şifreli Mesajlaşma)
-- Migration: 38_HABERLESME_TABLO.sql
-- Tarih: 20 Mart 2026
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS b1_askeri_haberlesme (
    id              uuid            DEFAULT gen_random_uuid() PRIMARY KEY,
    gonderen_rutbe  text            NOT NULL,
    hedef_oda       text            NOT NULL,
    sifreli_mesaj   text            NOT NULL,
    iv_vektoru      text            NOT NULL,
    auth_tag        text            NOT NULL,
    okundu_mu       boolean         DEFAULT false,
    created_at      timestamptz     DEFAULT now()
);

-- İndeks: Hızlı oda bazlı sorgu
CREATE INDEX IF NOT EXISTS idx_haberlesme_hedef_oda
    ON b1_askeri_haberlesme(hedef_oda);

CREATE INDEX IF NOT EXISTS idx_haberlesme_gonderen
    ON b1_askeri_haberlesme(gonderen_rutbe);

CREATE INDEX IF NOT EXISTS idx_haberlesme_created
    ON b1_askeri_haberlesme(created_at DESC);

-- RLS: Aktif et
ALTER TABLE b1_askeri_haberlesme ENABLE ROW LEVEL SECURITY;

-- Politika: Sadece service_role erişsin (API üzerinden)
CREATE POLICY "service_role_haberlesme" ON b1_askeri_haberlesme
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 7 günden eski mesajları otomatik sil (opsiyonel)
-- Bu kısmı Supabase Edge Function veya cron ile çalıştırabilirsin:
-- DELETE FROM b1_askeri_haberlesme WHERE created_at < now() - interval '7 days';
