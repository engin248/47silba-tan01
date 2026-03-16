import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Kriter 141: Zamanlanmış Görev (CRON) Planlayıcı
export async function GET(req) {
    const authHeader = req.headers.get('Authorization');
    // Vercel Cron Güvenlik Doğrulaması
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Yetkisiz Cron İsteği' }, { status: 401 });
    }

    const unlem = new URL(req.url).searchParams.get('gorev');

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
            const go2rtcUrl = process.env.NEXT_PUBLIC_GO2RTC_URL;
            if (!go2rtcUrl) {
                return NextResponse.json({ success: false, mesaj: 'NEXT_PUBLIC_GO2RTC_URL tanımlı değil, kamera kontrolü atlandı.' });
            }
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
                    } catch (e) {
                        // ignore error
                    }

                    // 2- Telegram Uyarisi At (Hayati!)
                    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
                    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
                    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
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
                    } catch (e) {
                        // ignore error
                    }
                }
            }

            return NextResponse.json({ success: true, mesaj: `Kamera Cron Çalıştı. Durum: ${nvrDurum}, Mesai Dışı: ${mesaiDisi}` });
        }

        // ─── AR-GE ZİNCİRİ: Yargıç + Köprü Ajanı Tetikleyici ───
        if (unlem === 'arge_zincir') {
            const domain = process.env.NEXT_PUBLIC_SITE_URL || 'https://mizanet.com';
            const cronReqHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`
            };

            // Log kaydı önce
            await supabaseAdmin.from('b1_ajan_gorevler').insert([{
                ajan_adi: 'Sistem Cron',
                gorev_adi: 'Otonom Ar-Ge Zinciri (Yargıç+Köprü) Tetiklendi',
                gorev_tipi: 'otomasyon',
                durum: 'tamamlandi',
                oncelik: 'yuksek',
                gorev_emri: 'Vercel Cron zamanlayıcısı otonom zinciri ateşledi.'
            }]);

            // KÖK ÇÖZÜM: setTimeout KALDIRILDI — Serverless'ta setTimeout güvensiz.
            // İki servisi eşzamanlı await ile tetikle, her ikisi de yanıt verinceye kadar bekle.
            await Promise.allSettled([
                fetch(`${domain}/api/ajan-yargic`, {
                    method: 'POST',
                    headers: cronReqHeaders,
                    body: JSON.stringify({})
                }).catch(e => console.log('Yargıç Cron Tetikleme Hatası:', e)),
                fetch(`${domain}/api/kopru-ajan`, {
                    method: 'POST',
                    headers: cronReqHeaders,
                    body: JSON.stringify({})
                }).catch(e => console.log('Köprü Cron Tetikleme Hatası:', e))
            ]);

            return NextResponse.json({
                success: true,
                mesaj: 'Ar-Ge zinciri tetiklendi: Yargıç ve Köprü Ajanı API uçlarına eşzamanlı vuruş yapıldı.'
            });
        }


        return NextResponse.json({ success: true, mesaj: 'Bilinmeyen Cron Parametresi Ancak Yetkili Giriş. Boş dönüldü.' });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
