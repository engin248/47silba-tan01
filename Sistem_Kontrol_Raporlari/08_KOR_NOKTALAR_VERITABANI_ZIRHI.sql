-- KÖR NOKTA 1: ÇİFT KAYIT (RACE CONDITION) ZIRHI
-- B1_Gorevler tablosuna aynı saniyede 2 kere "Kumaş Al" emri gönderildiğinde Supabase bunu durdursun.
-- Eşsizlik Kuralı: `durum` = 'bekliyor' olan aynı `baslik` ta görev açılamaz. (Veritabanı bazlı mutlak kalkan)
CREATE UNIQUE INDEX IF NOT EXISTS uq_b1_gorevler_bekleyen_baslik ON public.b1_gorevler (baslik) WHERE durum = 'bekliyor';

-- KÖR NOKTA 2: MEDYA (VİDEO/RESİM) ŞİŞME ZIRHI
-- Sistemde bir bucket olduğunu ("medya" veya kendi adınız) varsayar. 
-- Aşağıdaki mantığı Supabase'in "Storage -> Policies" bölümünden elle girmek çok daha güvenlidir.
-- Arayüzden dosya boyut limiti: 20MB (Sisteme bombalı dosya atılmasını engeller).
/*
CREATE POLICY "Medya boyutu 20mb altında olmalı" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    length(storage.get_obj_col(name, 'chunk_size', '')) < 20971520
);
*/

-- 1 Numaralı kod blogunu SUPABASE -> SQL EDITOR sekmesinden tek tıkla çalıştırınız. Mükerrer hata engeli %100 kapanacaktır.
