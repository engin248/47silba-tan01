const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const KONTROL = [
    ['m2_finans_veto', 'm2_kar_ajani tarafindan kullaniliyor'],
    ['m2_finansal_kilit', 'm2_finans_kar_ajani.js tarafindan kullaniliyor'],
    ['m4_yayindaki_vitrin_urunleri', 'vitrin_senkronizasyon_ajani.js'],
];

async function main() {
    for (const [ad, aciklama] of KONTROL) {
        process.stdout.write('\n[' + ad + ']\n');
        process.stdout.write('  Aciklama : ' + aciklama + '\n');

        const { data, error } = await supabase.from(ad).select('*').limit(1);
        if (error) {
            process.stdout.write('  Hata Kodu: ' + error.code + '\n');
            process.stdout.write('  Mesaj    : ' + error.message + '\n');
            process.stdout.write('  Detay    : ' + (error.details || '-') + '\n');
            process.stdout.write('  Hint     : ' + (error.hint || '-') + '\n');
        } else {
            process.stdout.write('  Durum    : ERISILEBILDI\n');
            process.stdout.write('  Data     : ' + JSON.stringify(data) + '\n');
        }
    }
}

main().catch(e => process.stdout.write('Script hatasi: ' + e.message + '\n'));
