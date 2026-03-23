-- =========================================================================================
-- THE ORDER NIZAM: TRENDYOL DETAYLI İSTİHBARAT TABLOSU (15 MADDE)
-- Kullanıcının el yazısı notlarındaki 15 kritere göre hazırlanmış veri şeması.
-- =========================================================================================

CREATE TABLE IF NOT EXISTS public.b1_trendyol_istihbarat_detayli (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 1. Marka ismi
    marka_ismi TEXT,
    
    -- 2. Ürün ismi
    urun_ismi TEXT,
    
    -- 3. Ürün orijinal fiyatı
    orijinal_fiyat NUMERIC,
    
    -- 4. Ürün indirimli fiyatı
    indirimli_fiyat NUMERIC,
    
    -- 5. Ürün Puanı (Örn: 4.5)
    urun_puani NUMERIC,
    
    -- 6. Ürün yorumları (Yorum adedi veya yorum içeriklerini temsil edebilir)
    urun_yorumlari TEXT,
    
    -- 7. Ürün özellikleri: kumaş, renk, v.s. (Esnek olması için JSONB)
    urun_ozellikleri JSONB,
    
    -- 8. Ürün yorum özeti
    urun_yorum_ozeti TEXT,
    
    -- 9. Ürün sepete ekleme (Sepete eklenme sayısı veya durumu)
    sepete_ekleme TEXT,
    
    -- 10. Ürün görüntüleme (Görüntüleme sayısı)
    goruntuleme TEXT,
    
    -- 11. Ürün favorisi (Favoriye alınma sayısı)
    urun_favorisi TEXT,
    
    -- 12. Ürün linki (Spam ve mükerrer kaydı önlemek için UNIQUE)
    urun_linki TEXT UNIQUE NOT NULL,
    
    -- 13. Ürün fotoğrafı (URL'si)
    urun_fotografi TEXT,
    
    -- 14. Ürün yorum tarihi
    urun_yorum_tarihi TEXT,
    
    -- 15. Ürün değerlendirme (Değerlendirme sayısı/skoru)
    urun_degerlendirme TEXT,
    
    -- Not: Her çekilen verilerin yanına hangi tarih ve gün çekildiği ile not edilecek.
    cekilen_tarih DATE DEFAULT CURRENT_DATE,
    cekilen_gun TEXT,             -- Hangi gün çekildiği ('Pazartesi', 'Cuma' vs.)
    cekildigi_zaman TIMESTAMPTZ DEFAULT NOW(), -- Tam tarih ve saati (Log takibi)
    
    -- Sistem Ek Verileri
    toplayan_ajan TEXT DEFAULT 'Ajan-1-Scout',
    hedef_platform TEXT DEFAULT 'Trendyol',
    islenmis BOOLEAN DEFAULT FALSE,  -- AI Analiz edildi mi?
    guncellenme_tarihi TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Etkinleştirme
ALTER TABLE public.b1_trendyol_istihbarat_detayli ENABLE ROW LEVEL SECURITY;

-- Politikalar (Herhangi biri ekleyebilir, okuyabilir)
CREATE POLICY "Tum Okuma Yetkileri" ON public.b1_trendyol_istihbarat_detayli
    FOR SELECT USING (true);
    
CREATE POLICY "Ekleme ve Guncelleme Yetkisi" ON public.b1_trendyol_istihbarat_detayli
    FOR ALL USING (true) WITH CHECK (true);

-- Otomatik Timestamp Fonksiyonu (Eğer Güncellenirse)
CREATE OR REPLACE FUNCTION update_trendyol_istihbarat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.guncellenme_tarihi = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_trendyol_istihbarat_modtime
BEFORE UPDATE ON public.b1_trendyol_istihbarat_detayli
FOR EACH ROW EXECUTE PROCEDURE update_trendyol_istihbarat_timestamp();

-- Yorumlar
COMMENT ON TABLE public.b1_trendyol_istihbarat_detayli IS 'Trendyoldan çekilen detaylı spesifik ürün verileri.';
