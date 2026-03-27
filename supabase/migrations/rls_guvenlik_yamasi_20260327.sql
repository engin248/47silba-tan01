-- ════════════════════════════════════════════════════════════
-- ACİL GÜVENLİK YAMASI — RLS POLİTİKA AÇIKLARI
-- Tespit: 4 tabloda anon/public tam erişim açığı
-- 27 Mart 2026
-- ════════════════════════════════════════════════════════════

-- ─── 1. b1_ic_mesajlar — TÜM ESKİ POLİTİKALARI TEMİZLE ────
DROP POLICY IF EXISTS "ic_mesajlar_okuma" ON public.b1_ic_mesajlar;
DROP POLICY IF EXISTS "ic_mesajlar_yazma" ON public.b1_ic_mesajlar;
DROP POLICY IF EXISTS "ic_mesajlar_guncelleme" ON public.b1_ic_mesajlar;
DROP POLICY IF EXISTS "ic_mesajlar_service" ON public.b1_ic_mesajlar;
-- Migrasyon dosyalarındaki eski isimler
DROP POLICY IF EXISTS "Herkes okusun" ON public.b1_ic_mesajlar;
DROP POLICY IF EXISTS "Herkes yazsın" ON public.b1_ic_mesajlar;
DROP POLICY IF EXISTS "Yetkililer güncellesin" ON public.b1_ic_mesajlar;
DROP POLICY IF EXISTS "ic_mesajlar_policy" ON public.b1_ic_mesajlar;
DROP POLICY IF EXISTS "allow_all" ON public.b1_ic_mesajlar;
DROP POLICY IF EXISTS "public_access" ON public.b1_ic_mesajlar;

-- Temiz politikalar
CREATE POLICY "ic_mesajlar_okuma" ON public.b1_ic_mesajlar
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "ic_mesajlar_yazma" ON public.b1_ic_mesajlar
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ic_mesajlar_guncelleme" ON public.b1_ic_mesajlar
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ic_mesajlar_service" ON public.b1_ic_mesajlar
    FOR ALL TO service_role USING (true);

-- ─── 2. b1_personel — ANON ERİŞİMİ KAPAT ──────────────────
DROP POLICY IF EXISTS "p_b1_personel" ON public.b1_personel;
DROP POLICY IF EXISTS "personel_select" ON public.b1_personel;
DROP POLICY IF EXISTS "personel_insert" ON public.b1_personel;
DROP POLICY IF EXISTS "personel_update" ON public.b1_personel;
DROP POLICY IF EXISTS "personel_delete" ON public.b1_personel;
DROP POLICY IF EXISTS "service_tam" ON public.b1_personel;

CREATE POLICY "personel_okuma" ON public.b1_personel
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "personel_yazma" ON public.b1_personel
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "personel_guncelleme" ON public.b1_personel
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "personel_silme" ON public.b1_personel
    FOR DELETE TO authenticated USING (true);
CREATE POLICY "personel_service" ON public.b1_personel
    FOR ALL TO service_role USING (true);

-- ─── 3. b2_kasa_hareketleri — ANON ERİŞİMİ KAPAT ──────────
DROP POLICY IF EXISTS "p_b2_kasa" ON public.b2_kasa_hareketleri;
DROP POLICY IF EXISTS "service_tam" ON public.b2_kasa_hareketleri;

CREATE POLICY "kasa_okuma" ON public.b2_kasa_hareketleri
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "kasa_yazma" ON public.b2_kasa_hareketleri
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kasa_service" ON public.b2_kasa_hareketleri
    FOR ALL TO service_role USING (true);

-- ─── 4. b2_siparisler — ANON ERİŞİMİ KAPAT ────────────────
DROP POLICY IF EXISTS "p_b2_siparis" ON public.b2_siparisler;
DROP POLICY IF EXISTS "service_tam" ON public.b2_siparisler;

CREATE POLICY "siparis_okuma" ON public.b2_siparisler
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "siparis_yazma" ON public.b2_siparisler
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "siparis_guncelleme" ON public.b2_siparisler
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "siparis_service" ON public.b2_siparisler
    FOR ALL TO service_role USING (true);

-- ─── DOĞRULAMA: Artık anon rolü hiçbir politikada olmamalı ─
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('b1_ic_mesajlar','b1_personel','b2_kasa_hareketleri','b2_siparisler')
ORDER BY tablename, policyname;
