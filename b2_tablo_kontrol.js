// Supabase tablo varlık kontrolü — anon key ile
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function kontrol() {
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40));

    // Önce b1 tablosunun çalıştığını doğrula
    const { data: b1, error: eb1 } = await sb.from('b1_model_taslaklari').select('id').limit(1);
    console.log('b1_model_taslaklari:', eb1 ? 'HATA: ' + eb1.message : 'OK ✅');

    // Şimdi b2 tablolarını dene
    const tablolar = ['b2_musteriler', 'b2_urun_katalogu', 'b2_siparisler', 'b2_siparis_kalemleri', 'b2_stok_hareketleri', 'b2_kasa_hareketleri'];
    for (const tbl of tablolar) {
        const { data, error } = await sb.from(tbl).select('id').limit(1);
        console.log(`${tbl}: ${error ? '❌ ' + error.message : '✅ OK (' + data.length + ' kayıt)'}`);
    }

    // Service role key ile dene (eğer varsa)
    const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (srKey) {
        console.log('\n--- SERVICE ROLE ile test ---');
        const sbSR = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, srKey);
        for (const tbl of tablolar) {
            const { data, error } = await sbSR.from(tbl).select('id').limit(1);
            console.log(`SR ${tbl}: ${error ? '❌ ' + error.message : '✅ OK'}`);
        }
    }
}
kontrol().catch(console.error);
