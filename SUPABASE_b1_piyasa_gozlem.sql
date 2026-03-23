-- ============================================================
-- THE ORDER NIZAM: GELİŞMİŞ GÖZLEM TABLOSU
-- 15 Kullanıcı Kriteri + 10 AI Tahmin Destek Alanı
-- Tablo: b1_piyasa_gozlem
-- ============================================================

-- Önce varsa eski tabloyu sil (güvenli kaldırma)
-- DROP TABLE IF EXISTS public.b1_piyasa_gozlem;

CREATE TABLE IF NOT EXISTS public.b1_piyasa_gozlem (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- ======================================================
    -- BÖLÜM A: 15 KULLANICI KRİTERİ (El Yazısı Notlardan)
    -- ======================================================

    -- 1. Marka ismi
    marka_ismi TEXT,

    -- 2. Ürün ismi
    urun_ismi TEXT,

    -- 3. Ürün orijinal fiyatı
    orijinal_fiyat NUMERIC,

    -- 4. Ürün indirimli fiyatı
    indirimli_fiyat NUMERIC,

    -- 5. Ürün Puanı (4.5 gibi)
    urun_puani NUMERIC,

    -- 6. Ürün yorumları (yorum sayısı - integer)
    yorum_sayisi INTEGER DEFAULT 0,

    -- 7. Ürün özellikleri: kumaş, renk, beden vs. (JSONB - esnek)
    urun_ozellikleri JSONB,

    -- 8. Ürün yorum özeti (AI tarafından doldurulacak özet)
    urun_yorum_ozeti TEXT,

    -- 9. Ürün sepete ekleme (gözlemlenen rakam - TEXT çünkü "1.2K" gibi gelebilir)
    sepete_ekleme TEXT,

    -- 10. Ürün görüntüleme
    goruntuleme TEXT,

    -- 11. Ürün favorisi
    urun_favorisi TEXT,

    -- 12. Ürün linki (tekrar işlemeyi engellemek için UNIQUE)
    urun_linki TEXT UNIQUE NOT NULL,

    -- 13. Ürün fotoğrafı (URL referansı - dosya kopyalanmaz)
    urun_fotografi_url TEXT,

    -- 14. Ürün yorum tarihi (en son yorum tarihi)
    son_yorum_tarihi TEXT,

    -- 15. Ürün değerlendirme (toplam değerlendirme sayısı - integer)
    degerlendirme_sayisi INTEGER DEFAULT 0,

    -- ======================================================
    -- BÖLÜM B: EKSTRA AI TAHMİN DESTEK ALANLARI
    -- Bu alanlar 2. Ekip (Yargıç) tarafından kullanılacak
    -- ======================================================

    -- B1. İndirim oranı (%) - Hesaplanan alan, fiyat düşüşü trend sinyali
    -- OrijinalFiyat yüksekse ve indirim fazlaysa ürün "çekici" kabul edilir
    indirim_orani NUMERIC GENERATED ALWAYS AS (
        CASE
            WHEN orijinal_fiyat > 0 AND indirimli_fiyat > 0
            THEN ROUND(((orijinal_fiyat - indirimli_fiyat) / orijinal_fiyat) * 100, 1)
            ELSE 0
        END
    ) STORED,

    -- B2. Stok durumu (Satışta mı? Tükendi mi?) - Talep sinyali
    stok_durumu TEXT DEFAULT 'Belirsiz',

    -- B3. Ürün kategorisi (Erkek Giyim / Kadın Giyim / Aksesuar vs.)
    kategori TEXT,

    -- B4. Hedef cinsiyet (Erkek / Kadın / Unisex) - Segmentasyon için kritik
    hedef_cinsiyet TEXT,

    -- B5. Sezon tahmini (İlkbahar/Yaz/Sonbahar/Kış) - Moda tahmin döngüsü
    tahmini_sezon TEXT,

    -- B6. Arama kriteri (Bu ürünü hangi kelimeyle bulduk?)
    -- Hangi arama terimi hangi ürünü buldu? AI için anahtar sinyal.
    arama_kriteri TEXT,

    -- B7. Platform (Trendyol, Zara, Amazon - geleceğe hazır)
    hedef_platform TEXT DEFAULT 'Trendyol',

    -- B8. Önceki fiyat gözlemi (fiyat değişikliği takibi için)
    -- Bir sonraki gözlemde bu değişmişse fiyat DÜŞTÜ veya YUKARI sinyali verilir
    onceki_fiyat NUMERIC,
    fiyat_degisim_yonu TEXT, -- 'YUKARI', 'ASAGI', 'SABIT', 'YENİ'

    -- B9. AI Tahmin Skoru (2. Ekip / Yargıç tarafından doldurulacak)
    -- 0-100 arası: Bu ürünün sipariş potansiyeli
    ai_trend_skoru INTEGER,
    ai_analiz_notu TEXT,    -- Yargıç'ın yorumu

    -- ======================================================
    -- BÖLÜM C: SİSTEM TAKİP ALANLARI (Log & Zaman)
    -- Not: Her gözlemin yanına tarih ve gün not edilecek
    -- ======================================================

    gozlem_tarihi DATE DEFAULT CURRENT_DATE,
    gozlem_gunu TEXT,           -- 'Pazartesi', 'Salı' vs.
    gozlem_zamani TIMESTAMPTZ DEFAULT NOW(),

    toplayan_ajan TEXT DEFAULT 'Ajan-1-Gozlemci',
    islenmis BOOLEAN DEFAULT FALSE,     -- Yargıç analiz etti mi?
    son_guncelleme TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================
-- GÜVENLİK: RLS (Row Level Security)
-- ======================================================
ALTER TABLE public.b1_piyasa_gozlem ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes Okuyabilir" ON public.b1_piyasa_gozlem
    FOR SELECT USING (true);

CREATE POLICY "Ajan Yazabilir" ON public.b1_piyasa_gozlem
    FOR ALL USING (true) WITH CHECK (true);

-- ======================================================
-- OTOMATİK TIMESTAMP TETİKLEYİCİ
-- ======================================================
CREATE OR REPLACE FUNCTION gozlem_timestamp_guncelle()
RETURNS TRIGGER AS $$
BEGIN
   NEW.son_guncelleme = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER gozlem_modtime
BEFORE UPDATE ON public.b1_piyasa_gozlem
FOR EACH ROW EXECUTE PROCEDURE gozlem_timestamp_guncelle();

-- ======================================================
-- PERFORMANS: İNDEKSLER
-- Sık sorgulanacak alanlara index ekle
-- ======================================================
CREATE INDEX IF NOT EXISTS idx_gozlem_platform    ON public.b1_piyasa_gozlem(hedef_platform);
CREATE INDEX IF NOT EXISTS idx_gozlem_marka       ON public.b1_piyasa_gozlem(marka_ismi);
CREATE INDEX IF NOT EXISTS idx_gozlem_kategori    ON public.b1_piyasa_gozlem(kategori);
CREATE INDEX IF NOT EXISTS idx_gozlem_islenmis    ON public.b1_piyasa_gozlem(islenmis);
CREATE INDEX IF NOT EXISTS idx_gozlem_tarih       ON public.b1_piyasa_gozlem(gozlem_tarihi);
CREATE INDEX IF NOT EXISTS idx_gozlem_ai_skor     ON public.b1_piyasa_gozlem(ai_trend_skoru);

COMMENT ON TABLE public.b1_piyasa_gozlem IS 
'THE ORDER NIZAM Piyasa Gözlem Tablosu: 15 Kriter + 10 AI Tahmin Alanı. 
Kamuya açık ürün bilgilerinin günlük etik gözlem kaydı.
AI tahmin skoru ve analizi Ajan-2 (Yargıç) tarafından doldurulur.';
