-- ════════════════════════════════════════════════════════════════════
-- MASTER RLS GÜVENLİK YAMASI — TEK ÇALIŞTIRILACAK
-- Tarih: 27 Mart 2026 | Proje: 47silba-tan01
-- KAPSAM: pg_policies taramasından tespit edilen TÜM anon/public açıklar
-- ════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════
-- BLOK 1: MÜŞTERİ VE KİŞİSEL VERİ (PII)
-- ═══════════════════════════════════════════════════════

DROP POLICY IF EXISTS "p_b2_musteriler" ON public.b2_musteriler;
DROP POLICY IF EXISTS "service_tam" ON public.b2_musteriler;
CREATE POLICY "musteri_okuma"     ON public.b2_musteriler FOR SELECT    TO authenticated USING (true);
CREATE POLICY "musteri_yazma"     ON public.b2_musteriler FOR INSERT    TO authenticated WITH CHECK (true);
CREATE POLICY "musteri_guncelleme" ON public.b2_musteriler FOR UPDATE   TO authenticated USING (true);
CREATE POLICY "musteri_silme"     ON public.b2_musteriler FOR DELETE    TO authenticated USING (true);
CREATE POLICY "musteri_service"   ON public.b2_musteriler FOR ALL       TO service_role  USING (true);

DROP POLICY IF EXISTS "p_b2_iletisim" ON public.b2_musteri_iletisim;
DROP POLICY IF EXISTS "service_tam"   ON public.b2_musteri_iletisim;
CREATE POLICY "iletisim_okuma"    ON public.b2_musteri_iletisim FOR SELECT TO authenticated USING (true);
CREATE POLICY "iletisim_yazma"    ON public.b2_musteri_iletisim FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "iletisim_service"  ON public.b2_musteri_iletisim FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_all"                    ON public.personnel;
DROP POLICY IF EXISTS "anon_read"                   ON public.personnel;
DROP POLICY IF EXISTS "personnel_authenticated_read" ON public.personnel;
DROP POLICY IF EXISTS "service_tam"                 ON public.personnel;
CREATE POLICY "personnel_okuma"   ON public.personnel FOR SELECT TO authenticated USING (true);
CREATE POLICY "personnel_yazma"   ON public.personnel FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "personnel_guncelleme" ON public.personnel FOR UPDATE TO authenticated USING (true);
CREATE POLICY "personnel_service" ON public.personnel FOR ALL    TO service_role  USING (true);

-- ═══════════════════════════════════════════════════════
-- BLOK 2: MALİ VERİ (FİNANSAL)
-- ═══════════════════════════════════════════════════════

DROP POLICY IF EXISTS "p_b1_muhasebe" ON public.b1_muhasebe_raporlari;
DROP POLICY IF EXISTS "service_tam"   ON public.b1_muhasebe_raporlari;
CREATE POLICY "muhasebe_okuma"    ON public.b1_muhasebe_raporlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "muhasebe_service"  ON public.b1_muhasebe_raporlari FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_all_maliyet" ON public.b1_maliyet_kayitlari;
DROP POLICY IF EXISTS "p_b1_maliyet"    ON public.b1_maliyet_kayitlari;
DROP POLICY IF EXISTS "service_tam"     ON public.b1_maliyet_kayitlari;
CREATE POLICY "maliyet_okuma"     ON public.b1_maliyet_kayitlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "maliyet_yazma"     ON public.b1_maliyet_kayitlari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "maliyet_guncelleme" ON public.b1_maliyet_kayitlari FOR UPDATE TO authenticated USING (true);
CREATE POLICY "maliyet_service"   ON public.b1_maliyet_kayitlari FOR ALL    TO service_role  USING (true);

-- ═══════════════════════════════════════════════════════
-- BLOK 3: SİPARİŞ VE STOK
-- ═══════════════════════════════════════════════════════

