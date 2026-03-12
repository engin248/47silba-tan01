-- 21_M1_HERMES_V2_NORMALIZE_DB.sql
-- Baş Denetmen Kurallarına Göre Normalize Edilmiş (Versiyonlanabilir) 3 Ana Hücre Tablosu

-- 1. MODEL MASTER (Ana Gövde: Ürünün değişmez kimliği)
CREATE TABLE b1_arge_model_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    arge_trend_id UUID REFERENCES b1_arge_trendler(id),
    baslik VARCHAR(255) NOT NULL,
    kategori VARCHAR(100),
    hedef_kitle VARCHAR(100),
    platform_kaynak VARCHAR(255),
    olusturulma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    guncellenme_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ANALYSIS RESULT (Versiyonlanabilir Ar-Ge Sonuçları)
-- Trend_v1, Trend_v2 mantığıyla Dondurulmamış veriler burada tutulur
CREATE TABLE b1_arge_analysis_result (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_id UUID REFERENCES b1_arge_model_master(id),
    versiyon INTEGER DEFAULT 1,
    -- AI'nin İlham İçgörüleri (Kesin değil, Küratör data)
    ongorulen_kumas TEXT,
    ongorulen_aksesuar TEXT,
    hedef_fiyat_min NUMERIC,
    hedef_fiyat_max NUMERIC,
    guven_skoru INTEGER, -- Pazar, Google Trends vs çaprazlama skoru (0-100)
    
    -- M1 Ar-Ge Trend ve Fırsat Metrikleri
    trend_skoru INTEGER,
    trend_yasi_gun INTEGER,
    search_growth INTEGER,
    review_velocity INTEGER,
    price_stability INTEGER,
    stock_depletion INTEGER,
    pazar_metrikleri JSONB DEFAULT '{}'::jsonb, -- AI tarafindan toplanan genis JSON verisi

    risk_profili VARCHAR(100),
    -- İNSAN ONAY BARKODU (Gateway: Bu olmadan Modelhane üretemez)
    insan_onayi_var_mi BOOLEAN DEFAULT FALSE,
    onaylayan_kullanici UUID,
    kayit_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. EVENT LOG (Kuyruk / Zamansal Doğrulama Takipçisi)
-- Gece Bekçisi Ajanı (Agent 6) bu log'ları okur ve yazar
CREATE TABLE b1_arge_event_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_id UUID REFERENCES b1_arge_model_master(id),
    islem_tipi VARCHAR(50), -- "ZAMANSAL_DOGRULAMA", "TREND_ALARM", "KUYRUK_BEKLIYOR"
    islem_sonucu TEXT, -- "Ürün yok sattı fırsat kaçtı" veya "Fiyatı çakıldı"
    islem_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HIZ VE PERFORMANS İÇİN İNDEKSLER (Kilitlenmeyi engellemek için)
CREATE INDEX idx_model_master_kategori ON b1_arge_model_master(kategori);
CREATE INDEX idx_analysis_guncel_versiyon ON b1_arge_analysis_result(master_id, versiyon);
CREATE INDEX idx_event_log_islem_tipi ON b1_arge_event_log(islem_tipi);
