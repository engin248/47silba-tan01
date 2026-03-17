import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ═══════════════════════════════════════════════════════════
//  /api/ai-kahin-ajan — Kâhin AI Ajanı
//  Perplexity API (OpenAI-uyumlu) kullanıyor
// ═══════════════════════════════════════════════════════════

export async function POST(req) {
    try {
        const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY;
        if (!PERPLEXITY_KEY) {
            return NextResponse.json({ error: 'PERPLEXITY_API_KEY tanımlı değil.' }, { status: 500 });
        }

        // 1. Personel verisi çek
        const { data: pData, error: pError } = await supabaseAdmin
            .from('b1_personel')
            .select('id, ad_soyad, aylik_maliyet_tl')
            .limit(50);

        if (pError) {
            return NextResponse.json({ error: `Personel sorgusu hata: ${pError.message}` }, { status: 500 });
        }
        if (!pData || pData.length === 0) {
            return NextResponse.json({ error: 'Personel tablosu boş.' }, { status: 404 });
        }

        // 2. Bu ayın performans verisi çek
        const ayBasi = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data: perfData } = await supabaseAdmin
            .from('b1_personel_performans')
            .select('personel_id, isletmeye_katilan_deger, kazanilan_prim, uretilen_adet, kalite_puani')
            .gte('created_at', ayBasi);

        // 3. Prompt için analiz metni
        let isciAnalizMetni = 'Fabrikanın bu ayki üretim verileri:\n\n';
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
  - Aylik Maliyet: ${maliyet} TL
  - Uretilen Adet: ${adet}
  - Katma Deger: ${deger} TL
  - Kalite Puani: ${kalite.toFixed(1)}/10
  - Kazanilan Prim: ${prim} TL
  - Amorti: %${maliyet > 0 ? ((deger / maliyet) * 100).toFixed(0) : 0}\n\n`;
        }

        // 4. Perplexity API çağrısı (OpenAI-uyumlu)
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
                        content: `Sen acımasız ve net bir Yalın Üretim Yapay Zeka Başdenetçisi (Kâhin Agent) sin.
Fabrika patronuna Türkçe, kısa (max 5 paragraf), eyleme geçirilebilir "Kârlılık ve Adalet Raporu" sun.
KURALLAR:
1. Maliyet > Katma Değer → "Zarar Yazdırıyor" — eğitim/uyarı öner.
2. Katma Değer > Maliyet → "Liyakat Yıldızı" — tebrik et.
3. Kalite Puanı < 5 → Çok üretse bile disiplin uyarısı ver.
4. Maksimum 5-6 paragraf. MD formatı. Agresif kurumsal dil. Boş övgü yok.`,
                    },
                    {
                        role: 'user',
                        content: `VERİLER:\n${isciAnalizMetni}`,
                    },
                ],
                max_tokens: 1024,
                temperature: 0.3,
            }),
        });

        if (!aiRes.ok) {
            const errText = await aiRes.text();
            console.error('[Kâhin] Perplexity hatası:', aiRes.status, errText);
            return NextResponse.json({ error: `Perplexity API hatası: ${aiRes.status}` }, { status: 502 });
        }

        const aiJson = await aiRes.json();
        const aiCevap = aiJson?.choices?.[0]?.message?.content || 'AI yargıç sessiz kaldı.';

        // 5. Log yaz (opsiyonel)
        try {
            await supabaseAdmin.from('b1_agent_loglari').insert([{
                ajan_adi: 'Kahin Ajani',
                islem_tipi: 'personel_analiz',
                kaynak_tablo: 'b1_personel',
                sonuc: 'basarili',
                mesaj: `${pData.length} personel analiz edildi.`,
            }]);
        } catch (_) { }

        return NextResponse.json({ success: true, aiCevap, personel_sayisi: pData.length });

    } catch (error) {
        console.error('[Kâhin AI Hatası]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
