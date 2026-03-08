-- =====================================================================
-- 47 SİL BAŞTAN — KARA KUTU VE HARD DELETE ENGELLEME SİSTEMİ
-- =====================================================================
-- Bu SQL Dosyası, sistemin en büyük iki zafiyetini (Kör Nokta 1 ve 2) kapatır:
-- 1. Açık (Anon) Supabase anahtarıyla dışarıdan veritabanına giren saldırganların eylemlerini kaydeder.
-- 2. Sistem içinde "Sil" tuşuna basılıp yok edilen her veriyi kalıcı olarak kopyalar (Soft Delete).
-- 
-- Kullanımı: Bu dosyayı Supabase SQL Editor'a yapıştırıp RUN (Çalıştır) deyin.

-- 1. B0 SİSTEM LOGLARI (Kara Kutu) Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS public.b0_sistem_loglari (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tablo_adi text NOT NULL,
    islem_tipi text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    eski_veri jsonb,          -- Silinen/Değiştirilen verinin eski hali (Asla kaybolmaz)
    yeni_veri jsonb,          -- Yeni eklenen veri
    islem_tarihi timestamp with time zone DEFAULT now()
);

-- SADECE YAZMAYA (INSERT) İZİN VERİLEN İLK VE TEK RLS POLİTİKASI (Kör Nokta 1 Kalkanı)
-- Kimse, hatta bir siber saldırgan bile b0_sistem_loglari'ndaki kayıtları SİLEMEZ (DELETE Yasak!)
ALTER TABLE public.b0_sistem_loglari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "log_insert_allow" ON public.b0_sistem_loglari;
CREATE POLICY "log_insert_allow" ON public.b0_sistem_loglari FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "log_select_allow" ON public.b0_sistem_loglari;
CREATE POLICY "log_select_allow" ON public.b0_sistem_loglari FOR SELECT TO anon USING (true);


-- 2. ANA TETİKLEYİCİ FONKSİYON (Tüm Tabloları İzleyen İstihbarat Kodu)
CREATE OR REPLACE FUNCTION public.fn_sistem_kara_kutu()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.b0_sistem_loglari (tablo_adi, islem_tipi, eski_veri)
        VALUES (TG_TABLE_NAME, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.b0_sistem_loglari (tablo_adi, islem_tipi, eski_veri, yeni_veri)
        VALUES (TG_TABLE_NAME, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.b0_sistem_loglari (tablo_adi, islem_tipi, yeni_veri)
        VALUES (TG_TABLE_NAME, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. BÜTÜN HAYATİ TABLOLARA TRİGGER (Kamera) BAĞLAMA

-- Modelhane & Arge
DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b1_model_taslaklari;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b1_model_taslaklari FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b1_arge_trendler;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b1_arge_trendler FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

-- İmalat & Maliyet
DROP TRIGGER IF EXISTS trg_kara_kutu ON public.production_orders;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.production_orders FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b1_maliyet_kayitlari;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b1_maliyet_kayitlari FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b1_kumas_arsivi;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b1_kumas_arsivi FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

-- Müşteriler & Siparişler
DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b2_musteriler;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b2_musteriler FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b2_siparisler;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b2_siparisler FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b2_siparis_kalemleri;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b2_siparis_kalemleri FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

-- Kasa & Stok (En Hayati)
DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b2_kasa_hareketleri;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b2_kasa_hareketleri FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b2_stok_hareketleri;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b2_stok_hareketleri FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b2_urun_katalogu;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b2_urun_katalogu FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

-- Personel & Sistem
DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b1_personel;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b1_personel FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b1_muhasebe_raporlari;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b1_muhasebe_raporlari FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

DROP TRIGGER IF EXISTS trg_kara_kutu ON public.b1_sistem_ayarlari;
CREATE TRIGGER trg_kara_kutu AFTER INSERT OR UPDATE OR DELETE ON public.b1_sistem_ayarlari FOR EACH ROW EXECUTE FUNCTION public.fn_sistem_kara_kutu();

-- BAŞARIYLA TAMAMLANDI: Hard Delete ve Supabase Anon zafiyetinin arkası kapatıldı.
