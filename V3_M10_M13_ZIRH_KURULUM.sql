-- =========================================================================
-- THE ORDER / NİZAM ERP - V3 SİBER ZIRH VE MİMARİ YAMALAR
-- TARİH: 14 Mart 2026
-- HEDEF: M10 (Varyantlı Stok) ve M13 (Bordro-Avans Finans Köprüsü)
-- =========================================================================

-- 1. ADIM: M7 KASA İLE M13 PERSONEL BORDRO KÖPRÜSÜ
-- Kasadan çıkan avansların otonom olarak personelin hakedişinden düşmesi için
-- b2_kasa_hareketleri tablosuna "personel_id" sütunu (yabancı anahtar) eklenmesi.
ALTER TABLE public.b2_kasa_hareketleri 
ADD COLUMN IF NOT EXISTS personel_id UUID REFERENCES public.b1_personel(id) ON DELETE SET NULL;

-- 2. ADIM: M10 KATALOG İÇİN VARYANT (SKU/BEDEN/RENK) STOK DEPOSU
-- Ana stok yerine, beden ve renk bazında ayrıntılı stok tutulmasını, 
-- e-ticaret siteleri ile (Pazaryerleri) %100 uyumlu stok akışını sağlayan derin zırh matrisi.
CREATE TABLE IF NOT EXISTS public.b2_urun_varyant_stok (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    urun_id UUID NOT NULL REFERENCES public.b2_urun_katalogu(id) ON DELETE CASCADE,
    beden VARCHAR(50),  -- Örn: S, M, L, XL, EU42
    renk VARCHAR(50),   -- Örn: Siyah, Beyaz, Mavi
    stok_adeti INTEGER DEFAULT 0,
    barkod VARCHAR(100) UNIQUE, -- E-ticaret / Mağaza pos barkodu
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mükerrer varyant açılmasını önleyen Güvenlik Zırhı
-- Bir ürünün sadece 1 tane "Siyah - S" bedeni olabilir.
ALTER TABLE public.b2_urun_varyant_stok 
DROP CONSTRAINT IF EXISTS uk_urun_varyant;

ALTER TABLE public.b2_urun_varyant_stok 
ADD CONSTRAINT uk_urun_varyant UNIQUE (urun_id, beden, renk);

-- 3. ADIM: TETİKLEYİCİ(TRIGGER) İLE ANA STOK OTONOM GÜNCELLEMESİ (OPSİYONEL AMA MUAZZAM)
-- Varyant stoğu değiştiğinde, b2_urun_katalogu 'ndaki toplam "stok_adeti" nin 
-- otonom olarak (insansız) güncellenmesi için veri kancası.
CREATE OR REPLACE FUNCTION update_ana_stok()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.b2_urun_katalogu
    SET stok_adeti = (
        SELECT COALESCE(SUM(stok_adeti), 0)
        FROM public.b2_urun_varyant_stok
        WHERE urun_id = COALESCE(NEW.urun_id, OLD.urun_id)
    )
    WHERE id = COALESCE(NEW.urun_id, OLD.urun_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_varyant_stok_degisti ON public.b2_urun_varyant_stok;
CREATE TRIGGER trg_varyant_stok_degisti
AFTER INSERT OR UPDATE OR DELETE ON public.b2_urun_varyant_stok
FOR EACH ROW EXECUTE FUNCTION update_ana_stok();

-- =========================================================================
-- BİLGİ: BU KOMUTLARI SUPABASE SQL EDITOR EKRANINDA "RUN" DİYEREK ÇALIŞTIRINIZ.
-- =========================================================================
