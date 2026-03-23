-- =========================================================================================
-- MİZANET KÖR NOKTA ZIRHI: GARBAGE COLLECTOR (YETİM VERİ TEMİZLEYİCİ)
-- Amaç: Test sürecinden kalma (referansı kopmuş) veya aylarca işlenmemiş 'taslak' verilerini silip sunucu yükünü hafifletmek.
-- =========================================================================================

CREATE OR REPLACE FUNCTION mizanet_garbage_collector()
RETURNS void AS $$
DECLARE
    silinen_count INTEGER := 0;
BEGIN
    -- 1. Numunesi dikilmemiş, 30 günden eski 'taslak' modellerini uçur (Yetim Modeller)
    DELETE FROM public.b1_model_taslaklari 
    WHERE durum = 'taslak' 
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- 2. Modeli (Parent) silinmiş Kalıp kayıtlarını sil (Eğer Foreign Key kısıtı cascade değilse temizle)
    DELETE FROM public.b1_model_kaliplari
    WHERE model_id NOT IN (SELECT id FROM public.b1_model_taslaklari);

    -- 3. Boş Logları (Mesajı olmayan) temizle
    DELETE FROM public.b0_sistem_loglari WHERE eski_veri IS NULL AND islem_tipi = 'OTOMATIK_TEST';

    RAISE NOTICE 'Garbage Collector çalıştı. Yetim çöpler sistemden atıldı.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Herhangi bir şekilde çağrılabilir
-- SELECT mizanet_garbage_collector();
