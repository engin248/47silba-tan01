-- M2 KÂR KİLİDİ VE YALITILMIŞ FİNANS TABLOSU
-- Patron Kuralı: "Kâr-zarar işlemlerini sadece görmesi gereken yöneticiler görebilsin. Yetkisi, faydası kadar olsun."

CREATE TABLE IF NOT EXISTS public.m2_finans_veto (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    urun_id UUID REFERENCES public.b1_arge_products(id) ON DELETE CASCADE,
    
    -- GİRDİLER (Dinamik öğrenme için sonradan güncellenecek)
    kumas_maliyeti NUMERIC(10,2) NOT NULL,
    iscilik_maliyeti NUMERIC(10,2) NOT NULL,
    kargo_ve_paketleme NUMERIC(10,2) NOT NULL,
    
    -- RİSK VE FİRE
    beklenen_fire_orani NUMERIC(5,2) DEFAULT 0.05, -- %5 Fire
    tahmini_iade_orani NUMERIC(5,2) DEFAULT 0.15, -- %15 Trendyol iade geneli
    
    -- MATEMATİKSEL ÇIKTILAR
    net_birim_maliyet NUMERIC(10,2) NOT NULL,
    tavsiye_satis_fiyati NUMERIC(10,2) NOT NULL,
    beklenen_net_kar NUMERIC(10,2) NOT NULL,
    
    -- YAPAY ZEKA ONAYI
    kar_kilidi_onayi BOOLEAN DEFAULT false, -- Zarar ediyorsa sistem kilitler
    ai_finans_yorumu TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ASKERİ GÜVENLİK ZIRHI (RLS - Row Level Security)
ALTER TABLE public.m2_finans_veto ENABLE ROW LEVEL SECURITY;

-- 1. SİSTEM (Yapay Zeka / Botlar) her türlü veriyi yazabilir
CREATE POLICY "Servis Rolü (Yapay Zeka) tam yetkili ekleme/düzenleme yapar"
ON public.m2_finans_veto
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. KÖMÜR KARASI GİZLİLİK: Sadece Yetkisi 'yonetici' olanlar parayı görebilir!
-- Normal çalışan (authenticated) yetkisi 'yonetici' değilse bu tablonun varlığından bile haberi olmaz.
CREATE POLICY "Sadece Yöneticiler ve Patron Finans Tablosunu Görebilir"
ON public.m2_finans_veto
FOR SELECT
TO authenticated
USING (
    -- Kullanıcının JWT token'ında (metadata) yetki='yonetici' veya role='admin' olması şartı
    auth.jwt() -> 'user_metadata' ->> 'yetki' = 'yonetici'
    OR auth.jwt() ->> 'role' = 'admin'
);
