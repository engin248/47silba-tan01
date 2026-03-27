import { NextResponse } from 'next/server';

/**
 * /api/deepseek-analiz
 * DeepSeek V3 — Dşk Maliyetli rn Analiz Servisi
 *
 * Grev: Gemini'ye alternatif, daha ucuz rn analizi.
 *        Tekstil/moda sektr iin retim kararı, maliyet tahmini,
 *        rekabet analizi ve pazar yorum retir.
 *
 * Input:  POST { urunAdi, kategori?, fiyat?, notlar? }
 * Output: { karar, skor, maliyet, riskler, oneriler, analiz }
 */

export async function POST(req) {
    try {
        const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY?.replace(/[\r\n]+/g, '').trim();

        if (!DEEPSEEK_KEY) {
            return NextResponse.json({ error: 'DEEPSEEK_API_KEY tanımlı değil.' }, { status: 500 });
        }

        const body = await req.json();
        const { urunAdi, kategori, fiyat, notlar } = body;

        if (!urunAdi?.trim()) {
            return NextResponse.json({ error: 'urunAdi parametresi zorunlu.' }, { status: 400 });
        }

        const prompt = `Sen THE ORDER / NİZAM sisteminin tekstil fabrikası analisti'sin.
Grevin: Verilen rn iin retim kararı ve maliyet analizi yap.

DİL KURALI: Tamamen soğukkanlı, metrik odaklı Trke yaz. Abartılı ifade kullanma.

RN BİLGİSİ:
- rn Adı: ${urunAdi.trim()}
- Kategori: ${kategori || 'belirtilmemiş'}
- Hedef Fiyat: ${fiyat ? fiyat + ' TL' : 'belirtilmemiş'}
- Notlar: ${notlar || 'yok'}

GREV:
Aşağıdaki JSON formatında yanıt ver (başka hibir şey yazma):

{
  "karar": "RET | TEST_URETIM | IZLE | REDDET",
  "karar_skoru": 0-100,
  "tahmini_maliyet_tl": sayı,
  "tahmini_kar_marji": "yzde olarak",
  "uretim_zorlugu": "Kolay | Orta | Zor",
  "tahmini_iscilik_gun": sayı,
  "riskler": ["Risk 1", "Risk 2"],
  "guclu_yonler": ["Gl yn 1", "Gl yn 2"],
  "pazar_yorumu": "2 cmle, metrik bazlı",
  "oneri": "Fabrika yneticisine 1 cmle net tavsiye"
}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_KEY}`,
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: 'deepseek-chat',  // DeepSeek-V3
                messages: [
                    {
                        role: 'system',
                        content: 'Sen bir tekstil fabrikası yapay zeka analistsin. Trke konuş. Yalnızca geerli JSON dn.',
                    },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 800,
                temperature: 0.2,
                response_format: { type: 'json_object' },
            }),
        });

        clearTimeout(timeout);

        if (!res.ok) {
            const errText = await res.text();
            return NextResponse.json({
                error: `DeepSeek API hatası (${res.status})`,
                detay: errText,
            }, { status: 502 });
        }

        const data = await res.json();
        const rawText = data.choices?.[0]?.message?.content || '{}';

        let analiz = {};
        try {
            analiz = JSON.parse(rawText);
        } catch {
            analiz = { oneri: rawText, karar: 'IZLE', karar_skoru: 50 };
        }

        // Token maliyet logu (opsiyonel bilgi)
        const tokenKullanimi = data.usage || {};

        return NextResponse.json({
            ajan: 'deepseek-analiz',
            urun: urunAdi,
            model: 'deepseek-chat (v3)',
            ...analiz,
            token_kullanimi: tokenKullanimi,
            timestamp: new Date().toISOString(),
        });

    } catch (err) {
        if (err.name === 'AbortError') {
            return NextResponse.json({ error: 'DeepSeek zaman aşımı (15sn).' }, { status: 504 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
