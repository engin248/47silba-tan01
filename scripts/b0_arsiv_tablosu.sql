-- =========================================================
-- b0_arsiv — DİP ARŞİV KATMANI (Geri Dönüşüm Kasası)
-- =========================================================
-- KN-6: Her kalıcı silme öncesi veri buraya kopyalanır.
-- Model Resimleri, Kumaş/Aksesuar Örnekleri, Personel Maliyet
-- Kayıtları ve Üretim Arşivleri bu tablo sayesinde korunur.
-- Köprü Ajanı artık doğrudan silme yapmıyor;
-- önce buraya arşivliyor, sonra asıl tablodan siliyor.
-- =========================================================

-- Tabloyu oluştur (yoksa)
CREATE TABLE IF NOT EXISTS b0_arsiv (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kaynak_tablo    TEXT NOT NULL,              -- Silinen kaydın geldiği tablo
    kaynak_id       UUID,                       -- Silinen kaydın orijinal ID'si
    veri            JSONB NOT NULL,             -- Silinen kaydın tam içeriği (JSON)
    silen_kullanici TEXT DEFAULT 'Sistem',      -- Kim sildi?
    silme_tarihi    TIMESTAMPTZ DEFAULT NOW(),  -- Ne zaman silindi?
    silme_sebebi    TEXT,                       -- Neden silindi?
    geri_yuklenebilir BOOLEAN DEFAULT TRUE,     -- Geri yüklenebilir mi?
    geri_yuklendi   BOOLEAN DEFAULT FALSE,      -- Geri yüklendi mi?
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Performans için indeks
CREATE INDEX IF NOT EXISTS idx_b0_arsiv_kaynak_tablo ON b0_arsiv(kaynak_tablo);
CREATE INDEX IF NOT EXISTS idx_b0_arsiv_silme_tarihi ON b0_arsiv(silme_tarihi);
CREATE INDEX IF NOT EXISTS idx_b0_arsiv_kaynak_id    ON b0_arsiv(kaynak_id);

-- RLS Aktif: Sadece adminler okuyabilir, sistem yazabilir
ALTER TABLE b0_arsiv ENABLE ROW LEVEL SECURITY;

-- Adminler (tam yetkili) her şeyi görebilir
CREATE POLICY "Adminler arsivi gorebilir" ON b0_arsiv
    FOR SELECT USING (true);

-- Sadece servis rolü (backend/ajan) yazabilir
CREATE POLICY "Sadece servis arsive yazabilir" ON b0_arsiv
    FOR INSERT WITH CHECK (true);

-- =========================================================
-- ÖNEMLİ NOT: b0_arsiv tablosu asla otomatik temizlenmez!
-- Dikkat: KORUNAN_TABLOLAR listesindeki veriler Köprü Ajanı
-- tarafından hiçbir zaman doğrudan silinmez:
--   - b1_kumas            (Kumaş ve Materyal Arşivi)
--   - b1_aksesuar         (Aksesuar Örnekleri)
--   - b1_model_taslaklari (Model Resimleri & Tasarım)
--   - b1_maliyet_kayitlari(Maliyet Kayıtları — 5 yıl zorunlu)
--   - b1_muhasebe_raporlari (Muhasebe Arşivi)
--   - production_orders   (Üretim Arşivi)
--   - b1_personel         (Personel Kayıtları)
--   - b1_personel_performans (Performans Arşivi)
--   - b0_arsiv            (Bu tablonun kendisi)
--   - b0_sistem_loglari   (Sistem Denetim Logları)
-- =========================================================