DROP POLICY IF EXISTS "p_b2_siparis_kalem" ON public.b2_siparis_kalemleri;
DROP POLICY IF EXISTS "service_tam"        ON public.b2_siparis_kalemleri;
CREATE POLICY "siparis_kalem_okuma"   ON public.b2_siparis_kalemleri FOR SELECT TO authenticated USING (true);
CREATE POLICY "siparis_kalem_yazma"   ON public.b2_siparis_kalemleri FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "siparis_kalem_guncelleme" ON public.b2_siparis_kalemleri FOR UPDATE TO authenticated USING (true);
CREATE POLICY "siparis_kalem_service" ON public.b2_siparis_kalemleri FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "p_b2_stok"   ON public.b2_stok_hareketleri;
DROP POLICY IF EXISTS "service_tam" ON public.b2_stok_hareketleri;
CREATE POLICY "stok_okuma"    ON public.b2_stok_hareketleri FOR SELECT TO authenticated USING (true);
CREATE POLICY "stok_yazma"    ON public.b2_stok_hareketleri FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stok_service"  ON public.b2_stok_hareketleri FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "tedarikci_delete" ON public.b2_tedarikciler;
DROP POLICY IF EXISTS "tedarikci_insert" ON public.b2_tedarikciler;
DROP POLICY IF EXISTS "tedarikci_select" ON public.b2_tedarikciler;
DROP POLICY IF EXISTS "tedarikci_update" ON public.b2_tedarikciler;
DROP POLICY IF EXISTS "service_tam"      ON public.b2_tedarikciler;
CREATE POLICY "tedarikci_okuma"      ON public.b2_tedarikciler FOR SELECT TO authenticated USING (true);
CREATE POLICY "tedarikci_yazma"      ON public.b2_tedarikciler FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tedarikci_guncelleme" ON public.b2_tedarikciler FOR UPDATE TO authenticated USING (true);
CREATE POLICY "tedarikci_service"    ON public.b2_tedarikciler FOR ALL    TO service_role  USING (true);

-- ═══════════════════════════════════════════════════════
-- BLOK 4: ÜRETİM VERİSİ
-- ═══════════════════════════════════════════════════════

DROP POLICY IF EXISTS "anon_delete" ON public.production_orders;
DROP POLICY IF EXISTS "anon_insert" ON public.production_orders;
DROP POLICY IF EXISTS "anon_select" ON public.production_orders;
DROP POLICY IF EXISTS "anon_update" ON public.production_orders;

DROP POLICY IF EXISTS "anon_b1_kesim_is_emirleri" ON public.b1_kesim_is_emirleri;
DROP POLICY IF EXISTS "service_tam" ON public.b1_kesim_is_emirleri;
CREATE POLICY "kesim_okuma"   ON public.b1_kesim_is_emirleri FOR SELECT TO authenticated USING (true);
CREATE POLICY "kesim_yazma"   ON public.b1_kesim_is_emirleri FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kesim_service" ON public.b1_kesim_is_emirleri FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_erisim" ON public.b1_kesim_operasyonlari;
DROP POLICY IF EXISTS "service_tam" ON public.b1_kesim_operasyonlari;
CREATE POLICY "kesimop_okuma"   ON public.b1_kesim_operasyonlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "kesimop_yazma"   ON public.b1_kesim_operasyonlari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kesimop_service" ON public.b1_kesim_operasyonlari FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "uretim_kayit_acik" ON public.b1_uretim_kayitlari;
CREATE POLICY "uretim_kayit_okuma"   ON public.b1_uretim_kayitlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "uretim_kayit_yazma"   ON public.b1_uretim_kayitlari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "uretim_kayit_service" ON public.b1_uretim_kayitlari FOR ALL    TO service_role  USING (true);

-- ═══════════════════════════════════════════════════════
-- BLOK 5: AR-GE VE KOMPETİTİF VERİ
-- ═══════════════════════════════════════════════════════

