-- ============================================================
-- NIZAM-IHS-2026-002 — Ek Tablo ve Sütunlar
-- Tarih: 13 Mart 2026
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- ============================================================

-- 1. Ana tabloya SHA-256 hash sütunu ekle
ALTER TABLE b1_ic_mesajlar
    ADD COLUMN IF NOT EXISTS mesaj_hash TEXT;

-- 2. KULLANICI GİZLEME TABLOSU
-- Mesajı DB'den SİLMEZ — yalnızca o kullanıcının görünümünden kaldırır.
-- Koordinatör/Yönetim Tam Arşiv'de kim gizledi + ne zaman görür.
CREATE TABLE IF NOT EXISTS b1_mesaj_gizli (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mesaj_id        UUID NOT NULL REFERENCES b1_ic_mesajlar(id),
    kullanici_id    UUID NOT NULL,
    kullanici_adi   TEXT NOT NULL,
    gizlendi_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Her kullanıcı bir mesajı yalnızca bir kez gizleyebilir
    UNIQUE (mesaj_id, kullanici_id)
);

-- İndeks
CREATE INDEX IF NOT EXISTS idx_mesaj_gizli_kullanici ON b1_mesaj_gizli(kullanici_id);
CREATE INDEX IF NOT EXISTS idx_mesaj_gizli_mesaj     ON b1_mesaj_gizli(mesaj_id);

-- RLS
ALTER TABLE b1_mesaj_gizli ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mesaj_gizli_okuma" ON b1_mesaj_gizli
    FOR SELECT USING (true);

CREATE POLICY "mesaj_gizli_yazma" ON b1_mesaj_gizli
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- KURAL ÖZETİ (Kod değil, belgeleme):
--
-- b1_ic_mesajlar → HİÇBİR ZAMAN fiziksel DELETE yapılmaz
-- b1_mesaj_gizli → Kullanıcı "sil" → bu tabloya kayıt eklenir
-- Kullanıcı görünümü: b1_mesaj_gizli'de ID'si yoksa göster
-- Koordinatör/Yönetim: b1_ic_mesajlar'dan direkt çeker (gizli dahil)
-- SHA-256 (mesaj_hash): Gönderimde tarayıcıda hesaplanır, saklanır
--   → İçerik + gönderen + zaman hash'lenir
--   → Hash uyuşmuyorsa içerik manipüle edilmiştir — kanıt
-- ============================================================
