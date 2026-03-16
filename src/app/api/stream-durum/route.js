import { NextResponse } from 'next/server';

// go2rtc stream sunucu sağlık kontrolü
export const dynamic = 'force-dynamic';

export async function GET() {
    const go2rtcUrl = process.env.NEXT_PUBLIC_GO2RTC_URL || process.env.GO2RTC_URL || 'http://localhost:1984';

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

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

    } catch (err) {
        const kapali = err.name === 'AbortError' || err.code === 'ECONNREFUSED';
        return NextResponse.json({
            durum: 'kapali',
            url: go2rtcUrl,
            mesaj: kapali ? 'go2rtc çalışmıyor — stream-server/BASLAT.bat ile başlatın' : err.message,
        });
    }
}
