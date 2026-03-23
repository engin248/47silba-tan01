-- 37_ARGE_AGENT_SESSION_YAMASI.sql
-- Browser Agent Mimarisinin "Oturum Hafızası" (SESSION_HANDOFF'tan gelen) için gerekli yama

ALTER TABLE public.b1_arge_products 
ADD COLUMN IF NOT EXISTS agent_session_id TEXT,
ADD COLUMN IF NOT EXISTS kaynak_url TEXT,
ADD COLUMN IF NOT EXISTS ham_veri JSONB;

-- Arge İstihbarat sistem uyarı tablosu eksiği
ALTER TABLE public.b1_sistem_uyarilari
ADD COLUMN IF NOT EXISTS cozuldu_mu BOOLEAN DEFAULT false;
