-- ============================================================
-- NIZAM-IHS-2026-003 — urun_id Ortak Anahtar
-- Tarih: 13 Mart 2026
-- MİMARİ: Bir ürün/model için tüm geçmişi tek anahtarla bağla
-- ============================================================

-- b1_ic_mesajlar tablosuna urun_id ekle
ALTER TABLE b1_ic_mesajlar
    ADD COLUMN IF NOT EXISTS urun_id     UUID,    -- ürün/model ortak anahtarı
    ADD COLUMN IF NOT EXISTS urun_kodu   TEXT,    -- snapshot: "MODEL-47-A" değişmez kanıt
    ADD COLUMN IF NOT EXISTS urun_adi    TEXT;    -- snapshot: "Kırmızı Ceket V2" değişmez kanıt

-- ÜRÜNe göre hızlı sorgulama için indeks
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_urun_id ON b1_ic_mesajlar(urun_id);

-- ============================================================
-- KULLANIM SENARYOSU:
--
-- Sipariş #47, Model: Kırmızı Ceket V2, urun_id: abc-123
--
-- Mesaj 1 (Kesimhane → Üretim):
--   urun_id = abc-123, ilgili_modul = 'kesim'
--   "Kesim esnasında sağ kol uzunluğu 2cm fazla çıktı"
--
-- Mesaj 2 (Kalıp → Koordinatör):
--   urun_id = abc-123, ilgili_modul = 'kalip'
--   "Kalıp revizyonu yapıldı, v2.1 dosyası güncellendi"
--
-- Mesaj 3 (Üretim → Koordinatör):
--   urun_id = abc-123, ilgili_modul = 'uretim'
--   "Dikim hatası — yaka dikişi gevşek, muayene raporu eklendi"
--
-- SORGU: SELECT * FROM b1_ic_mesajlar WHERE urun_id = 'abc-123'
-- → Bu ürünle ilgili TÜM iletişim geçmişi, tüm modüllerden, kronolojik
-- → Hangi sorun ne zaman, kim tarafından raporlandı — tam izlenebilir
-- → Koordinatör bu timeline'a bakarak adil karar verir
-- ============================================================
