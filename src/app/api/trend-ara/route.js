export const maxDuration = 60; // Vercel Timeout (522/504) Engelleyici
import { NextResponse } from 'next/server';
// Build Hatasını nlemek İin Upstash Geici Olarak Devre Dışı
// import { Ratelimit } from '@upstash/ratelimit';
// import { Redis } from '@upstash/redis';

// IP tabanlı kalıcı rate limit (Mock)
/*
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(1, '10 m'), // Zafiyet Kapatıldı: Her IP 10 dakikada sadece 1 araştırma yapabilir
    analytics: true,
});
*/

export async function POST(request) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    // Gvenlik Kalkanı (Devre Dışı)
    /*
    try {
        const { success } = await ratelimit.limit(`trend-ara_${ip}`);
        if (!success) {
            return NextResponse.json({ error: 'Sistem Bte Koruması devrede. Spam ve mali kayıp riski (Sorgu başı Fatura) nlendi. Yeni bir arama yapmak iin ltfen 10 dakika bekleyiniz.' }, { status: 429 });
        }
    } catch (error) {
        // Redis bağlanamazsa işlemi kesme, logla ve devam et (Fallback)
    }
    */

    const { sorgu } = await request.json();

    if (!sorgu?.trim()) return NextResponse.json({ error: 'Sorgu boş olamaz' }, { status: 400 });
    if (sorgu.length > 500) return NextResponse.json({ error: 'Sorgu en fazla 500 karakter olabilir' }, { status: 400 });

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey || apiKey.includes('BURAYA')) {
        return NextResponse.json({
            error: 'Perplexity API key eksik. .env.local dosyasına eklendiğinde Hermes AI alışacaktır.',
            demo: true,
            ozet: "Hermes Mimarisi API Anahtarı Bekliyor...",
            sonuclar: [
                {
                    satilacak_urun: "Oversize Keten Gmlek",
                    model_turu: "Geniş kesim, dşk omuz, gnlk kullanım",
                    kumas_turu: "%100 Ham Keten (Yaz Sezonu)",
                    aksesuar_turu: "Hindistan cevizi dğme, gizli astar",
                    fiyat_araligi: "850 TL - 1200 TL / Perakende",
                    hedef_musteri: "Avrupa ve Trkiye, 18-35 yaş grubu",
                    platform: "instagram",
                    kategori: "gomlek",
                    talep_skoru: 9,
                    aciklama: "Instagram ve TikTok verilerine gre yaz sezonu iin yksek talep.",
                    kaynak: "https://instagram.com"
                }
            ]
        });
    }

    try {
        const prompt = `Sen THE ORDER sisteminin 119 Kriterlik retim ve Risk Mimarisiyle donatılmış "Hermes" kod adlı veri madenciliği ajanısın. Tek grevin, istenilen konu hakkında e-ticaret siteleri ve moda platformlarındaki GEREK talep verilerini toplamak ve bunu 119 KRİTERLİ FİLTREMİZE (Krlılık, Operasyonel Risk, Talep Şiddeti) gre acımasızca szmektir.

DİL VE SLUP KURALI (KESİN TALİMAT):
Asla sbjektif, coşkulu veya abartılı cmleler ("mthiş satıyor", "uuyor", "kaıyor", "harika trend") KULLANMAYACAKSIN. Yorum yapmayacaksın. Cevapların %100 rakamlara, yzdelere, TL/Euro cinsinden finansal değerlere ve llebilir verilere dayanmak ZORUNDADIR. lemediğin hibir şeyi rapora yazma. Tamamen soğukkanlı, net ve rakamsal (analitik) bir dil kullan.

BİZİM İİN RETİM LİMİTİ YOKTUR: İmalatıyız, kendi fabrikamız haricinde devasa fason ağımızla tekstilde yapamayacağımız hibir rn yoktur! Bu yzden "retimi zor mu, dikişi ağır mı" diye korkma; sadece "Bu rn yaparsak kr marjı, kumaş/aksesuar tedarik riski ve satılabilme potansiyeli nedir?" vizyonuyla dşn.

HİBİR ZAMAN VARSAYIM YAPMA. Eğer net veri bulamıyorsan uydurma, "Veri Bulunamadı" de. 

Pazar araştırmasını şu temel eksende yap ve BİZİM 119 KRİTERİMİZLE değerlendir:
1. Pazar İlgisi: Son 30 gndeki arama hacmi artış yzdesi nedir? Tedarik edilen pazar yerlerindeki aylık tahmini satış adedi/hacmi nedir?
2. Operasyonel ve Maliyet Riski (119 Kriter Szgeci): Fason veya i retimde bu modelin kumaş ve aksesuar detayları (dğme, fermuar, taş dizimi vb.) tahmini birim maliyetini (TL) ne lde etkiler? Tedarik bazlı metraj fire oranı riski nedir?
3. Fiyat ve Mşteri: Pazar yerlerindeki gncel taban ve tavan fiyat (TL) nedir? Mşteri yorumlarındaki temel şikayetler (kalıp dar, kumaş terletiyor vb.) istatistiksel olarak hangi orana işaret ediyor?

Aşağıdaki JSON FORMATINI (Schema) eksiksiz doldur. JSON FORMATI DIŞINDA ASLA BİR ŞEY YAZMA!
{
  "ozet": "Tamamen veri ve rakama dayalı, duygudan uzak, 2 cmlelik pazar zeti (rn: Amazon'da aylık arama hacmi %15 artmış, taban fiyat 850 TL).",
  "sonuclar": [
    {
      "satilacak_urun": "rn: Oversize Paraşt Kargo Pantolon",
      "trend_skoru": "0-100 arası tahmini analitik skor",
      "trend_durumu": "Yeni Ykselen / Doygun / Dşşte",
      "pazar_uyumu": "Blge bilgisi (Trkiye, Avrupa)",
      "kumas_turu": "Bu model iin en rasyonel kumaş reetesi",
      "aksesuar_turu": "Kullanılan ana aksesuar ve tahmini para başı maliyet etikisi",
      "fiyat_araligi": "Platformlardaki gerek taban-tavan satış fiyatı (rn: 900 TL - 1400 TL)",
      "hedef_musteri": "Demografik veri (rn: 18-25 Kadın, Segment B)",
      "platform": "Verinin ekildiği ana platform (rn: Trendyol, Amazon)",
      "kategori": "gomlek/pantolon/elbise/dis_giyim/spor/ic_giyim/aksesuar/diger",
      "aciklama": "AI'nin risk/potansiyel raporu. Yalnızca metrik, adet, yzde ve TL odaklı olmalı.",
      "kaynak": "Veriyi/analizi aldığın referans URL"
    }
  ]
}

ARAŞTIRILACAK KONU: ${sorgu}
Odak: Sınırsız retim Gc (İ Tesis + Fason), Krlılık, Operasyonel Risk ve THE ORDER 119 Kriter Mimarisi.`;

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
                    { role: 'user', content: `Şimdi ltfen şu konuyu incele ve sadece belirttiğim JSON formatında ıktı ver: ${sorgu}` }
                ],
                max_tokens: 1500,
                temperature: 0.2, // Yksek tutarlılık (Halsinasyon engelleyici)
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
