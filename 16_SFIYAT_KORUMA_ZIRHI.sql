-- =========================================================================================
-- THE ORDER / NİZAM - VERİTABANI ZIRHI (SİPARİŞ FİYAT KORUMASI)
-- Görev: M9 Katalog "Toplu Zam" işlemi sırasında geçmiş sipariş fiyatlarının ezilmesini engellemek.
-- =========================================================================================

-- 1. ADIM: Sipariş Kalemleri (b2_siparis_kalemleri) için Fiyat Koruma Trigger'ı
-- 'beklemede' harici bir siparişin kalem fiyatını dışarıdan değiştirmeyi yasaklar.
CREATE OR REPLACE FUNCTION check_siparis_kalem_fiyat_korumasi()
RETURNS TRIGGER AS $$
DECLARE
    v_siparis_durum text;
BEGIN
    SELECT durum INTO v_siparis_durum FROM b1_siparisler WHERE id = NEW.siparis_id;
    
    -- Eğer sipariş onaylanmış, kargoya verilmiş veya teslim edilmişse kalemin fiyatı KESİNLİKLE değişemez.
    IF (v_siparis_durum != 'beklemede') AND 
       (NEW.birim_fiyat_tl IS DISTINCT FROM OLD.birim_fiyat_tl OR NEW.iskonto_pct IS DISTINCT FROM OLD.iskonto_pct) THEN
        RAISE EXCEPTION 'ZIRH AKTİF: % durumundaki bir siparişin kalem (fiyat) bilgileri değiştirilemez!', upper(v_siparis_durum);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_siparis_kalem_fiyat_korumasi ON b2_siparis_kalemleri;
CREATE TRIGGER trg_siparis_kalem_fiyat_korumasi
BEFORE UPDATE ON b2_siparis_kalemleri
FOR EACH ROW
EXECUTE FUNCTION check_siparis_kalem_fiyat_korumasi();

-- 2. ADIM: Ana Sipariş Tablosu (b1_siparisler) için Toplam Tutar Koruma Trigger'ı
CREATE OR REPLACE FUNCTION check_siparis_toplam_tutar_korumasi()
RETURNS TRIGGER AS $$
BEGIN
    -- Sipariş tamamlandıktan sonra fiyatının ezilmesini önler
    IF (OLD.durum != 'beklemede') AND (NEW.toplam_tutar_tl IS DISTINCT FROM OLD.toplam_tutar_tl) THEN
        RAISE EXCEPTION 'ZIRH AKTİF: % durumundaki bir siparişin toplam tutarı değiştirilemez!', upper(OLD.durum);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_siparis_toplam_tutar_korumasi ON b1_siparisler;
CREATE TRIGGER trg_siparis_toplam_tutar_korumasi
BEFORE UPDATE ON b1_siparisler
FOR EACH ROW
EXECUTE FUNCTION check_siparis_toplam_tutar_korumasi();

-- Not: Katalog Toplu Fiyat Güncellemesi (M9) sadece katalogu etkileyip geriye dönük bağlı siparişleri bozamaz.
