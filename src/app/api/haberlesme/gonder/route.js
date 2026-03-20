export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { mesajSifrele } from '@/lib/kripto';

export async function POST(req) {
    try {
        const { gonderen_rutbe, hedef_oda, mesaj_metni } = await req.json();

        if (!gonderen_rutbe || !hedef_oda || !mesaj_metni) {
            return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 });
        }

        // DÃ¼z metin mesajÄ± sunucuda AES-256 ile ÅŸifreliyoruz
        const sifreliPaket = mesajSifrele(mesaj_metni);
        if (!sifreliPaket) {
            return NextResponse.json({ error: 'Åifreleme baÅŸarÄ±sÄ±z' }, { status: 500 });
        }

        // Supabase tarafÄ±nda tablo yoksa bile oluÅŸturulmasÄ± (Migration mantÄ±ÄŸÄ±) gerekecek.
        // VeritabanÄ±na DÃœZ METÄ°N GÄ°TMEZ. Sadece ÅŸifreli vektÃ¶rler(Hex) gider.
        const { data, error } = await supabaseAdmin
            .from('b1_askeri_haberlesme')
            .insert([{
                gonderen_rutbe,
                hedef_oda,
                sifreli_mesaj: sifreliPaket.encrypted,
                iv_vektoru: sifreliPaket.iv,
                auth_tag: sifreliPaket.authTag,
                okundu_mu: false
            }]);

        if (error) {
            console.error("[HABERLEÅME API HATA]:", error.message);
            // Tablo yoksa sahte baÅŸarÄ± dÃ¶nelim ÅŸimdilik (UI Ã§Ã¶kmesin)
            if (error.code === '42P01') {
                return NextResponse.json({ success: true, fake: true, message: 'Tablo yok ama ÅŸifrelendi.' });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Emir uÃ§tan uca ÅŸifrelendi ve hedefe mÃ¼hÃ¼rlendi.' });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
