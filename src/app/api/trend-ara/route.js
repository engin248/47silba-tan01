import { NextResponse } from 'next/server';

const istekSayaci = new Map();
function rateLimitKontrol(ip) {
    const simdi = Date.now();
    const kayit = istekSayaci.get(ip) || { sayi: 0, baslangic: simdi };
    if (simdi - kayit.baslangic > 60 * 1000) {
        istekSayaci.set(ip, { sayi: 1, baslangic: simdi });
        return true;
    }
    if (kayit.sayi >= 30) return false;
    istekSayaci.set(ip, { ...kayit, sayi: kayit.sayi + 1 });
    return true;
}

export async function POST(request) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!rateLimitKontrol(ip)) {
        return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekleyin.' }, { status: 429 });
    }

    const { sorgu } = await request.json();

    if (!sorgu?.trim()) return NextResponse.json({ error: 'Sorgu boş olamaz' }, { status: 400 });
    if (sorgu.length > 500) return NextResponse.json({ error: 'Sorgu en fazla 500 karakter olabilir' }, { status: 400 });

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey || apiKey.includes('BURAYA')) {
        return NextResponse.json({
            error: 'Perplexity API key eksik. .env.local dosyasına eklendiğinde Hermes AI çalışacaktır.',
            demo: true,
            ozet: "Hermes Mimarisi API Anahtarı Bekliyor...",
            sonuclar: [
                {
                    satilacak_urun: "Oversize Keten Gömlek",
                    model_turu: "Geniş kesim, düşük omuz, günlük kullanım",
                    kumas_turu: "%100 Ham Keten (Yaz Sezonu)",
                    aksesuar_turu: "Hindistan cevizi düğme, gizli astar",
                    fiyat_araligi: "850 TL - 1200 TL / Perakende",
                    hedef_musteri: "Avrupa ve Türkiye, 18-35 yaş grubu",
                    platform: "instagram",
                    kategori: "gomlek",
                    talep_skoru: 9,
                    aciklama: "Instagram ve TikTok verilerine göre yaz sezonu için yüksek talep.",
                    kaynak: "https://instagram.com"
                }
            ]
        });
    }

    try {
        const prompt = `Sen "Hermes" kod adlı kusursuz bir tekstil, moda ve veri analizi ajanısın. 
Görevin, Türkiye fason üretim işletmesi için hiçbir insan tahmini katmadan saf "veri odaklı" karar almaktır.

AŞAĞIDAKİ ADIMLARI ZİHNİNDE PARALEL OLARAK İŞLE:
1. Google Arama Trendleri, Pinterest, Instagram, TikTok ve Moda Haftası raporlarını tara.
2. Amazon, Zara, H&M, Trendyol, Shopify, Etsy, Alibaba ve Aliexpress sitelerinin "En çok satan, en hızlı tükenen, en yüksek yorum alan" ürünlerini süz.
3. Rakiplerin fiyatlarını, kumaş tercihlerini, üretim sayılarını ve pazar rekabet seviyesini (Kızıl veya Mavi okyanus) ölç.
4. T-shirt, Sweatshirt, Hoodie, Elbise, Pantolon, Ceket, Gömlek kategorilerinden birine karar ver.
5. Kullanılacak doğru kumaş türünü, kumaş dokusunu, düğme, fermuar ve baskı gibi net aksesuarları seç.
6. Ürünün Hangi Sezona (Yaz, Kış, Bahar, Sonbahar) ve Hangi Bölgeye (Avrupa, Amerika, Türkiye, Orta Doğu, Asya) uygun olduğunu belirle.
7. Satış hacmi, tahmini üretim maliyeti, potansiyel kâr marjı ve satış fiyatı aralığını hesapla.

Bana sadece aşağıdaki JSON CİKCİPİNİ (Schema) döndür! Başka MERHABA VEYA AÇIKLAMA YAZMA:
{
  "ozet": "Analiz özeti ve karar gerekçesi (Maksimum 3 cümle)",
  "sonuclar": [
    {
      "satilacak_urun": "Örn: Baggy Cargo Pantolon",
      "model_turu": "Örn: Geniş kesim, 6 cepli, dizden pensli",
      "kumas_turu": "Örn: %100 Pamuk Gabardin veya Paraşüt Kumaş",
      "aksesuar_turu": "Örn: Nikel stoper, cırt cırt, çıtçıt düğme",
      "fiyat_araligi": "Örn: 900 TL - 1400 TL",
      "hedef_musteri": "Örn: Avrupa Bölgesi, Z Kuşağı",
      "platform": "trendyol/amazon/instagram/pinterest/diger (hangisi baskınsa)",
      "kategori": "gomlek/pantolon/elbise/dis_giyim/spor/ic_giyim/aksesuar/diger",
      "talep_skoru": 1 ile 10 arasında matematiksel puan,
      "aciklama": "Seçim nedenine dair kısa argüman",
      "kaynak": "Ref URL veya ana veri platformu adı"
    }
  ]
}

ARAŞTIRILACAK KONU: ${sorgu}
Odak: 2025-2026 Sezonu Moda Dinamikleri.
JSON FORMATI DIŞINDA ASLA BİRŞEY YAZMA.
`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    { role: 'system', content: prompt }
                ],
                max_tokens: 1500,
                temperature: 0.2, // Yüksek tutarlılık (Halüsinasyon engelleyici)
            }),
        });

        if (!response.ok) {
            const hata = await response.text();
            return NextResponse.json({ error: `Perplexity hermes ajan hatası: ${response.status} - ${hata}` }, { status: 500 });
        }

        const data = await response.json();
        const icerik = data.choices?.[0]?.message?.content || '';

        const jsonMatch = icerik.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ error: 'Hermes ajanı yanıtı veri formatına (JSON) oturtamadı', ham: icerik }, { status: 500 });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ basarili: true, ...parsed });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
