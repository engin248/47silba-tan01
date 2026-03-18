-- ==============================================================================
-- NİZAM SİSTEMİ BROWSER AGENT YAMASI (18 Mart 2026)
-- b1_arge_products tablosuna oturum hafızasını (agent_session_id) ekler.
-- ==============================================================================

-- BROWSER AGENT MİMARİSİ İÇİN OTURUM HAFIZASI
-- Ajanın bir döngüde tarayıcı kapatana kadar yaptığı okumaları gruplamak için:
ALTER TABLE b1_arge_products ADD COLUMN IF NOT EXISTS agent_session_id TEXT;
