-- ════════════════════════════════════════════════════════════════
-- FINAL RLS YAMASI — KALAN TÜM PUBLIC/ANON AÇIKLAR
-- Tarih: 27 Mart 2026
-- Kural: Hiçbir tablo anon veya public açık kalmaz.
-- ════════════════════════════════════════════════════════════════

-- b0_tasarim_ayarlari
DROP POLICY IF EXISTS "Herkes_okuyabilir_tasarim" ON public.b0_tasarim_ayarlari;
DROP POLICY IF EXISTS "Yetkililer_yazabilir_tasarim" ON public.b0_tasarim_ayarlari;
CREATE POLICY "tasarim_okuma"   ON public.b0_tasarim_ayarlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasarim_yazma"   ON public.b0_tasarim_ayarlari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tasarim_guncelleme" ON public.b0_tasarim_ayarlari FOR UPDATE TO authenticated USING (true);
CREATE POLICY "tasarim_service" ON public.b0_tasarim_ayarlari FOR ALL TO service_role USING (true);

-- b0_bildirim_loglari
DROP POLICY IF EXISTS "b0_bildirim_herkes_okuyabilir" ON public.b0_bildirim_loglari;
DROP POLICY IF EXISTS "b0_bildirim_herkes_yazabilir"  ON public.b0_bildirim_loglari;
CREATE POLICY "bildirim_okuma"   ON public.b0_bildirim_loglari FOR SELECT TO authenticated USING (true);
CREATE POLICY "bildirim_yazma"   ON public.b0_bildirim_loglari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "bildirim_service" ON public.b0_bildirim_loglari FOR ALL TO service_role USING (true);

-- b0_yetki_ayarlari
DROP POLICY IF EXISTS "herkes_okuyabilir"        ON public.b0_yetki_ayarlari;
DROP POLICY IF EXISTS "sadece_servis_yazabilir"  ON public.b0_yetki_ayarlari;
DROP POLICY IF EXISTS "service_tam"              ON public.b0_yetki_ayarlari;
CREATE POLICY "yetki_okuma"   ON public.b0_yetki_ayarlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "yetki_service" ON public.b0_yetki_ayarlari FOR ALL TO service_role USING (true);

-- b0_toplantiler
DROP POLICY IF EXISTS "b0_toplanti_okuma"   ON public.b0_toplantiler;
DROP POLICY IF EXISTS "b0_toplanti_servis"  ON public.b0_toplantiler;
DROP POLICY IF EXISTS "service_tam"         ON public.b0_toplantiler;
CREATE POLICY "toplanti_okuma"   ON public.b0_toplantiler FOR SELECT TO authenticated USING (true);
CREATE POLICY "toplanti_yazma"   ON public.b0_toplantiler FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "toplanti_service" ON public.b0_toplantiler FOR ALL TO service_role USING (true);

-- b0_api_spam_kalkani (botlar service_role ile yazar)
DROP POLICY IF EXISTS "spam_insert" ON public.b0_api_spam_kalkani;
DROP POLICY IF EXISTS "spam_select" ON public.b0_api_spam_kalkani;
DROP POLICY IF EXISTS "spam_update" ON public.b0_api_spam_kalkani;
CREATE POLICY "spam_service" ON public.b0_api_spam_kalkani FOR ALL TO service_role USING (true);

-- b0_sistem_loglari (server tarafı service_role ile yazar)
DROP POLICY IF EXISTS "log_insert_allow" ON public.b0_sistem_loglari;
DROP POLICY IF EXISTS "log_select_allow" ON public.b0_sistem_loglari;
DROP POLICY IF EXISTS "service_tam"      ON public.b0_sistem_loglari;
CREATE POLICY "sistem_log_okuma"   ON public.b0_sistem_loglari FOR SELECT TO authenticated USING (true);
CREATE POLICY "sistem_log_service" ON public.b0_sistem_loglari FOR ALL TO service_role USING (true);

