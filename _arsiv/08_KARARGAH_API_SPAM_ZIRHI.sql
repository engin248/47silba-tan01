-- =====================================================================
-- 47 SİL BAŞTAN — DÜŞMAN SPAM/DDOS ZIRHI
-- =====================================================================
-- Kör Nokta 3 Çözümü: Veritabanına kaydedilen Persistent IP Limiter.
-- Saldırganlar veya bozuk botlar 1 dakikada 15'ten fazla API atamaz.

CREATE TABLE IF NOT EXISTS public.b0_api_spam_kalkani (
    ip_adresi text PRIMARY KEY,
    spam_sayaci integer DEFAULT 1,
    son_vurus_saati timestamp with time zone DEFAULT now()
);

-- RLS (Row Level Security) - Sadece okuma/yazma/güncellemeye izin ver
ALTER TABLE public.b0_api_spam_kalkani ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_spam_select" ON public.b0_api_spam_kalkani;
CREATE POLICY "api_spam_select" ON public.b0_api_spam_kalkani FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "api_spam_insert" ON public.b0_api_spam_kalkani;
CREATE POLICY "api_spam_insert" ON public.b0_api_spam_kalkani FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "api_spam_update" ON public.b0_api_spam_kalkani;
CREATE POLICY "api_spam_update" ON public.b0_api_spam_kalkani FOR UPDATE TO anon USING (true);

-- Not: Saldırganlar "Delete" ile izlerini silemesin diye DELETE kuralı koyulmadı.
