import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Eğer projede henüz set edilmemişse Dummy fallback (Çalışması için env gereklidir)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY' });

export async function POST(req) {
    try {
        // Auth Key Bypass - Servis hesabıyla Database okuması yapılacak (Server-side)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 1. Veritabanından Tüm Personelleri (Maliyeti olanlar) Çek
        const { data: pData, error: pError } = await supabaseAdmin
            .from('b1_personel')
            .select('id, ad_soyad, birim, aylik_maliyet_tl');

        if (pError || !pData) {
            return NextResponse.json({ error: 'Personel verisi okunamadı.' }, { status: 500 });
        }

        // 2. Bu ayın üretim girdilerini çek
        const date = new Date();
        const ilkGun = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const { data: perfData } = await supabaseAdmin
            .from('b1_personel_performans')
            .select('personel_id, isletmeye_katilan_deger, kazanilan_prim, uretilen_adet, kalite_puani')
            .gte('created_at', ilkGun);

        // 3. Prompt İçin Veri Hazırlığı
        let isciAnalizMetni = "İşte fabrikanın bu ayki üretim verileri ve personel maliyetleri:\n\n";

        pData.forEach(p => {
            const islemRaporlari = (perfData || []).filter(log => log.personel_id === p.id);
            const adetler = islemRaporlari.reduce((acc, curr) => acc + (Number(curr.uretilen_adet) || 0), 0);
            const kaliteortalamasi = islemRaporlari.length ? islemRaporlari.reduce((acc, curr) => acc + (Number(curr.kalite_puani) || 10), 0) / islemRaporlari.length : 10;
            const toplamDeger = islemRaporlari.reduce((acc, curr) => acc + (Number(curr.isletmeye_katilan_deger) || 0), 0);
            const toplamPrim = islemRaporlari.reduce((acc, curr) => acc + (Number(curr.kazanilan_prim) || 0), 0);
            const maliyet = Number(p.aylik_maliyet_tl) || 0;

            isciAnalizMetni += `Personel: ${p.ad_soyad} (${p.birim || 'Bilinmiyor'})
  - Aylık Şirket Maliyeti: ${maliyet} TL
  - Toplam Ürettiği Parça/İşlem Sayısı: ${adetler}
  - Makineden Çıkan Hata/Kalite Puanı (1-10): ${kaliteortalamasi.toFixed(1)}
  - Şirkete Ürettiği Katma Değer Puanı (Amorti Barı): ${toplamDeger} TL
  - Hakkettiği Prim (Adil Formül - Maliyeti Aştı mı?): ${toplamPrim} TL\n\n`;
        });

        const systemPrompt = `Sen acımasız, net ve tam bir verimlilik makinesi olan Yalın Üretim Yapay Zeka Başdenetçisi (Kâhin Agent) sin.
Fabrikadaki patrona ve yönetim kuruluna Türkçe olarak kısa, vurucu ve eyleme geçirilebilir bir "Kârlılık ve Adalet Raporu" sunmakla görevlisin.
Sana yukarıda verilen listedeki personellerin aylık maliyetleri ile firmaya kattığı katma değeri (ürettiklerini) analiz edeceksin.

KURALLAR:
1. Bir işçi maliyetinden daha az değer üretmişse (örn 60bin maliyeti var ama 30bin TL değer katmışsa) işletmeye "Zarar Yazdırıyor" ve "Uyarı/Eğitim verilmeli" diyeceksin.
2. Bir işçi maliyetini çoktan aşıp PRİM almaya başlamışsa onu şirketin elit personeli (Liyakat Yıldızı) ilan edecek ve tebrik edeceksin.
3. Hata oranı / Kalite Puanı düşükse (örneğin 5'in altında), çok üretse bile kalitesiz ürettiği için disiplin uyarısı vereceksin.
4. Çıktıyı MD formatında ve agresif/kurumsal bir dille (Net direktiflerle) vereceksin. Kesinlikle boş övgü yapma. Yatan ile çalışanı ayır. Mümkün olduğunca kısa (maks 5-6 paragraf) tut.`;

        // 4. Gemini'a gönder!
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${systemPrompt}\n\nVERİLER:\n${isciAnalizMetni}`,
            config: {
                temperature: 0.3, // Daha acımasız net yargılar için
            }
        });

        const aiCevap = response.text || "AI yargıç sessiz kaldı.";

        return NextResponse.json({ success: true, aiCevap });

    } catch (error) {
        console.error('Kâhin AI Hatası:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
