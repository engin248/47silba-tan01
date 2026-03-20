export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { mesajCoz } from '@/lib/kripto';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const hedef_oda = searchParams.get('oda');

        if (!hedef_oda) {
            return NextResponse.json({ error: 'Oda bilgisi eksik' }, { status: 400 });
        }

        // Sadece Hedef Odaya veya Genel Karargaha ait (veya odanÄ±n gÃ¶nderdiÄŸi) mesajlarÄ± Ã§ek
        const { data, error } = await supabaseAdmin
            .from('b1_askeri_haberlesme')
            .select('*')
            .or(`hedef_oda.eq.${hedef_oda},gonderen_rutbe.eq.${hedef_oda}`)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) {
            // Tablo yoksa boÅŸ dizi dÃ¶n (Sistem Ã§Ã¶kmemesi iÃ§in Kural 0 zÄ±rhÄ±)
            if (error.code === '42P01') return NextResponse.json({ mesajlar: [] });
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) return NextResponse.json({ mesajlar: [] });

        // VeritabanÄ±ndaki ÅŸifreli (Hex) paketleri sadece bu Server'da (Process Env Key ile) Ã§Ã¶zÃ¼yoruz
        const cozulmusMesajlar = data.map(msg => {
            const orjinal = mesajCoz(msg.sifreli_mesaj, msg.iv_vektoru, msg.auth_tag);
            return {
                id: msg.id,
                gonderen: msg.gonderen_rutbe,
                hedef: msg.hedef_oda,
                metin: orjinal,
                tarih: new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            };
        });

        return NextResponse.json({ mesajlar: cozulmusMesajlar });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
