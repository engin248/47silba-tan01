const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data, error } = await supabase.from('b1_arge_trend_data').select('*').limit(1);
    if (error) console.error(error);
    else console.log('b1_arge_trend_data:', Object.keys(data[0] || {}));
}
run();