-- b1_ajan_gorevler (botlar service_role ile çalışır)
DROP POLICY IF EXISTS "anon_ekle"    ON public.b1_ajan_gorevler;
DROP POLICY IF EXISTS "anon_guncelle" ON public.b1_ajan_gorevler;
DROP POLICY IF EXISTS "anon_oku"     ON public.b1_ajan_gorevler;
DROP POLICY IF EXISTS "service_tam"  ON public.b1_ajan_gorevler;
DROP POLICY IF EXISTS "servis_tam"   ON public.b1_ajan_gorevler;
CREATE POLICY "ajan_gorev_okuma"   ON public.b1_ajan_gorevler FOR SELECT TO authenticated USING (true);
CREATE POLICY "ajan_gorev_service" ON public.b1_ajan_gorevler FOR ALL TO service_role USING (true);

-- b1_personel_performans
DROP POLICY IF EXISTS "performans_okuma_herkes" ON public.b1_personel_performans;
DROP POLICY IF EXISTS "performans_yazma_herkes" ON public.b1_personel_performans;
CREATE POLICY "performans_okuma"   ON public.b1_personel_performans FOR SELECT TO authenticated USING (true);
CREATE POLICY "performans_yazma"   ON public.b1_personel_performans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "performans_guncelleme" ON public.b1_personel_performans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "performans_service" ON public.b1_personel_performans FOR ALL TO service_role USING (true);

-- b1_piyasa_gozlem
DROP POLICY IF EXISTS "Ajan Yazar" ON public.b1_piyasa_gozlem;
DROP POLICY IF EXISTS "Herkes Okur" ON public.b1_piyasa_gozlem;
CREATE POLICY "piyasa_okuma"   ON public.b1_piyasa_gozlem FOR SELECT TO authenticated USING (true);
CREATE POLICY "piyasa_service" ON public.b1_piyasa_gozlem FOR ALL TO service_role USING (true);

-- b1_arge_products_karantina
DROP POLICY IF EXISTS "Anonim kullanıcılar okuyabilir" ON public.b1_arge_products_karantina;
DROP POLICY IF EXISTS "Servis rolleri serbest"        ON public.b1_arge_products_karantina;
CREATE POLICY "karantina_okuma"   ON public.b1_arge_products_karantina FOR SELECT TO authenticated USING (true);
CREATE POLICY "karantina_service" ON public.b1_arge_products_karantina FOR ALL TO service_role USING (true);

-- b1_mesaj_okundu_log
DROP POLICY IF EXISTS "okundu_log_okuma" ON public.b1_mesaj_okundu_log;
DROP POLICY IF EXISTS "okundu_log_yazma" ON public.b1_mesaj_okundu_log;
CREATE POLICY "okundu_okuma"   ON public.b1_mesaj_okundu_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "okundu_yazma"   ON public.b1_mesaj_okundu_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "okundu_service" ON public.b1_mesaj_okundu_log FOR ALL TO service_role USING (true);

-- b1_uretim_kayitlari (zaten drop edildi, policy yok ise ekle)
DROP POLICY IF EXISTS "uretim_kayit_acik" ON public.b1_uretim_kayitlari;
CREATE POLICY "uretim_kayit_okuma"   ON public.b1_uretim_kayitlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "uretim_kayit_yazma"   ON public.b1_uretim_kayitlari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "uretim_kayit_service" ON public.b1_uretim_kayitlari FOR ALL TO service_role USING (true);

-- b2_kategoriler
DROP POLICY IF EXISTS "allow_all"       ON public.b2_kategoriler;
DROP POLICY IF EXISTS "p_b2_kategori"   ON public.b2_kategoriler;
DROP POLICY IF EXISTS "service_tam"     ON public.b2_kategoriler;
CREATE POLICY "kategori_okuma"   ON public.b2_kategoriler FOR SELECT TO authenticated USING (true);
CREATE POLICY "kategori_yazma"   ON public.b2_kategoriler FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "kategori_guncelleme" ON public.b2_kategoriler FOR UPDATE TO authenticated USING (true);
CREATE POLICY "kategori_service" ON public.b2_kategoriler FOR ALL TO service_role USING (true);

