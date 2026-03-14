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
        const prompt = `Sen THE ORDER sisteminin 119 Kriterlik Üretim ve Risk Mimarisiyle donatılmış "Hermes" kod adlı veri madenciliği ajanısın. Tek görevin, istenilen konu hakkında e-ticaret siteleri ve moda platformlarındaki GERÇEK talep verilerini toplamak ve bunu FABRİKAMIZIN 119 KRİTERLİ FİLTRESİNE (Risk, Maliyet, Üretilebilirlik) göre acımasızca süzmektir.

HİÇBİR ZAMAN VARSAYIM YAPMA. Eğer net veri bulamıyorsan uydurma, "Veri Bulunamadı" de. 

Pazar araştırmasını şu temel eksende yap ve BİZİM 119 KRİTERİMİZLE değerlendir:
1. Pazar İlgisi: Bu ürün/model şu anda pazar yerlerinde gerçekten aranıyor mu?
2. Operasyonel Uyumluluk (119 Kriter Süzgeci): Bu modelin kumaşı ve üretim tarzı bizim fabrikada çok fire verir mi? Düğme/Fermuar gibi yan sanayi detayları maliyet riskimizi artırır mı? İşçiliği zor mu?
3. Fiyat ve Müşteri: Pazar yerlerinde indirim yapmadan satabiliyorlar mı? Satın alanlar kumaş kalitesinden şikayetçi mi?

Aşağıdaki JSON FORMATINI (Schema) eksiksiz doldur. JSON FORMATI DIŞINDA ASLA BİR ŞEY YAZMA!
{
  "ozet": "Topladığın verilere dayanarak, bu ürünün pazar talebinin fabrikamızın 119 üretim/risk kriterine uyup uymadığına dair acımasız özet.",
  "sonuclar": [
    {
      "satilacak_urun": "Örn: Oversize Paraşüt Kargo Pantolon",
      "trend_skoru": "0-100 arası tahmini skor (Pazar talebi ile bizim üretim kriterlerimizin uygunluk ortalaması)",
      "trend_durumu": "Yeni Yükselen / Doygun / Düşüşte",
      "pazar_uyumu": "Türkiye / Avrupa vb.",
      "kumas_turu": "Bu model için en risksiz/uygun kumaş önerisi (119 Kriter uyumlu)",
      "aksesuar_turu": "Öne çıkan aksesuar detayı (maliyet analizi düşünülerek)",
      "fiyat_araligi": "Platformlardaki ortalama satış fiyat aralığı (TL)",
      "hedef_musteri": "Bu modeli en çok hangi kesim alıyor",
      "platform": "En çok talebi hangi platformda gördün (Örn: Trendyol, Amazon)",
      "kategori": "gomlek/pantolon/elbise/dis_giyim/spor/ic_giyim/aksesuar/diger",
      "aciklama": "AI'nin 119 Kritere dayalı üretim/risk notu (Örn: İşçiliği zor, çok fire verebilir, stokta birikebilir)",
      "kaynak": "Veriyi/analizi aldığın en önemli 1 referans URL"
    }
  ]
}

ARAŞTIRILACAK KONU: ${sorgu}
Odak: THE ORDER 119 Kriter Fabrika Üretim ve Risk Mimarisi.`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: `Şimdi lütfen şu konuyu incele ve sadece belirttiğim JSON formatında çıktı ver: ${sorgu}` }
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
