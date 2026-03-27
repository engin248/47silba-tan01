import { NextResponse } from 'next/server';
import { KuyruktanAl, KuyrukUzunlugu } from '@/lib/redis_kuyruk';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

/**
 * /api/kuyruk-motoru 
 * GREVİ: Redis 'scraper_jobs' kuyrugundaki bekleyen grevleri eker.
 * ZIRH (Rate Limit): Aynı anda sadece `CONCURRENCY_LIMIT` kadar grevi eker (Spam ve RAM koruması).
 */
export async function POST(req) {
    try {
        const auth = req.headers.get('Authorization');
        // Sadece Cron veya Yetkili servisle tetiklenebilir — her ortamda geerli
        if (auth !== `Bearer ${process.env.CRON_SECRET}`) { // [FIX] devMode bypass kaldIrIldı
            return NextResponse.json({ error: 'Siber ZIrh: Yetkisiz Tetikleme Yasak' }, { status: 401 });
        }

        // ZIRH: CONCURRENCY LIMIT (Rate Limiting - Sogutma Kalkanı)
        // Eger kuyrukta 500 grev varsa, Vercel ker. Sadece 2 tanesini eker!
        const CONCURRENCY_LIMIT = 2;
        let uyandirilanAjanlar = [];

        const mevcutGorevSayisi = await KuyrukUzunlugu('scraper_jobs');
        if (mevcutGorevSayisi === 0) {
            return NextResponse.json({ success: true, message: 'Kuyruk boş, sahaya srlecek ajan yok. Sistem istirahatte.' });
        }

        for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
            const gorev = await KuyruktanAl('scraper_jobs');
            if (gorev) {
                uyandirilanAjanlar.push(gorev);

                // KURAL 20: Tamamen Asenkron Serbest BIrak (Fire-and-forget)
                // Node JS Child Process olarak izole bir asker dogurur.
                if (gorev.data?.hedef === 'trendyol_indirim') {
                    // Not: Windows/Linux VPS farketmeksizin asenkron alIsIr
                    execAsync(`node src/scripts/scrapers/oluisci.js`).catch(err => {
                        console.error("[SHIELD_LOG] BagImsIz Ajan kmesi İnfazla BastIrIldı:", err.message);
                    });
                } else {
                    // Diger ajan hedefleri iin
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `${uyandirilanAjanlar.length} ajan sogutma (Rate Limit) kalkanIndan geerek sahaya ateslendi.`,
            tetiklenen_ajan_sayisi: uyandirilanAjanlar.length,
            kalan_kuyruk: await KuyrukUzunlugu('scraper_jobs') - uyandirilanAjanlar.length
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
