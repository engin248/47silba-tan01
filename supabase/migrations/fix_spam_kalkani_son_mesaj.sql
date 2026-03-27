-- ============================================================
-- [#19 FIX] b0_api_spam_kalkani tablosuna son_mesaj_ozeti kolonu ekle
-- telegram-bildirim/route.js L87-100 bu kolonu kullanıyor
-- Supabase Dashboard → SQL Editor'a yapıştırıp çalıştırın
-- ============================================================

ALTER TABLE public.b0_api_spam_kalkani
    ADD COLUMN IF NOT EXISTS son_mesaj_ozeti TEXT;

-- Index: duplicate kontrol sorgusunu hızlandırır (L88: .eq('son_mesaj_ozeti', mesajOnizleme))
CREATE INDEX IF NOT EXISTS idx_spam_kalkani_mesaj_ozeti
    ON public.b0_api_spam_kalkani (son_mesaj_ozeti)
    WHERE son_mesaj_ozeti IS NOT NULL;

-- Doğrulama
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'b0_api_spam_kalkani'
  AND column_name = 'son_mesaj_ozeti';
