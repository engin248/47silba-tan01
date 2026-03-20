export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
const { KuyrugaEkle } = require('@/lib/redis_kuyruk');

export async function POST(req) {
    try {
        const body = await req.json();
        const { hedefParametre } = body;

        const hedef = hedefParametre || 'Genel Saha TaramasÄ±';

        // 1. EkranlarÄ± Beslemek Ä°Ã§in Log BaÅŸlangÄ±cÄ±
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: 'BEYAZ_SAHA_ORKESTRATOR',
            islem_tipi: 'TETIKLENDI',
            mesaj: `Hedef "${hedef}" iÃ§in Ajanlar (Bot 3, Bot 4, Bot 5) cehenneme sÃ¼rÃ¼lÃ¼yor...`,
            sonuc: 'bekliyor'
        }]);

        // Vercel Serverless Function Limitlerini aÅŸmamak iÃ§in 
        // iÅŸi tamamen koparÄ±p otonom Redis Scraper iÅŸÃ§isine devrediyoruz (Fire and Forget)
        await KuyrugaEkle('scraper_jobs', {
            hedef: hedef,
            zamanDamgasi: new Date().toISOString()
        });

        // 200 HTTP DÃ¶nÃ¼ÅŸÃ¼
        return NextResponse.json({
            success: true,
            mesaj: `Ajanlar Yolda... "${hedef}" kuyruÄŸa eklendi.`,
        });

    } catch (error) {
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: 'BEYAZ_SAHA_ORKESTRATOR',
            islem_tipi: 'FATAL_ERROR',
            mesaj: `Kuyruk Ekleme Ã‡Ã¶ktÃ¼: ${error.message}`,
            sonuc: 'hata'
        }]);

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
