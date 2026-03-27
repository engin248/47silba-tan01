import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// NIZAM V3 MİMARİSİ: VISION AJAN ÇEKİRDEĞİ 
// Metin Kazıma (Scraping) İptal Edilmiştir. Yerini Görsel Okuma almıştır.

const asilHavuzTablo = 'b1_arge_trendler';
const copHavuzTablo = 'b0_bigdata_cop_arsivi'; // Diger butun ham gorsel ve yazilar buraya eklenecek

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { platformUrl, base64Image, aramaKonusu } = body;

        if (!base64Image) {
            return NextResponse.json({ basarili: false, mesaj: 'İşlenecek görsel (Vision) bulunamadı.' }, { status: 400 });
        }

        // 1. GEMINI VISION AI MODELİNİ HAZIRLA
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Görsel analizde çok iyi ve maliyeti sıfıra yakın

        // 2. YAPAY İNSAN GÖZÜ İÇİN TALİMAT (PROMPT)
        const prompt = `
        Sen NIZAM ERP'nin "Kurmay" istihbarat ajanısın. 
        Sana internetteki bir ekran görüntüsü veya kıyafetlerin fotoğrafı verildi. HTML scraping kullanmiyoruz, sadece gözlerinle incele.
        Arama Konusu: ${aramaKonusu || 'Bilinmiyor'}

        GÖREVİN:
        Bu resimdeki ürünü incele ve bana SADECE ŞU JSON FORMATINDA HAP BİLGİYİ DÖN:
        {
            "baslik": "Resimdeki en net kiyafetin adi/modeli",
            "kategori": "Giyim/Aksesuar vs.",
            "fiyat": "Gorebiliyorsan sayisal fiyat, yoksa null",
            "hedef_kitle": "Erkek/Kadin/Unisex",
            "oneri_skoru": 1 ile 10 arasi bir trend yildizi,
            "karar_ozeti": "Neden bu urun satar veya satmaz? Kisa vizyon yazin"
        }
        Cevabın MÜTLAKA parse edilebilir temiz JSON olmalıdır. Markdown veya süslü karakter (backtick \`\`\` ) kullanma.
        `;

        // Base64 formatını parçala ve objeyi hazırla
        const [mimeType, b64Data] = base64Image.split('base64,');
        const gorselData = {
            inlineData: { data: b64Data, mimeType: mimeType.replace('data:', '').replace(';', '') }
        };

        // 3. GEMINI'YE BAKTIR VE YORUMLAT
        const result = await model.generateContent([prompt, gorselData]);
        const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const aiCevap = JSON.parse(cleanJson);

        // 4. ÇÖPLERİ M21'İN BIG DATA ARŞİVİNE AT
        // (Arkaplan öğrenmesi ve incelemesi için)
        await sb.from(copHavuzTablo).insert([{
            kaynak_url: platformUrl || 'Bilinmiyor',
            gorsel_base64: base64Image.substring(0, 1000) + '...', // Log şişmesin diye limitli
            arama_konusu: aramaKonusu,
            ai_ham_cikti: result.response.text(),
            tarih: new Date().toISOString()
        }]);

        // 5. RAFİNE MÜCEVHER BİLGİYİ NİZAM'IN ASIL AR-GE ÇEKİRDEĞİNE (B1) KAYDET
        const { data: yeniTrend, error } = await sb.from(asilHavuzTablo).insert([{
            baslik: aiCevap.baslik,
            kategori: aiCevap.kategori,
            talep_skoru: aiCevap.oneri_skoru,
            aciklama: aiCevap.karar_ozeti,
            fiyat_trendi: aiCevap.fiyat ? parseFloat(aiCevap.fiyat) : 0,
            platform: platformUrl ? new URL(platformUrl).hostname : 'Gorsel-Tarama',
            durum: 'inceleniyor'
        }]).select();

        if (error) throw error;

        return NextResponse.json({
            basarili: true,
            mesaj: 'Gemini gözüyle tarandı, çöpler dışlandı, asil veri eklendi.',
            data: yeniTrend
        });

    } catch (e) {
        return NextResponse.json({ basarili: false, mesaj: e.message }, { status: 500 });
    }
}
