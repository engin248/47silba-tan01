const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'C:\\Users\\Esisya\\Desktop\\47_SilBaştan\\.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking b2_siparisler...");
    const { data: siparisler } = await supabase.from('b2_siparisler').select('*').order('created_at', { ascending: false }).limit(2);
    console.log(siparisler);

    console.log("Checking b2_kasa_hareketleri...");
    const { data: kasa } = await supabase.from('b2_kasa_hareketleri').select('*').order('created_at', { ascending: false }).limit(2);
    console.log(kasa);
}

check();
