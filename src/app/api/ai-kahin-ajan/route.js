export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  /api/ai-kahin-ajan â€” KÃ¢hin AI AjanÄ±
//  Perplexity API (sonar model) â€” Vercel'de PERPLEXITY_API_KEY gerekli
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function POST(req) {
    try {
        const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY;
        if (!PERPLEXITY_KEY) {
            return NextResponse.json({ error: 'PERPLEXITY_API_KEY tanÄ±mlÄ± deÄŸil.' }, { status: 500 });
        }

        // 1. Personel verisi Ã§ek
        const { data: pData, error: pError } = await supabaseAdmin
            .from('b1_personel')
            .select('id, ad_soyad, aylik_maliyet_tl')
            .limit(50);

        if (pError) {
            return NextResponse.json({ error: `Personel sorgusu hata: ${pError.message}` }, { status: 500 });
        }
        if (!pData || pData.length === 0) {
            return NextResponse.json({ error: 'Personel tablosu boÅŸ.' }, { status: 404 });
        }

        // 2. Bu ayÄ±n performans verisi Ã§ek
        const ayBasi = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data: perfData } = await supabaseAdmin
            .from('b1_personel_performans')
            .select('personel_id, isletmeye_katilan_deger, kazanilan_prim, uretilen_adet, kalite_puani')
            .gte('created_at', ayBasi);

        // 3. Analiz metni oluÅŸtur
        let isciAnalizMetni = 'FabrikanÄ±n bu ayki Ã¼retim verileri:\n\n';
        for (const p of pData) {
            const raporlar = (perfData || []).filter(l => l.personel_id === p.id);
            const adet = raporlar.reduce((s, r) => s + (Number(r.uretilen_adet) || 0), 0);
            const deger = raporlar.reduce((s, r) => s + (Number(r.isletmeye_katilan_deger) || 0), 0);
            const prim = raporlar.reduce((s, r) => s + (Number(r.kazanilan_prim) || 0), 0);
            const kalite = raporlar.length
                ? raporlar.reduce((s, r) => s + (Number(r.kalite_puani) || 10), 0) / raporlar.length
                : 10;
            const maliyet = Number(p.aylik_maliyet_tl) || 0;
            isciAnalizMetni += `Personel: ${p.ad_soyad}
  - AylÄ±k Maliyet: ${maliyet} TL
  - Ãœretilen Adet: ${adet}
  - Katma DeÄŸer: ${deger} TL
  - Kalite PuanÄ±: ${kalite.toFixed(1)}/10
  - KazanÄ±lan Prim: ${prim} TL
  - Amorti: %${maliyet > 0 ? ((deger / maliyet) * 100).toFixed(0) : 0}\n\n`;
        }

        // 4. Perplexity API
        const aiRes = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PERPLEXITY_KEY}`,
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: `Sen acÄ±masÄ±z ve net bir YalÄ±n Ãœretim Yapay Zeka BaÅŸdenetÃ§isi (KÃ¢hin Agent) sin.
Fabrika patronuna TÃ¼rkÃ§e, kÄ±sa (max 5 paragraf), eyleme geÃ§irilebilir "KÃ¢rlÄ±lÄ±k ve Adalet Raporu" sun.
KURALLAR:
1. Maliyet > Katma DeÄŸer â†’ "Zarar YazdÄ±rÄ±yor" â€” eÄŸitim/uyarÄ± Ã¶ner.
2. Katma DeÄŸer > Maliyet â†’ "Liyakat YÄ±ldÄ±zÄ±" â€” tebrik et.
3. Kalite PuanÄ± < 5 â†’ Ã‡ok Ã¼retse bile disiplin uyarÄ±sÄ± ver.
4. Maksimum 5-6 paragraf. MD formatÄ±. Agresif kurumsal dil.`,
                    },
                    { role: 'user', content: `VERÄ°LER:\n${isciAnalizMetni}` },
                ],
                max_tokens: 1024,
                temperature: 0.3,
            }),
        });

        if (!aiRes.ok) {
            const errText = await aiRes.text();
            return NextResponse.json({ error: `Perplexity API hatasÄ±: ${aiRes.status}` }, { status: 502 });
        }

        const aiJson = await aiRes.json();
        const aiCevap = aiJson?.choices?.[0]?.message?.content || 'AI yargÄ±Ã§ sessiz kaldÄ±.';

        // 5. Log yaz
        try {
            await supabaseAdmin.from('b1_agent_loglari').insert([{
                ajan_adi: 'Kahin Ajani', islem_tipi: 'personel_analiz',
                kaynak_tablo: 'b1_personel', sonuc: 'basarili',
                mesaj: `${pData.length} personel analiz edildi.`,
            }]);
        } catch (_) { console.error('[KÃ–R NOKTA ZIRHI - YUTULAN HATA] Dosya: route.js'); }

        return NextResponse.json({ success: true, aiCevap, personel_sayisi: pData.length });

    } catch (error) {
        console.error('[KÃ¢hin AI HatasÄ±]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
