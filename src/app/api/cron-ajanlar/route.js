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
 * /api/cron-ajanlar — Zamanlanmış Ajan Köprüsü
 *
 * Vercel cron veya x-internal-api-key ile tetiklenir.
 * Her cron görevi, ajanlar-v2.js'deki ilgili fonksiyonu direkt çağırır.
 */
export async function GET(req) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Yetkisiz Cron İsteği' }, { status: 401 });
    }

    const gorev = new URL(req.url).searchParams.get('gorev');

    try {
        // ── SABAH ÖZETİ (08:00 TR) ─────────────────────────────────
        if (gorev === 'sabah_ozeti') {
            const sonuc = await sabahSubayi();
            await nabiz();
            await zincirci();

            await supabaseAdmin.from('b1_ajan_gorevler').insert([{
                ajan_adi: 'Sabah Subayı',
                gorev_adi: 'Otomatik Sabah Özeti (Cron)',
                gorev_tipi: 'rapor',
                durum: sonuc.basarili ? 'tamamlandi' : 'hata',
                oncelik: 'yuksek',
                bitis_tarihi: new Date().toISOString(),
                sonuc_ozeti: sonuc.brifing || sonuc.hata || 'Sabah brifing tamamlandı.',
                gorev_emri: 'Sabah taraması — tüm kritik kontroller yapıldı'
            }]);

            return NextResponse.json({ success: true, mesaj: 'Sabah cronu çalıştı', sonuc });
        }

        // ── GECE YEDEKLEMESİ (03:00 TR) ────────────────────────────
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
                gorev_adi: 'Gece Log Arşivleme ve Muhasebe (Cron)',
                gorev_tipi: 'kontrol',
                durum: 'tamamlandi',
                oncelik: 'normal',
                bitis_tarihi: new Date().toISOString(),
                sonuc_ozeti: `Gece operasyonu tamamlandı. ${silinenLoglar?.length || 0} eski log temizlendi.`,
                gorev_emri: '30 günden eski logları temizle, muhasebe güncelle.'
            }]);

            return NextResponse.json({
                success: true, mesaj: 'Gece cronu çalıştı',
                aksamSonuc, muhasebeSonuc,
                temizlenen_log: silinenLoglar?.length || 0
            });
        }

        // ── KAMERA DURUM KONTROL ─────────────────────────────────────
        if (gorev === 'kamera_durum_kontrol_ajan') {
            const go2rtcUrl = process.env.NEXT_PUBLIC_GO2RTC_URL;
            if (!go2rtcUrl) {
                return NextResponse.json({ success: false, mesaj: 'NEXT_PUBLIC_GO2RTC_URL tanımlı değil.' });
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
                            text: "🔴 *KRİTİK UYARI* 🔴\n\nNVR Kamera Stream Sunucusu ulaşılamıyor!",
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

            return NextResponse.json({ success: true, mesaj: `Kamera Cron Çalıştı. Durum: ${nvrDurum}, Mesai Dışı: ${mesaiDisi}` });
        }

        // ── AR-GE ZİNCİRİ: Yargıç + Köprü + Zincirci ────────────────
        if (gorev === 'arge_zincir') {
            await zincirci();

            const domain = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            const cronReqHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}` // [A-4 FİX]: dev_secret fallback kaldırıldı
            };

            fetch(`${domain}/api/ajan-yargic`, {
                method: 'POST', headers: cronReqHeaders, body: JSON.stringify({})
            }).catch(e => console.error('Yargıç Cron Tetikleme Hatası:', e));

            setTimeout(() => {
                fetch(`${domain}/api/kopru-ajan`, {
                    method: 'POST', headers: cronReqHeaders, body: JSON.stringify({})
                }).catch(e => console.error('Köprü Cron Tetikleme Hatası:', e));
            }, 5000);

            await supabaseAdmin.from('b1_ajan_gorevler').insert([{
                ajan_adi: 'Sistem Cron',
                gorev_adi: 'Ar-Ge Zinciri (Yargıç+Köprü+Zincirci) Tetiklendi',
                gorev_tipi: 'otomasyon',
                durum: 'tamamlandi',
                oncelik: 'yuksek',
                bitis_tarihi: new Date().toISOString(),
                sonuc_ozeti: 'Vercel Cron otonom zinciri ateşledi.',
                gorev_emri: 'Ar-Ge zinciri: Zincirci → Yargıç → Köprü'
            }]);

            return NextResponse.json({ success: true, mesaj: 'Ar-Ge zinciri tetiklendi.' });
        }

        return NextResponse.json({ success: true, mesaj: 'Bilinmeyen Cron Parametresi. Boş dönüldü.' });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
