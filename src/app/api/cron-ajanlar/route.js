import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Kriter 141: Zamanlanmış Görev (CRON) Planlayıcı
export async function GET(req) {
    const authHeader = req.headers.get('Authorization');
    // Vercel Cron Güvenlik Doğrulaması
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Yetkisiz Cron İsteği' }, { status: 401 });
    }

    const unlem = new URL(req.url).searchParams.get('gorev');
    const supabaseAdmin = createClient(
        (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'),
        (process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key')
    );

    try {
        if (unlem === 'sabah_ozeti') {
            await supabaseAdmin.from('b1_ajan_gorevler').insert([{
                ajan_adi: 'Genel',
                gorev_adi: 'Otomatik Sabah Özeti Raporu',
                gorev_tipi: 'rapor',
                durum: 'bekliyor',
                oncelik: 'yuksek',
                gorev_emri: 'Dünkü üretim rakamlarını topla ve yönetime telegram at'
            }]);
            return NextResponse.json({ success: true, mesaj: 'Sabah cronu kuyruğa eklendi' });
        }

        if (unlem === 'gece_yedekleme_ve_temizlik') {
            await supabaseAdmin.from('b1_ajan_gorevler').insert([{
                ajan_adi: 'Sistem',
                gorev_adi: 'Gece Log Arşivleme',
                gorev_tipi: 'kontrol',
                durum: 'bekliyor',
                oncelik: 'normal',
                gorev_emri: '7 günden eski logları arşivle.'
            }]);
            return NextResponse.json({ success: true, mesaj: 'Gece cronu kuyruğa eklendi' });
        }

        // YENİ İŞLEM: NVR Kamera Durumu ve Gece Kapanma Logu Kontrol Ajanı
        if (unlem === 'kamera_durum_kontrol_ajan') {
            const go2rtcUrl = process.env.NEXT_PUBLIC_GO2RTC_URL || 'http://localhost:1984';
            let nvrDurum = 'aktif';

            try {
                const res = await fetch(`${go2rtcUrl}/api`, { cache: 'no-store', signal: AbortSignal.timeout(3000) });
                if (!res.ok) nvrDurum = 'kapali';
            } catch (error) {
                nvrDurum = 'kapali';
            }

            // Saat kontrolü (08:00 - 24:00 mesai dışı ise alarm verme, sadece gri log at)
            const suankiSaat_TR = new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul", hour12: false, hour: "2-digit" });
            const saatInt = parseInt(suankiSaat_TR, 10);
            const mesaiDisi = saatInt >= 0 && saatInt < 8; // Gece 00 ile sabah 08 arası

            if (nvrDurum === 'kapali') {
                if (!mesaiDisi) {
                    // Mesai içi NVR kapanması: Kritik hata
                    // 1- Supabase tabloya yaz (Tablo varsa basar, yoksa sessiz gecer - zero trust)
                    try {
                        await supabaseAdmin.from('camera_events').insert([{
                            camera_id: null,
                            event_type: 'offline_alarm',
                            video_url: null
                        }]);
                    } catch (kameraLogHata) {
                        console.error('[CRON] camera_events offline_alarm yazılamadı:', kameraLogHata.message);
                    }

                    // 2- Telegram Uyarisi At (Hayati!)
                    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
                    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1406184852'; // Gerekirse asil id
                    if (TELEGRAM_BOT_TOKEN) {
                        const telegramMsg = "🔴 *KRİTİK UYARI* 🔴\n\nNVR Kamera Stream Sunucusu ulaşılamıyor. Lütfen Karargahı kontrol ediniz!";
                        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: telegramMsg, parse_mode: 'Markdown' })
                        }).catch(() => null);
                    }
                } else {
                    // Mesai dışı NVR Kapanması: Normal, pasif log
                    try {
                        await supabaseAdmin.from('camera_events').insert([{
                            camera_id: null,
                            event_type: 'offline_sleep',
                            video_url: null
                        }]);
                    } catch (uyku_logHata) {
                        console.warn('[CRON] camera_events offline_sleep yazılamadı:', uyku_logHata.message);
                    }
                }
            }

            return NextResponse.json({ success: true, mesaj: `Kamera Cron Çalıştı. Durum: ${nvrDurum}, Mesai Dışı: ${mesaiDisi}` });
        }

        return NextResponse.json({ success: true, mesaj: 'Bilinmeyen Cron Parametresi Ancak Yetkili Giriş. Boş dönüldü.' });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
