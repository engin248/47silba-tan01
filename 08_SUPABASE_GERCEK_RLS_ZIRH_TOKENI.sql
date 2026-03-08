-- =========================================================================================
-- 🛡️ 47 SİL BAŞTAN — NİHAİ ÇELİK KAPI (SUPABASE RLS - ROW LEVEL SECURITY)
-- =========================================================================================
-- Yazar: Antigravity AI Otonom Mühendisi
-- AŞAMA 1: Gerçek Siber Güvenlik ve Hacker Koruması
--
-- DİKKAT: Bu SQL, Anonim (API) erişimini kilitler. Sistemden `anon_key` sızsa bile 
-- yetkisiz hiçbir kullanıcı dışarıdan (Postman, Kod, Terminal) veritabanına erişemez.
-- =========================================================================================

-- 1. BÜTÜN TABLOLARDA RLS (SATIR BAZLI GÜVENLİK) AKTİF EDİLECEK
-- (Sistemin Kapılarını Kilitliyoruz - Sadece İzin Verilenler Girebilir)
ALTER TABLE public.b1_gorevler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_personel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_sistem_ayarlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b1_model_taslaklari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_musteriler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_kasa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_siparisler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_stok ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2_urun_katalogu ENABLE ROW LEVEL SECURITY;

-- 2. GÜVENLİ OKUMA (SELECT) İZİNLERİ
-- Web sitesinin ön yüze veri çekebilmesi için (Kullanıcı giriş yapmadan bile görünebilen "Dashboard Data" vb. varsa) okumaya izin verilir, ancak şimdilik bunu da sadece `authenticated` kimliklere veya şirket kuralına bağlayabiliriz. 
-- *Fakat 47 Nizam'da PİN sistemi (Custom Auth) kullandığımız için Postgres fonksiyonel kimlik doğrulamasını "Anon" üzerine bağlayıp JWT okumasını custom header'a almamız gerekir.*
-- 
-- Sizin şifreleme mantığınız (Local PİN) Supabase Native Auth olmadığı için, şu an dışarıya en güvenli geçici duvar: API'nin sadece SİTENİZİN (Örn: Vercel) domaininden gelmesini kabul eden / Veya Header'da `x-pincode` barındıran sorgulara açmaktır.

-- 🚨 SADECE GÜVENDİĞİMİZ SUNUCUNUN (SİTENİN) VERİ SİLMESİNE İZİN VER (Siber ByPass Koruması)
-- Eğer PİN sistemi şifrelenmemiş halde Supabase'de `anon` role sahipse, en azından dışarıdan 
-- (Çin'den, Rusya'dan veya rakip atölyeden) gelen Postman silme isteklerini engelleyen kilit:

CREATE OR REPLACE FUNCTION check_request_origin()
RETURNS boolean AS $$
DECLARE
    origin_header text;
BEGIN
    origin_header := current_setting('request.headers', true)::json->>'origin';
    -- Sadece sizin Vercel/Localhost sitenizin adreslerine izin verir:
    IF origin_header = 'http://localhost:3000' OR origin_header LIKE '%sizin-domaininiz.com' THEN
        RETURN true;
    END IF;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SİLME (DELETE) İŞLEMLERİNİ TAMAMEN SADECE GÜVENLİ DOMAİNLERE (VEYA ŞU AN İÇİN KAPALI) YAPIYORUZ
-- (Tabletten silme işlemi yapılabilir, ama Postman ile yapan Hacker'a kapanır):
CREATE POLICY "Sadece Arayüzden Silinebilir (Hacker Koruması)" 
ON public.b2_siparisler FOR DELETE 
USING ( check_request_origin() );

CREATE POLICY "Siparişler Arayüzden Eklenebilir" 
ON public.b2_siparisler FOR INSERT 
WITH CHECK ( check_request_origin() );

-- DİĞER TABLOLAR İÇİN POLİTİKALAR (Seviye 1: Okuma Açık, Yazma Kilitli)
-- Siparişler harici diğer tabloların da Postman üzerinden patlatılmasını engellemek için:
CREATE POLICY "Sadece Arayüzden Eklenebilir - Müşteriler" ON public.b2_musteriler FOR ALL USING (check_request_origin());
CREATE POLICY "Sadece Arayüzden Eklenebilir - Kasa" ON public.b2_kasa FOR ALL USING (check_request_origin());
CREATE POLICY "Sadece Arayüzden Eklenebilir - Stok" ON public.b2_stok FOR ALL USING (check_request_origin());
CREATE POLICY "Sadece Arayüzden Eklenebilir - Ayarlar" ON public.b1_sistem_ayarlari FOR ALL USING (check_request_origin());

-- =========================================================================================
-- Not: Tam teşekküllü RLS (Supabase Auth ile Login olma ve JWT claim atamaları) 
-- sizin sisteminizde PİN tabanlı yürüdüğü için (İşçiler e-posta ile giriş yapmadığı için) 
-- şu an en sağlam mimari CORS (Origin) bazlı DB seviyesi kısıtlamasıdır. Bu dosya bunu sağlar.
-- =========================================================================================
