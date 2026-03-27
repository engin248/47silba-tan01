-- ════════════════════════════════════════════════════════════════════
-- KRİTİK RLS GÜVENLİK YAMASI #2 — KAPSAMLI DÜZELTME
-- Tarih: 27 Mart 2026
-- Kapsam: 14 kritik tablo — anon/public açık erişim kapatıldı
-- ════════════════════════════════════════════════════════════════════

-- ─── b2_musteriler ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "p_b2_musteriler" ON public.b2_musteriler;
DROP POLICY IF EXISTS "service_tam" ON public.b2_musteriler;
CREATE POLICY "musteri_okuma" ON public.b2_musteriler FOR SELECT TO authenticated USING (true);
CREATE POLICY "musteri_yazma" ON public.b2_musteriler FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "musteri_guncelleme" ON public.b2_musteriler FOR UPDATE TO authenticated USING (true);
CREATE POLICY "musteri_service" ON public.b2_musteriler FOR ALL TO service_role USING (true);

-- ─── b2_musteri_iletisim ────────────────────────────────────────────
DROP POLICY IF EXISTS "p_b2_iletisim" ON public.b2_musteri_iletisim;
DROP POLICY IF EXISTS "service_tam" ON public.b2_musteri_iletisim;
CREATE POLICY "iletisim_okuma" ON public.b2_musteri_iletisim FOR SELECT TO authenticated USING (true);
CREATE POLICY "iletisim_yazma" ON public.b2_musteri_iletisim FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "iletisim_service" ON public.b2_musteri_iletisim FOR ALL TO service_role USING (true);

-- ─── b1_muhasebe_raporlari ─────────────────────────────────────────
DROP POLICY IF EXISTS "p_b1_muhasebe" ON public.b1_muhasebe_raporlari;
DROP POLICY IF EXISTS "service_tam" ON public.b1_muhasebe_raporlari;
CREATE POLICY "muhasebe_okuma" ON public.b1_muhasebe_raporlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "muhasebe_service" ON public.b1_muhasebe_raporlari FOR ALL TO service_role USING (true);

-- ─── b1_maliyet_kayitlari ──────────────────────────────────────────
DROP POLICY IF EXISTS "anon_all_maliyet" ON public.b1_maliyet_kayitlari;
DROP POLICY IF EXISTS "p_b1_maliyet" ON public.b1_maliyet_kayitlari;
DROP POLICY IF EXISTS "service_tam" ON public.b1_maliyet_kayitlari;
CREATE POLICY "maliyet_okuma" ON public.b1_maliyet_kayitlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "maliyet_yazma" ON public.b1_maliyet_kayitlari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "maliyet_service" ON public.b1_maliyet_kayitlari FOR ALL TO service_role USING (true);

-- ─── personnel ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_all" ON public.personnel;
DROP POLICY IF EXISTS "anon_read" ON public.personnel;
DROP POLICY IF EXISTS "personnel_authenticated_read" ON public.personnel;
DROP POLICY IF EXISTS "service_tam" ON public.personnel;
CREATE POLICY "personnel_okuma" ON public.personnel FOR SELECT TO authenticated USING (true);
CREATE POLICY "personnel_service" ON public.personnel FOR ALL TO service_role USING (true);

-- ─── b2_tedarikciler ───────────────────────────────────────────────
DROP POLICY IF EXISTS "tedarikci_delete" ON public.b2_tedarikciler;
DROP POLICY IF EXISTS "tedarikci_insert" ON public.b2_tedarikciler;
DROP POLICY IF EXISTS "tedarikci_select" ON public.b2_tedarikciler;
DROP POLICY IF EXISTS "tedarikci_update" ON public.b2_tedarikciler;
DROP POLICY IF EXISTS "service_tam" ON public.b2_tedarikciler;
CREATE POLICY "tedarikci_okuma" ON public.b2_tedarikciler FOR SELECT TO authenticated USING (true);
CREATE POLICY "tedarikci_yazma" ON public.b2_tedarikciler FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tedarikci_guncelleme" ON public.b2_tedarikciler FOR UPDATE TO authenticated USING (true);
CREATE POLICY "tedarikci_service" ON public.b2_tedarikciler FOR ALL TO service_role USING (true);

