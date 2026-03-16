-- ==============================================================================
-- 47 SİL BAŞTAN — EKSİK VERİTABANI TABLOSU (Ar-Ge Modülü İçin)
-- Kullanım: Bu kodu kopyalayıp Supabase Dashboard -> SQL Editor üzerine yapıştırın
-- ve "RUN" butonuna basarak Execute (Çalıştır) ediniz. Konsoldaki 400 hatasını çözecektir.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.b0_herm_ai_kararlar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_referans_id UUID,
    karar TEXT NOT NULL,
    guven_skoru INTEGER NOT NULL,
    ajan_tavsiyesi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tablo Yetkilendirme (RLS) İşlemleri
ALTER TABLE public.b0_herm_ai_kararlar ENABLE ROW LEVEL SECURITY;

-- Eski policy varsa düşür ve herkesin okuma/yazma/ekleme yapabileceği genel kuralı tanımla
DROP POLICY IF EXISTS "hermai_acik_erisim" ON public.b0_herm_ai_kararlar;
CREATE POLICY "hermai_acik_erisim" ON public.b0_herm_ai_kararlar FOR ALL USING (true);
