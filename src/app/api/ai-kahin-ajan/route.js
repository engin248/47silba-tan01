import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ═══════════════════════════════════════════════════════════
//  /api/ai-kahin-ajan — Kâhin AI Ajanı
//  Gemini REST API (generativelanguage.googleapis.com)
// ═══════════════════════════════════════════════════════════

export async function POST(req) {
    try {
        const GEMINI_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY Vercel ortam değişkenlerinde tanımlı değil.' }, { status: 500 });
        }

        // 1. Personel verisi çek (b1_personel — mevcut kolonlar)
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

        const systemPrompt = `Sen acımasız ve net bir Yalın Üretim Yapay Zeka Başdenetçisi (Kâhin Agent) sin.
Fabrika patronuna Türkçe, kısa (max 5 paragraf), eyleme geçirilebilir "Kârlılık ve Adalet Raporu" sun.
KURALLAR:
1. Maliyet > Katma Değer → "Zarar Yazdırıyor" — eğitim/uyarı öner.
2. Katma Değer > Maliyet → "Liyakat Yıldızı" — tebrik et.
3. Kalite Puanı < 5 → Çok üretse bile disiplin uyarısı ver.
4. Maksimum 5-6 paragraf. MD formatı. Agresif kurumsal dil. Boş övgü yok.`;

        // 4. Gemini REST API
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nVERİLER:\n${isciAnalizMetni}` }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
                }),
            }
        );

        if (!geminiRes.ok) {
            const errBody = await geminiRes.json().catch(() => ({}));
            const errMsg = errBody?.error?.message || geminiRes.status;
            console.error('[Kâhin] Gemini hatası:', errMsg);
            return NextResponse.json({ error: `Gemini API hatası: ${errMsg}` }, { status: 502 });
        }

        const geminiData = await geminiRes.json();
        const aiCevap = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'AI yargıç sessiz kaldı.';

        // 5. Log yaz
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
