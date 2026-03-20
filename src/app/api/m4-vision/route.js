export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { spamKontrol } from '@/lib/ApiZirhi';

// Edge Node (Ä°ÅŸletmedeki PC/Raspberry) cihazlarÄ±nÄ±n buluta (Buraya) veri atacaÄŸÄ± gÃ¼venli uÃ§.
export async function POST(req) {
    try {
        // ğŸš¨ KÃ–R NOKTA ZIRHI: DDoS KorumasÄ± (Makine TÃ¼feÄŸi) ğŸš¨
        const ip = req.headers.get('x-forwarded-for') || 'edge_ip';
        const { izinVerildi } = spamKontrol(ip);
        if (!izinVerildi) return NextResponse.json({ error: 'SPAM TESPÄ°T EDÄ°LDÄ° - BAÄLANTI REDDEDÄ°LDÄ°!' }, { status: 429 });

        const authHeader = req.headers.get('Authorization');
        // 'Bearer ' prefixi ile gÃ¼venlik
        const expectedSecret = process.env.CRON_SECRET || 'dev_secret';
        const isValid = authHeader === `Bearer ${expectedSecret}` || authHeader === expectedSecret;

        if (!isValid) {
            return NextResponse.json({ error: 'Yetkisiz Edge CihazÄ± (Auth HatasÄ±)!' }, { status: 401 });
        }

        const body = await req.json();

        // JSON'dan beklenen verileri Ã§Ä±kar
        const { kamera_ip, kamera_adi, olay_tipi, guven_skoru, resim_url, ek_bilgi } = body;

        if (!kamera_ip || !olay_tipi) {
            return NextResponse.json({ error: 'Eksik parametreler (kamera_ip veya olay_tipi ÅŸarttÄ±r)' }, { status: 400 });
        }

        // Supabase b1_kamera_olaylari tablosuna at (Service Role Key KullanÄ±yoruz)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAdmin = supabaseUrl && supabaseServiceKey
            ? createClient(supabaseUrl, supabaseServiceKey)
            : supabase;

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
            message: 'Olay kaydÄ± baÅŸarÄ±yla buluta kuryelendi.',
            data: data
        });

    } catch (err) {
        console.error('[M4 API Crash]', err.message);
        return NextResponse.json({ error: 'Sistemsel Hata', detail: err.message, stack: err.stack }, { status: 500 });
    }
}
