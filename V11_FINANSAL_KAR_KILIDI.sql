-- THE ORDER - FAZ 2.1: M2 KÂR VE MALİYET KİLİDİ ZIRHI
-- İşletmeyi zarardan koruyan "Matematiksel Filtre"

-- 1. Finansal Hesaplamalar Tablosu
CREATE TABLE IF NOT EXISTS public.m2_finansal_kilit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    urun_id UUID, -- B1 Arge tablosundaki ürünün ID'si
    urun_adi TEXT NOT NULL,
    kategori TEXT NOT NULL,
    
    -- Satış ve Kumaş Metrikleri
    tahmini_satis_fiyati NUMERIC NOT NULL,
    kumas_metre_fiyati NUMERIC NOT NULL,
    tahmini_metraj NUMERIC NOT NULL, -- "Bu elbise kaç metre kumaş yer?"
    kumas_maliyeti NUMERIC NOT NULL, -- (Fiyat * Metraj)
    
    -- FİRE (Kumaş Kesim Çöpü) Miktarı
    fire_orani_yuzde NUMERIC DEFAULT 10,
    fire_maliyeti NUMERIC DEFAULT 0, -- Kumaş Maliyeti * (Fire/100)
    
    -- Üretim (Fason/Dikim) Maliyeti
    dikim_iscilik_maliyeti NUMERIC DEFAULT 0,
    
    -- Lojistik (Kargo ve İade Riski)
    kargo_ds_bedeli NUMERIC DEFAULT 55, -- Gönderim Kargo Ücreti
    iade_olasiligi_yuzde NUMERIC DEFAULT 20, -- Satılamayan/Geri dönen oran
    iade_maliyeti_zarari NUMERIC DEFAULT 0, -- İade Durumunda çöpe giden = (Gidiş + Geliş Kargo + Ambalaj) * İhtimal
    
    -- Operasyonel Zırh (KDV ve Platform Komisyonu)
    pazaryeri_komisyon_yuzde NUMERIC DEFAULT 15,
    komisyon_bedeli NUMERIC DEFAULT 0,
    vergi_kdv NUMERIC DEFAULT 0,
    
    -- KÂR ZARAR SONUCU
    toplam_maliyet NUMERIC DEFAULT 0,
    net_kar_tl NUMERIC DEFAULT 0,
    net_kar_marji_yuzde NUMERIC DEFAULT 0,
    
    -- KARAR DEĞERİ
    finans_karari TEXT DEFAULT 'HESAPLANIYOR', -- KÂRLI_ÜRET veya ZARAR_REDDEDİLDİ
    hermania_finans_raporu TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- GÜVENLİK (RLS): "Sadece Yöneticiler Görebilir"
-- ==========================================
ALTER TABLE public.m2_finansal_kilit ENABLE ROW LEVEL SECURITY;

-- Politikalar: Sisteme sadece sunucu düzeyindeki Service Role (Agent) tam erişim sağlar.
-- Normal kullanıcılar (UI üzerinden) sadece "JWT Rolü" 'admin' veya 'yonetici' ise görebilir.
-- "yetkisi işletmeye faydası kadar olsun bu sınır"
CREATE POLICY "Sadece_Yoneticiler_ve_Server_Gorur" 
ON public.m2_finansal_kilit FOR SELECT
USING (
    current_user = 'postgres' OR 
    (auth.jwt() ->> 'role' = 'admin') OR 
    (auth.jwt() ->> 'role' = 'yonetici') OR
    (auth.jwt() ->> 'email' = 'patron@mizanet.com') -- Örnek patron kilidi
);

CREATE POLICY "Sadece_Server_Insert_Yapar" 
ON public.m2_finansal_kilit FOR INSERT
WITH CHECK (current_user = 'postgres' OR (auth.jwt() ->> 'role' = 'admin'));

CREATE POLICY "Sadece_Server_Update_Yapar" 
ON public.m2_finansal_kilit FOR UPDATE
USING (current_user = 'postgres' OR (auth.jwt() ->> 'role' = 'admin'));

-- Güvenlik endişelerinden M1 tarafında RLS sorun yaratmasın diye Karargah ajanı
-- işlemleri service_role tokeniyle yapacaktır. UI taraflı supabase anon_key JWT'e bağımlı kilitlenir.