-- b2_malzeme_katalogu
DROP POLICY IF EXISTS "Tum_Kullanicilar_Gorebilir"   ON public.b2_malzeme_katalogu;
DROP POLICY IF EXISTS "Yetkililer_Ekleme_Yapabilir"  ON public.b2_malzeme_katalogu;
DROP POLICY IF EXISTS "Yetkililer_Guncelleyebilir"   ON public.b2_malzeme_katalogu;
CREATE POLICY "malzeme_okuma"   ON public.b2_malzeme_katalogu FOR SELECT TO authenticated USING (true);
CREATE POLICY "malzeme_yazma"   ON public.b2_malzeme_katalogu FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "malzeme_guncelleme" ON public.b2_malzeme_katalogu FOR UPDATE TO authenticated USING (true);
CREATE POLICY "malzeme_service" ON public.b2_malzeme_katalogu FOR ALL TO service_role USING (true);

-- b2_urun_katalogu
DROP POLICY IF EXISTS "anon_katalog_okur" ON public.b2_urun_katalogu;
DROP POLICY IF EXISTS "p_b2_urun"         ON public.b2_urun_katalogu;
DROP POLICY IF EXISTS "service_tam"       ON public.b2_urun_katalogu;
CREATE POLICY "urun_okuma"   ON public.b2_urun_katalogu FOR SELECT TO authenticated USING (true);
CREATE POLICY "urun_yazma"   ON public.b2_urun_katalogu FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "urun_guncelleme" ON public.b2_urun_katalogu FOR UPDATE TO authenticated USING (true);
CREATE POLICY "urun_service" ON public.b2_urun_katalogu FOR ALL TO service_role USING (true);

-- cameras (kameralar service_role key ile bağlanmalı)
DROP POLICY IF EXISTS "cam_select"      ON public.cameras;
DROP POLICY IF EXISTS "cameras_insert"  ON public.cameras;
DROP POLICY IF EXISTS "cameras_select"  ON public.cameras;
DROP POLICY IF EXISTS "cameras_update"  ON public.cameras;
CREATE POLICY "kamera_okuma"   ON public.cameras FOR SELECT TO authenticated USING (true);
CREATE POLICY "kamera_service" ON public.cameras FOR ALL TO service_role USING (true);

-- camera_events
DROP POLICY IF EXISTS "Ajanlar Data Yazar - Insert"          ON public.camera_events;
DROP POLICY IF EXISTS "Kameraları Gorme Yetkisi - Select"    ON public.camera_events;
DROP POLICY IF EXISTS "camera_events_insert"                 ON public.camera_events;
DROP POLICY IF EXISTS "camera_events_select"                 ON public.camera_events;
DROP POLICY IF EXISTS "ev_ins"                               ON public.camera_events;
DROP POLICY IF EXISTS "ev_sel"                               ON public.camera_events;
CREATE POLICY "event_okuma"   ON public.camera_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_service" ON public.camera_events FOR ALL TO service_role USING (true);

-- camera_access_log
DROP POLICY IF EXISTS "cam_log_insert" ON public.camera_access_log;
DROP POLICY IF EXISTS "cam_log_select" ON public.camera_access_log;
DROP POLICY IF EXISTS "log_ins"        ON public.camera_access_log;
DROP POLICY IF EXISTS "log_sel"        ON public.camera_access_log;
CREATE POLICY "camlog_okuma"   ON public.camera_access_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "camlog_service" ON public.camera_access_log FOR ALL TO service_role USING (true);

