-- ============================================================
-- AI AJAN GÖREV MERKEZİ TABLOSU
-- 47 SIL BAŞTAN — b1_ajan_gorevler
-- ============================================================

CREATE TABLE IF NOT EXISTS b1_ajan_gorevler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- GÖREV KİMLİĞİ
    gorev_adi TEXT NOT NULL,                           -- "2026 Yaz Trendi Araştır"
    gorev_tipi TEXT NOT NULL DEFAULT 'arastirma',      -- arastirma | analiz | kaydet | kontrol | rapor | uret
    oncelik TEXT NOT NULL DEFAULT 'normal',            -- acil | yuksek | normal | dusuk
    
    -- GÖREV EMRİ
    gorev_emri TEXT NOT NULL,                          -- Koordinatörün verdiği tam talimat
    hedef_modul TEXT,                                  -- arge | kumas | kalip | modelhane | kesim | uretim | maliyet | muhasebe | katalog | siparisler | stok | kasa | musteriler | personel | raporlar | genel
    hedef_tablo TEXT,                                  -- Sonucun yazılacağı Supabase tablosu
    hedef_alan TEXT,                                   -- Hangi alan/sütuna yazılacak
    
    -- YETKİLER
    yetki_internet BOOLEAN DEFAULT false,              -- İnternet arama yetkisi
    yetki_supabase_yaz BOOLEAN DEFAULT true,           -- Supabase'e yazma yetkisi
    yetki_supabase_oku BOOLEAN DEFAULT true,           -- Supabase okuma yetkisi
    yetki_ai_kullan BOOLEAN DEFAULT true,              -- AI (Perplexity/Gemini) kullanma yetkisi
    yetki_dosya_olustur BOOLEAN DEFAULT false,         -- Dosya oluşturma yetkisi
    
    -- AJAN BİLGİSİ
    ajan_adi TEXT NOT NULL DEFAULT 'Trend Kâşifi',     -- Hangi ajan çalışacak
    -- Trend Kâşifi | Kumaş Analisti | Kalıp Mühendisi | Üretim Kontrol | Maliyet Hesap | Muhasebe | Katalog | Stok | Müşteri | Personel | Genel
    
    -- DURUM
    durum TEXT NOT NULL DEFAULT 'bekliyor',            -- bekliyor | calisıyor | tamamlandi | hata | iptal
    
    -- ZAMANLAMA
    created_at TIMESTAMPTZ DEFAULT NOW(),
    baslangic_tarihi TIMESTAMPTZ,                      -- Ne zaman başladı
    bitis_tarihi TIMESTAMPTZ,                          -- Ne zaman bitti
    
    -- SONUÇ
    sonuc_ozeti TEXT,                                  -- Kısa özet
    sonuc_detay JSONB,                                 -- Tam JSON sonuç
    hata_mesaji TEXT,                                  -- Hata varsa
    
    -- TAKİP
    koordinator_notu TEXT,                             -- Koordinatörün notu
    tekrar_sayisi INT DEFAULT 0,                       -- Kaç kez çalıştırıldı
    son_calistiran TEXT DEFAULT 'koordinator'          -- Kim başlattı
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ajan_gorevler_durum ON b1_ajan_gorevler(durum);
CREATE INDEX IF NOT EXISTS idx_ajan_gorevler_created ON b1_ajan_gorevler(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ajan_gorevler_ajan ON b1_ajan_gorevler(ajan_adi);
CREATE INDEX IF NOT EXISTS idx_ajan_gorevler_modul ON b1_ajan_gorevler(hedef_modul);

-- RLS
ALTER TABLE b1_ajan_gorevler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Servis rolü tam erişim" ON b1_ajan_gorevler
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon okuma" ON b1_ajan_gorevler
    FOR SELECT TO anon USING (true);
CREATE POLICY "Anon yazma" ON b1_ajan_gorevler
    FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon güncelleme" ON b1_ajan_gorevler
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Örnek görev
INSERT INTO b1_ajan_gorevler (
    gorev_adi, gorev_tipi, oncelik, gorev_emri, hedef_modul,
    hedef_tablo, yetki_internet, ajan_adi, durum
) VALUES (
    'İlk Sistem Testi', 'kontrol', 'normal',
    'Sistemi test et ve çalışma durumunu raporla.',
    'genel', 'b1_ajan_gorevler', false, 'Genel', 'tamamlandi'
) ON CONFLICT DO NOTHING;
