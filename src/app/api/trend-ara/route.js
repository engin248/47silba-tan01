export const dynamic = 'force-dynamic'
export const maxDuration = 60; // Vercel Timeout (522/504) Engelleyici
import { NextResponse } from 'next/server';
// Build Hatasını Önlemek İçin Upstash Geçici Olarak Devre Dışı
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

    // Güvenlik Kalkanı (Devre Dışı)
    /*
    try {
        const { success } = await ratelimit.limit(`trend-ara_${ip}`);
        if (!success) {
            return NextResponse.json({ error: 'Sistem Bütçe Koruması devrede. Spam ve mali kayıp riski (Sorgu başı Fatura) önlendi. Yeni bir arama yapmak için lütfen 10 dakika bekleyiniz.' }, { status: 429 });
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
        const prompt = `Sen THE ORDER sisteminin 119 Kriterlik Üretim ve Risk Mimarisiyle donatılmış "Hermes" kod adlı veri madenciliği ajanısın. Tek görevin, istenilen konu hakkında e-ticaret siteleri ve moda platformlarındaki GERÇEK talep verilerini toplamak ve bunu 119 KRİTERLİ FİLTREMİZE (Kârlılık, Operasyonel Risk, Talep Şiddeti) göre acımasızca süzmektir.

DİL VE ÜSLUP KURALI (KESİN TALİMAT):
Asla sübjektif, coşkulu veya abartılı cümleler ("müthiş satıyor", "uçuyor", "kaçıyor", "harika trend") KULLANMAYACAKSIN. Yorum yapmayacaksın. Cevapların %100 rakamlara, yüzdelere, TL/Euro cinsinden finansal değerlere ve ölçülebilir verilere dayanmak ZORUNDADIR. Ölçemediğin hiçbir şeyi rapora yazma. Tamamen soğukkanlı, net ve rakamsal (analitik) bir dil kullan.

BİZİM İÇİN ÜRETİM LİMİTİ YOKTUR: İmalatçıyız, kendi fabrikamız haricinde devasa fason ağımızla tekstilde yapamayacağımız hiçbir ürün yoktur! Bu yüzden "üretimi zor mu, dikişi ağır mı" diye korkma; sadece "Bu ürünü yaparsak kâr marjı, kumaş/aksesuar tedarik riski ve satılabilme potansiyeli nedir?" vizyonuyla düşün.

HİÇBİR ZAMAN VARSAYIM YAPMA. Eğer net veri bulamıyorsan uydurma, "Veri Bulunamadı" de. 

Pazar araştırmasını şu temel eksende yap ve BİZİM 119 KRİTERİMİZLE değerlendir:
1. Pazar İlgisi: Son 30 gündeki arama hacmi artış yüzdesi nedir? Tedarik edilen pazar yerlerindeki aylık tahmini satış adedi/hacmi nedir?
2. Operasyonel ve Maliyet Riski (119 Kriter Süzgeci): Fason veya iç üretimde bu modelin kumaş ve aksesuar detayları (düğme, fermuar, taş dizimi vb.) tahmini birim maliyetini (TL) ne ölçüde etkiler? Tedarik bazlı metraj fire oranı riski nedir?
3. Fiyat ve Müşteri: Pazar yerlerindeki güncel taban ve tavan fiyat (TL) nedir? Müşteri yorumlarındaki temel şikayetler (kalıp dar, kumaş terletiyor vb.) istatistiksel olarak hangi orana işaret ediyor?

Aşağıdaki JSON FORMATINI (Schema) eksiksiz doldur. JSON FORMATI DIŞINDA ASLA BİR ŞEY YAZMA!
{
  "ozet": "Tamamen veri ve rakama dayalı, duygudan uzak, 2 cümlelik pazar özeti (Örn: Amazon'da aylık arama hacmi %15 artmış, taban fiyat 850 TL).",
  "sonuclar": [
    {
      "satilacak_urun": "Örn: Oversize Paraşüt Kargo Pantolon",
      "trend_skoru": "0-100 arası tahmini analitik skor",
      "trend_durumu": "Yeni Yükselen / Doygun / Düşüşte",
      "pazar_uyumu": "Bölge bilgisi (Türkiye, Avrupa)",
      "kumas_turu": "Bu model için en rasyonel kumaş reçetesi",
      "aksesuar_turu": "Kullanılan ana aksesuar ve tahmini parça başı maliyet etikisi",
      "fiyat_araligi": "Platformlardaki gerçek taban-tavan satış fiyatı (Örn: 900 TL - 1400 TL)",
      "hedef_musteri": "Demografik veri (Örn: 18-25 Kadın, Segment B)",
      "platform": "Verinin çekildiği ana platform (Örn: Trendyol, Amazon)",
      "kategori": "gomlek/pantolon/elbise/dis_giyim/spor/ic_giyim/aksesuar/diger",
      "aciklama": "AI'nin risk/potansiyel raporu. Yalnızca metrik, adet, yüzde ve TL odaklı olmalı.",
      "kaynak": "Veriyi/analizi aldığın referans URL"
    }
  ]
}

ARAŞTIRILACAK KONU: ${sorgu}
Odak: Sınırsız Üretim Gücü (İç Tesis + Fason), Kârlılık, Operasyonel Risk ve THE ORDER 119 Kriter Mimarisi.`;

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
