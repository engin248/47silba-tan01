-- ═══════════════════════════════════════════════════════
-- THE ORDER NIZAM — FAZ 2 SQL KOMUTLARI
-- Tarih: 08.03.2026
-- Hazırlayan: Antigravity AI
-- ═══════════════════════════════════════════════════════
-- Supabase Dashboard → SQL Editor'a gidip bu dosyayı çalıştırın.
-- URL: https://supabase.com/dashboard → Projeniz → SQL Editor
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────
-- ADIM 1: aktif KOLONU KONTROLÜ
-- b1_kumas_arsivi tablosunda 'aktif' kolonu var mı?
-- ─────────────────────────────────────────────────────
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'b1_kumas_arsivi' AND column_name = 'aktif';
-- Sonuç BOŞSA: Kolonu tabloya eklemeye gerek yok (kodda zaten düzeltildi)
-- Sonuç DOLUYSA: Aşağıdaki komutu çalıştır:
-- ALTER TABLE b1_kumas_arsivi ALTER COLUMN aktif SET DEFAULT true;


-- ─────────────────────────────────────────────────────
-- ADIM 2: UNIQUE CONSTRAINT — Race Condition Kapama
-- ─────────────────────────────────────────────────────
-- b1_gorevler: aynı başlık + durum çiftini engelle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uniq_gorev_baslik_durum'
  ) THEN
    ALTER TABLE b1_gorevler 
    ADD CONSTRAINT uniq_gorev_baslik_durum UNIQUE (baslik, durum);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────
-- ADIM 3: PERFORMANS İNDEKSLERİ
-- Sık sorgulanan alanların hızlandırılması
-- ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_kumas_kodu 
  ON b1_kumas_arsivi(kumas_kodu);

CREATE INDEX IF NOT EXISTS idx_production_status 
  ON production_orders(status);

CREATE INDEX IF NOT EXISTS idx_gorevler_durum 
  ON b1_gorevler(durum);

CREATE INDEX IF NOT EXISTS idx_personel_durum 
  ON b1_personel(durum);

CREATE INDEX IF NOT EXISTS idx_siparisler_durum 
  ON b2_siparisler(durum);


-- ─────────────────────────────────────────────────────
-- ADIM 4: RLS KONTROL — Tüm tablolarda aktif mi?
-- ─────────────────────────────────────────────────────
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
-- rowsecurity = true → RLS aktif ✅
-- rowsecurity = false → RLS kapalı ⚠️ (kritik tablolarda açılmalı)


-- ─────────────────────────────────────────────────────
-- ADIM 5: TABLO LİSTESİ KONTROLÜ
-- Sistemdeki tüm tabloların varlığını doğrula
-- ─────────────────────────────────────────────────────
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
