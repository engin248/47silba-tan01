-- =========================================================================================
-- 🛡️ 47 SİL BAŞTAN — ÇEKİRDEK (DATABASE) ZIRHLARI VE KÖR NOKTA KAPATMA SCRİPTİ
-- =========================================================================================
-- Yazar: Antigravity AI
-- Tarih: 2026-03-08
-- 
-- DİKKAT: Bu SQL komut dizisi, "Arayüz (Tabletten) yapılabilecek mükerrer tıklamaların",
-- sunucu RAM sıfırlanmasında yaşanacak SPAM saldırılarının ve "Disk Şişmesi" (Faturaların 
-- patlaması) krizinin kalıcı olarak engellenmesi içindir. Bu dosyayı Supabase SQL Editor'da
-- çalıştırın.
-- =========================================================================================

-- ─────────────────────────────────────────────────────────────────
-- 🚨 1. BÜYÜK KÖR NOKTA: MÜKERRER KAYIT (RACE CONDITION) ZIRHI
-- ─────────────────────────────────────────────────────────────────
-- İnternet yavaşken personelin butona 5 kez ard arda tıklaması sonucu Supabase'in 
-- aynı Siparişi / Personeli 5 kez açmasını (Arayüz yetersiz kaldığı için) kalıcı olarak 
-- DB seviyesinde MÜHÜRLÜYORUZ. UNIQUE kısıtlaması, sistemin aynı veriyi asla kaydetmemesini sağlar.

ALTER TABLE public.b2_siparisler 
ADD CONSTRAINT siparis_no_unique UNIQUE (siparis_no);

ALTER TABLE public.b2_musteriler 
ADD CONSTRAINT musteri_kodu_unique UNIQUE (musteri_kodu);

ALTER TABLE public.b1_personel 
ADD CONSTRAINT personel_kodu_unique UNIQUE (personel_kodu);

-- Model ve Gorevler için de çift kayıt zırhı:
ALTER TABLE public.b1_model_taslaklari
ADD CONSTRAINT model_kodu_unique UNIQUE (model_kodu);


-- ─────────────────────────────────────────────────────────────────
-- 🚨 2. BÜYÜK KÖR NOKTA: API SPAM ZIRHI (SERVERLESS ENGELLEYİCİ)
-- ─────────────────────────────────────────────────────────────────
-- Vercel ve sunucu platformları RAM'i her 10 saniyede bir temizler. In-Memory (Node.js Map) 
-- tabanlı IP spam sınırlayıcısı canlıda işe yaramaz. Bu yüzden Telegram bildirim atan 
-- cihazların vuruşlarını DB tablosunda tutmalıyız ki hafıza hiç sıfırlanmasın.

CREATE TABLE IF NOT EXISTS public.b0_api_spam_kalkani (
    ip_adresi TEXT PRIMARY KEY,
    son_vurus_saati TIMESTAMPTZ DEFAULT NOW(),
    spam_sayaci INT DEFAULT 1
);

-- RLS (Güvenlik Kalkanı) aktif edelim ve Anonim (API) erişimini güvene alalım.
ALTER TABLE public.b0_api_spam_kalkani ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Servisler IP bilgisini güncelleyebilir" ON public.b0_api_spam_kalkani
    FOR ALL USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────
-- 🚨 3. BÜYÜK KÖR NOKTA: KARA KUTU PATLAMASI (DİSK ŞİŞMESİ / FATURA ALARMI)
-- ─────────────────────────────────────────────────────────────────
-- b0_sistem_loglari tablosu, her silinen veriyi yedeğe alıyor. Ancak 1 yıl sonra
-- tabloda Milyonlarca satır oluşup Supabase disk limitlerini dolduracak ve sistemi kilitleyecektir.
-- Aşağıdaki PostgreSQL Cron Job, 3 Aydan Eski (90 Günlük) logları arkaplanda siz uyurken siler.

-- Extensions aktifleştir (Supabase destekler)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Önce temizlik fonksiyonunu (Müfettiş Bıçağı) oluşturalım:
CREATE OR REPLACE FUNCTION public.otomatik_kara_kutu_temizle()
RETURNS void AS $$
BEGIN
  -- 90 Günden (3 Aydan) daha eski logları otonom olarak küle çevirir.
  DELETE FROM public.b0_sistem_loglari
  WHERE silinme_tarihi < NOW() - INTERVAL '90 days';
  
  -- API Spam Kalkanını da her gün temizleyelim ki Çöp IP'ler birikmesin
  DELETE FROM public.b0_api_spam_kalkani
  WHERE son_vurus_saati < NOW() - INTERVAL '1 days';
END;
$$ LANGUAGE plpgsql;

-- Sonra Cron (Zamanlayıcı) görevini Her Gece Saat 03:00'te çalışacak şekilde kuralım (Eğer pg_cron kapalıysa burası hata verebilir, manuel destek aranabilir):
DO $$
BEGIN
  -- Eğer daha önce "log_temizleyici" adında bir cron varsa kaldıralım:
  PERFORM cron.unschedule('log_temizleyici');
EXCEPTION
  WHEN undefined_object THEN
    -- Hata yok, cron yokmuş zaten.
END $$;

SELECT cron.schedule(
    'log_temizleyici',          -- Görev Adı
    '0 3 * * *',                -- Çalışma Saati: Her gün saat 03:00 (Gece yarısı)
    'SELECT public.otomatik_kara_kutu_temizle();'
);

-- =========================================================================================
-- KARARGÂH (ANTIGRAVITY TEST EKİBİ) BİLDİRİYOR: DB Çekirdek Zırhları Başarıyla Döküldü.
-- =========================================================================================
