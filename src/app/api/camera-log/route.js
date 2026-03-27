import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function POST(req) {
    try {
        const body = await req.json();

        const { error } = await supabase.from('camera_access_log').insert([{
            user_id: body.user_id || null,
            kullanici_adi: body.kullanici_adi || 'Bilinmeyen',
            islem_tipi: body.islem_tipi || 'Bilinmeyen Islem',
            kamera_adi: body.kamera_adi || null,
            ip_adresi: 'client'
        }]);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
