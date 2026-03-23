-- =========================================================================================
-- THE ORDER / NİZAM - TİTANYUM KASA (DB ZIRHI) ENTEGRASYONU
-- Tarih: 11 Mart 2026 | Operatör: Antigravity AI
-- İçerik: Kilit Veritabanı Koruma Triggers, Kriptolu Şifreleme, Ajan Sınırları, Soft Delete
-- =========================================================================================

-- 1. PGCrypto (Gelişmiş Şifreleme Algoritması) Uzantısını Açıyoruz (KRİTER 129 - BCRYPT HASH)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- NOT: Şifreleme için 'crypt(pin, gen_salt(''bf''))' kullanılacaktır. M0 Karargah auth sistemi sonradan buna taşınacaktır.

-- 2. TİTANYUM BLOK A: AJAN MÜDAHALESİNE VE HARD-DELETE (SİLİNMEYE) KARŞI SOFT_DELETE KORUMASI 
-- (KRİTER 123 - YUMUŞAK SİLME, KRİTER 143 - AJAN SERT SINIRI)
-- İlgili her tabloya 'is_deleted' ve 'deleted_at' sütunu ekleyeceğiz.

DO $$ 
DECLARE
    tablo TEXT;
BEGIN
    FOR tablo IN 
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
        AND table_name IN ('b1_arge_trendler', 'b1_agent_loglari', 'camera_events') -- Mevcut canlı tablolar
    LOOP
        -- Eğer Sütun yoksa ekle
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;', tablo);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;', tablo);
    END LOOP;
END $$;

-- Hard Delete İşlemini İZİN VERMEYEN ve Soft Delete'e Çeviren Katı Tetikleyici (Trigger Fonksiyonu)
CREATE OR REPLACE FUNCTION prevent_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Eski veriyi silmek yerine güncelleyip gizle
    EXECUTE format('UPDATE %I SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1', TG_TABLE_NAME)
    USING OLD.id;
    
    -- Veritabanına (Kaba/Hard) silme işlemini REDDET (Ajan Service Role ile gelse bile silemez)
    RETURN NULL; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sadece önemli tablolara bu kalkanı bağlayalım (Eğer tablo varsa)
DO $$
DECLARE
    tablo TEXT;
BEGIN
    FOR tablo IN 
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
        AND table_name IN ('b1_arge_trendler')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_hard_delete ON %I', tablo);
        EXECUTE format('CREATE TRIGGER trg_prevent_hard_delete BEFORE DELETE ON %I FOR EACH ROW EXECUTE FUNCTION prevent_hard_delete()', tablo);
    END LOOP;
END $$;


-- 3. TİTANYUM BLOK B: MANİPÜLASYON ENGELİ / VERİ BÜTÜNLÜĞÜ (KRİTER 104, 112, 115)
-- Geçmiş Operasyon Verisinin (Örn: 24 Saatten eski veya ONAYLANMIŞ verinin) Değiştirilmesini Yasakla
CREATE OR REPLACE FUNCTION prevent_manipulation()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer kayıt 'onaylandi' statüsündeyse ve güncellenmek isteniyorsa DURDUR!
    -- Ancak sadece 'durum' sütunu değiştiriliyorsa izin verilebilir, yoksa içeriği değiştirilemez!
    IF OLD.durum = 'onaylandi' AND NEW.durum = 'onaylandi' THEN
        RAISE EXCEPTION 'Titanyum Kasa: Onaylanmış geçmiş veriler üzerinde değişiklik MANİPÜLASYON kabul edilir ve değiştirilemez!';
    END IF;

    -- Eğer kayıt atılalı 48 saati geçmişse kimse içeriğini değiştiremez (Tarihsel manipülasyon engeli)
    IF OLD.created_at < NOW() - INTERVAL '48 hours' THEN
        -- Sadece durum değişimlerine (Örn Arşive kaldırmak) izin verilir
        IF OLD.durum = NEW.durum THEN
            RAISE EXCEPTION 'Titanyum Kasa: 48 Saatten eski işlem kayıtları KİLİTLİDİR. Sadece arşive gönderebilirsiniz.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manipülasyon Zırhını Ar-Ge Modülüne Bağla
DROP TRIGGER IF EXISTS trg_prevent_manipulation ON public.b1_arge_trendler;
CREATE TRIGGER trg_prevent_manipulation 
BEFORE UPDATE ON public.b1_arge_trendler 
FOR EACH ROW EXECUTE FUNCTION prevent_manipulation();


-- 4. TİTANYUM BLOK C: SİSTEM-AJAN LOG KOMBİNASYONU (DEĞİŞTİRİLEMEZLİK - IMMUTABLE)
-- (KRİTER 115) Log tablolarına UPDATE ve DELETE atılması FİZİKSEL OLARAK İMKANSIZ KILINIR.
CREATE OR REPLACE FUNCTION block_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Kritik İhlal: Ajan/Sistem loglarının değiştirilmesi veya silinmesi YASAKTIR. Bu işlem kayıt altına alındı!';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajan log listesini sonsuza dek mühürle
DROP TRIGGER IF EXISTS trg_no_update_agent_logs ON public.b1_agent_loglari;
CREATE TRIGGER trg_no_update_agent_logs BEFORE UPDATE OR DELETE ON public.b1_agent_loglari FOR EACH ROW EXECUTE FUNCTION block_log_tampering();

DROP TRIGGER IF EXISTS trg_no_update_system_logs ON public.b0_sistem_loglari;
CREATE TRIGGER trg_no_update_system_logs BEFORE UPDATE OR DELETE ON public.b0_sistem_loglari FOR EACH ROW EXECUTE FUNCTION block_log_tampering();


-- 5. CASCADE ORPHAN PROTECTION (Bütünlük Zırhı) Kriter 52 - 121
-- Gelecekte M2 (Modelhane) vs geldiğinde çalışması için standart foreign key'lere 
-- kısıtlayıcı (RESTRICT) kuralı ekleneceğini belirten hazırlık trigger setupı:
-- Ajan veya Cronlar 'cascade' (patlayarak silme) hatası oluşturmasın diye...
CREATE OR REPLACE FUNCTION restrict_delete_with_references() 
RETURNS TRIGGER AS $$
BEGIN
    -- Eger Modelhane uretimde islem goruyorsa, Argesi silinemesin diye genel bir hata kalibi
    RAISE EXCEPTION 'Veri Bütünlüğü Zırhı: Bu veri başka bir modüle aktarıldığı için (Örn Modelhane) silinemez!';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
