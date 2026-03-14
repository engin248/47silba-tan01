-- NIZAM IC MESAJLASMA -- TAM KURULUM
-- 13 Mart 2026

-- 1. ANA MESAJ TABLOSU
CREATE TABLE IF NOT EXISTS b1_ic_mesajlar (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    konu                TEXT NOT NULL,
    icerik              TEXT NOT NULL,
    mesaj_hash          TEXT,
    gonderen_id         UUID,
    gonderen_adi        TEXT NOT NULL,
    gonderen_modul      TEXT NOT NULL,
    alici_id            UUID,
    alici_adi           TEXT,
    alici_grup          TEXT,
    oncelik             TEXT NOT NULL DEFAULT 'normal' CHECK (oncelik IN ('normal','acil','kritik')),
    tip                 TEXT NOT NULL DEFAULT 'bilgi' CHECK (tip IN ('bilgi','gorev_talebi','onay_bekleniyor','sikayet','rapor')),
    ilgili_modul        TEXT,
    ilgili_kayit_id     UUID,
    ilgili_kayit_ozet   TEXT,
    urun_id             UUID,
    urun_kodu           TEXT,
    urun_adi            TEXT,
    durum               TEXT NOT NULL DEFAULT 'gonderildi' CHECK (durum IN ('gonderildi','okundu','islem_alindi','kapatildi')),
    onay_durumu         TEXT CHECK (onay_durumu IN ('bekliyor','onaylandi','reddedildi')),
    onaylayan_id        UUID,
    onaylayan_adi       TEXT,
    onay_notu           TEXT,
    onaylandi_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    okundu_at           TIMESTAMPTZ,
    yanit_id            UUID REFERENCES b1_ic_mesajlar(id)
);

-- 2. OKUNDU KANIT TABLOSU
CREATE TABLE IF NOT EXISTS b1_mesaj_okundu_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mesaj_id    UUID NOT NULL REFERENCES b1_ic_mesajlar(id),
    okuyan_id   UUID,
    okuyan_adi  TEXT NOT NULL,
    okundu_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. KULLANICI GIZLEME TABLOSU
CREATE TABLE IF NOT EXISTS b1_mesaj_gizli (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mesaj_id        UUID NOT NULL REFERENCES b1_ic_mesajlar(id),
    kullanici_id    UUID NOT NULL,
    kullanici_adi   TEXT NOT NULL,
    gizlendi_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (mesaj_id, kullanici_id)
);

-- 4. INDEKSLER
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_alici_id    ON b1_ic_mesajlar(alici_id);
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_gonderen_id ON b1_ic_mesajlar(gonderen_id);
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_alici_grup  ON b1_ic_mesajlar(alici_grup);
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_created_at  ON b1_ic_mesajlar(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_oncelik     ON b1_ic_mesajlar(oncelik);
CREATE INDEX IF NOT EXISTS idx_ic_mesajlar_urun_id     ON b1_ic_mesajlar(urun_id);
CREATE INDEX IF NOT EXISTS idx_okundu_log_mesaj_id     ON b1_mesaj_okundu_log(mesaj_id);
CREATE INDEX IF NOT EXISTS idx_mesaj_gizli_kullanici   ON b1_mesaj_gizli(kullanici_id);
CREATE INDEX IF NOT EXISTS idx_mesaj_gizli_mesaj       ON b1_mesaj_gizli(mesaj_id);

-- 5. ROW LEVEL SECURITY
ALTER TABLE b1_ic_mesajlar      ENABLE ROW LEVEL SECURITY;
ALTER TABLE b1_mesaj_okundu_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE b1_mesaj_gizli      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ic_mesajlar_okuma"      ON b1_ic_mesajlar      FOR SELECT USING (true);
CREATE POLICY "ic_mesajlar_yazma"      ON b1_ic_mesajlar      FOR INSERT WITH CHECK (true);
CREATE POLICY "ic_mesajlar_guncelleme" ON b1_ic_mesajlar      FOR UPDATE USING (true);
CREATE POLICY "okundu_log_okuma"       ON b1_mesaj_okundu_log FOR SELECT USING (true);
CREATE POLICY "okundu_log_yazma"       ON b1_mesaj_okundu_log FOR INSERT WITH CHECK (true);
CREATE POLICY "mesaj_gizli_okuma"      ON b1_mesaj_gizli      FOR SELECT USING (true);
CREATE POLICY "mesaj_gizli_yazma"      ON b1_mesaj_gizli      FOR INSERT WITH CHECK (true);
