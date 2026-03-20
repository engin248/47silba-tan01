export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { spamKontrol } from '@/lib/ApiZirhi';

export const revalidate = 3600; // Karargah Ana Verileri 1 SAAT boyunca statik kalÄ±r (Bedava & Ã‡ok HÄ±zlÄ±)

export async function GET(request) {
    try {
        // ğŸš¨ KÃ–R NOKTA ZIRHI: DDoS ve Spam KorumasÄ± ğŸš¨
        const ip = request.headers.get('x-forwarded-for') || 'bilinmeyen_ip';
        const { izinVerildi } = spamKontrol(ip);
        if (!izinVerildi) return NextResponse.json({ error: 'SPAM TESPÄ°T EDÄ°LDÄ° - ATEÅ KES!' }, { status: 429 });

        // ğŸš¨ KÃ–R NOKTA ZIRHI: Yetkisiz DÄ±ÅŸarÄ± (Service Role) Okuma Engellendi ğŸš¨
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev_secret'}`) {
            return NextResponse.json({ error: 'YETKÄ°SÄ°Z ERÄ°ÅÄ°M! (KASA KAPALI)' }, { status: 403 });
        }

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const supabase = createClient(url, key);

        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        const bugunISO = bugun.toISOString();

        // 1. Kasa Gelirleri (BugÃ¼nkÃ¼ Tahsilatlar vb.)
        const { data: kasaData, error: kasaErr } = await supabase
            .from('b2_kasa_hareketleri')
            .select('tutar_tl')
            .eq('hareket_tipi', 'gelir')
            .gte('created_at', bugunISO);

        if (kasaErr) throw kasaErr;

        const ciro = kasaData?.reduce((t, h) => t + parseFloat(h.tutar_tl || 0), 0) || 0;

        // 2. Maliyetler
        const { data: maliyetData, error: maliyetErr } = await supabase
            .from('b1_maliyet_kayitlari')
            .select('tutar_tl, maliyet_tipi')
            .gte('created_at', bugunISO);

        if (maliyetErr) throw maliyetErr;

        const maliyet = maliyetData?.reduce((t, m) => t + parseFloat(m.tutar_tl || 0), 0) || 0;
        const personel = maliyetData?.filter(m => m.maliyet_tipi === 'personel_iscilik').reduce((t, m) => t + parseFloat(m.tutar_tl || 0), 0) || 0;

        // 3. Sistem AlarmlarÄ± (Aktif limit 10)
        const { data: alarmData, error: alarmErr } = await supabase
            .from('b1_sistem_uyarilari')
            .select('id, uyari_tipi, seviye, baslik, mesaj, olusturma')
            .eq('durum', 'aktif')
            .order('olusturma', { ascending: false })
            .limit(10);

        if (alarmErr) throw alarmErr;

        return NextResponse.json({
            ciro,
            maliyet,
            personel,
            alarmlar: alarmData || []
        });

    } catch (e) {
        return NextResponse.json({ e: e.message, ciro: 0, maliyet: 0, personel: 0, alarmlar: [] }, { status: 500 });
    }
}