-- model_memory_embeddings
DROP POLICY IF EXISTS "Enable all for authenticated users on memory" ON public.model_memory_embeddings;
DROP POLICY IF EXISTS "service_tam" ON public.model_memory_embeddings;
CREATE POLICY "memory_okuma"   ON public.model_memory_embeddings FOR SELECT TO authenticated USING (true);
CREATE POLICY "memory_service" ON public.model_memory_embeddings FOR ALL TO service_role USING (true);

-- production_logs
DROP POLICY IF EXISTS "anon_all"                       ON public.production_logs;
DROP POLICY IF EXISTS "production_logs_authenticated_read" ON public.production_logs;
DROP POLICY IF EXISTS "service_role_production_all"    ON public.production_logs;
DROP POLICY IF EXISTS "service_tam"                    ON public.production_logs;
CREATE POLICY "prodlog_okuma"   ON public.production_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "prodlog_service" ON public.production_logs FOR ALL TO service_role USING (true);

-- personel_saat_kayitlari
DROP POLICY IF EXISTS "anon_erisim" ON public.personel_saat_kayitlari;
DROP POLICY IF EXISTS "service_tam" ON public.personel_saat_kayitlari;
CREATE POLICY "saat_kayit_okuma"   ON public.personel_saat_kayitlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "saat_kayit_yazma"   ON public.personel_saat_kayitlari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "saat_kayit_service" ON public.personel_saat_kayitlari FOR ALL TO service_role USING (true);

-- ara_kontrol
DROP POLICY IF EXISTS "anon_erisim" ON public.ara_kontrol;
DROP POLICY IF EXISTS "service_tam" ON public.ara_kontrol;
CREATE POLICY "ara_kontrol_service" ON public.ara_kontrol FOR ALL TO service_role USING (true);

-- ilk_urun_hazirlama
DROP POLICY IF EXISTS "anon_erisim" ON public.ilk_urun_hazirlama;
DROP POLICY IF EXISTS "service_tam" ON public.ilk_urun_hazirlama;
CREATE POLICY "ilk_urun_service" ON public.ilk_urun_hazirlama FOR ALL TO service_role USING (true);

-- parti_kabul
DROP POLICY IF EXISTS "anon_erisim" ON public.parti_kabul;
DROP POLICY IF EXISTS "service_tam" ON public.parti_kabul;
CREATE POLICY "parti_service" ON public.parti_kabul FOR ALL TO service_role USING (true);

-- model_islem_sirasi
DROP POLICY IF EXISTS "anon_erisim" ON public.model_islem_sirasi;
DROP POLICY IF EXISTS "service_tam" ON public.model_islem_sirasi;
CREATE POLICY "model_islem_service" ON public.model_islem_sirasi FOR ALL TO service_role USING (true);

-- uretim_giris_parcalar / uretim_giris_parcalari / uretim_girisleri / urun_fazlari
DROP POLICY IF EXISTS "anon_erisim" ON public.uretim_giris_parcalar;
DROP POLICY IF EXISTS "service_tam" ON public.uretim_giris_parcalar;
CREATE POLICY "ugp_service" ON public.uretim_giris_parcalar FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "anon_erisim" ON public.uretim_giris_parcalari;
DROP POLICY IF EXISTS "service_tam" ON public.uretim_giris_parcalari;
CREATE POLICY "ugpa_service" ON public.uretim_giris_parcalari FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "anon_erisim" ON public.uretim_girisleri;
DROP POLICY IF EXISTS "service_tam" ON public.uretim_girisleri;
CREATE POLICY "ug_service" ON public.uretim_girisleri FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "anon_erisim" ON public.urun_fazlari;
DROP POLICY IF EXISTS "service_tam" ON public.urun_fazlari;
CREATE POLICY "uf_service" ON public.urun_fazlari FOR ALL TO service_role USING (true);

