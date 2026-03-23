-- 1. Cold Storage (Veri Soğutma) Arşiv Tablosu
CREATE TABLE IF NOT EXISTS b1_agent_loglari_arsiv (
    id uuid PRIMARY KEY,
    ajan_adi text,
    islem_tipi text,
    mesaj text,
    sonuc text,
    kaynak_tablo text,
    kaynak_id text,
    created_at timestamp with time zone,
    arsivlenme_tarihi timestamp with time zone DEFAULT now()
);

-- 30 günden eski veri taşıyıcı RPC
CREATE OR REPLACE FUNCTION agent_log_sogutma_yap()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tasinan_kayit integer;
BEGIN
    -- Eski kayıtları arşive kopyala
    INSERT INTO b1_agent_loglari_arsiv (id, ajan_adi, islem_tipi, mesaj, sonuc, kaynak_tablo, kaynak_id, created_at)
    SELECT id, ajan_adi, islem_tipi, mesaj, sonuc, kaynak_tablo, kaynak_id, created_at
    FROM b1_agent_loglari
    WHERE created_at < NOW() - INTERVAL '30 days'
    ON CONFLICT (id) DO NOTHING;
    
    -- Taşınanları ana tablodan sil
    WITH deleted AS (
        DELETE FROM b1_agent_loglari
        WHERE created_at < NOW() - INTERVAL '30 days'
        RETURNING *
    )
    SELECT count(*) INTO tasinan_kayit FROM deleted;

    RETURN tasinan_kayit;
END;
$$;

-- 'gizlenen_izler' soğutma
CREATE TABLE IF NOT EXISTS gizlenen_izler_arsiv AS SELECT * FROM gizlenen_izler LIMIT 0;
ALTER TABLE gizlenen_izler_arsiv ADD COLUMN IF NOT EXISTS arsivlenme_tarihi timestamp with time zone DEFAULT now();

CREATE OR REPLACE FUNCTION iz_sogutma_yap()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tasinan_kayit integer;
BEGIN
    INSERT INTO gizlenen_izler_arsiv 
    SELECT *, now() FROM gizlenen_izler WHERE created_at < NOW() - INTERVAL '30 days';
    
    WITH deleted AS (
        DELETE FROM gizlenen_izler WHERE created_at < NOW() - INTERVAL '30 days' RETURNING *
    )
    SELECT count(*) INTO tasinan_kayit FROM deleted;
    RETURN tasinan_kayit;
END;
$$;

-- 2. BATCH AI Kuyruğu
CREATE TABLE IF NOT EXISTS b1_ai_is_kuyrugu (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    istek_tipi text NOT NULL,
    istek_datasi jsonb,
    durum text DEFAULT 'bekliyor',
    sonuc_datasi jsonb,
    ai_maliyeti_token integer,
    created_at timestamp with time zone DEFAULT now(),
    islenme_tarihi timestamp with time zone
);

-- 3. Hibrit Onay Zırhı için yeni kolon (Ceza/Prim sistemleri için)
ALTER TABLE b1_ajan_gorevler ADD COLUMN IF NOT EXISTS hibrit_onay_gerekli boolean DEFAULT true;
ALTER TABLE b1_ajan_gorevler ADD COLUMN IF NOT EXISTS yonetici_onayi text DEFAULT 'bekliyor';
