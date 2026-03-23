-- 39_SUPABASE_SECURITY_PATH_YAMASI.sql
-- Supabase Security Advisor tarafından belirtilen "Fonksiyon Arama Yolu Değiştirilebilir" 
-- (search_path yapılandırılmamış) uyarısını çözmek için yazılmıştır.

-- Public Şemasındaki Fonksiyonlar
ALTER FUNCTION public.fn_trend_onaylandi SET search_path = public;
ALTER FUNCTION public.block_log_tampering SET search_path = public;
ALTER FUNCTION public.update_b2_malzeme_modtime SET search_path = public;
ALTER FUNCTION public.fn_b2_stok_alarm SET search_path = public;
ALTER FUNCTION public.fn_kumas_stok_alarm SET search_path = public;
ALTER FUNCTION public.fn_b2_siparis_onay SET search_path = public;
ALTER FUNCTION public.check_request_origin SET search_path = public;
ALTER FUNCTION public.transaction_kilif_paket SET search_path = public;

-- Kamu Şemasındaki Fonksiyonlar (Eğer public uzantılar gerekiyorsa public, kamu yolları eklenebilir)
-- Genellikle kamu şeması işlerinde kendi şemasına bakması güvendedir.
ALTER FUNCTION kamu.fn_risk_kontrol SET search_path = kamu, public;
ALTER FUNCTION kamu.depo_revizyonu SET search_path = kamu, public;

-- TODO: Eger parametreli metodlar ise function signatürünü bilmediğimiz için bu kod çalışmayabilir 
-- (örn: ALTER FUNCTION public.fn_trend_onaylandi(uuid) SET search_path = public; şeklinde olması gerekebilir)
-- Bu yüzden proje içindeki SQL dosyasından bu metodların imzalarını tarayıp güncellemek gerekir.
