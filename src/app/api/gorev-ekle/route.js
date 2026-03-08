import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitKontrol } from '@/lib/rateLimit';
import { gorevSchema, veriDogrula } from '@/lib/zodSchemas';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── POST /api/gorev-ekle ─────────────────────────────────────
// NOT: Eski gorev-ekle varsa bunu ona birleştirin veya eski route'u silin
export async function POST(request) {
    try {
        // 1. RATE LIMIT
        const ip = (request.headers.get('x-forwarded-for') || 'bilinmeyen').split(',')[0].trim();
        if (!rateLimitKontrol(ip, 15, 60)) {
            return NextResponse.json({ hata: 'Çok fazla istek.' }, { status: 429 });
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
            return NextResponse.json({ hata: 'Geçersiz veri', detay: dogrulama.error }, { status: 422 });
        }

        const temizVeri = dogrulama.data;

        // 4. MÜKERRER TITLE KONTROLÜ (Race Condition zırhı)
        const { data: mevcut } = await supabaseAdmin
            .from('b1_gorevler')
            .select('id')
            .eq('baslik', temizVeri.baslik)
            .eq('durum', 'bekliyor'); // durum kolonu varsa

        if (mevcut && mevcut.length > 0) {
            return NextResponse.json(
                { hata: 'Aynı başlıkta bekleyen bir görev zaten mevcut!' },
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
