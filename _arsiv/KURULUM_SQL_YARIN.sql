-- ============================================================
-- THE ORDER / NIZAM — TASARIM ALTYAPISI KURULUM SQL
-- Çalıştırılacak yer: https://supabase.com/dashboard/project/cauptlsnqieegdrgotob/sql/new
-- ============================================================

-- 1. TASARIM AYARLARI TABLOSU (Sayfa Tasarım Stüdyosu için)
CREATE TABLE IF NOT EXISTS public.b0_tasarim_ayarlari (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ayar_anahtari text UNIQUE NOT NULL,
  ana_renk text DEFAULT '#047857',
  ikincil_renk text DEFAULT '#0f172a',
  arkaplan_renk text DEFAULT '#f8fafc',
  kutu_arka_plan text DEFAULT '#ffffff',
  yazi_tipi text DEFAULT 'Inter, sans-serif',
  kose_radius text DEFAULT '12px',
  golge_stili text DEFAULT 'yumusak',
  guncelleyen text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS kapat (uygulama kendi auth kullanıyor)
ALTER TABLE public.b0_tasarim_ayarlari DISABLE ROW LEVEL SECURITY;

-- Varsayılan global tema kaydı
INSERT INTO public.b0_tasarim_ayarlari 
  (ayar_anahtari, ana_renk, ikincil_renk, arkaplan_renk, kutu_arka_plan, yazi_tipi, kose_radius, golge_stili, guncelleyen)
VALUES 
  ('global_tema', '#047857', '#0f172a', '#f8fafc', '#ffffff', 'Inter, sans-serif', '12px', 'yumusak', 'sistem')
ON CONFLICT (ayar_anahtari) DO NOTHING;

-- ============================================================
-- NASIL ÇALIŞTIRILIR:
-- 1. https://supabase.com adresine giriş yap
-- 2. Sol menü → SQL Editor → New Query
-- 3. Bu dosyanın içeriğini yapıştır
-- 4. "Run" butonuna tıkla
-- 5. "Success" mesajı görünce tamam!
-- ============================================================
