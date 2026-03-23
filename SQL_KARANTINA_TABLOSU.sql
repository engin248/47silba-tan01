-- =========================================================================
-- THE ORDER - KARANTİNA HAVUZU (Scraper Veri Ön Onay Tablosu)
-- =========================================================================

-- 1. Karantina Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS public.b1_arge_products_karantina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    veri_kaynagi TEXT NOT NULL, -- Örn: TRENDYOL_KADIN
    hedef_ajans TEXT DEFAULT 'bot_oluisci',
    
    -- Kullanıcının İstediği 15 Madde:
    marka_ismi TEXT,
    urun_ismi TEXT,
    orjinal_fiyat NUMERIC,
    indirimli_fiyat NUMERIC,
    urun_puani NUMERIC,
    urun_degerlendirme_sayisi INTEGER, -- Örn: 15. Madde
    urun_yorum_ozeti TEXT, -- Yorumların genel metni veya AI özeti
    urun_ozellikleri JSONB, -- Kumaş, renk vb. teknik spektler (JSON objesi)
    sepete_ekleme_notu TEXT, -- Örn: "100+ kişi sepete ekledi"
    siparis_begenisi_notu TEXT, -- Görüntüleme, e.g. "Son 1 haftada 50 kişi baktı"
    favori_sayisi INTEGER,
    urun_linki TEXT UNIQUE, -- Aynı linkteki ürün tekrar çekilmesin
    urun_fotografi TEXT,
    
    -- Operasyonel Notlar:
    cekildigi_tarih TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    cekildigi_gun TEXT, -- Not: Hangi tarihte gün çekildi not edilecek
    
    -- Karantina Durum Kontrolü
    karantina_durumu TEXT DEFAULT 'bekliyor', -- bekliyor, onaylandi, reddedildi
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Sorgu Hızlandırma İndeksleri
CREATE INDEX IF NOT EXISTS idx_karantina_durum ON public.b1_arge_products_karantina(karantina_durumu);
CREATE INDEX IF NOT EXISTS idx_karantina_kaynak ON public.b1_arge_products_karantina(veri_kaynagi);

-- 3. RLS İzinleri
ALTER TABLE public.b1_arge_products_karantina ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Servis rolleri serbest" ON public.b1_arge_products_karantina FOR ALL USING (true);
CREATE POLICY "Anonim kullanıcılar okuyabilir" ON public.b1_arge_products_karantina FOR SELECT USING (true);
