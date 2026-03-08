-- ==============================================================================
-- 47 SİL BAŞTAN SİSTEMİ - AŞAĞIDAN YUKARIYA VERİTABANI YENİLEME VE GENİŞLETME
-- (Obezite Cerrahisi & Yeni Eklentiler - C-Level Analiz Doğrultusunda)
-- ==============================================================================

-- 1. [M1 Ar-Ge] Üretilebilirlik Zorluğu Sütunu
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_arge_trendler' AND column_name='zorluk_derecesi') THEN
        ALTER TABLE public.b1_arge_trendler ADD COLUMN zorluk_derecesi integer DEFAULT 5;
    END IF;
END $$;

-- 2. [M2 Kumaş] Tedarikçi Yönetimi ve Referansları
CREATE TABLE IF NOT EXISTS public.b2_tedarikciler (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    isim text NOT NULL,
    telefon text,
    kategori text DEFAULT 'Kumaş', -- Kumaş, Aksesuar, Fason
    created_at timestamp with time zone DEFAULT now()
);

-- Policy (Herkes görebilir ve ekleyebilir, Admin/Uretim silebilir)
ALTER TABLE public.b2_tedarikciler ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tedarikci_select' AND tablename = 'b2_tedarikciler') THEN
        CREATE POLICY "tedarikci_select" ON public.b2_tedarikciler FOR SELECT TO anon USING (true);
        CREATE POLICY "tedarikci_insert" ON public.b2_tedarikciler FOR INSERT TO anon WITH CHECK (true);
        CREATE POLICY "tedarikci_update" ON public.b2_tedarikciler FOR UPDATE TO anon USING (true);
        CREATE POLICY "tedarikci_delete" ON public.b2_tedarikciler FOR DELETE TO anon USING (true);
    END IF;
END $$;

-- Kumaş tablosuna sütun olarak ekle (ForeignKey)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_kumas_arsivi' AND column_name='tedarikci_id') THEN
        ALTER TABLE public.b1_kumas_arsivi ADD COLUMN tedarikci_id uuid REFERENCES public.b2_tedarikciler(id) ON DELETE SET NULL;
    END IF;
END $$;


-- 3. [M4 Kalıp] DXF / Dijital Format Kalıp Yükleme Bağlantısı
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_model_kaliplari' AND column_name='kalip_dosya_url') THEN
        ALTER TABLE public.b1_model_kaliplari ADD COLUMN kalip_dosya_url text;
    END IF;
END $$;

-- Storage Bucket: Kalıplar
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kalip_dosyalar', 'kalip_dosyalar', true)
ON CONFLICT (id) DO NOTHING;


-- 4. [M7 Kasa] Çek, Senet, Veresiye ve Vade Takip Tablosu
CREATE TABLE IF NOT EXISTS public.b2_cek_senet_vade (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    belge_turu text NOT NULL, -- 'cek', 'senet', 'kredi_karti', 'veresiye'
    firma_kisi text NOT NULL,
    tutar numeric NOT NULL,
    para_birimi text DEFAULT 'TL',
    vade_tarihi date NOT NULL,
    durum text DEFAULT 'bekliyor', -- 'odendi', 'bekliyor', 'karsiliksiz'
    aciklama text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.b2_cek_senet_vade ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cekler_select' AND tablename = 'b2_cek_senet_vade') THEN
        CREATE POLICY "cekler_select" ON public.b2_cek_senet_vade FOR SELECT TO anon USING (true);
        CREATE POLICY "cekler_insert" ON public.b2_cek_senet_vade FOR INSERT TO anon WITH CHECK (true);
        CREATE POLICY "cekler_update" ON public.b2_cek_senet_vade FOR UPDATE TO anon USING (true);
        CREATE POLICY "cekler_delete" ON public.b2_cek_senet_vade FOR DELETE TO anon USING (true);
    END IF;
END $$;


-- 5. [M9 Personel] Sistem Atamalı AI Verimlilik (Puantaj Puanı)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b1_personel' AND column_name='ai_verimlilik_puani') THEN
        ALTER TABLE public.b1_personel ADD COLUMN ai_verimlilik_puani integer DEFAULT 0;
    END IF;
END $$;


-- 6. [M11 Müşteriler] Sicil ve Risk Limiti
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='b2_musteriler' AND column_name='risk_limiti') THEN
        ALTER TABLE public.b2_musteriler ADD COLUMN risk_limiti numeric DEFAULT 0;
    END IF;
END $$;

-- REALTIME'a ZORUNLU EKLENMESİ GEREKEN YENİ TABLOLAR
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'b2_tedarikciler') THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.b2_tedarikciler';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'b2_cek_senet_vade') THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.b2_cek_senet_vade';
    END IF;
END $$;