-- b1_kamas_olaylari / b1_modelhane_kayitlari
DROP POLICY IF EXISTS "Kamera Edge kuryesi veri gönderebilir"            ON public.b1_kamera_olaylari;
DROP POLICY IF EXISTS "Kamera logları güncellenemez"                     ON public.b1_kamera_olaylari;
DROP POLICY IF EXISTS "Kamera logları silinemez"                         ON public.b1_kamera_olaylari;
DROP POLICY IF EXISTS "Sadece yetkili personeller kamera olaylarını görebilir" ON public.b1_kamera_olaylari;
CREATE POLICY "kamera_olay_okuma"   ON public.b1_kamera_olaylari FOR SELECT TO authenticated USING (true);
CREATE POLICY "kamera_olay_service" ON public.b1_kamera_olaylari FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "modelhane_okuma"   ON public.b1_modelhane_kayitlari;
DROP POLICY IF EXISTS "modelhane_yazma"   ON public.b1_modelhane_kayitlari;
DROP POLICY IF EXISTS "modelhane_acik"    ON public.b1_modelhane_kayitlari;
DROP POLICY IF EXISTS "modelhane_service" ON public.b1_modelhane_kayitlari;
CREATE POLICY "modelhane_okuma"   ON public.b1_modelhane_kayitlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "modelhane_yazma"   ON public.b1_modelhane_kayitlari FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "modelhane_service" ON public.b1_modelhane_kayitlari FOR ALL TO service_role USING (true);

-- prim_kayitlari
DROP POLICY IF EXISTS "prim_service_only" ON public.prim_kayitlari;
DROP POLICY IF EXISTS "service_role_prim_all" ON public.prim_kayitlari;
DROP POLICY IF EXISTS "service_tam" ON public.prim_kayitlari;
CREATE POLICY "prim_okuma"   ON public.prim_kayitlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "prim_service" ON public.prim_kayitlari FOR ALL TO service_role USING (true);

-- karar_arsivi / kesim_planlari / orders / yari_mamul_stok (public SELECT kaldır)
DROP POLICY IF EXISTS "karar_arsivi_authenticated_read" ON public.karar_arsivi;
CREATE POLICY "karar_okuma" ON public.karar_arsivi FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "kesim_planlari_authenticated_read" ON public.kesim_planlari;
CREATE POLICY "kesimplan_okuma" ON public.kesim_planlari FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "orders_authenticated_read" ON public.orders;
CREATE POLICY "orders_okuma" ON public.orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "yari_mamul_stok_authenticated_read" ON public.yari_mamul_stok;
CREATE POLICY "yari_mamul_okuma" ON public.yari_mamul_stok FOR SELECT TO authenticated USING (true);

-- quality_checks / production_logs
DROP POLICY IF EXISTS "anon_all"                         ON public.quality_checks;
DROP POLICY IF EXISTS "quality_checks_authenticated_read" ON public.quality_checks;
CREATE POLICY "quality_okuma" ON public.quality_checks FOR SELECT TO authenticated USING (true);

-- b0_herm_ai_kararlar (public INSERT açık)
DROP POLICY IF EXISTS "herm_yazma" ON public.b0_herm_ai_kararlar;
CREATE POLICY "herm_yazma" ON public.b0_herm_ai_kararlar FOR INSERT TO service_role WITH CHECK (true);

-- b1_operasyon_tanimlari
DROP POLICY IF EXISTS "operasyon_okuma_herkes" ON public.b1_operasyon_tanimlari;
CREATE POLICY "operasyon_okuma" ON public.b1_operasyon_tanimlari FOR SELECT TO authenticated USING (true);
CREATE POLICY "operasyon_service" ON public.b1_operasyon_tanimlari FOR ALL TO service_role USING (true);

-- ═══ SON DOĞRULAMA ═══════════════════════════════════════════
-- Bu sorgu 0 satır döndürmeli
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND (
    'anon' = ANY(roles)
    OR (roles::text = '{public}' AND qual = 'true')
)
ORDER BY tablename;
