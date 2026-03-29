import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimitKontrol } from '@/lib/rateLimit';
import { gorevSchema, veriDogrula } from '@/lib/zodSchemas';

//  POST /api/gorev-ekle 
// NOT: Eski gorev-ekle varsa bunu ona birleştirin veya eski route'u silin
export async function POST(request) {
    try {
        // 1. RATE LIMIT
        const ip = (request.headers.get('x-forwarded-for') || 'bilinmeyen').split(',')[0].trim();
        if (!(request.headers.get('x-internal-api-key') === process.env.INTERNAL_API_KEY || rateLimitKontrol(ip, 15, 60))) {
            return NextResponse.json({ hata: 'ok fazla istek.' }, { status: 429 });
        }

        // 2. BODY PARSE
        const body = await request.json();

        // 3. ZOD DOĞRULAMA
        const dogrulama = veriDogrula(gorevSchema, {
            baslik: body.baslik,
            aciklama: body.aciklama || null,
            oncelik: body.oncelik || 'normal',
            atanan_personel_id: body.atanan_personel_id || null,
            bitis_tarihi: body.bitis_tarihi || null,
        });

        if (!dogrulama.basarili) {
            return NextResponse.json({ hata: 'Geersiz veri', detay: dogrulama.error }, { status: 422 });
        }

        const temizVeri = dogrulama.data;

        // 4. MKERRER TITLE KONTROL (Race Condition zırhı)
        const { data: mevcut } = await supabaseAdmin
            .from('b1_gorevler')
            .select('id')
            .eq('baslik', temizVeri.baslik)
            .eq('durum', 'bekliyor'); // durum kolonu varsa

        if (mevcut && mevcut.length > 0) {
            return NextResponse.json(
                { hata: 'Aynı başlıkta bekleyen bir grev zaten mevcut!' },
                { status: 409 }
            );
        }

        // 5. INSERT
        const { data, error } = await supabaseAdmin
            .from('b1_gorevler')
            .insert([{ ...temizVeri, durum: 'bekliyor' }])
            .select();

        if (error) throw error;

        return NextResponse.json({ basarili: true, gorev: data?.[0] }, { status: 201 });

    } catch (error) {
        console.error('[/api/gorev-ekle] Hata:', error.message);
        return NextResponse.json({ hata: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}
