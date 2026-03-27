const { KuyruktanAl } = require('../src/lib/redis_kuyruk');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') }); // [FIX] mutlak yol
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOK');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || ''); // [FIX] mutlak yol + undefined lint

const QUEUE_NAME = 'ai_jobs';
const DELAY_MS = 5000; // Rate limit yememek için 5 saniye bekleme (Soğutma)

/**
 * Bu otonom işçi (Worker), sürekli uyanık kalarak Redis'ten sıradaki Gemini işini alır,
 * işler, ve Supabase'e "tamamlandi" statüsünde postalar.
 */
async function baslatKuyrukMotoru() {
    console.log(`[AI WORKER] Otonom Soğutmalı İşçi Uyandı. Kuyruk Dinleniyor: ${QUEUE_NAME}...`);

    while (true) {
        try {
            const job = await KuyruktanAl(QUEUE_NAME);

            if (job) {
                console.log(`\n[AI WORKER] Yeni İş Teslim Alındı! ID: ${job.id}`);
                console.log(`[AI WORKER] Görev Tipi: ${job.data.istek_tipi} | Gönderen: ${job.data.ajan_adi}`);

                // 1. Gemini'ye İş Gönder
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(job.data.prompt);
                const response = await result.response;
                const aiSonucu = response.text();

                console.log(`[AI WORKER] Sonuç Alındı. Supabase'e Basılıyor...`);

                // 2. Supabase'e Yaz (10_AI_SOGUTMA mimarisini simüle ederek veya Karargaha işleyerek)
                // İdeal olarak, b1_ai_is_kuyrugu yerine asıl veritabanına kararı basıyoruz.
                let sonucJSON;
                try {
                    sonucJSON = JSON.parse(aiSonucu);
                } catch (e) {
                    sonucJSON = { raw_text: aiSonucu, parse_error: true };
                }

                // AI Sonuç logunu Supabase'e yaz (örnek agent_log)
                await supabase.from('b1_agent_loglari').insert({
                    ajan_adi: job.data.ajan_adi || 'AI_WORKER',
                    islem_tipi: job.data.istek_tipi,
                    mesaj: `Kuyruktan İşlendi: ${job.id}. Sonuç: Başarılı`,
                    sonuc: 'basarili',
                    detay: sonucJSON
                });

                console.log(`[AI WORKER] İş Başarıyla Bitirildi. `);
            } else {
                // Kuyruk boşsa bekle (Console kirliliğini önlemek için sadece küçük bir bekleme yapıyoruz)
                await new Promise(res => setTimeout(res, 2000));
            }
        } catch (error) {
            console.error(`[AI WORKER ERROR] Beklenmeyen Hata:`, error.message);
            // Hata durumunda da durakla ki sonsuz hata döngüsüne girmesin
        }

        // Dinlenme Saniyesi (AI Rate Limit Patlamaması İçin Zaruri!)
        await new Promise(res => setTimeout(res, DELAY_MS));
    }
}

baslatKuyrukMotoru();
