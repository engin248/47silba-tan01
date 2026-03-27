-- ════════════════════════════════════════════════════════════════
-- POLİCY İSİMLERİ TÜRKÇE TEMİZLEME — ASCII'ye Dönüştürme
-- Tarih: 27 Mart 2026
-- Kapsam: b1_arge_* tablolarındaki Türkçe isimli politikalar
-- ════════════════════════════════════════════════════════════════

-- ─── b1_arge_products ──────────────────────────────────────────
DROP POLICY IF EXISTS "Sadece Adminler Ürün Kimliğini Güncelleyebilir (Update)" ON public.b1_arge_products;
DROP POLICY IF EXISTS "Sadece Sisteme Giriş Yapanlar Ar-Ge Ürünlerini Görebilir" ON public.b1_arge_products;
DROP POLICY IF EXISTS "Ajanlar ve Adminler Yeni Ürün Ekleyebilir (Insert)" ON public.b1_arge_products;
CREATE POLICY "arge_urun_select" ON public.b1_arge_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "arge_urun_insert" ON public.b1_arge_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "arge_urun_update" ON public.b1_arge_products FOR UPDATE TO authenticated USING (true);

-- ─── b1_arge_cost_analysis ─────────────────────────────────────
DROP POLICY IF EXISTS "Herkes Maliyet Verisini Okuyabilir (Select)" ON public.b1_arge_cost_analysis;
DROP POLICY IF EXISTS "Yetkili Kullanıcılar/Adminler Maliyet Ekleyebilir (Insert/Upd" ON public.b1_arge_cost_analysis;
CREATE POLICY "arge_maliyet_select" ON public.b1_arge_cost_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "arge_maliyet_all"    ON public.b1_arge_cost_analysis FOR ALL    TO authenticated USING (true);

-- ─── b1_arge_risk_analysis ─────────────────────────────────────
DROP POLICY IF EXISTS "Ajan ve Karar Verici Risk Skoru Girebilir" ON public.b1_arge_risk_analysis;
DROP POLICY IF EXISTS "Herkes Riskleri Görüntüleyebilir" ON public.b1_arge_risk_analysis;
CREATE POLICY "arge_risk_select" ON public.b1_arge_risk_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "arge_risk_all"    ON public.b1_arge_risk_analysis FOR ALL    TO authenticated USING (true);

-- ─── b1_arge_strategy ──────────────────────────────────────────
DROP POLICY IF EXISTS "Sadece Karargah Yetkilisi Onay Yapabilir" ON public.b1_arge_strategy;
DROP POLICY IF EXISTS "Stratejist Ajan Karar Yazabilir" ON public.b1_arge_strategy;
DROP POLICY IF EXISTS "Yönetici Stratejiyi Okuyabilir" ON public.b1_arge_strategy;
CREATE POLICY "arge_strateji_select" ON public.b1_arge_strategy FOR SELECT TO authenticated USING (true);
CREATE POLICY "arge_strateji_insert" ON public.b1_arge_strategy FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "arge_strateji_update" ON public.b1_arge_strategy FOR UPDATE TO authenticated USING (true);

-- ─── b1_arge_trend_data ────────────────────────────────────────
DROP POLICY IF EXISTS "Herkes Trend Verisini Okuyabilir (Select)" ON public.b1_arge_trend_data;
DROP POLICY IF EXISTS "Sadece AI ve Adminler Trend Puanı Yazabilir (Insert/Update)" ON public.b1_arge_trend_data;
CREATE POLICY "arge_trend_select" ON public.b1_arge_trend_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "arge_trend_all"    ON public.b1_arge_trend_data FOR ALL    TO authenticated USING (true);

-- ─── DOĞRULAMA: Türkçe harf içeren policy ismi kalmamalı ───────
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND policyname ~ '[çğışöüÇĞİŞÖÜ]'
ORDER BY tablename;