DROP POLICY IF EXISTS "p_b1_arge" ON public.b1_arge_trendler;
DROP POLICY IF EXISTS "service_tam" ON public.b1_arge_trendler;
CREATE POLICY "arge_trend_okuma"   ON public.b1_arge_trendler FOR SELECT TO authenticated USING (true);
CREATE POLICY "arge_trend_yazma"   ON public.b1_arge_trendler FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "arge_trend_guncelleme" ON public.b1_arge_trendler FOR UPDATE TO authenticated USING (true);
CREATE POLICY "arge_trend_service" ON public.b1_arge_trendler FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_b1_model_taslaklari" ON public.b1_model_taslaklari;
DROP POLICY IF EXISTS "service_tam" ON public.b1_model_taslaklari;
CREATE POLICY "model_taslak_okuma"   ON public.b1_model_taslaklari FOR SELECT TO authenticated USING (true);
CREATE POLICY "model_taslak_yazma"   ON public.b1_model_taslaklari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "model_taslak_service" ON public.b1_model_taslaklari FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_b1_model_kaliplari" ON public.b1_model_kaliplari;
DROP POLICY IF EXISTS "service_tam" ON public.b1_model_kaliplari;
CREATE POLICY "model_kalip_okuma"   ON public.b1_model_kaliplari FOR SELECT TO authenticated USING (true);
CREATE POLICY "model_kalip_yazma"   ON public.b1_model_kaliplari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "model_kalip_service" ON public.b1_model_kaliplari FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_b1_aksesuar_arsivi" ON public.b1_aksesuar_arsivi;
DROP POLICY IF EXISTS "service_tam" ON public.b1_aksesuar_arsivi;
CREATE POLICY "aksesuar_okuma"   ON public.b1_aksesuar_arsivi FOR SELECT TO authenticated USING (true);
CREATE POLICY "aksesuar_yazma"   ON public.b1_aksesuar_arsivi FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "aksesuar_service" ON public.b1_aksesuar_arsivi FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "p_b1_kumas" ON public.b1_kumas_arsivi;
DROP POLICY IF EXISTS "service_tam" ON public.b1_kumas_arsivi;
CREATE POLICY "kumas_okuma"   ON public.b1_kumas_arsivi FOR SELECT TO authenticated USING (true);
CREATE POLICY "kumas_yazma"   ON public.b1_kumas_arsivi FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kumas_service" ON public.b1_kumas_arsivi FOR ALL    TO service_role  USING (true);

-- ═══════════════════════════════════════════════════════
-- BLOK 6: İÇ OPERASYONEL VERİ
-- ═══════════════════════════════════════════════════════

