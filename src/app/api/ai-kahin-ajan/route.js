import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json({ error: 'Sunucu yapılandırması eksik (env).' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        // 1. Personelleri çek (birim kolonu opsiyonel - select * yapıp manuel map)
        const { data: pData, error: pError } = await supabaseAdmin
            .from('b1_personel')
            .select('id, ad_soyad, aylik_maliyet_tl')
            .limit(50);

        if (pError) {
            console.error('[Kâhin] Personel hatası:', pError);
            return NextResponse.json({ error: `Personel sorgusu hata: ${pError.message}` }, { status: 500 });
        }
        if (!pData || pData.length === 0) {
            return NextResponse.json({ error: 'Personel tablosu boş.' }, { status: 404 });
        }

        // 2. Bu ayın üretim verilerini çek
        const date = new Date();
        const ilkGun = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const { data: perfData, error: perfError } = await supabaseAdmin
            .from('b1_personel_performans')
            .select('personel_id, isletmeye_katilan_deger, kazanilan_prim, uretilen_adet, kalite_puani')
            .gte('created_at', ilkGun)
            .limit(500);

        if (perfError) console.warn('[Kâhin] Performans uyarısı:', perfError.message);

        // 3. Prompt verisi hazırla
        let isciAnalizMetni = 'Fabrikanın bu ayki üretim verileri ve personel maliyetleri:\n\n';

        pData.forEach(p => {
            const logs = (perfData || []).filter(l => l.personel_id === p.id);
            const adet = logs.reduce((a, c) => a + (Number(c.uretilen_adet) || 0), 0);
            const deger = logs.reduce((a, c) => a + (Number(c.isletmeye_katilan_deger) || 0), 0);
            const prim = logs.reduce((a, c) => a + (Number(c.kazanilan_prim) || 0), 0);
            const kalite = logs.length
                ? logs.reduce((a, c) => a + (Number(c.kalite_puani) || 10), 0) / logs.length
                : 10;
            const maliyet = Number(p.aylik_maliyet_tl) || 0;

            isciAnalizMetni += `Personel: ${p.ad_soyad}
  - Aylık Maliyet: ${maliyet} TL
  - Üretilen Adet: ${adet}
  - Katma Değer: ${deger} TL
  - Kalite Puanı: ${kalite.toFixed(1)}/10
  - Kazanılan Prim: ${prim} TL
  - Amorti: %${maliyet > 0 ? ((deger / maliyet) * 100).toFixed(0) : 0}\n\n`;
        });

        const systemPrompt = `Sen acımasız ve net bir Yalın Üretim Yapay Zeka Başdenetçisi (Kâhin Agent) sin.
Fabrika patronuna Türkçe, kısa (max 5 paragraf) ve eyleme geçirilebilir bir "Kârlılık ve Adalet Raporu" sun.

KURALLAR:
1. Maliyetinden az değer üretene → "Zarar Yazdırıyor - Uyarı/Eğitim"
2. Maliyetini aşıp prim kazanana → "Liyakat Yıldızı - Tebrik"
3. Kalite puanı 5 altında olana → "Disiplin Uyarısı" (çok üretse bile)
4. MD formatında, kurumsal ve agresif dil. Boş övgü yok.`;

        // 4. Gemini API çağrısı
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY eksik.' }, { status: 500 });
        }

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `${systemPrompt}\n\nVERİLER:\n${isciAnalizMetni}` }]
                    }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
                })
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error('[Kâhin] Gemini hatası:', geminiRes.status, errText);
            return NextResponse.json({ error: `Gemini API hatası: ${geminiRes.status}` }, { status: 502 });
        }

        const geminiJson = await geminiRes.json();
        const aiCevap = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || 'AI yargıç sessiz kaldı.';

        return NextResponse.json({ success: true, aiCevap, personelSayisi: pData.length });

    } catch (error) {
        console.error('[Kâhin] Beklenmeyen hata:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
