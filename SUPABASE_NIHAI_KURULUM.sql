-- ============================================================
-- THE ORDER NIZAM — TAM VE TEMİZ KURULUM
-- Bu kodu Supabase SQL Editor'e yapistir ve calistir
-- Eski tablolari siler, dogru tabloyu olusturur.
-- ============================================================

-- ESKİ TABLOLARI SİL (Varmış olabilir)
DROP TABLE IF EXISTS public.b1_trendyol_istihbarat_detayli CASCADE;
DROP TABLE IF EXISTS public.b1_piyasa_gozlem CASCADE;

-- YENİ TABLOYU OLUŞTUR
CREATE TABLE public.b1_piyasa_gozlem (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- ── 15 KRİTER (El Yazısı Notlardan) ─────────────────────
    marka_ismi           TEXT,
    urun_ismi            TEXT,
    orijinal_fiyat       NUMERIC,
    indirimli_fiyat      NUMERIC,
    urun_puani           NUMERIC,
    yorum_sayisi         INTEGER  DEFAULT 0,
    urun_ozellikleri     JSONB,
    urun_yorum_ozeti     TEXT,
    sepete_ekleme        TEXT,
    goruntuleme          TEXT,
    urun_favorisi        TEXT,
    urun_linki           TEXT     NOT NULL,   -- UNIQUE deil: her gun yeni satir
    urun_fotografi_url   TEXT,
    son_yorum_tarihi     TEXT,
    degerlendirme_sayisi INTEGER  DEFAULT 0,

    -- ── AI TAHMİN ALANLARI ────────────────────────────────────
    -- Otomatik hesaplanan indirim orani (%)
    indirim_orani        NUMERIC GENERATED ALWAYS AS (
        CASE
            WHEN orijinal_fiyat > 0 AND indirimli_fiyat > 0
            THEN ROUND(((orijinal_fiyat - indirimli_fiyat) / orijinal_fiyat) * 100, 1)
            ELSE 0
        END
    ) STORED,

    stok_durumu          TEXT     DEFAULT 'Belirsiz',
    kategori             TEXT,
    hedef_cinsiyet       TEXT,
    tahmini_sezon        TEXT,
    arama_kriteri        TEXT,
    hedef_platform       TEXT     DEFAULT 'Trendyol',

    -- Fiyat degisim takibi
    onceki_fiyat         NUMERIC,
    fiyat_degisim_yonu   TEXT,    -- 'YENİ' | 'YUKARI' | 'ASAGI' | 'SABİT'

    -- Gunluk delta (trend hizi sinyali)
    yorum_delta          INTEGER  DEFAULT 0,  -- Bugunki - dunkü yorum
    favori_delta         INTEGER  DEFAULT 0,  -- Bugunki - dunkü favori

    -- Yargic (AI-2) analizi
    ai_trend_skoru       INTEGER,
    ai_analiz_notu       TEXT,

    -- ── SİSTEM ───────────────────────────────────────────────
    gozlem_tarihi        DATE     DEFAULT CURRENT_DATE,
    gozlem_gunu          TEXT,
    gozlem_zamani        TIMESTAMPTZ DEFAULT NOW(),
    toplayan_ajan        TEXT     DEFAULT 'Ajan-1-Gozlemci',
    islenmis             BOOLEAN  DEFAULT FALSE,
    son_guncelleme       TIMESTAMPTZ DEFAULT NOW()
);

-- ── GÜNDELİK UNIQUE: Aynı URL günde 1 kayıt ─────────────────
CREATE UNIQUE INDEX idx_gozlem_url_gun
    ON public.b1_piyasa_gozlem(urun_linki, gozlem_tarihi);

-- ── PERFORMANS İNDEKSLERİ ────────────────────────────────────
CREATE INDEX idx_gozlem_platform ON public.b1_piyasa_gozlem(hedef_platform);
CREATE INDEX idx_gozlem_marka    ON public.b1_piyasa_gozlem(marka_ismi);
CREATE INDEX idx_gozlem_islenmis ON public.b1_piyasa_gozlem(islenmis);
CREATE INDEX idx_gozlem_ai       ON public.b1_piyasa_gozlem(ai_trend_skoru);
CREATE INDEX idx_gozlem_tarih    ON public.b1_piyasa_gozlem(gozlem_tarihi);

-- ── RLS GÜVENLİK ────────────────────────────────────────────
ALTER TABLE public.b1_piyasa_gozlem ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes Okur"    ON public.b1_piyasa_gozlem FOR SELECT USING (true);
CREATE POLICY "Ajan Yazar"     ON public.b1_piyasa_gozlem FOR ALL    USING (true) WITH CHECK (true);

-- ── OTOMATİK TIMESTAMP ───────────────────────────────────────
CREATE OR REPLACE FUNCTION gozlem_timestamp_guncelle()
RETURNS TRIGGER AS $$
BEGIN
    NEW.son_guncelleme = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gozlem_modtime
    BEFORE UPDATE ON public.b1_piyasa_gozlem
    FOR EACH ROW EXECUTE PROCEDURE gozlem_timestamp_guncelle();

COMMENT ON TABLE public.b1_piyasa_gozlem IS
'THE ORDER NIZAM — Gunluk Piyasa Gozlem Tablosu.
15 Kriter + AI Tahmin + Delta Takip.
Her urun icin her gun 1 satir oluşur.
Yargic (AI-2) ai_trend_skoru ve ai_analiz_notu alanlarina yazar.';
