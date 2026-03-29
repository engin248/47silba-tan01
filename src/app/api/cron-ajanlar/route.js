import { NextResponse } from 'next/server';

/**
 * /api/cron-ajanlar — ZAMANLANMIŞ AJAN KÖPRÜSÜ (GÜNCELLENDİ)
 * 
 * [Vercel-Node Ayrımı Operasyonu]:
 * Eskiden Sabah Subayı, Akşamcı, Nabız gibi tüm ağır AI ajanları burada Next.js 
 * içerisinde Serverless function olarak çalıştırılıyordu. Bu durum Vercel Hobby 
 * katmanında 60 saniye timeout (ölüm) sınırına takılıyordu.
 * 
 * YENİ MİMARİ:
 * Tüm ajan yükü Mizanet-Backend (Yerel Makine / Engin PC) tarafına aktarılmıştır.
 * Vercel Cron tetiklendiği anda yükü çalıştırmadan 200 OK döner veya 
 * işi yerel makineye ping (Webhook) atarak devreder.
 */
export async function GET(req) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Yetkisiz Cron İstegi' }, { status: 401 });
    }

    const gorev = new URL(req.url).searchParams.get('gorev');
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Sadece Telegram Kamera Kopması Uyarısını Vercel'de bırakabiliriz (Hafif bir HTTP isteği olduğu için)
    if (gorev === 'kamera_durum_kontrol_ajan') {
        const go2rtcUrl = 'https://expanding-sept-safer-pages.trycloudflare.com';
        let nvrDurum = 'aktif';
        try {
            const res = await fetch(`${go2rtcUrl}/api`, { cache: 'no-store', signal: AbortSignal.timeout(3000) });
            if (!res.ok) nvrDurum = 'kapali';
        } catch {
            nvrDurum = 'kapali';
        }

        const saatTR = new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul", hour12: false, hour: "2-digit" });
        const mesaiDisi = parseInt(saatTR, 10) >= 0 && parseInt(saatTR, 10) < 8;

        if (nvrDurum === 'kapali' && !mesaiDisi) {
            if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: "🔴 *KRITIK UYARI* 🔴\n\nNVR Kamera Stream Sunucusu ulasIlamIyor!",
                        parse_mode: 'Markdown'
                    })
                }).catch(() => null);
            }
        }
        return NextResponse.json({ success: true, mesaj: `Kamera kontrolü yapıldı: ${nvrDurum}` });
    }

    // Diğer tüm ağır görevler (Sabah, Akşam, Ar-Ge) NodeJS PC sunucusuna aktarıldı
    console.log(`[VERCEL CRON] '${gorev}' tetiklendi. İşlem yerel Mizanet-Backend sunucusuna devredilmiş durumda, es geçiliyor.`);
    return NextResponse.json({
        success: true,
        mesaj: `[Vercel-Node Ayrımı] '${gorev}' görevi yerel (Node) sunucudaki scheduler (Zamanlayıcı) tarafından yönetiliyor. Vercel'in görevi bitirildi.`
    });
}
