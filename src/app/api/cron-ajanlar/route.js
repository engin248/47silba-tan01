import { NextResponse } from 'next/server';

/**
 * /api/cron-ajanlar — ZAMANLANMIŞ AJAN KÖPRÜSÜ (GÜNCELLENDİ)
 * 
 * [Vercel-Node Ayrımı Operasyonu]:
 * Eskiden tüm ağır AI ajanları burada Next.js (Vercel) içinde çalışıyordu ve Timeout'a takılıyordu.
 * 
 * YENİ MİMARİ (KÖR NOKTA GİDERİLDİ):
 * 1. Kamera Kontrol: Sadece Vercel'de çalışmaya devam eder (Hafif İşlem). URL artık process.env'den çekilmektedir.
 * 2. Diğer Ajanlar: Gerçek bir Webhook (POST) atılarak Mizanet-Backend (Node.js) sunucusuna "devredilir".
 * Vercel sadece tetikleyici (Trigger Orchestrator) görevi görür.
 */
export async function GET(req) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Yetkisiz Cron İstegi' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gorev = searchParams.get('gorev');
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Sadece Telegram Kamera Kopması Uyarısını Vercel'de bırakıyoruz
    if (gorev === 'kamera_durum_kontrol_ajan') {
        const go2rtcUrl = process.env.NVR_TUNNEL_URL; // .env'den alınacak (Sabitlenmiş Zero Trust adresi)
        if (!go2rtcUrl) {
            console.error('[CRON HATA] NVR_TUNNEL_URL environment variable eksik.');
            return NextResponse.json({ error: 'NVR_TUNNEL_URL eksik' }, { status: 500 });
        }

        let nvrDurum = 'aktif';
        try {
            // Timeout 5000ms yapıldı (Cloudflare / Network gecikmesine tolerans)
            const res = await fetch(`${go2rtcUrl}/api`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
            if (!res.ok) nvrDurum = 'kapali';
        } catch (error) {
            console.error('[CRON KAMERA] Ping hatası veya Timeout:', error.message);
            nvrDurum = 'kapali';
        }

        // Türkiye Saati (UTC+3) ile Mesai dışı kontrolünü güvenli ve hatasız (Int) olarak hesaplama
        const now = new Date();
        const trHour = (now.getUTCHours() + 3) % 24;
        const mesaiDisi = trHour >= 0 && trHour < 8; // Gece 00:00 ile Sabah 08:00 arası alarm atma

        if (nvrDurum === 'kapali' && !mesaiDisi) {
            if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                try {
                    const telegramRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: TELEGRAM_CHAT_ID,
                            text: "🔴 *KRITIK UYARI* 🔴\n\nNVR Kamera Stream Sunucusu ulaşılamıyor! Bağlantı koptu veya çöktü.",
                            parse_mode: 'Markdown'
                        })
                    });
                    if (!telegramRes.ok) {
                        const errText = await telegramRes.text();
                        console.error('[CRON TELEGRAM HATA] Mesaj atılamadı:', errText);
                    }
                } catch (telegramErr) {
                    console.error('[CRON TELEGRAM KRİTİK HATA] Ağ işlemi başarısız:', telegramErr.message);
                }
            } else {
                console.warn('[CRON UYARI] Telegram değişkenleri (.env) eksik, izinsiz donanım kapanması bildirilemedi.');
            }
        }
        return NextResponse.json({ success: true, mesaj: `Kamera kontrolü yapıldı: ${nvrDurum}` });
    }

    // --- GERÇEK WEBHOOK KÖPRÜSÜ (Kör Nokta Düzeltmesi) ---
    // Diğer tüm ağır görevler (Sabah, Akşam, Ar-Ge) NodeJS PC sunucusuna DEVREDİLİR
    const nodeBackendUrl = process.env.NODE_BACKEND_URL; // Örn: https://backend.demirtekstiltheonder.com VEYA Sabit Tünel URL'si

    if (!nodeBackendUrl) {
        console.warn(`[VERCEL CRON] '${gorev}' tetiklendi. NODE_BACKEND_URL tanımlı değil, devredilemiyor!`);
        return NextResponse.json({
            success: false,
            error: `[Vercel-Node Ayrımı Başarısız] '${gorev}' görevi için hedef NODE_BACKEND_URL bulunamadı.`
        }, { status: 500 });
    }

    try {
        console.log(`[VERCEL CRON] '${gorev}' görevi için ${nodeBackendUrl} adresine HTTP POST (Webhook) atılıyor...`);
        // Vercel Timeout'una (60s barajı) takılmamak için Node.js tarafı bu isteği alır almaz ASENKRON (Arkaplanda) başlatıp anında 200 dönmelidir!
        const webhookRes = await fetch(`${nodeBackendUrl}/api/run-agent?gorev=${gorev}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(5000) // Node.js 5 saniye içinde "Görevi Aldım" (200 OK) demeli.
        });

        if (!webhookRes.ok) {
            const errText = await webhookRes.text();
            console.error(`[VERCEL CRON WEBHOOK HATA] ${gorev} hedef backend'e devredilemedi. Status: ${webhookRes.status}`, errText);
            return NextResponse.json({ success: false, error: 'Webkook hedef sunucu tarafından reddedildi.' }, { status: webhookRes.status });
        }

        console.log(`[VERCEL CRON DUMMY DEĞİL, GERÇEK!] '${gorev}' başarıyla yerel Node.js sunucusuna (${nodeBackendUrl}) devredildi.`);
        return NextResponse.json({
            success: true,
            mesaj: `[Vercel-Node Tam Ayrımı] Görev Node.js sunucusuna tetikleyici webhook atılarak başarıyla devredildi.`
        });

    } catch (err) {
        console.error(`[VERCEL CRON WEBHOOK AĞ HATASI] '${gorev}' devredilirken bağlantı koptu veya Backend kapalı:`, err.message);
        return NextResponse.json({ success: false, error: 'Hedef Backend kapalı veya ulaşılamaz durumda.' }, { status: 502 });
    }
}
