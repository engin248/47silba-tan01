import { NextResponse } from 'next/server';

// go2rtc stream sunucu sağlık kontrolü
export const dynamic = 'force-dynamic';
export const maxDuration = 5; // Vercel Serverless: max 5s — 503 önlemi

export async function GET() {
    const go2rtcUrl = process.env.NEXT_PUBLIC_GO2RTC_URL || process.env.GO2RTC_URL || 'http://localhost:1984';

    // Vercel/production ortamında go2rtc lokal servis — 200 ile kapali döndür
    // ÖNEMLİ: 503 yerine 200 kullanılıyor — tarayıcı konsol hatası önleniyor
    if (process.env.VERCEL === '1' || process.env.VERCEL_URL) {
        return NextResponse.json({
            durum: 'kapali',
            url: go2rtcUrl,
            mesaj: 'go2rtc Vercel ortamında çalışmaz — yerel sunucu gerekli',
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=300',  // 5 dakika cache — gereksiz istekleri azaltır
            }
        });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        let res;
        try {
            res = await fetch(`${go2rtcUrl}/api`, {
                signal: controller.signal,
                cache: 'no-store',
            });
        } finally {
            clearTimeout(timeout);
        }

        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            return NextResponse.json({
                durum: 'aktif',
                url: go2rtcUrl,
                kamera_sayisi: Object.keys(data).length || 0,
                mesaj: 'Stream sunucusu çalışıyor',
            });
        }

        return NextResponse.json({ durum: 'hata', url: go2rtcUrl, mesaj: `HTTP ${res.status}` });

    } catch {
        return NextResponse.json({
            durum: 'kapali',
            url: go2rtcUrl,
            mesaj: 'fetch failed',
        });
    }
}
