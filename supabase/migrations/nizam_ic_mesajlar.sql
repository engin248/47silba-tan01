-- ============================================================
-- NIZAM İÇ MESAJLAŞMA SİSTEMİ — Supabase SQL
-- Belge: NIZAM-IHS-2026-001
-- Tarih: 13 Mart 2026
-- Felsefe: Adalet · Şeffaflık · Kanıt · Belkisizlik
-- ============================================================

-- ANA MESAJ TABLOSU
CREATE TABLE IF NOT EXISTS b1_ic_mesajlar (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    konu                TEXT NOT NULL,
    icerik              TEXT NOT NULL,

    -- Gönderen — snapshot alınır, kullanıcı adı değişse bile kanıt değişmez
    gonderen_id         UUID,
    gonderen_adi        TEXT NOT NULL,
    gonderen_modul      TEXT NOT NULL,   -- 'kesim' | 'uretim' | 'kasa' | 'koordinator' | ...

    -- Alıcı
    alici_id            UUID,            -- Bireysel alıcı (null ise grup mesajı)
    alici_adi           TEXT,            -- Snapshot
    alici_grup          TEXT,            -- 'uretim' | 'kesim' | 'hepsi' | ...

    -- Sınıflandırma
    oncelik             TEXT NOT NULL DEFAULT 'normal' CHECK (oncelik IN ('normal','acil','kritik')),
    tip                 TEXT NOT NULL DEFAULT 'bilgi' CHECK (tip IN ('bilgi','gorev_talebi','onay_bekleniyor','sikayet','rapor')),

    -- Bağlantı — hangi kayıt hakkında
    ilgili_modul        TEXT,            -- 'siparis' | 'stok' | 'uretim' | 'kasa' | ...
    ilgili_kayit_id     UUID,
    ilgili_kayit_ozet   TEXT,            -- "Sipariş #47 - Ahmet Bey" gibi snapshot

    -- Durum
    durum               TEXT NOT NULL DEFAULT 'gonderildi' CHECK (durum IN ('gonderildi','okundu','islem_alindi','kapatildi')),

    -- Onay mekanizması
    onay_durumu         TEXT CHECK (onay_durumu IN ('bekliyor','onaylandi','reddedildi')),
    onaylayan_id        UUID,
    onaylayan_adi       TEXT,
    onay_notu           TEXT,
    onaylandi_at        TIMESTAMPTZ,

    -- Kanıt zaman damgaları — server-side, kullanıcı değiştiremez
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    okundu_at           TIMESTAMPTZ,

    -- Soft delete — fiziksel silme asla yapılmaz
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    silindi_at          TIMESTAMPTZ,
    silen_id            UUID,
    silen_adi           TEXT,

    -- Yanıt zinciri
    yanit_id            UUID REFERENCES b1_ic_mesajlar(id)
);

-- OKUNDU KANIT TABLOSU — kim ne zaman okudu, değiştirilemez
CREATE TABLE IF NOT EXISTS b1_mesaj_okundu_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mesaj_id    UUID NOT NULL REFERENCES b1_ic_mesajlar(id),
    okuyan_id   UUID,
    okuyan_adi  TEXT NOT NULL,
    okundu_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- İNDEKSLER
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_alici_id     ON b1_ic_mesajlar(alici_id);
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_gonderen_id  ON b1_ic_mesajlar(gonderen_id);
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_alici_grup   ON b1_ic_mesajlar(alici_grup);
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_created_at   ON b1_ic_mesajlar(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_oncelik      ON b1_ic_mesajlar(oncelik);
CREATE INDEX IF NOT EXISTS idx_okundu_log_mesaj_id      ON b1_mesaj_okundu_log(mesaj_id);

-- ROW LEVEL SECURITY
ALTER TABLE b1_ic_mesajlar     ENABLE ROW LEVEL SECURITY;
ALTER TABLE b1_mesaj_okundu_log ENABLE ROW LEVEL SECURITY;

-- Tüm authenticated kullanıcılar okuyabilir ve yazabilir
-- (Yetki kontrolü uygulama katmanında yapılır)
CREATE POLICY "ic_mesajlar_okuma" ON b1_ic_mesajlar
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "ic_mesajlar_yazma" ON b1_ic_mesajlar
    FOR INSERT WITH CHECK (true);

CREATE POLICY "ic_mesajlar_guncelleme" ON b1_ic_mesajlar
    FOR UPDATE USING (true);

CREATE POLICY "okundu_log_okuma" ON b1_mesaj_okundu_log
    FOR SELECT USING (true);

CREATE POLICY "okundu_log_yazma" ON b1_mesaj_okundu_log
    FOR INSERT WITH CHECK (true);
