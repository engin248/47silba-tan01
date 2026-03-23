import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { spamKontrol } from '@/lib/ApiZirhi';

export const revalidate = 3600;

export async function GET(request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'bilinmeyen_ip';
        const { izinVerildi } = spamKontrol(ip);
        if (!izinVerildi) return NextResponse.json({ error: 'SPAM TESPİT EDİLDİ - ATEŞ KES!' }, { status: 429 });

        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev_secret'}`) {
            return NextResponse.json({ error: 'YETKİSİZ ERİŞİM! (KASA KAPALI)' }, { status: 403 });
        }

        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        const bugunISO = bugun.toISOString();

        const { data: kasaData, error: kasaErr } = await supabaseAdmin
            .from('b2_kasa_hareketleri')
            .select('tutar_tl')
            .eq('hareket_tipi', 'gelir')
            .gte('created_at', bugunISO);

        if (kasaErr) throw kasaErr;

        const ciro = kasaData?.reduce((t, h) => t + parseFloat(h.tutar_tl || 0), 0) || 0;

        const { data: maliyetData, error: maliyetErr } = await supabaseAdmin
            .from('b1_maliyet_kayitlari')
            .select('tutar_tl, maliyet_tipi')
            .gte('created_at', bugunISO);

        if (maliyetErr) throw maliyetErr;

        const maliyet = maliyetData?.reduce((t, m) => t + parseFloat(m.tutar_tl || 0), 0) || 0;
        const personel = maliyetData?.filter(m => m.maliyet_tipi === 'personel_iscilik').reduce((t, m) => t + parseFloat(m.tutar_tl || 0), 0) || 0;

        const { data: alarmData, error: alarmErr } = await supabaseAdmin
            .from('b1_sistem_uyarilari')
            .select('id, uyari_tipi, seviye, baslik, mesaj, olusturma')
            .eq('durum', 'aktif')
            .order('olusturma', { ascending: false })
            .limit(10);

        if (alarmErr) throw alarmErr;

        return NextResponse.json({ ciro, maliyet, personel, alarmlar: alarmData || [] });

    } catch (e) {
        return NextResponse.json({ e: e.message, ciro: 0, maliyet: 0, personel: 0, alarmlar: [] }, { status: 500 });
    }
}
