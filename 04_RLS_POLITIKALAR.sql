-- =====================================================================
-- 47 SİL BAŞTAN — RLS POLİTİKALARI (03_RLS_TUM_TABLOLAR.sql'dan SONRA)
-- =====================================================================

ALTER TABLE public.b1_model_taslaklari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_arge_trendler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_kumas_arsivi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_personel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_personel_devam ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_maliyet_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_muhasebe_raporlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_sistem_ayarlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_musteriler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_urun_katalogu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_kategoriler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_siparisler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_siparis_kalemleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_stok_hareketleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_kasa_hareketleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_musteri_iletisim ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_b1_model_taslaklari" ON public.b1_model_taslaklari FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b1_arge_trendler" ON public.b1_arge_trendler FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b1_kumas_arsivi" ON public.b1_kumas_arsivi FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b1_personel" ON public.b1_personel FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b1_personel_devam" ON public.b1_personel_devam FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b1_maliyet_kayitlari" ON public.b1_maliyet_kayitlari FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b1_muhasebe_raporlari" ON public.b1_muhasebe_raporlari FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b1_sistem_ayarlari" ON public.b1_sistem_ayarlari FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b2_musteriler" ON public.b2_musteriler FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b2_urun_katalogu" ON public.b2_urun_katalogu FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b2_kategoriler" ON public.b2_kategoriler FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b2_siparisler" ON public.b2_siparisler FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b2_siparis_kalemleri" ON public.b2_siparis_kalemleri FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b2_stok_hareketleri" ON public.b2_stok_hareketleri FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b2_kasa_hareketleri" ON public.b2_kasa_hareketleri FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_b2_musteri_iletisim" ON public.b2_musteri_iletisim FOR ALL TO anon USING (true) WITH CHECK (true);
