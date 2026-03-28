require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log("Checking b1_maliyet_kayitlari...");
  const { data: m, error: e1 } = await supabase.from('b1_maliyet_kayitlari').select('*').limit(1);
  console.log("Maliyet columns:", m ? Object.keys(m[0] || {}) : e1);

  console.log("Checking b1_sistem_uyarilari...");
  const { data: s, error: e2 } = await supabase.from('b1_sistem_uyarilari').select('*').limit(1);
  console.log("Uyari columns:", s ? Object.keys(s[0] || {}) : e2);
}

checkSchema();
