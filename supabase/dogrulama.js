const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sadece yeni eklenen 6 tabloyu kontrol et
const YEN_TABLOLAR = [
    'm4_finansal_kasa_arsivi',
    'm4_fiziksel_satin_almalar',
    'sistem_parametreleri',
    'm2_finans_veto',
    'm2_finansal_kilit',
    'm4_yayindaki_vitrin_urunleri',
];

async function main() {
    let tamam = 0, sorun = 0;
    for (const ad of YEN_TABLOLAR) {
        const { error, count } = await supabase.from(ad).select('*', { count: 'exact', head: true });
        if (!error) {
            process.stdout.write('OK   | ' + ad + ' | ' + (count || 0) + ' satir\n');
            tamam++;
        } else {
            process.stdout.write('HATA | ' + ad + ' | ' + error.code + ': ' + error.message + '\n');
            sorun++;
        }
    }
    process.stdout.write('\nSONUC: ' + tamam + ' OK | ' + sorun + ' SORUN\n');
}
main().catch(e => process.stdout.write('Script hatasi: ' + e.message + '\n'));
