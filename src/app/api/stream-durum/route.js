import { NextResponse } from 'next/server';

// go2rtc stream sunucu sağlık kontrolü
export async function GET() {
    const go2rtcUrl = (process.env.GO2RTC_URL || process.env.NEXT_PUBLIC_GO2RTC_URL || 'http://localhost:1984').trim();

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${go2rtcUrl}/api`, {
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timeout);

        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            return NextResponse.json({
                durum: 'aktif',
                url: go2rtcUrl,
                kamera_sayisi: Object.keys(data).length || 0,
                mesaj: 'Stream sunucusu çalışıyor',
            });
        }

        return NextResponse.json({ durum: 'hata', url: go2rtcUrl, mesaj: `HTTP ${res.status}` }, { status: 503 });

    } catch (err) {
        const kapali = err.name === 'AbortError' || err.code === 'ECONNREFUSED';
        return NextResponse.json({
            durum: 'kapali',
            url: go2rtcUrl,
            mesaj: kapali ? 'go2rtc çalışmıyor — stream-server/BASLAT.bat ile başlatın' : err.message,
        }, { status: 503 });
    }
}
