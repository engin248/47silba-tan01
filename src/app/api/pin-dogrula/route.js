// /api/pin-dogrula — Server-side PIN doğrulama
// PIN'ler artık sadece bu server-side fonksiyonda okunur
// Client browser'da hiçbir zaman PIN göremez

import { NextResponse } from 'next/server';

// Rate limiting basit in-memory (serverless ortamda her request yeni — production'da Redis kullan)
const DENEME_KAYDI = new Map();
const MAX_DENEME = 5;
const KILIT_SURESI = 30 * 1000; // 30 saniye

export async function POST(request) {
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // Rate limiting kontrolü
    const simdi = Date.now();
    const kayit = DENEME_KAYDI.get(ip) || { sayi: 0, son: 0, kilitli: false, kilitBitis: 0 };

    if (kayit.kilitli && simdi < kayit.kilitBitis) {
        const kalan = Math.ceil((kayit.kilitBitis - simdi) / 1000);
        return NextResponse.json(
            { hata: `Çok fazla hatalı deneme. ${kalan} saniye bekleyin.` },
            { status: 429 }
        );
    }

    // Kilit süresi geçti mi?
    if (kayit.kilitli && simdi >= kayit.kilitBitis) {
        DENEME_KAYDI.delete(ip);
    }

    let pin;
    try {
        const body = await request.json();
        pin = body.pin?.trim();
    } catch {
        return NextResponse.json({ hata: 'Geçersiz istek formatı.' }, { status: 400 });
    }

    if (!pin || pin.length < 4) {
        return NextResponse.json({ hata: 'PIN en az 4 karakter olmalı.' }, { status: 400 });
    }

    const coordPin = process.env.COORDINATOR_PIN?.replace(/["']/g, '')?.replace(/\\r\\n/g, '')?.trim();
    const uretimPin = process.env.URETIM_PIN?.replace(/["']/g, '')?.replace(/\\r\\n/g, '')?.trim();
    const genelPin = process.env.GENEL_PIN?.replace(/["']/g, '')?.replace(/\\r\\n/g, '')?.trim();

    const PINLER = {
        [coordPin || '4747']: 'tam',
        [uretimPin || '1244']: 'uretim',
        [genelPin || '8888']: 'genel',
    };

    const grup = PINLER[pin] || null;

    if (!grup) {
        // Başarısız deneme kaydı
        const yeniKayit = DENEME_KAYDI.get(ip) || { sayi: 0, son: 0, kilitli: false, kilitBitis: 0 };
        yeniKayit.sayi += 1;
        yeniKayit.son = simdi;

        if (yeniKayit.sayi >= MAX_DENEME) {
            yeniKayit.kilitli = true;
            yeniKayit.kilitBitis = simdi + KILIT_SURESI;
            yeniKayit.sayi = 0;
        }

        DENEME_KAYDI.set(ip, yeniKayit);

        return NextResponse.json(
            { basarili: false, grup: null, kalanDeneme: MAX_DENEME - (yeniKayit.sayi) },
            { status: 401 }
        );
    }

    // Başarılı — deneme sayacını sıfırla
    DENEME_KAYDI.delete(ip);

    return NextResponse.json({ basarili: true, grup }, { status: 200 });
}
