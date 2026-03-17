import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ═══════════════════════════════════════════════════════════
//  /api/ai-kahin-ajan
//  Kâhin AI Ajanı — Personel Kârlılık & Adalet Raporu
//  Hata Düzeltme: @google/genai v0.7.0 uyumsuzluğu giderildi
//  Artık tüm sistem ile aynı fetch() yöntemi kullanılıyor
// ═══════════════════════════════════════════════════════════

export async function POST(req) {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY tanımlı değil.' }, { status: 500 });
        }

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        // 1. Personel verisi çek
        const { data: pData, error: pError } = await supabaseAdmin
            .from('b1_personel')
            .select('id, ad_soyad, aylik_maliyet_tl')
            .eq('aktif', true)
            .limit(50);

        if (pError) {
            console.error('[Kâhin] Personel sorgu hatası:', pError.message);
            return NextResponse.json({ error: `Personel verisi okunamadı: ${pError.message}` }, { status: 500 });
        }

        if (!pData || pData.length === 0) {
            return NextResponse.json({ error: 'Aktif personel bulunamadı.' }, { status: 404 });
        }

        // 2. Bu ayın performans verisi çek
        const ayBasi = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data: perfData } = await supabaseAdmin
            .from('b1_personel_performans')
            .select('personel_id, isletmeye_katilan_deger, kazanilan_prim, uretilen_adet, kalite_puani')
            .gte('created_at', ayBasi);

        // 3. Prompt için veri hazırla
        let isciAnalizMetni = 'İşte fabrikanın bu ayki üretim verileri ve personel maliyetleri:\n\n';

        for (const p of pData) {
            const raporlar = (perfData || []).filter(log => log.personel_id === p.id);
            const adet = raporlar.reduce((s, r) => s + (Number(r.uretilen_adet) || 0), 0);
            const kalite = raporlar.length
                ? raporlar.reduce((s, r) => s + (Number(r.kalite_puani) || 10), 0) / raporlar.length
                : 10;
            const deger = raporlar.reduce((s, r) => s + (Number(r.isletmeye_katilan_deger) || 0), 0);
            const prim = raporlar.reduce((s, r) => s + (Number(r.kazanilan_prim) || 0), 0);
            const maliyet = Number(p.aylik_maliyet_tl) || 0;

            isciAnalizMetni += `Personel: ${p.ad_soyad}
  - Aylık Maliyet: ${maliyet} TL
  - Ürettiği Parça/İşlem: ${adet} adet
  - Kalite Puanı (1-10): ${kalite.toFixed(1)}
  - Firmaya Katma Değer: ${deger} TL
  - Kazandığı Prim: ${prim} TL\n\n`;
        }

        const systemPrompt = `Sen acımasız, net ve tam bir verimlilik makinesi olan Yalın Üretim Yapay Zeka Başdenetçisi (Kâhin Agent) sin.
Fabrikadaki patrona Türkçe olarak kısa, vurucu ve eyleme geçirilebilir bir "Kârlılık ve Adalet Raporu" sunmakla görevlisin.

KURALLAR:
1. Maliyet > Katma Değer → "Zarar Yazdırıyor" — eğitim/uyarı öner.
2. Katma Değer > Maliyet → "Liyakat Yıldızı" — tebrik et.
3. Kalite Puanı < 5 → Çok üretse bile disiplin uyarısı ver.
4. Maksimum 5-6 paragraf. MD formatı. Kurumsal, net dil.`;

        const fullPrompt = `${systemPrompt}\n\nVERİLER:\n${isciAnalizMetni}`;

        // 4. Gemini API — düz fetch (tüm route'larla tutarlı yöntem)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const geminiRes = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
            }),
        });
        clearTimeout(timeoutId);

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error('[Kâhin] Gemini HTTP hatası:', geminiRes.status, errText);
            return NextResponse.json({ error: `Gemini API hatası: ${geminiRes.status}` }, { status: 500 });
        }

        const geminiData = await geminiRes.json();
        const aiCevap = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'AI yargıç sessiz kaldı.';

        // 5. Log yaz
        try {
            await supabaseAdmin.from('b1_agent_loglari').insert([{
                ajan_adi: 'Kâhin Ajanı',
                islem_tipi: 'personel_analiz',
                kaynak_tablo: 'b1_personel',
                sonuc: 'basarili',
                mesaj: `${pData.length} personel analiz edildi.`,
            }]);
        } catch (_) { /* log hatası kritik değil */ }

        return NextResponse.json({ success: true, aiCevap, personel_sayisi: pData.length });

    } catch (error) {
        console.error('[Kâhin AI Hatası]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
