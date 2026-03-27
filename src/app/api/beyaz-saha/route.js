import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
const { KuyrugaEkle } = require('@/lib/redis_kuyruk');

export async function POST(req) {
    try {
        const body = await req.json();
        const { hedefParametre } = body;

        const hedef = hedefParametre || 'Genel Saha Taraması';

        // 1. Ekranları Beslemek İin Log Başlangıcı
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: 'BEYAZ_SAHA_ORKESTRATOR',
            islem_tipi: 'TETIKLENDI',
            mesaj: `Hedef "${hedef}" iin Ajanlar (Bot 3, Bot 4, Bot 5) cehenneme srlyor...`,
            sonuc: 'bekliyor'
        }]);

        // Vercel Serverless Function Limitlerini aşmamak iin 
        // işi tamamen koparıp otonom Redis Scraper işisine devrediyoruz (Fire and Forget)
        await KuyrugaEkle('scraper_jobs', {
            hedef: hedef,
            zamanDamgasi: new Date().toISOString()
        });

        // 200 HTTP Dnş
        return NextResponse.json({
            success: true,
            mesaj: `Ajanlar Yolda... "${hedef}" kuyruğa eklendi.`,
        });

    } catch (error) {
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: 'BEYAZ_SAHA_ORKESTRATOR',
            islem_tipi: 'FATAL_ERROR',
            mesaj: `Kuyruk Ekleme kt: ${error.message}`,
            sonuc: 'hata'
        }]);

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
