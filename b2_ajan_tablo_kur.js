const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cauptlsnqieegdrgotob.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdXB0bHNucWllZWdkcmdvdG9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQxNzE3MywiZXhwIjoyMDg3OTkzMTczfQ.MgVNEwQzHJncpL5JSm1HX7Z0VxRH1mqg3PjGyIlW1Sw';

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function tablouOlustur() {
    console.log('Tablo kontrol ediliyor...');

    const { data, error } = await sb.from('b1_ajan_gorevler').select('id').limit(1);
    if (!error) {
        console.log('TABLO ZATEN MEVCUT - Test kaydı ekleniyor...');
        const { data: test, error: testErr } = await sb.from('b1_ajan_gorevler').insert([{
            gorev_adi: 'Test Gorevi - Sistem Kontrolu',
            gorev_tipi: 'kontrol',
            oncelik: 'normal',
            gorev_emri: 'Sistem calisiyor mu kontrol et.',
            hedef_modul: 'genel',
            hedef_tablo: 'b1_ajan_gorevler',
            ajan_adi: 'Genel',
            durum: 'bekliyor'
        }]).select().single();
        if (testErr) console.error('Ekleme hatasi:', testErr.message);
        else console.log('Test kaydi eklendi:', test.id);
        return;
    }

    console.log('TABLO YOK - Supabase SQL Editor\'da calistirmaniz gerekiyor:');
    console.log('------------------------------------------------------------');
    console.log('Dosya: gorevler_tablosu.sql');
    console.log('Adim: Supabase Dashboard > SQL Editor > New Query > Dosyayi yapistir > Run');
    console.log('------------------------------------------------------------');

    // Alternatif: exec_sql RPC dene
    console.log('\nExec_sql RPC deneniyor...');
    const sql = `
    CREATE TABLE IF NOT EXISTS b1_ajan_gorevler (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      gorev_adi TEXT NOT NULL,
      gorev_tipi TEXT NOT NULL DEFAULT 'arastirma',
      oncelik TEXT NOT NULL DEFAULT 'normal',
      gorev_emri TEXT NOT NULL DEFAULT '',
      hedef_modul TEXT,
      hedef_tablo TEXT,
      hedef_alan TEXT,
      yetki_internet BOOLEAN DEFAULT false,
      yetki_supabase_yaz BOOLEAN DEFAULT true,
      yetki_supabase_oku BOOLEAN DEFAULT true,
      yetki_ai_kullan BOOLEAN DEFAULT true,
      yetki_dosya_olustur BOOLEAN DEFAULT false,
      ajan_adi TEXT NOT NULL DEFAULT 'Genel',
      durum TEXT NOT NULL DEFAULT 'bekliyor',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      baslangic_tarihi TIMESTAMPTZ,
      bitis_tarihi TIMESTAMPTZ,
      sonuc_ozeti TEXT,
      sonuc_detay JSONB,
      hata_mesaji TEXT,
      koordinator_notu TEXT,
      tekrar_sayisi INT DEFAULT 0,
      son_calistiran TEXT DEFAULT 'koordinator'
    );
  `;

    const { data: rpcData, error: rpcErr } = await sb.rpc('exec_sql', { sql });
    if (rpcErr) {
        console.log('exec_sql RPC mevcut degil:', rpcErr.message);
        console.log('\nLUTFEN SUPABASE SQL EDITOR DA SU DOSYAYI CALISTIRIN:');
        console.log('C:\\Users\\Admin\\Desktop\\47_SIL_BASTAN_01\\gorevler_tablosu.sql');
    } else {
        console.log('TABLO OLUSTURULDU!', rpcData);
    }
}

tablouOlustur().catch(console.error);
