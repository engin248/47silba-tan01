import { NextResponse } from 'next/server';

// Basit in-memory rate limiter (production'da Redis kullan)
const istekSayaci = new Map();
function rateLimitKontrol(ip) {
    const simdi = Date.now();
    const kayit = istekSayaci.get(ip) || { sayi: 0, baslangic: simdi };
    if (simdi - kayit.baslangic > 60 * 1000) {
        istekSayaci.set(ip, { sayi: 1, baslangic: simdi });
        return true;
    }
    if (kayit.sayi >= 30) return false; // 1 dakikada max 30 istek
    istekSayaci.set(ip, { ...kayit, sayi: kayit.sayi + 1 });
    return true;
}

export async function POST(request) {
    // Rate limit kontrolü
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!rateLimitKontrol(ip)) {
        return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekleyin.' }, { status: 429 });
    }

    // API Key doğrulama (internal servislere karşı)
    const authHeader = request.headers.get('x-internal-key');
    const beklenenKey = process.env.INTERNAL_API_KEY;
    if (beklenenKey && authHeader !== beklenenKey) {
        // API key eksikse bile çalışmaya devam et (backward compat) — sadece logla
        console.warn('[trend-ara] İç API key eksik/hatalı — IP:', ip);
    }

    const { sorgu } = await request.json();

    if (!sorgu?.trim()) {
        return NextResponse.json({ error: 'Sorgu boş olamaz' }, { status: 400 });
    }

    // Input uzunluk limiti
    if (sorgu.length > 500) {
        return NextResponse.json({ error: 'Sorgu en fazla 500 karakter olabilir' }, { status: 400 });
    }

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey || apiKey.includes('BURAYA')) {
        return NextResponse.json({
            error: 'Perplexity API key eksik. .env.local dosyasına PERPLEXITY_API_KEY ekleyin.',
            demo: true,
            sonuclar: [
                { baslik: '2026 Yaz Trendleri: Pastel Renkler', platform: 'trendyol', talep_skoru: 8, aciklama: 'Açık pembe, buz mavisi, lavanta renkleri öne çıkıyor. Hafif kumaşlarla kombine ediliyor.', kaynak: 'https://trendyol.com' },
                { baslik: 'Oversize Linen Gömlek', platform: 'instagram', talep_skoru: 9, aciklama: 'Keten kumaş oversize kesim. Hem günlük hem ofis kullanımına uygun.', kaynak: 'https://instagram.com' },
                { baslik: 'Wide Leg Pantolon', platform: 'pinterest', talep_skoru: 7, aciklama: 'Yüksek bel geniş paça. Özellikle 25-40 yaş kadın segmentinde yüksek talep.', kaynak: 'https://pinterest.com' },
            ]
        });
    }

    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: `Sen bir tekstil ve moda trendleri analistisin. Türkiye fason tekstil sektörü için trend araştırması yapıyorsun.
Kullanıcının verdiği konu veya kategoriye göre güncel moda trendlerini araştır.
Cevabını MUTLAKA şu JSON formatında ver (başka bir şey yazma):
{
  "ozet": "genel trend özeti 2-3 cümle",
  "sonuclar": [
    {
      "baslik": "trend başlığı",
      "platform": "trendyol/instagram/pinterest/amazon/diger",
      "talep_skoru": 1-10 arasında sayı,
      "aciklama": "kısa açıklama",
      "kaynak": "url veya platform adı"
    }
  ]
}`
                    },
                    {
                        role: 'user',
                        content: `Şu konuda güncel tekstil/moda trendlerini araştır: ${sorgu}\n\nÖzellikle Türkiye pazarına uygun, 2025-2026 sezonu için geçerli trendlere odaklan.`
                    }
                ],
                max_tokens: 1000,
                temperature: 0.2,
            }),
        });

        if (!response.ok) {
            const hata = await response.text();
            return NextResponse.json({ error: `Perplexity hatası: ${response.status} - ${hata}` }, { status: 500 });
        }

        const data = await response.json();
        const icerik = data.choices?.[0]?.message?.content || '';

        // JSON parse
        const jsonMatch = icerik.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ error: 'AI yanıtı parse edilemedi', ham: icerik }, { status: 500 });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ basarili: true, ...parsed });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
