-- ========================================================================================
-- THE ORDER 47 - KARARGÂH OTOMASYON VE GÜVENLİK YAMALARI (RPC)
-- ========================================================================================

-- Karargâh Anasayfası'ndaki "Kritik Stok Alarmlarını" binlerce veriyi Frontend'e 
-- yığmadan doğrudan sunucu tarafında (Backend) filtreleyip, sadece cidden dibe vuran 
-- stoğu döndüren Askeri Sınıf RPC Kodu:

CREATE OR REPLACE FUNCTION get_kritik_stok()
RETURNS TABLE(urun_kodu varchar, urun_adi text, stok_adeti numeric, min_stok numeric)
AS $$
BEGIN
  RETURN QUERY 
  SELECT uk.urun_kodu, uk.urun_adi_tr::text, uk.stok_adeti, uk.min_stok_alarm
  FROM public.b2_urun_katalogu uk 
  WHERE uk.aktif = true AND uk.stok_adeti < COALESCE(uk.min_stok_alarm, 0)
  ORDER BY uk.stok_adeti ASC;
END;
$$ LANGUAGE plpgsql;

