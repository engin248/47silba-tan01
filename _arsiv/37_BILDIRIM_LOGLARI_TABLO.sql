-- ========================================================================================
-- THE ORDER 47 - B0 BİLDİRİM LOGLARI TABLOSU (bildirim.js merkezi katmanı için)
-- Neden: src/lib/bildirim.js her bildirimi bu tabloya yazar. Tablo yoksa hata verir.
-- ========================================================================================

CREATE TABLE IF NOT EXISTS public.b0_bildirim_loglari (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mesaj text NOT NULL,
    oncelik varchar(20) DEFAULT 'normal' CHECK (oncelik IN ('normal', 'acil', 'kritik')),
    modul varchar(100) NOT NULL DEFAULT 'sistem',
    kullanici varchar(200) DEFAULT 'Sistem',
    ek_bilgi text,
    ortam varchar(20) DEFAULT 'development',
    telegram_gitti boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.b0_bildirim_loglari ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'b0_bildirim_loglari' 
        AND policyname = 'b0_bildirim_herkes_okuyabilir'
    ) THEN
        CREATE POLICY "b0_bildirim_herkes_okuyabilir"
            ON public.b0_bildirim_loglari FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'b0_bildirim_loglari' 
        AND policyname = 'b0_bildirim_herkes_yazabilir'
    ) THEN
        CREATE POLICY "b0_bildirim_herkes_yazabilir"
            ON public.b0_bildirim_loglari FOR INSERT WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_b0_bildirim_oncelik ON public.b0_bildirim_loglari(oncelik);
CREATE INDEX IF NOT EXISTS idx_b0_bildirim_created ON public.b0_bildirim_loglari(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_b0_bildirim_modul ON public.b0_bildirim_loglari(modul);
