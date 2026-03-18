require('dotenv').config({ path: '.env.local' });
const { KuyruktanAl } = require('../src/lib/redis_kuyruk');
const { bot3GoogleTalepAjani } = require('../arge_ajanlari/talep_google');
const { bot4MetaReklamAjani } = require('../arge_ajanlari/reklam_meta');
const { bot5MerkeziSorguHakemi } = require('../arge_ajanlari/filtre_suzgec');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const QUEUE_NAME = 'scraper_jobs';
const DELAY_MS = 2000;

async function baslatKuyrukMotoru() {
    console.log(`[SCRAPER WORKER] Kazıyıcı İşçi Ayaklandı. Kuyruk Dinleniyor: ${QUEUE_NAME}...`);

    while (true) {
        try {
            const job = await KuyruktanAl(QUEUE_NAME);

            if (job) {
                const hedef = job.data.hedef;
                console.log(`\n[SCRAPER WORKER] Vercel'den Emir Geldi! Hedef: ${hedef}`);

                // Adım 1: Perplexity ve Google Trends Makro Taraması
                await supabase.from('b1_agent_loglari').insert([{
                    ajan_adi: 'BOT 3: GOOGLE',
                    islem_tipi: 'TETIKLENDI',
                    mesaj: `Hedef aranıyor: ${hedef}`,
                    sonuc: 'bekliyor'
                }]);
                await bot3GoogleTalepAjani(hedef);

                // Adım 2: Meta Reklam Sıçraması (Organiklik) Taraması
                await supabase.from('b1_agent_loglari').insert([{
                    ajan_adi: 'BOT 4: META',
                    islem_tipi: 'TETIKLENDI',
                    mesaj: `Reklam kütüphanesine dalındı: ${hedef}`,
                    sonuc: 'bekliyor'
                }]);
                await bot4MetaReklamAjani(hedef);

                // Adım 3: Merkezi Yargıç (Hermania) Karar Versin
                await supabase.from('b1_agent_loglari').insert([{
                    ajan_adi: 'BOT 5: HERMANIA',
                    islem_tipi: 'TETIKLENDI',
                    mesaj: `Ajanların topladığı veriler ${hedef} için yargılanıyor...`,
                    sonuc: 'bekliyor'
                }]);
                await bot5MerkeziSorguHakemi(hedef);

                console.log(`[SCRAPER WORKER] İş ${job.id} Zinciri Başarıyla Tamamlandı.`);
            } else {
                await new Promise(res => setTimeout(res, 2000));
            }
        } catch (error) {
            console.error(`[SCRAPER WORKER ERROR] Zincir Çöktü:`, error.message);
        }

        await new Promise(res => setTimeout(res, DELAY_MS));
    }
}

baslatKuyrukMotoru();
