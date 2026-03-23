-- V3 NİZAM (THE ORDER) AR-GE TREND TAHMİN VERİTABANI ŞEMASI
-- Kullanım: Supabase üzerinden çalıştırılacak 8 Ajanlı Düşük Maliyetli "Trend Score" Hafıza Deposu
-- Konsept: Zara & Shein Mimarisinin Açık Kaynak + Düşük Maliyetli Versiyonu

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    style VARCHAR(100),
    fabric VARCHAR(100),
    color VARCHAR(100),
    price_range VARCHAR(50),
    olusturulma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE trend_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sales_growth NUMERIC(5,2), -- % Satış artışı
    social_growth NUMERIC(5,2), -- % Sosyal medya büyümesi
    competitor_usage NUMERIC(5,2), -- Rakip platformlarda bulunma oranı
    season_score NUMERIC(5,2), -- Sezon uyumu puanı
    trend_score NUMERIC(5,2), -- (Satış x 0.35) + (Sosyal x 0.30) ... Nihai Puan
    hesaplama_tarihi TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE cost_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    fabric_cost NUMERIC(10,2), -- İç tahmini kumaş maliyeti
    labor_cost NUMERIC(10,2), -- Fason işçilik maliyeti
    production_cost NUMERIC(10,2), -- Toplam Üretim
    guncelleme_tarihi TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE risk_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    production_risk NUMERIC(5,2), -- Makine/Dikim zorluk skoru (Puan)
    supply_risk NUMERIC(5,2), -- Kumaş tedarik riski
    trend_life VARCHAR(50), -- (Mikro 1-3 Ay / Orta 6-12 Ay / Mega 2-5 Yıl)
    guncelleme_tarihi TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE strategy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    opportunity_score NUMERIC(5,2), -- Fırsat Skoru = Trend + Kâr - Risk
    decision VARCHAR(50), -- ('üretim', 'test_üretim', 'izleme', 'reddet')
    production_quantity INTEGER, -- Önerilen adet
    onay_durumu VARCHAR(20) DEFAULT 'bekliyor', -- Yönetici onayı (Patron)
    olusturulma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- AI Veritabanı Yalıtımı ve Performans İçin İndeksler
CREATE INDEX idx_trend_score ON trend_data(trend_score DESC);
CREATE INDEX idx_opportunity_score ON strategy(opportunity_score DESC);
CREATE INDEX idx_decision ON strategy(decision);
