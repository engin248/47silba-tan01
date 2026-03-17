import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 5;

export async function GET() {
    try {
        const go2rtcUrl = process.env.NEXT_PUBLIC_GO2RTC_URL || process.env.GO2RTC_URL || 'http://localhost:1984';

        const isLocalhost = go2rtcUrl.includes('localhost') || go2rtcUrl.includes('127.0.0.1');
        if (isLocalhost && process.env.NODE_ENV === 'production') {
            return NextResponse.json({
                durum: 'kapali',
                url: go2rtcUrl,
                mesaj: 'go2rtc production ortaminda calismaz'
            }, { status: 200 }); // Asla 500/503 atma
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000); // 2 saniye zorunlu koparma

        const res = await fetch(`${go2rtcUrl}/api`, {
            signal: controller.signal,
            cache: 'no-store'
        });

        clearTimeout(timeout);

        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            return NextResponse.json({
                durum: 'aktif',
                kamera_sayisi: Object.keys(data).length || 0
            }, { status: 200 });
        }

        return NextResponse.json({ durum: 'hata', mesaj: `HTTP ${res.status}` }, { status: 200 });

    } catch (error) {
        return NextResponse.json({
            durum: 'kapali',
            mesaj: 'Baglanti koptu'
        }, { status: 200 }); // Kapasite hatasını Vercel'e yansıtma
    }
}