-- ─── b2_siparis_kalemleri ──────────────────────────────────────────
DROP POLICY IF EXISTS "p_b2_siparis_kalem" ON public.b2_siparis_kalemleri;
DROP POLICY IF EXISTS "service_tam" ON public.b2_siparis_kalemleri;
CREATE POLICY "siparis_kalem_okuma" ON public.b2_siparis_kalemleri FOR SELECT TO authenticated USING (true);
CREATE POLICY "siparis_kalem_yazma" ON public.b2_siparis_kalemleri FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "siparis_kalem_service" ON public.b2_siparis_kalemleri FOR ALL TO service_role USING (true);

-- ─── b2_stok_hareketleri ───────────────────────────────────────────
DROP POLICY IF EXISTS "p_b2_stok" ON public.b2_stok_hareketleri;
DROP POLICY IF EXISTS "service_tam" ON public.b2_stok_hareketleri;
CREATE POLICY "stok_hareket_okuma" ON public.b2_stok_hareketleri FOR SELECT TO authenticated USING (true);
CREATE POLICY "stok_hareket_yazma" ON public.b2_stok_hareketleri FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stok_hareket_service" ON public.b2_stok_hareketleri FOR ALL TO service_role USING (true);

-- ─── b1_sistem_ayarlari ────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_all_sistem_ayarlari" ON public.b1_sistem_ayarlari;
DROP POLICY IF EXISTS "anon_ayarlar_okur" ON public.b1_sistem_ayarlari;
DROP POLICY IF EXISTS "service_tam" ON public.b1_sistem_ayarlari;
CREATE POLICY "ayarlar_okuma" ON public.b1_sistem_ayarlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "ayarlar_service" ON public.b1_sistem_ayarlari FOR ALL TO service_role USING (true);

-- ─── b1_mesaj_gizli ────────────────────────────────────────────────
DROP POLICY IF EXISTS "mesaj_gizli_okuma" ON public.b1_mesaj_gizli;
DROP POLICY IF EXISTS "mesaj_gizli_yazma" ON public.b1_mesaj_gizli;
CREATE POLICY "gizli_okuma" ON public.b1_mesaj_gizli FOR SELECT TO authenticated USING (true);
CREATE POLICY "gizli_yazma" ON public.b1_mesaj_gizli FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "gizli_service" ON public.b1_mesaj_gizli FOR ALL TO service_role USING (true);

-- ─── b1_arge_trendler ──────────────────────────────────────────────
DROP POLICY IF EXISTS "p_b1_arge" ON public.b1_arge_trendler;
DROP POLICY IF EXISTS "service_tam" ON public.b1_arge_trendler;
CREATE POLICY "arge_trend_okuma" ON public.b1_arge_trendler FOR SELECT TO authenticated USING (true);
CREATE POLICY "arge_trend_yazma" ON public.b1_arge_trendler FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "arge_trend_service" ON public.b1_arge_trendler FOR ALL TO service_role USING (true);

-- ─── b1_gorevler ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_all" ON public.b1_gorevler;
DROP POLICY IF EXISTS "anon_b1_gorevler" ON public.b1_gorevler;
DROP POLICY IF EXISTS "service_tam" ON public.b1_gorevler;
CREATE POLICY "gorev_okuma" ON public.b1_gorevler FOR SELECT TO authenticated USING (true);
CREATE POLICY "gorev_yazma" ON public.b1_gorevler FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "gorev_guncelleme" ON public.b1_gorevler FOR UPDATE TO authenticated USING (true);
CREATE POLICY "gorev_service" ON public.b1_gorevler FOR ALL TO service_role USING (true);

-- ─── production_orders ─────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_delete" ON public.production_orders;
DROP POLICY IF EXISTS "anon_insert" ON public.production_orders;
DROP POLICY IF EXISTS "anon_select" ON public.production_orders;
DROP POLICY IF EXISTS "anon_update" ON public.production_orders;
-- authenticated_full_access ve authenticated_tam_erisim bırak — bunlar zaten doğru

-- ─── DOĞRULAMA ─────────────────────────────────────────────────────
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN (
  'b2_musteriler','b2_musteri_iletisim','b1_muhasebe_raporlari',
  'b1_maliyet_kayitlari','personnel','b2_tedarikciler',
  'b2_siparis_kalemleri','b2_stok_hareketleri','b1_sistem_ayarlari',
  'b1_mesaj_gizli','b1_arge_trendler','b1_gorevler','production_orders'
)
AND NOT ('anon' = ANY(roles))
AND qual != 'true' OR (roles::text = '{authenticated}' OR roles::text = '{service_role}')
ORDER BY tablename, policyname;
