-- ZİNCİRCİ VE AKŞAMCI AJANI İÇİN VERİTABANI YAMASI (M6, M7, M8)
-- Bu script, UI tarafından beslenen yeni nesil tabloların AI Ajanları tarafından
-- geriye dönük (duplicate) okunmasını engellemek için "zincirleme mühür" kolonlarını ekler.

-- 1. YENİ İMALAT (ÜRETİM) TABLOSU İÇİN (production_orders)
ALTER TABLE public.production_orders
ADD COLUMN IF NOT EXISTS zincir_bildirim_m7 timestamp with time zone DEFAULT NULL;

COMMENT ON COLUMN public.production_orders.zincir_bildirim_m7 IS 'Zincirci Ajan: M6 Üretim tamamlanıp M7 Maliyet hesabı açıldığında burayı mühürler';

-- 2. YENİ MALİYET TABLOSU İÇİN (b1_maliyet_kayitlari)
ALTER TABLE public.b1_maliyet_kayitlari
ADD COLUMN IF NOT EXISTS zincir_bildirim_m8 timestamp with time zone DEFAULT NULL;

COMMENT ON COLUMN public.b1_maliyet_kayitlari.zincir_bildirim_m8 IS 'Zincirci Ajan: M7 Maliyet onaylanıp M8 Muhasebe taslağı oluşturulduğunda burayı mühürler';

-- İLGİLİ RLS POLİTİKALARI (AI YETKİLENDİRME GÜVENLİĞİ) EĞER GEREKİRSE:
-- (Supabase Service Key kullanıldığı için bypass ediliyor, ancak tablo varlığını netleştirmek iyidir)
