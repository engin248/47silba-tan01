import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Edge Node (İşletmedeki PC/Raspberry) cihazlarının buluta (Buraya) veri atacağı güvenli uç.
export async function POST(req) {
    try {
        const authHeader = req.headers.get('Authorization');
        // 'Bearer ' prefixi ile güvenlik
        const isValid = authHeader === `Bearer ${process.env.CRON_SECRET}` || authHeader === process.env.CRON_SECRET;

        if (!isValid) {
            return NextResponse.json({ error: 'Yetkisiz Edge Cihazı (Auth Hatası)!' }, { status: 401 });
        }

        const body = await req.json();

        // JSON'dan beklenen verileri çıkar
        const { kamera_ip, kamera_adi, olay_tipi, guven_skoru, resim_url, ek_bilgi } = body;

        if (!kamera_ip || !olay_tipi) {
            return NextResponse.json({ error: 'Eksik parametreler (kamera_ip veya olay_tipi şarttır)' }, { status: 400 });
        }

        // Supabase b1_kamera_olaylari tablosuna at (Service Role Key Kullanıyoruz)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAdmin = supabaseUrl && supabaseServiceKey
            ? require('@supabase/supabase-js').createClient(supabaseUrl, supabaseServiceKey)
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
            message: 'Olay kaydı başarıyla buluta kuryelendi.',
            data: data
        });

    } catch (err) {
        console.error('[M4 API Crash]', err.message);
        return NextResponse.json({ error: 'Sistemsel Hata' }, { status: 500 });
    }
}
