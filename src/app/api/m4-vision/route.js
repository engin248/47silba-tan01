import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { spamKontrol } from '@/lib/ApiZirhi';


// Edge Node (İşletmedeki PC/Raspberry) cihazlarının buluta (Buraya) veri atacağı güvenli uç.
export async function POST(req) {
    try {
        // 🚨 KÖR NOKTA ZIRHI: DDoS Koruması (Makine Tüfeği) 🚨
        const ip = req.headers.get('x-forwarded-for') || 'edge_ip';
        const { izinVerildi } = spamKontrol(ip);
        if (!izinVerildi) return NextResponse.json({ error: 'SPAM TESPİT EDİLDİ - BAĞLANTI REDDEDİLDİ!' }, { status: 429 });

        const authHeader = req.headers.get('Authorization');
        // 'Bearer ' prefixi ile güvenlik
        // ─── GÜVENLİK [A-4 FİX]: dev_secret fallback kaldırıldı ───────────
        if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'Yapılandırma hatası: CRON_SECRET eksik' }, { status: 500 });
        const expectedSecret = process.env.CRON_SECRET;
        const isValid = authHeader === `Bearer ${expectedSecret}`;

        if (!isValid) {
            return NextResponse.json({ error: 'Yetkisiz Edge Cihazı (Auth Hatası)!' }, { status: 401 });
        }

        const body = await req.json();

        // JSON'dan beklenen verileri çıkar
        const { kamera_ip, kamera_adi, olay_tipi, guven_skoru, resim_url, ek_bilgi } = body;

        if (!kamera_ip || !olay_tipi) {
            return NextResponse.json({ error: 'Eksik parametreler (kamera_ip veya olay_tipi şarttır)' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('b1_kamera_olaylari')
            .insert([{
                kamera_ip,
                kamera_adi: kamera_adi || 'Bilinmeyen Kamera',
                olay_tipi,
                guven_skoru: guven_skoru || 1.0,
                resim_url: resim_url || null,
                ek_bilgi: ek_bilgi || {}
            }])
            .select('*')
            .single();

        if (error) {
            console.error('[M4 Vision Error]', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Olay kaydı başarıyla buluta kuryelendi.',
            data: data
        });

    } catch (err) {
        console.error('[M4 API Crash]', err.message);
        return NextResponse.json({ error: 'Sistemsel Hata', detail: err.message, stack: err.stack }, { status: 500 });
    }
}
