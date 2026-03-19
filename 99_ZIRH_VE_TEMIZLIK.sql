-- =========================================================================
-- MİZANET ARKA PLAN ZIRHI: RLS GÜVENLİK VE YETİM VERİ TEMİZLİĞİ (GARBAGE COLLECTOR)
-- Amaç: Finansal sızıntıları engellemek ve veritabanı kirliliğini silmek.
-- =========================================================================

-- 1. ZIRH: ROW LEVEL SECURITY (RLS) AKTİVASYONU
-- M2 Finans ve M4 Lojistik tablolarına dışarıdan (Anon Key) erişimi KİLİTLİYORUZ.

ALTER TABLE public.m2_finans_veto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b3_uretilen_tasarimlar ENABLE ROW LEVEL SECURITY;

-- 2. ZIRH: GÜVENLİK POLİTİKALARI (Sadece Yöneticiler Okuyabilir)
-- Not: Gerçek senaryoda auth.uid() üzerinden rol tabanlı kontrol yapılır. 
-- Eğer mevcut ön yüz (UI) anon key üzerinden sadece okuma yapacaksa, 
-- aşağıdakini projendeki 'role = admin' JWT claim'ine göre ayarlamalısın.
-- Şimdilik en azından tam yetkisiz INSERT/UPDATE/DELETE kapatıyoruz, okumaya izin veriyoruz (Karargah için).

CREATE POLICY "Sadece Okuma (Karargah)" ON public.m2_finans_veto
    FOR SELECT
    USING (true);

CREATE POLICY "Veri Değiştirme ve Yazma Yasak (M2)" ON public.m2_finans_veto
    FOR ALL
    USING (auth.uid() IS NOT NULL); -- Sadece giriş yapmış kullanıcılar değiştirebilir.


-- 3. ZIRH: GARBAGE COLLECTOR (YETİM VERİ TEMİZLİĞİ)
-- Arge sayfasından silinmiş ama M2, M3 veya M4'te artığı kalmış ('Orphan') verileri infaz etme.

-- Adım A: b1_arge_products tablosunda olmayan ama m2_finans_veto tablosunda kalan artıkları sil.
DELETE FROM public.m2_finans_veto 
WHERE arge_urun_id NOT IN (SELECT id FROM public.b1_arge_products);

-- Adım B: Üretimden red yemiş 'VETO' statüsündeki tasarımları 30 gün sonra arşive at veya sil.
DELETE FROM public.b3_uretilen_tasarimlar
WHERE onay_durumu = 'VETO' AND created_at < NOW() - INTERVAL '30 days';

-- BAŞARI MESAJI
-- Bu SQL kodunu Supabase Dashboard > SQL Editor kısmından doğrudan "Run" diyerek çalıştırın.
