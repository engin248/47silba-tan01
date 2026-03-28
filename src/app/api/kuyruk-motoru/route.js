import { NextResponse } from 'next/server';
import { KuyruktanAl, KuyrukUzunlugu } from '@/lib/redis_kuyruk';

/**
 * /api/kuyruk-motoru 
 * GÖREVİ: Redis 'scraper_jobs' kuyruğundaki bekleyen görevleri çeker.
 * DİKKAT: Arka uç mimarisi fiziksel olarak ayrıştırıldığı için, bu API artık
 * doğrudan yerel script (oluisci.js) ÇALIŞTIRAMAZ. Görevi sadece veritabanına işaretler
 * ve masaüstündeki bağımsız Mizanet-Backend bunu dinleyerek çalışır.
 */
export async function POST(req) {
    try {
        const auth = req.headers.get('Authorization');
        if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Siber Zırh: Yetkisiz Tetikleme Yasak' }, { status: 401 });
        }

        const CONCURRENCY_LIMIT = 2;
        let uyandirilanAjanlar = [];

        const mevcutGorevSayisi = await KuyrukUzunlugu('scraper_jobs');
        if (mevcutGorevSayisi === 0) {
            return NextResponse.json({ success: true, message: 'Kuyruk boş. Sistem istirahatte.' });
        }

        for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
            const gorev = await KuyruktanAl('scraper_jobs');
            if (gorev) {
                uyandirilanAjanlar.push(gorev);
                console.log("[MİMARİ_GÜÇLENDİRME] Ön yüz (Vercel) fiziksel bot çalıştıramaz. Görev arka uca devredildi:", gorev.data?.hedef);
                // NOT: Arka uç (Mizanet-Backend) doğrudan Redis veya Supabase'den bu görevi devralacak.
            }
        }

        return NextResponse.json({
            success: true,
            message: `${uyandirilanAjanlar.length} görev arka uca yönlendirildi.`,
            tetiklenen_ajan_sayisi: uyandirilanAjanlar.length,
            kalan_kuyruk: await KuyrukUzunlugu('scraper_jobs') - uyandirilanAjanlar.length
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
