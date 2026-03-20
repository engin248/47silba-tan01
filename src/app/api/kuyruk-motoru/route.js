export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { KuyruktanAl, KuyrukUzunlugu } from '@/lib/redis_kuyruk';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

/**
 * /api/kuyruk-motoru 
 * GÃ–REVÄ°: Redis 'scraper_jobs' kuyruÄŸundaki bekleyen gÃ¶revleri Ã§eker.
 * ZIRH (Rate Limit): AynÄ± anda sadece `CONCURRENCY_LIMIT` kadar gÃ¶revi Ã§eker (Spam ve RAM korumasÄ±).
 */
export async function POST(req) {
    try {
        const auth = req.headers.get('Authorization');
        const devMode = process.env.NODE_ENV === 'development';

        // Sadece Cron veya Yetkili servisle tetiklenebilir
        if (!devMode && auth !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Siber ZÄ±rh: Yetkisiz Tetikleme Yasak' }, { status: 401 });
        }

        // ZIRH: CONCURRENCY LIMIT (Rate Limiting - SoÄŸutma KalkanÄ±)
        // EÄŸer kuyrukta 500 gÃ¶rev varsa, Vercel Ã§Ã¶ker. Sadece 2 tanesini Ã§eker!
        const CONCURRENCY_LIMIT = 2;
        let uyandirilanAjanlar = [];

        const mevcutGorevSayisi = await KuyrukUzunlugu('scraper_jobs');
        if (mevcutGorevSayisi === 0) {
            return NextResponse.json({ success: true, message: 'Kuyruk boÅŸ, sahaya sÃ¼rÃ¼lecek ajan yok. Sistem istirahatte.' });
        }

        for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
            const gorev = await KuyruktanAl('scraper_jobs');
            if (gorev) {
                uyandirilanAjanlar.push(gorev);

                // KURAL 20: Tamamen Asenkron Serbest BÄ±rak (Fire-and-forget)
                // Node JS Child Process olarak izole bir asker doÄŸurur.
                if (gorev.data?.hedef === 'trendyol_indirim') {
                    // Not: Windows/Linux VPS farketmeksizin asenkron Ã§alÄ±ÅŸÄ±r
                    execAsync(`node src/scripts/scrapers/oluisci.js`).catch(err => {
                        console.error("[SHIELD_LOG] BaÄŸÄ±msÄ±z Ajan Ã‡Ã¶kmesi Ä°nfazla BastÄ±rÄ±ldÄ±:", err.message);
                    });
                } else {
                    // DiÄŸer ajan hedefleri iÃ§in
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `${uyandirilanAjanlar.length} ajan soÄŸutma (Rate Limit) kalkanÄ±ndan geÃ§erek sahaya ateÅŸlendi.`,
            tetiklenen_ajan_sayisi: uyandirilanAjanlar.length,
            kalan_kuyruk: await KuyrukUzunlugu('scraper_jobs') - uyandirilanAjanlar.length
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
