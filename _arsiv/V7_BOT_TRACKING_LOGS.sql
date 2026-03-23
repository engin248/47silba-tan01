-- V7 BOT TRACKING LOGS: M1 (KARARGAH) %100 İZLENEBİLİRLİK VE 'KILL SWITCH' ALTYAPISI
-- Mizanet Global Agent Rules #9 ve #13 Uyarınca:

CREATE TABLE IF NOT EXISTS public.bot_tracking_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(255) NOT NULL,
    ajan_adi VARCHAR(100) NOT NULL,
    hedef_kavram TEXT NOT NULL,
    ilerleme_yuzdesi INTEGER DEFAULT 0,
    durum VARCHAR(50) DEFAULT 'kuyrukta',
    son_mesaj TEXT,
    rota_url TEXT,
    baslama_zamani TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    son_guncelleme TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_tracking_job ON public.bot_tracking_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_bot_tracking_durum ON public.bot_tracking_logs(durum);

CREATE OR REPLACE FUNCTION update_bot_tracking_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.son_guncelleme = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SET search_path = public;

DROP TRIGGER IF EXISTS trg_bot_tracking_modtime ON public.bot_tracking_logs;
CREATE TRIGGER trg_bot_tracking_modtime
BEFORE UPDATE ON public.bot_tracking_logs
FOR EACH ROW
EXECUTE FUNCTION update_bot_tracking_modtime();

-- Güvenlik (RLS) Yaması - Rules #13 Uyarınca
ALTER TABLE public.bot_tracking_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    CREATE POLICY "Tam erişim genel" ON public.bot_tracking_logs FOR SELECT USING (true);
    CREATE POLICY "Ekleme servis yetkisi" ON public.bot_tracking_logs FOR INSERT WITH CHECK (true);
    CREATE POLICY "Guncelleme servis yetkisi" ON public.bot_tracking_logs FOR UPDATE USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
