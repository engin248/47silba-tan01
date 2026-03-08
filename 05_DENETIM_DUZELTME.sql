-- ====================================================================
-- 47 SİL BAŞTAN — TAM SUPABASE DENETİM DÜZELTME SQLi
-- Tarih: 2026-03-07
-- Bu dosyayı Supabase SQL Editor'da SIRASIYA çalıştırın
-- ====================================================================

-- ─── SORGU 1: Foreign Key Sorunlarını Düzelt ─────────────────────
-- production_orders ve users tabloları silindi → bağımlı FK'ları kaldır

ALTER TABLE public.b1_maliyet_kayitlari
    DROP CONSTRAINT IF EXISTS b1_maliyet_kayitlari_order_id_fkey,
    DROP CONSTRAINT IF EXISTS b1_maliyet_kayitlari_personel_id_fkey;

ALTER TABLE public.b1_muhasebe_raporlari
    DROP CONSTRAINT IF EXISTS b1_muhasebe_raporlari_order_id_fkey,
    DROP CONSTRAINT IF EXISTS b1_muhasebe_raporlari_onaylayan_id_fkey;

ALTER TABLE public.b1_model_taslaklari
    DROP CONSTRAINT IF EXISTS b1_model_taslaklari_tasarimci_id_fkey;

ALTER TABLE public.b1_arge_trendler
    DROP CONSTRAINT IF EXISTS b1_arge_trendler_olusturan_id_fkey;

ALTER TABLE public.b1_numune_uretimleri
    DROP CONSTRAINT IF EXISTS b1_numune_uretimleri_diken_id_fkey;

ALTER TABLE public.b1_model_kaliplari
    DROP CONSTRAINT IF EXISTS b1_model_kaliplari_olusturan_id_fkey;

ALTER TABLE public.b1_kesim_is_emirleri
    DROP CONSTRAINT IF EXISTS b1_kesim_is_emirleri_yapan_id_fkey;

ALTER TABLE public.b1_dikim_talimatlari
    DROP CONSTRAINT IF EXISTS b1_dikim_talimatlari_olusturan_id_fkey;

ALTER TABLE public.b1_muhasebe_raporlari
    DROP CONSTRAINT IF EXISTS b1_muhasebe_raporlari_onaylayan_id_fkey;

-- ─── SORGU 2: Eksik kolonları ekle ───────────────────────────────

-- b2_kasa_hareketleri'ne vade_tarihi kolonu (Karargah alarm sistemi kullanıyor)
ALTER TABLE public.b2_kasa_hareketleri
    ADD COLUMN IF NOT EXISTS vade_tarihi timestamptz;

-- b1_model_taslaklari'na hedef_adet ve hedef_kitle
ALTER TABLE public.b1_model_taslaklari
    ADD COLUMN IF NOT EXISTS hedef_adet integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hedef_kitle text,
    ADD COLUMN IF NOT EXISTS sezon text;

-- b2_siparisler'e acil kolonu (daha önce eklendi ama kontrol)
ALTER TABLE public.b2_siparisler
    ADD COLUMN IF NOT EXISTS acil boolean DEFAULT false;

-- b1_muhasebe_raporlari'na model_adi ve model_kodu (direkt join olmadan)
ALTER TABLE public.b1_muhasebe_raporlari
    ADD COLUMN IF NOT EXISTS model_adi text,
    ADD COLUMN IF NOT EXISTS model_kodu text,
    ADD COLUMN IF NOT EXISTS hedeflenen_maliyet_tl numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rapor_durumu text DEFAULT 'taslak',
    ADD COLUMN IF NOT EXISTS onay_tarihi timestamptz;

-- ─── SORGU 3: Eksik RLS Politikaları ─────────────────────────────

ALTER TABLE public.b1_gorevler ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_b1_gorevler" ON public.b1_gorevler;
CREATE POLICY "anon_b1_gorevler" ON public.b1_gorevler FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.b1_aksesuar_arsivi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_b1_aksesuar" ON public.b1_aksesuar_arsivi;
CREATE POLICY "anon_b1_aksesuar_arsivi" ON public.b1_aksesuar_arsivi FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.b1_numune_uretimleri ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_b1_numune_uretimleri" ON public.b1_numune_uretimleri;
CREATE POLICY "anon_b1_numune_uretimleri" ON public.b1_numune_uretimleri FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.b1_dikim_talimatlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_b1_dikim_talimatlari" ON public.b1_dikim_talimatlari;
CREATE POLICY "anon_b1_dikim_talimatlari" ON public.b1_dikim_talimatlari FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.b1_kesim_is_emirleri ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_b1_kesim_is_emirleri" ON public.b1_kesim_is_emirleri;
CREATE POLICY "anon_b1_kesim_is_emirleri" ON public.b1_kesim_is_emirleri FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.b1_ara_is_emirleri ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_b1_ara_is_emirleri" ON public.b1_ara_is_emirleri;
CREATE POLICY "anon_b1_ara_is_emirleri" ON public.b1_ara_is_emirleri FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.b1_model_kaliplari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_b1_model_kaliplari" ON public.b1_model_kaliplari;
CREATE POLICY "anon_b1_model_kaliplari" ON public.b1_model_kaliplari FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.b1_model_malzeme_listesi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_b1_model_malzeme_listesi" ON public.b1_model_malzeme_listesi;
CREATE POLICY "anon_b1_model_malzeme_listesi" ON public.b1_model_malzeme_listesi FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.b1_sistem_uyarilari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_b1_sistem_uyarilari" ON public.b1_sistem_uyarilari;
CREATE POLICY "anon_b1_sistem_uyarilari" ON public.b1_sistem_uyarilari FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.b1_agent_loglari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_b1_agent_loglari" ON public.b1_agent_loglari;
CREATE POLICY "anon_b1_agent_loglari" ON public.b1_agent_loglari FOR ALL TO anon USING (true) WITH CHECK (true);
