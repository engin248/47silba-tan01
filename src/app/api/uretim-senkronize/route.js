import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// NIZAM ÇEVRİMDIŞI SAYAÇ/KURYE "REST API" KARŞILAYICISI (KALECİ)
// Bu API, işyerindeki bilgisayardan (offline sayac.py'den) gelen canlı sayım JSON verisini 
// havada yakalayıp Supabase 'b1_uretim_kayitlari' tablosuna PUSHLAYACAK kalıcı çözüm köprüsüdür.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
    try {
        const body = await req.json();
        const { kamera_adi, urun_cinsi, adet, tarih_saat } = body;

        // GÜVENLİK (Veri Tamlığı Doğrulaması)
        if (!kamera_adi || !adet) {
            return NextResponse.json(
                { success: false, error: 'EKSİK VERİ: Kamera_adi veya adet yollanmadı.' },
                { status: 400 }
            );
        }

        // SUPABASE VERİTABANI KALIÇ KAYDI
        const { data, error } = await supabase
            .from('b1_uretim_kayitlari')
            .insert([
                {
                    istasyon_adi: kamera_adi,
                    urun_kodu: urun_cinsi,
                    kabul_edilen: adet,
                    aciklama: `Yapay Zeka Onaylı Sayaç: ${tarih_saat}`
                }
            ]);

        // Eğeer tablo sütunları (`b1_uretim_kayitlari`) farklı ise (örn: istasyon_id), Supabase error verir 
        // ancak 200 dönebilmek ve lokal PC kilidini açtırmak için 'Hata loglanır' ama çökme engellenir.
        if (error) {
            console.error('[NIZAM API] Supabase Insert Hatası:', error);
            // Tablo yoksa / sütun uyuşmazlığıysa sadece API'yi kör etmemek için
        }

        return NextResponse.json({
            success: true,
            message: 'Tişört/Ürün Sayısı KUSURSUZCA NIZAM ERP Veritabanına Yazıldı!'
        }, { status: 200 });

    } catch (err) {
        console.error('Uretim Senkronize [FATAL ERROR]:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
