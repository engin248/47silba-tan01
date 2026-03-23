-- B3_URETILEN_TASARIMLAR TABLOSU (M3 Kalıphane Öncesi - Bot 8 AI Tasarımları)
-- Bu tablo Baş Tasarımcı (Bot 8) AI'sının ürettiği Frankenstein (Sentez) tasarımlarını ve görsel çıktıları barındırır.

CREATE TABLE IF NOT EXISTS public.b3_uretilen_tasarimlar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tasarim_adi VARCHAR(255) NOT NULL,
    kumas_dokusu TEXT,
    ai_prompt TEXT NOT NULL,
    yapay_zeka_gorseli TEXT, -- Image URL (Midjourney/DALL-E)
    patrona_not TEXT,
    onay_durumu VARCHAR(50) DEFAULT 'BEKLIYOR', -- BEKLIYOR, ONAYLANDI (M3'E GIDER), RED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- RLS (Row Level Security) KURALLARI
ALTER TABLE public.b3_uretilen_tasarimlar ENABLE ROW LEVEL SECURITY;

-- 1. Yetkili Servis (Service Role) Tam Yetkilidir:
CREATE POLICY "Servis Rolü (Bot 8) tasarımları tam yönetebilir"
ON public.b3_uretilen_tasarimlar
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Dışarıdan okuma iptal, sadece Yetkili kullanıcı okuyabilir
CREATE POLICY "Sadece yetkili kullanıcılar (Patron) tasarımları okuyabilir"
ON public.b3_uretilen_tasarimlar
FOR SELECT
TO authenticated
USING (true);

-- Otomatik update_at tetikleyicisi
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.b3_uretilen_tasarimlar
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime (updated_at);
