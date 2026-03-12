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
        const prompt = `Sen 119 Kriterlik Araştırma Modelini kullanan "Hermes (M1 Hücre-1)" kod adlı bir yapay zeka küratörüsün. Tek görevin, pazarda satma ihtimali olan fırsat ürünlerini tespit etmektir. Üretim Kararı asla veremezsin.

ŞU 4 ANA METRİĞİ (0-100 ARASI) İLİKLERİNE KADAR ARAŞTIR:
1. Search Growth (Arama Hacmi İvmesi): İnsanlar bu ürünü Google'da ve arama motorlarında ne kadar aratıyor?
2. Review Velocity (Yorum Artış Hızı): Amazon/Zara gibi sitelerde bu kışlık/yazlık ürünün yorumları hızla artıyor mu?
3. Stock Depletion (Stok Erime Hızı): Ürünlerin bedenleri hızla tükeniyor mu?
4. Price Stability (Fiyat İstikrarı): Ürün fiyatı sabit kalarak mı satıyor, yoksa fiyat kırılarak (Clearance) mı satıyor?

ZORUNLU MATEMATİKSEL KURAL (TREND SKORU HESABI): 
Trend Skoru = (Search Growth * 0.30) + (Review Velocity * 0.30) + (Stock Depletion * 0.20) + (Price Stability * 0.20)
* Eğer bu formülün sonucu 60'ın altındaysa, ürün "ÜRETİLEMEZ (ÇÖP)" statüsündedir.

TREND YAŞI KONTROLÜ:
* < 30 gün: Geçici Köpük (Riskli)
* 30-90 gün: Doğrulanmış Trend (Üretilebilir)
* > 180 gün: Doygun Pazar / Kırmızı Okyanus (Riskli)

Aşağıdaki JSON FORMATINI (Schema) eksiksiz doldur. JSON FORMATI DIŞINDA ASLA BİR ŞEY YAZMA!
{
  "ozet": "Kısa istihbarat özeti (Örn: Amazon Best Seller ile Google Hacmi eşleşiyor, Güven %85)",
  "sonuclar": [
    {
      "satilacak_urun": "Örn: Oversize Paraşüt Kargo Pantolon",
      "trend_skoru": 75,
      "trend_yasi_gun": 45,
      "risk_seviyesi": "Orta / Doğrulanmış Trend",
      "pazar_uyumu": "Türkiye / Avrupa (Z Kuşağı)",
      "kumas_turu": "Örn: İÇGÖRÜ (Manuel Onay Bekler): %100 Pamuk Dokuma veya Paraşüt Kumaş",
      "aksesuar_turu": "Örn: TAHMİNİ: Cırt cırt paça büzgüsü",
      "fiyat_araligi": "Örn: 900 TL - 1400 TL",
      "hedef_musteri": "Örn: 18-25 Yaş Grubu",
      "platform": "amazon/trendyol/instagram/tiktok",
      "kategori": "gomlek/pantolon/elbise/dis_giyim/spor/ic_giyim/aksesuar/diger",
      "metrics": {
         "search_growth": 80,
         "review_velocity": 85,
         "stock_depletion": 70,
         "price_stability": 60
      },
      "aciklama": "AI'nin Risk Algısı: (Örn: Modal ömrü kısa, stok eritme ihtimali..)",
      "kaynak": "Ref URL veya çapraz doğrulama veri kaynağı"
    }
  ]
}

ARAŞTIRILACAK KONU: ${sorgu}
Odak: 2025-2026 Sezonu, İşletme Maliyet ve Stok Riskini En Aza İndirecek 119 Kriter Mimarisi.`;

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
