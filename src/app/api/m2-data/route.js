import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        // Askeri seviye yonetici (service_role) yetkisiyle RLS'i aşar
        const { data, error } = await supabaseAdmin
            .from('m2_finans_veto')
            .select('*, b1_arge_products(urun_adi)')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error("M2 Yetki veya Fetch Hatası: ", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: data || [] });
    } catch (err) {
        console.error("M2 Beklenmeyen HTTP Hatası:", err);
        return NextResponse.json({ error: 'SİSTEM BAĞLANTISI KOPUK (M2): Veritabanına ulaşılamıyor.' }, { status: 500 });
    }
}