DROP POLICY IF EXISTS "allow_all"       ON public.b1_gorevler;
DROP POLICY IF EXISTS "anon_b1_gorevler" ON public.b1_gorevler;
DROP POLICY IF EXISTS "service_tam"     ON public.b1_gorevler;
CREATE POLICY "gorev_okuma"   ON public.b1_gorevler FOR SELECT TO authenticated USING (true);
CREATE POLICY "gorev_yazma"   ON public.b1_gorevler FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "gorev_guncelleme" ON public.b1_gorevler FOR UPDATE TO authenticated USING (true);
CREATE POLICY "gorev_silme"   ON public.b1_gorevler FOR DELETE TO authenticated USING (true);
CREATE POLICY "gorev_service" ON public.b1_gorevler FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "mesaj_gizli_okuma" ON public.b1_mesaj_gizli;
DROP POLICY IF EXISTS "mesaj_gizli_yazma" ON public.b1_mesaj_gizli;
CREATE POLICY "gizli_okuma"   ON public.b1_mesaj_gizli FOR SELECT TO authenticated USING (true);
CREATE POLICY "gizli_yazma"   ON public.b1_mesaj_gizli FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "gizli_service" ON public.b1_mesaj_gizli FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_all_sistem_ayarlari" ON public.b1_sistem_ayarlari;
DROP POLICY IF EXISTS "anon_ayarlar_okur"        ON public.b1_sistem_ayarlari;
DROP POLICY IF EXISTS "service_tam"              ON public.b1_sistem_ayarlari;
CREATE POLICY "ayarlar_okuma"   ON public.b1_sistem_ayarlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "ayarlar_guncelleme" ON public.b1_sistem_ayarlari FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ayarlar_service" ON public.b1_sistem_ayarlari FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_b1_sistem_uyarilari" ON public.b1_sistem_uyarilari;
DROP POLICY IF EXISTS "service_tam" ON public.b1_sistem_uyarilari;
CREATE POLICY "uyari_okuma"   ON public.b1_sistem_uyarilari FOR SELECT TO authenticated USING (true);
CREATE POLICY "uyari_yazma"   ON public.b1_sistem_uyarilari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "uyari_service" ON public.b1_sistem_uyarilari FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_b1_dikim_talimatlari" ON public.b1_dikim_talimatlari;
DROP POLICY IF EXISTS "service_tam" ON public.b1_dikim_talimatlari;
CREATE POLICY "dikim_okuma"   ON public.b1_dikim_talimatlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "dikim_yazma"   ON public.b1_dikim_talimatlari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dikim_service" ON public.b1_dikim_talimatlari FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_b1_ara_is_emirleri" ON public.b1_ara_is_emirleri;
DROP POLICY IF EXISTS "service_tam" ON public.b1_ara_is_emirleri;
CREATE POLICY "ara_emir_okuma"   ON public.b1_ara_is_emirleri FOR SELECT TO authenticated USING (true);
CREATE POLICY "ara_emir_yazma"   ON public.b1_ara_is_emirleri FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ara_emir_service" ON public.b1_ara_is_emirleri FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_b1_numune_uretimleri" ON public.b1_numune_uretimleri;
DROP POLICY IF EXISTS "service_tam" ON public.b1_numune_uretimleri;
CREATE POLICY "numune_okuma"   ON public.b1_numune_uretimleri FOR SELECT TO authenticated USING (true);
CREATE POLICY "numune_yazma"   ON public.b1_numune_uretimleri FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "numune_service" ON public.b1_numune_uretimleri FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_b1_model_malzeme_listesi" ON public.b1_model_malzeme_listesi;
DROP POLICY IF EXISTS "service_tam" ON public.b1_model_malzeme_listesi;
CREATE POLICY "malzeme_liste_okuma"   ON public.b1_model_malzeme_listesi FOR SELECT TO authenticated USING (true);
CREATE POLICY "malzeme_liste_yazma"   ON public.b1_model_malzeme_listesi FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "malzeme_liste_service" ON public.b1_model_malzeme_listesi FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "modelhane_acik" ON public.b1_modelhane_kayitlari;
CREATE POLICY "modelhane_okuma"   ON public.b1_modelhane_kayitlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "modelhane_yazma"   ON public.b1_modelhane_kayitlari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "modelhane_service" ON public.b1_modelhane_kayitlari FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "p_b1_devam" ON public.b1_personel_devam;
DROP POLICY IF EXISTS "service_tam" ON public.b1_personel_devam;
CREATE POLICY "devam_okuma"   ON public.b1_personel_devam FOR SELECT TO authenticated USING (true);
CREATE POLICY "devam_yazma"   ON public.b1_personel_devam FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "devam_service" ON public.b1_personel_devam FOR ALL    TO service_role  USING (true);

DROP POLICY IF EXISTS "anon_b1_agent_loglari" ON public.b1_agent_loglari;
DROP POLICY IF EXISTS "service_tam" ON public.b1_agent_loglari;
CREATE POLICY "agent_log_okuma"   ON public.b1_agent_loglari FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_log_yazma"   ON public.b1_agent_loglari FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "agent_log_service" ON public.b1_agent_loglari FOR ALL    TO service_role  USING (true);

-- ═══════════════════════════════════════════════════════
-- DOĞRULAMA: Artık anon rolü olmamalı (kasıtlı olanlar hariç)
-- ═══════════════════════════════════════════════════════
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND 'anon' = ANY(roles)
AND tablename NOT IN ('b0_api_spam_kalkani', 'b0_sistem_loglari', 'b1_ajan_gorevler')
ORDER BY tablename;
