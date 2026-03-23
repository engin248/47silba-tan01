-- ============================================================
-- 47 SİL BAŞTAN — EKSİK TABLO KURULUMU (REVİZE)
-- Sadece gerçekten eksik olan 2 tablo
-- Supabase SQL Editor'de çalıştırın
-- ============================================================

-- ── 1. b1_uretim_kayitlari (Ajan Zincir: Üretim Takip) ─────
-- Kullanıldığı yer: ajanlar-v2.js (M6 zincir, günlük özet, kapanış)
CREATE TABLE IF NOT EXISTS public.b1_uretim_kayitlari (
    id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id                UUID,
    personel_id             UUID,
    bant_no                 INTEGER,
    uretilen_adet           INTEGER DEFAULT 0,
    fire_adet               INTEGER DEFAULT 0,
    durum                   VARCHAR(30) DEFAULT 'devam',
    zincir_bildirim_m7      TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.b1_uretim_kayitlari ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uretim_kayit_acik" ON public.b1_uretim_kayitlari FOR ALL USING (true);

-- ── 2. b1_modelhane_kayitlari (Ajan Zincir: Numune Onay) ────
-- Kullanıldığı yer: ajanlar-v2.js (M4→M5 zincir bildirimi)
CREATE TABLE IF NOT EXISTS public.b1_modelhane_kayitlari (
    id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id                UUID,
    islem_tipi              VARCHAR(50),
    aciklama                TEXT,
    durum                   VARCHAR(30) DEFAULT 'bekliyor',
    zincir_bildirim_m5      TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.b1_modelhane_kayitlari ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modelhane_acik" ON public.b1_modelhane_kayitlari FOR ALL USING (true);

-- ── KONTROL ─────────────────────────────────────────────────
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('b1_uretim_kayitlari', 'b1_modelhane_kayitlari')
ORDER BY table_name;
