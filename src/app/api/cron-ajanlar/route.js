export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
    sabahSubayi,
    aksamci,
    nabiz,
    zincirci,
    finansKalkani,
    muhasebeYazici
} from '@/lib/ajanlar-v2';

/**
 * /api/cron-ajanlar â€” ZamanlanmÄ±ÅŸ Ajan KÃ¶prÃ¼sÃ¼
 *
 * Vercel cron veya x-internal-api-key ile tetiklenir.
 * Her cron gÃ¶revi, ajanlar-v2.js'deki ilgili fonksiyonu direkt Ã§aÄŸÄ±rÄ±r.
 */
export async function GET(req) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Yetkisiz Cron Ä°steÄŸi' }, { status: 401 });
    }

    const gorev = new URL(req.url).searchParams.get('gorev');

    try {
        // â”€â”€ SABAH Ã–ZETÄ° (08:00 TR) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (gorev === 'sabah_ozeti') {
            const sonuc = await sabahSubayi();
            await nabiz();
            await zincirci();

            await supabaseAdmin.from('b1_ajan_gorevler').insert([{
                ajan_adi: 'Sabah SubayÄ±',
                gorev_adi: 'Otomatik Sabah Ã–zeti (Cron)',
                gorev_tipi: 'rapor',
                durum: sonuc.basarili ? 'tamamlandi' : 'hata',
                oncelik: 'yuksek',
                bitis_tarihi: new Date().toISOString(),
                sonuc_ozeti: sonuc.brifing || sonuc.hata || 'Sabah brifing tamamlandÄ±.',
                gorev_emri: 'Sabah taramasÄ± â€” tÃ¼m kritik kontroller yapÄ±ldÄ±'
            }]);

            return NextResponse.json({ success: true, mesaj: 'Sabah cronu Ã§alÄ±ÅŸtÄ±', sonuc });
        }

        // â”€â”€ GECE YEDEKLEMESÄ° (03:00 TR) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (gorev === 'gece_yedekleme_ve_temizlik') {
            const aksamSonuc = await aksamci();
            const muhasebeSonuc = await muhasebeYazici();
            await finansKalkani();

            const otuzGunOnce = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { data: silinenLoglar } = await supabaseAdmin
                .from('b1_agent_loglari')
                .delete()
                .lt('created_at', otuzGunOnce)
                .select('id');

            await supabaseAdmin.from('b1_ajan_gorevler').insert([{
                ajan_adi: 'Sistem',
                gorev_adi: 'Gece Log ArÅŸivleme ve Muhasebe (Cron)',
                gorev_tipi: 'kontrol',
                durum: 'tamamlandi',
                oncelik: 'normal',
                bitis_tarihi: new Date().toISOString(),
                sonuc_ozeti: `Gece operasyonu tamamlandÄ±. ${silinenLoglar?.length || 0} eski log temizlendi.`,
                gorev_emri: '30 gÃ¼nden eski loglarÄ± temizle, muhasebe gÃ¼ncelle.'
            }]);

            return NextResponse.json({
                success: true, mesaj: 'Gece cronu Ã§alÄ±ÅŸtÄ±',
                aksamSonuc, muhasebeSonuc,
                temizlenen_log: silinenLoglar?.length || 0
            });
        }

        // â”€â”€ KAMERA DURUM KONTROL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (gorev === 'kamera_durum_kontrol_ajan') {
            const go2rtcUrl = process.env.NEXT_PUBLIC_GO2RTC_URL;
            if (!go2rtcUrl) {
                return NextResponse.json({ success: false, mesaj: 'NEXT_PUBLIC_GO2RTC_URL tanÄ±mlÄ± deÄŸil.' });
            }

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
                try {
                    await supabaseAdmin.from('camera_events').insert([{
                        camera_id: null, event_type: 'offline_alarm', video_url: null
                    }]);
                } catch { }

                const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
                const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
                if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: TELEGRAM_CHAT_ID,
                            text: "ğŸ”´ *KRÄ°TÄ°K UYARI* ğŸ”´\n\nNVR Kamera Stream Sunucusu ulaÅŸÄ±lamÄ±yor!",
                            parse_mode: 'Markdown'
                        })
                    }).catch(() => null);
                }
            } else if (nvrDurum === 'kapali' && mesaiDisi) {
                try {
                    await supabaseAdmin.from('camera_events').insert([{
                        camera_id: null, event_type: 'offline_sleep', video_url: null
                    }]);
                } catch { }
            }

            return NextResponse.json({ success: true, mesaj: `Kamera Cron Ã‡alÄ±ÅŸtÄ±. Durum: ${nvrDurum}, Mesai DÄ±ÅŸÄ±: ${mesaiDisi}` });
        }

        // â”€â”€ AR-GE ZÄ°NCÄ°RÄ°: YargÄ±Ã§ + KÃ¶prÃ¼ + Zincirci â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (gorev === 'arge_zincir') {
            await zincirci();

            const domain = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            const cronReqHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev_secret'}`
            };

            fetch(`${domain}/api/ajan-yargic`, {
                method: 'POST', headers: cronReqHeaders, body: JSON.stringify({})
            }).catch(e => console.log('YargÄ±Ã§ Cron Tetikleme HatasÄ±:', e));

            setTimeout(() => {
                fetch(`${domain}/api/kopru-ajan`, {
                    method: 'POST', headers: cronReqHeaders, body: JSON.stringify({})
                }).catch(e => console.log('KÃ¶prÃ¼ Cron Tetikleme HatasÄ±:', e));
            }, 5000);

            await supabaseAdmin.from('b1_ajan_gorevler').insert([{
                ajan_adi: 'Sistem Cron',
                gorev_adi: 'Ar-Ge Zinciri (YargÄ±Ã§+KÃ¶prÃ¼+Zincirci) Tetiklendi',
                gorev_tipi: 'otomasyon',
                durum: 'tamamlandi',
                oncelik: 'yuksek',
                bitis_tarihi: new Date().toISOString(),
                sonuc_ozeti: 'Vercel Cron otonom zinciri ateÅŸledi.',
                gorev_emri: 'Ar-Ge zinciri: Zincirci â†’ YargÄ±Ã§ â†’ KÃ¶prÃ¼'
            }]);

            return NextResponse.json({ success: true, mesaj: 'Ar-Ge zinciri tetiklendi.' });
        }

        return NextResponse.json({ success: true, mesaj: 'Bilinmeyen Cron Parametresi. BoÅŸ dÃ¶nÃ¼ldÃ¼.' });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
