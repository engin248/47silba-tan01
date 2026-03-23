-- ════════════════════════════════════════════════════════════════
-- 47 SİL BAŞTAN — SUPABASE ROW LEVEL SECURITY (RLS) KURULUM
-- OWASP A01: Broken Access Control koruması
-- Çalıştırma: Supabase Dashboard > SQL Editor > Bu dosyayı yapıştır > Run
-- ════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- ADIM 1: TÜM TABLOLARDA RLS AKTİF ET
-- ──────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS b1_model_taslaklari          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b1_kumas_arsivi              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b1_model_kaliplari           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b1_numune_uretimleri         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b1_dikim_talimatlari         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b1_personel                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b1_personel_devam            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b1_maliyet_kayitlari         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b1_muhasebe_raporlari        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b1_arge_trendler             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b1_sistem_ayarlari           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b2_siparisler                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b2_musteriler                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b2_kasa_hareketleri          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b2_stok                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b2_katalog                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS b1_gorevler                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS production_orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS v2_production_orders         ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- ADIM 2: SERVICE ROLE İÇİN TAM YETKİ (API route'lar için)
-- Service role key tüm RLS politikalarını bypass eder (zaten)
-- Bu adım anon key için politika tanımlar
-- ──────────────────────────────────────────────────────────────

-- NOT: Mevcut sistem Supabase Auth kullanmıyor (PIN bazlı)
-- Bu nedenle "authenticated" rolü yerine "anon" rolüne izin veriyoruz
-- Supabase Auth'a geçildiğinde aşağıdaki politikaları
-- "FOR ALL TO anon" → "FOR ALL TO authenticated" olarak değiştirin

-- ──────────────────────────────────────────────────────────────
-- ADIM 3: TEMEL POLİTİKALAR  
-- Şu an: anon key sahibi okuma/yazma yapabilir (mevcut sistem)
-- Gelecek: authenticated kullanıcılar
-- ──────────────────────────────────────────────────────────────

-- b1_model_taslaklari
DROP POLICY IF EXISTS "anon_all_b1_model_taslaklari" ON b1_model_taslaklari;
CREATE POLICY "anon_all_b1_model_taslaklari" ON b1_model_taslaklari
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b1_kumas_arsivi
DROP POLICY IF EXISTS "anon_all_b1_kumas_arsivi" ON b1_kumas_arsivi;
CREATE POLICY "anon_all_b1_kumas_arsivi" ON b1_kumas_arsivi
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b1_numune_uretimleri
DROP POLICY IF EXISTS "anon_all_b1_numune" ON b1_numune_uretimleri;
CREATE POLICY "anon_all_b1_numune" ON b1_numune_uretimleri
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b1_dikim_talimatlari
DROP POLICY IF EXISTS "anon_all_b1_dikim" ON b1_dikim_talimatlari;
CREATE POLICY "anon_all_b1_dikim" ON b1_dikim_talimatlari
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b1_personel (hassas - sadece okuma kısıtlanabilir)
DROP POLICY IF EXISTS "anon_all_b1_personel" ON b1_personel;
CREATE POLICY "anon_all_b1_personel" ON b1_personel
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b1_maliyet_kayitlari
DROP POLICY IF EXISTS "anon_all_b1_maliyet" ON b1_maliyet_kayitlari;
CREATE POLICY "anon_all_b1_maliyet" ON b1_maliyet_kayitlari
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b2_siparisler
DROP POLICY IF EXISTS "anon_all_b2_siparisler" ON b2_siparisler;
CREATE POLICY "anon_all_b2_siparisler" ON b2_siparisler
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b2_musteriler
DROP POLICY IF EXISTS "anon_all_b2_musteriler" ON b2_musteriler;
CREATE POLICY "anon_all_b2_musteriler" ON b2_musteriler
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b2_kasa_hareketleri (çok hassas)
DROP POLICY IF EXISTS "anon_all_b2_kasa" ON b2_kasa_hareketleri;
CREATE POLICY "anon_all_b2_kasa" ON b2_kasa_hareketleri
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b1_arge_trendler
DROP POLICY IF EXISTS "anon_all_b1_arge" ON b1_arge_trendler;
CREATE POLICY "anon_all_b1_arge" ON b1_arge_trendler
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b1_sistem_ayarlari
DROP POLICY IF EXISTS "anon_all_b1_ayarlar" ON b1_sistem_ayarlari;
CREATE POLICY "anon_all_b1_ayarlar" ON b1_sistem_ayarlari
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b1_gorevler
DROP POLICY IF EXISTS "anon_all_b1_gorevler" ON b1_gorevler;
CREATE POLICY "anon_all_b1_gorevler" ON b1_gorevler
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- b2_stok
DROP POLICY IF EXISTS "anon_all_b2_stok" ON b2_stok;
CREATE POLICY "anon_all_b2_stok" ON b2_stok
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- ADIM 4: TABLO ADI TUTARSIZLIĞI — production_orders SORUNU
-- Mevcut: hem "production_orders" hem "v2_production_orders" kullanılıyor
-- Çözüm: v2_production_orders → production_orders VIEW'e dönüştür
-- ──────────────────────────────────────────────────────────────

-- Eğer v2_production_orders varsa, production_orders'a view oluştur:
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_name = 'v2_production_orders') 
    AND NOT EXISTS (SELECT FROM information_schema.tables 
                    WHERE table_name = 'production_orders') THEN
        EXECUTE 'CREATE VIEW production_orders AS SELECT * FROM v2_production_orders';
        RAISE NOTICE 'production_orders VIEW olarak oluşturuldu (v2_production_orders üzerinde)';
    ELSE
        RAISE NOTICE 'production_orders zaten var veya v2_production_orders yok — adım atlandı';
    END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- ADIM 5: STORAGE BUCKET GÜVENLİĞİ
-- ──────────────────────────────────────────────────────────────

-- teknik-foyler bucket'ı sadece giriş yapılmış kullanıcılar okuyabilsin
-- (Şu an herkese açık ise kısıtla)
-- Supabase Dashboard > Storage > teknik-foyler > Policies'den ayarlanabilir

-- ──────────────────────────────────────────────────────────────
-- DOĞRULAMA: RLS aktif mi kontrol et
-- ──────────────────────────────────────────────────────────────
SELECT 
    schemaname,
    tablename,
    rowsecurity as "rls_aktif"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ════════════════════════════════════════════════════════════════
-- SONRAKI ADIM: Supabase Auth'a geçince bu politikaları güncelle:
-- "TO anon" → "TO authenticated"
-- Bu sayede sadece giriş yapmış kullanıcılar veri okuyabilir
-- ════════════════════════════════════════════════════════════════
