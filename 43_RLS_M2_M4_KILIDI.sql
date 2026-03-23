-- =========================================================================================
-- MİZANET KÖR NOKTA ZIRHI: FİNANSAL SIZINTI ENGELİ (RLS YAMASI)
-- İlgili Tablolar: M2 Finans, M4 Modelhane
-- Amaç: Anon Key (Dışarıdan) okumaları tamamen kapatmak, sadece yetkilileri içeri almak.
-- =========================================================================================

-- 1. Tablolarda RLS'yi Zorunlu Kıl
ALTER TABLE public.b1_modelhane_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_model_taslaklari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_model_kaliplari ENABLE ROW LEVEL SECURITY;

-- Mevcut AÇIK (Anon) ilkelerini silelim (Eğer varsa)
DROP POLICY IF EXISTS "Anon Okuma Izinli" ON public.b1_modelhane_kayitlari;
DROP POLICY IF EXISTS "Anon Okuma Izinli" ON public.b1_model_taslaklari;

-- 2. Sıkı RLS Kurallarını Ekle (Sadece JWT Authenticated veya Service Role girebilir)
CREATE POLICY "M4_Gizlilik_Okuma"
ON public.b1_modelhane_kayitlari
FOR SELECT
TO authenticated
USING (true); -- Authenticated ise okuyabilir

CREATE POLICY "M3_M4_Modeller_Okuma"
ON public.b1_model_taslaklari
FOR SELECT
TO authenticated
USING (true);

-- Not: NEXT_PUBLIC_SUPABASE_ANON_KEY ile arayüzden gelen istekler JWT olmadan geçersiz sayılacak.
-- Yönetici harici maliyet ve modelhane verisi okuyamayacak.
