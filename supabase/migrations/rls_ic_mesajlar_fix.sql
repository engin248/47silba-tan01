-- b1_ic_mesajlar RLS politikası düzeltmesi
-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "ic_mesajlar_okuma" ON public.b1_ic_mesajlar;
DROP POLICY IF EXISTS "ic_mesajlar_yazma" ON public.b1_ic_mesajlar;
DROP POLICY IF EXISTS "ic_mesajlar_guncelleme" ON public.b1_ic_mesajlar;
DROP POLICY IF EXISTS "okundu_log_okuma" ON public.b1_mesaj_okundu_log;
DROP POLICY IF EXISTS "okundu_log_yazma" ON public.b1_mesaj_okundu_log;

-- Güvenli politikalar — sadece authenticated kullanıcılar
CREATE POLICY "ic_mesajlar_okuma" ON public.b1_ic_mesajlar
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ic_mesajlar_yazma" ON public.b1_ic_mesajlar
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ic_mesajlar_guncelleme" ON public.b1_ic_mesajlar
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Service role her şeyi yapabilir
CREATE POLICY "ic_mesajlar_service" ON public.b1_ic_mesajlar
    FOR ALL USING (auth.role() = 'service_role');

-- Okundu log
CREATE POLICY "okundu_log_okuma" ON public.b1_mesaj_okundu_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "okundu_log_yazma" ON public.b1_mesaj_okundu_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Doğrulama
SELECT polname, cmd 
FROM pg_policy 
WHERE polrelid = 'b1_ic_mesajlar'::regclass
ORDER BY polname;
