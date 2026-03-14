-- =========================================================================
-- THE ORDER / NİZAM ERP - V5 SİPARİŞ (M9) FİNANS ZIRHI
-- TARİH: 14 Mart 2026
-- HEDEF: M9 Sipariş ile M7 Kasa Entegrasyonu (Ödeme Yöntemi Eklemesi)
-- =========================================================================

-- Siparişlerin hangi karga veya ödeme aracı ile yapıldığını M7'ye aktarmak için:
ALTER TABLE public.b2_siparisler 
ADD COLUMN IF NOT EXISTS odeme_yontemi TEXT DEFAULT 'nakit';

-- Müşteri cari bakiyesinin hesaplanabilmesi için eğer yoksa bakiye (borç/alacak) ekleniyor:
ALTER TABLE public.b2_musteriler
ADD COLUMN IF NOT EXISTS bakiye NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS kara_liste BOOLEAN DEFAULT false;

-- =========================================================================
-- BİLGİ: BU KOMUTLARI SUPABASE SQL EDITOR EKRANINDA "RUN" DİYEREK ÇALIŞTIRINIZ.
-- =========================================================================
