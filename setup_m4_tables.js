const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("HATA: env baglantisi saglanamadi.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
    console.log("SQL Migration baslatiliyor...");

    try {
        // Tablolari RPC veya tekil INSERT ile tetikleyerek olusturma / RPC varsa kullanma
        // Egitim ortaminda RPC yoksa doğrudan tablo oluşturma mantığını simüle edip 
        // b1_personel tablosunu güncelliyoruz veya bu komutları kullanıcı manuel çalıştırır.

        // Şimdilik test amaçlı rastgele bir personele barkod ekleyelim
        const { data: personelList, error: pErr } = await supabase.from('b1_personel').select('id').limit(1);

        if (pErr) throw pErr;
        console.log("Personel tablosuna erisim basarili. Eklenecek SQL Semasi loglaniyor.");

        const tabloSQLLeri = `
        -- URETIM M4 TABLOLARI KURULUM SQL'İ
        CREATE TABLE IF NOT EXISTS b1_uretim_operasyonlari (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            model_id UUID REFERENCES b1_model_taslaklari(id) ON DELETE CASCADE,
            operasyon_adi VARCHAR(255) NOT NULL,
            makine_tipi VARCHAR(100),
            sira_no INT DEFAULT 1,
            zorluk_derecesi INT DEFAULT 5,
            parca_basi_deger_tl NUMERIC(10, 2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS b1_personel_performans (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            personel_id UUID REFERENCES b1_personel(id) ON DELETE SET NULL,
            operasyon_id UUID REFERENCES b1_uretim_operasyonlari(id) ON DELETE SET NULL,
            order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
            baslangic_saati TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            bitis_saati TIMESTAMP WITH TIME ZONE,
            uretilen_adet INT DEFAULT 0,
            hiza_gore_prim_tl NUMERIC(10, 2) DEFAULT 0,
            kalite_puani INT DEFAULT 5,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        ALTER TABLE b1_personel ADD COLUMN IF NOT EXISTS barkod_no VARCHAR(100);
        `;

        console.log(tabloSQLLeri);
        console.log("===============");
        console.log("DIKKAT: Supabase arayuzunden yukaridaki SQL komutlarini calistiriniz!");

    } catch (err) {
        console.error("HATA:", err.message);
    }
}

runSQL();
