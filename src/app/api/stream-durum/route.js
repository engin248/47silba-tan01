import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { spamKontrol } from '@/lib/ApiZirhi';

export const dynamic = 'force-dynamic';
export const maxDuration = 5;

export async function GET(request) {
    // R2 FIX (Müfettiş 19.03.2026): Rate limit zirhi eklendi
    const ip = request.headers.get('x-forwarded-for') || 'sistem';
    const { izinVerildi } = spamKontrol(ip);
    if (!izinVerildi) return NextResponse.json({ durum: 'kapali', mesaj: 'Rate limit' }, { status: 429 });

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

=======

// go2rtc stream sunucu sağlık kontrolü
export async function GET() {
    const go2rtcUrl = 'https://kamera.demirtekstiltheondercom.com';

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${go2rtcUrl}/api`, {
            signal: controller.signal,
            cache: 'no-store',
        });
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        clearTimeout(timeout);

        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            return NextResponse.json({
                durum: 'aktif',
<<<<<<< HEAD
                kamera_sayisi: Object.keys(data).length || 0
            }, { status: 200 });
        }

        return NextResponse.json({ durum: 'hata', mesaj: `HTTP ${res.status}` }, { status: 200 });

    } catch (error) {
        return NextResponse.json({
            durum: 'kapali',
            mesaj: 'Baglanti koptu'
        }, { status: 200 }); // Kapasite hatasını Vercel'e yansıtma
=======
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
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    }
}
