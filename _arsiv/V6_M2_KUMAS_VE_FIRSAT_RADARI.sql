-- b2_malzeme_katalogu TABLOSU (M2: KUMAŞ, AKSESUAR VE ÖLÜ STOK FIRSATLARI)

CREATE TABLE IF NOT EXISTS public.b2_malzeme_katalogu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kategori TEXT NOT NULL, -- kumas, aksesuar, tas, baski, ozel
    alt_kategori TEXT,
    ad TEXT NOT NULL,
    kod TEXT UNIQUE,
    
    -- Görsel & Medya
    fotograf_urls TEXT[], 
    video_url TEXT,
    
    -- Özellikler
    icerik_yuzdesi JSONB, -- {"pamuk": 80, "polyester": 20}
    renk TEXT,
    renk_kodu TEXT,
    renk_varyantlari JSONB,
    
    -- Kaynak & Finans & Tedarik
    tedarikci TEXT,
    fiyat NUMERIC NOT NULL DEFAULT 0,
    stok_miktar NUMERIC NOT NULL DEFAULT 0,
    stok_birimi TEXT, -- metre, kg, adet
    
    -- Mimari Entegrasyon
    kullanildigi_urunler TEXT[],
    etiketler TEXT[],
    
    -- ÖLÜ STOK / FIRSAT KUMAŞ ZIRHI (AI DESTEKLİ)
    is_firsat BOOLEAN DEFAULT false,
    kondisyon_notu TEXT,    -- Örn: "2 yıldır depoda, sorunsuz şifon"
    ai_trend_eslesme JSONB, -- AI Çıktısı: {"model_tavsiyesi": "Tek Omuz Abiye", "beklenen_marj_yuzdesi": 85}
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Satır Bazlı Güvenlik) Katmanı
ALTER TABLE public.b2_malzeme_katalogu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tum_Kullanicilar_Gorebilir" 
ON public.b2_malzeme_katalogu FOR SELECT 
USING (true);

CREATE POLICY "Yetkililer_Ekleme_Yapabilir" 
ON public.b2_malzeme_katalogu FOR INSERT 
WITH CHECK (true); -- İleride (auth.uid() IN (admin listesi)) eklenebilir

CREATE POLICY "Yetkililer_Guncelleyebilir" 
ON public.b2_malzeme_katalogu FOR UPDATE 
USING (true);

-- Zaman Mührü Otomasyonu (Update için)
CREATE OR REPLACE FUNCTION update_b2_malzeme_modtime()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS tr_b2_malzeme_modtime ON public.b2_malzeme_katalogu;

CREATE TRIGGER tr_b2_malzeme_modtime
BEFORE UPDATE ON public.b2_malzeme_katalogu
FOR EACH ROW EXECUTE PROCEDURE update_b2_malzeme_modtime();

-- M1 Trend Motoru için Index (Hızlı arama Zırhı)
CREATE INDEX IF NOT EXISTS idx_b2_malzeme_etiketler ON public.b2_malzeme_katalogu USING GIN (etiketler);
CREATE INDEX IF NOT EXISTS idx_b2_malzeme_firsatlar ON public.b2_malzeme_katalogu (kategori) WHERE is_firsat = true;
