const { KuyruktanAl, KuyrukUzunlugu } = require('./src/lib/redis_kuyruk.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase Sunucu ve Veritabanı Zırhı Bağlantısı
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Kurallar Gereği Sunucu Boğulmaması İçin Maksimum Sekme/Ajan Kuralı
const GOREV_LIMITI = 2; // Aynı anda koşacak Max Tarayıcı (Concurrency)
let aktifGorevler = 0;

/**
 * Siber İşçi Motoru: 
 * Upstash Redis Kuyruğunu dinler, sıradaki görevi alır
 * Çapraz testli ve izlenebilir mimari (bot_tracking_logs) ile infazı/işlemi yürütür.
 */
async function isciMotoru() {
    try {
        if (aktifGorevler >= GOREV_LIMITI) {
            return; // Sınır dolu, beklemede kal
        }

        const job = await KuyruktanAl('scraper_jobs');
        if (!job) return; // Kuyruk boş

        aktifGorevler++;
        console.log(`\n[İŞÇİ] 🎯 Yeni Görev Alındı: ${job.data.hedef} | Job ID: ${job.id}`);

        // 1. Supabase "Canlı İzleme (Realtime)" Tablosuna Adımı Yaz
        // Patronun verdiği Global Agent Rules SQL yapısına uyarlıdır.
        await supabase.from('bot_tracking_logs').insert([{
            job_id: job.id,
            ajan_adi: 'DAĞITICI_MİMAR',
            hedef_kavram: job.data.hedef,
            ilerleme_yuzdesi: 25,
            durum: 'çalışıyor',
            son_mesaj: 'İşçi bot sahaya (TikTok/Trendyol) iniş yapıyor...'
        }]);

        // FAZ 1 UYGULANACAK ALAN: (Burası AŞAMA 2 ve 3 de Ajanları Tetikleyecek Kod Bloğu)
        // Şimdilik Simülasyon:

        setTimeout(async () => {
            // 3. Başarılı Bitiş - Vize Alındı (%100)
            await supabase.from('bot_tracking_logs').update({
                ilerleme_yuzdesi: 100,
                durum: 'onaylandı',
                son_mesaj: 'Ajan görevi başarıyla bitirdi, veriler M2 fizibilitesi için hazırlandı.'
            }).eq('job_id', job.id);

            console.log(`[İŞÇİ] ✅ ${job.data.hedef} görevi %100 onaylandı.`);
            aktifGorevler--;
        }, 5000);

    } catch (err) {
        console.error("[İŞÇİ HATA İNFAZI] Motor Kırılması:", err.message);
        aktifGorevler--;
    }
}

// Kalp atışı: İşçi her 1 saniyede bir tetikte uyanır ve radar bakar
setInterval(isciMotoru, 1000);
console.log("\n🛡️ SİBER İŞÇİ (Otonom Worker) BAŞLATILDI. Redis Kuyruğu Dinleniyor...\n");
