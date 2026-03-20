export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { KuyrugaEkle } from '../../../../src/lib/redis_kuyruk';

export async function POST(req) {
    try {
        // Ajan gÃ¶revlerini kuyruÄŸa ASENKRON olarak ekler (UI Asla Kilitlenmez)
        // Bu, arkaplanda calisan worker.js tarafÄ±ndan iÅŸlenecektir.

        // Ã–rnek tetiklemeler: TikTok ve Trendyol saha taramalarÄ±
        await KuyrugaEkle('scraper_jobs', {
            hedef: 'trendyol_indirim',
            ajanadi: 'Vision Trendyol Ajani',
            timestamp: Date.now()
        });

        await KuyrugaEkle('scraper_jobs', {
            hedef: 'tiktok_trend',
            ajanadi: 'Sokak Trend Ajani',
            timestamp: Date.now()
        });

        return NextResponse.json({
            success: true,
            message: 'GÃ¶revler Sentinel/Worker havuzuna sevk edildi. Arka planda asenkron yÃ¼rÃ¼tÃ¼lecek.'
        }, { status: 200 });

    } catch (error) {
        console.error('API Tetikleme HatasÄ±:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
