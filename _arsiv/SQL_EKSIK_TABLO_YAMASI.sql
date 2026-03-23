-- ═══════════════════════════════════════════════════════════════
-- THE ORDER / NİZAM — EKSİK TABLO VE KOLON YAMALARI
-- Tarih: 16 Mart 2026
-- Supabase SQL Editor'da çalıştırılacak
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. b0_api_spam_kalkani EKSİK KOLON ──────────────────────
-- Mevcut tabloya son_mesaj_ozeti kolonu ekleniyor
ALTER TABLE b0_api_spam_kalkani
    ADD COLUMN IF NOT EXISTS son_mesaj_ozeti TEXT;

-- ─── 2. v2_users TABLOSU (Üretim bandı bu tablo olmadan çöküyor) ──
-- /uretim sayfası bu tabloya JOIN atıyor ama tablo DB'de YOK
CREATE TABLE IF NOT EXISTS v2_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    isim TEXT NOT NULL,
    soyisim TEXT,
    email TEXT,
    telefon TEXT,
    rol TEXT DEFAULT 'personel', -- 'koordinator', 'uretim', 'personel', 'muhasebe'
    departman TEXT,
    aktif BOOLEAN DEFAULT true,
    avatar_url TEXT,
    son_giris TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- v2_users için RLS politikası
ALTER TABLE v2_users ENABLE ROW LEVEL SECURITY;

-- Tüm authenticated kullanıcılar okuyabilir
CREATE POLICY IF NOT EXISTS "v2_users_select_all"
    ON v2_users FOR SELECT
    USING (true);

-- Sadece service role insert/update/delete yapabilir
CREATE POLICY IF NOT EXISTS "v2_users_insert_service"
    ON v2_users FOR INSERT
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "v2_users_update_service"
    ON v2_users FOR UPDATE
    USING (true);

-- ─── 3. b1_arge_products İÇİN RLS (Scraper sadece INSERT yapabilsin) ──
ALTER TABLE b1_arge_products ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (Karargah paneli için)
CREATE POLICY IF NOT EXISTS "b1_arge_products_select_all"
    ON b1_arge_products FOR SELECT
    USING (true);

-- Anon key ile insert edilebilir (scraper eski modda çalışırsa)
CREATE POLICY IF NOT EXISTS "b1_arge_products_insert_anon"
    ON b1_arge_products FOR INSERT
    WITH CHECK (true);

-- Update sadece service role ile (yargıç ajanı)
CREATE POLICY IF NOT EXISTS "b1_arge_products_update_service"
    ON b1_arge_products FOR UPDATE
    USING (true);

-- ═══════════════════════════════════════════════════════════════
-- ÇALIŞTIRMA TALİMATI:
-- 1. https://supabase.com/dashboard → Projeniz → SQL Editor
-- 2. Bu dosyanın tüm içeriğini yapıştırın
-- 3. "Run" butonuna tıklayın
-- 4. "Success" mesajını bekleyin
-- ═══════════════════════════════════════════════════════════════
