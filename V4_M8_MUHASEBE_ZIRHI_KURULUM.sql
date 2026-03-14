-- =========================================================================
-- THE ORDER / NİZAM ERP - V4 MUHASEBE VE MALİYET KÖK YAMASI
-- TARİH: 14 Mart 2026
-- HEDEF: M8 Muhasebe Modülü "Stratejik Dolaylı Gider" ve "Zeyilname" Zırhı
-- =========================================================================

-- 1. ADIM: M8 MUHASEBE RAPORU TABLOSU ESNEKLİĞİ
-- M8 Modülü analizinde bahsedilen "Zeyilname (Ek Fatura)" kurgusunu, 
-- kilitlenmiş devredilmiş raporlara sonradan yansıtılabilmesi için alanlar açıyoruz.
ALTER TABLE public.b1_muhasebe_raporlari 
ADD COLUMN IF NOT EXISTS notlar TEXT,
ADD COLUMN IF NOT EXISTS ek_maliyet_tl NUMERIC(12,2) DEFAULT 0;

-- 2. ADIM: AÇIKLAMALAR
COMMENT ON COLUMN public.b1_muhasebe_raporlari.ek_maliyet_tl IS 'Kilitli raporlara sonradan gelen fason farkları veya kargo masrafları için açılmış zeyilname zırhıdır.';
COMMENT ON COLUMN public.b1_muhasebe_raporlari.notlar IS 'Fatura itirazları, zeyilname detayları veya zayiat nedenlerini barındırır.';

-- =========================================================================
-- BİLGİ: BU KOMUTLARI SUPABASE SQL EDITOR EKRANINDA "RUN" DİYEREK ÇALIŞTIRINIZ.
-- =========================================================================
