import { NextResponse } from 'next/server';
import { KuyruktanAl, KuyrukUzunlugu } from '@/lib/redis_kuyruk';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

/**
 * /api/kuyruk-motoru 
 * GÖREVİ: Redis 'scraper_jobs' kuyruğundaki bekleyen görevleri çeker.
 * ZIRH (Rate Limit): Aynı anda sadece `CONCURRENCY_LIMIT` kadar görevi çeker (Spam ve RAM koruması).
 */
export async function POST(req) {
    try {
        const auth = req.headers.get('Authorization');
        const devMode = process.env.NODE_ENV === 'development';

        // Sadece Cron veya Yetkili servisle tetiklenebilir
        if (!devMode && auth !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Siber Zırh: Yetkisiz Tetikleme Yasak' }, { status: 401 });
        }

        // ZIRH: CONCURRENCY LIMIT (Rate Limiting - Soğutma Kalkanı)
        // Eğer kuyrukta 500 görev varsa, Vercel çöker. Sadece 2 tanesini çeker!
        const CONCURRENCY_LIMIT = 2;
        let uyandirilanAjanlar = [];

        const mevcutGorevSayisi = await KuyrukUzunlugu('scraper_jobs');
        if (mevcutGorevSayisi === 0) {
            return NextResponse.json({ success: true, message: 'Kuyruk boş, sahaya sürülecek ajan yok. Sistem istirahatte.' });
        }

        for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
            const gorev = await KuyruktanAl('scraper_jobs');
            if (gorev) {
                uyandirilanAjanlar.push(gorev);

                // KURAL 20: Tamamen Asenkron Serbest Bırak (Fire-and-forget)
                // Node JS Child Process olarak izole bir asker doğurur.
                if (gorev.data?.hedef === 'trendyol_indirim') {
                    // Not: Windows/Linux VPS farketmeksizin asenkron çalışır
                    execAsync(`node src/scripts/scrapers/oluisci.js`).catch(err => {
                        console.error("[SHIELD_LOG] Bağımsız Ajan Çökmesi İnfazla Bastırıldı:", err.message);
                    });
                } else {
                    // Diğer ajan hedefleri için
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `${uyandirilanAjanlar.length} ajan soğutma (Rate Limit) kalkanından geçerek sahaya ateşlendi.`,
            tetiklenen_ajan_sayisi: uyandirilanAjanlar.length,
            kalan_kuyruk: await KuyrukUzunlugu('scraper_jobs') - uyandirilanAjanlar.length
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
