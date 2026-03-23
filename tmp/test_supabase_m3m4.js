require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
    console.log("Testing Supabase connection for M3/M4 tables...");
    
    // Test with Service Role first (Bypasses RLS)
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: adminData, error: adminErr } = await supabaseAdmin.from('b1_model_taslaklari').select('*').limit(5);
    console.log("Service Role (Bypass RLS) Result:", adminErr ? adminErr : `Found ${adminData?.length} records.`);

    // Test with Anon Key (Simulating Frontend UI!)
    const supabaseAnon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: anonData, error: anonErr } = await supabaseAnon.from('b1_model_taslaklari').select('*').limit(5);
    console.log("Anon Key (Frontend Simulation) Result:", anonErr ? anonErr : `Found ${anonData?.length} records.`);
    
    // Test kalip table with Anon
    const { data: kalipData, error: kalipErr } = await supabaseAnon.from('b1_model_kaliplari').select('*').limit(5);
    console.log("Anon Key (Kaliplari) Result:", kalipErr ? kalipErr : `Found ${kalipData?.length} records.`);
}

testConnection();
