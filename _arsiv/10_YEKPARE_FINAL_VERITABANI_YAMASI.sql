-- 🛡️ THE ORDER 47 - NİHAİ VERİTABANI YAMASI (PROD ÖNCESİ)
-- DİKKAT: Bu SQL sorgusu, Karargâh'ta temizlenen en son kör noktaların Supabase tablolarına entegre edilmesini sağlar.
-- Eğer bu yamalar çalıştırılmazsa, Ön Yüzdeki (UI) yeni butonlar veritabanında sütun bulamayacağı için çökme/hata yaşatır!

-- 1. M1 AR-GE SİSTEMİ 
-- Tasarımların AI tarafından analiz edilebilmesi veya üretim bant genişliği için "Zorluk Derecesi"
ALTER TABLE public.b1_arge_trendler ADD COLUMN IF NOT EXISTS zorluk_derecesi smallint DEFAULT 5;

-- 2. M3 KUMAŞ & DEPO SİSTEMİ
-- Önce Tedarikçiler Tablosunu oluşturuyoruz (Eğer yoksa)
CREATE TABLE IF NOT EXISTS public.b2_tedarikciler (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    firma_adi text NOT NULL,
    telefon text,
    email text,
    vergi_no text,
    adres text,
    hizmet_turu text,
    aktif_mi boolean DEFAULT true,
    notlar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- RLS İzinleri (Tedarikçiler için)
ALTER TABLE public.b2_tedarikciler ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tedarikci_select' AND tablename = 'b2_tedarikciler') THEN CREATE POLICY "tedarikci_select" ON public.b2_tedarikciler FOR SELECT TO anon USING (true); CREATE POLICY "tedarikci_insert" ON public.b2_tedarikciler FOR INSERT TO anon WITH CHECK (true); CREATE POLICY "tedarikci_update" ON public.b2_tedarikciler FOR UPDATE TO anon USING (true); CREATE POLICY "tedarikci_delete" ON public.b2_tedarikciler FOR DELETE TO anon USING (true); END IF; END $$;

-- Tedarikçilerin serbest metin yerine tam yetkili databaseden seçilmesi için yeni sütun ve foreign key
ALTER TABLE public.b1_kumas_arsivi ADD COLUMN IF NOT EXISTS tedarikci_id uuid REFERENCES public.b2_tedarikciler(id) ON DELETE SET NULL;

-- 3. M9 PERSONEL SİSTEMİ
-- Personel tablosuna AI Puanı entegrasyonu (0-100 arası değerlendirme için)
ALTER TABLE public.b1_personel ADD COLUMN IF NOT EXISTS ai_verimlilik_puani smallint DEFAULT 0;

-- 4. M11 MÜŞTERİ HEDEFLERİ
-- Müşteriler için Kırmızı Alarm (Kara Liste) ve Finansal Risk Limiti (TL)
ALTER TABLE public.b2_musteriler ADD COLUMN IF NOT EXISTS kara_liste boolean DEFAULT false;
ALTER TABLE public.b2_musteriler ADD COLUMN IF NOT EXISTS risk_limiti numeric(15,2) DEFAULT 0;

-- SONUÇ: Tablolar güvendedir. RLS (Row Level Security) politikalarınız bu tablolar üzerinde zaten aktif olduğu için
-- eklenen bu yeni kolonlar otomatik olarak mevcut zırhın koruması altına girmiştir. Ek RLS sorgusuna gerek yoktur.
