import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitKontrol } from '@/lib/rateLimit';
import { kumasSchema, aksesuarSchema, veriDogrula } from '@/lib/zodSchemas';
import { hataBildir } from '@/lib/hataBildirim';

// ─── SERVER-SIDE SUPABASE (Service Role Key — güvenli) ─────────
// Client-side anon key yerine sunucu tarafı service key kullanılır.
// Bu sayede RLS bypass riski kontrol altına alınır.
// ─── POST /api/kumas-ekle ──────────────────────────────────────
export async function POST(request) {
    const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
);
    try {
        // 1. RATE LIMIT KONTROLÜ
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : 'bilinmeyen';
        const limitGecti = rateLimitKontrol(ip, 20, 60); // 1 dakikada max 20 istek
        if (!limitGecti) {
            return NextResponse.json(
                { hata: 'Çok fazla istek. Lütfen bekleyin.' },
                { status: 429 }
            );
        }

        // 2. BODY PARSE
        const body = await request.json();
        const { tip, veri } = body; // tip: 'kumas' | 'aksesuar'

        if (!tip || !veri) {
            return NextResponse.json({ hata: 'tip ve veri zorunlu' }, { status: 400 });
        }

        // 3. ZOD DOĞRULAMA
        let schema, tablo;
        if (tip === 'kumas') {
            schema = kumasSchema;
            tablo = 'b1_kumas_arsivi';
        } else if (tip === 'aksesuar') {
            schema = aksesuarSchema;
            tablo = 'b1_aksesuar_arsivi';
        } else {
            return NextResponse.json({ hata: 'Geçersiz tip' }, { status: 400 });
        }

        const dogrulama = veriDogrula(schema, veri);
        if (!dogrulama.basarili) {
            return NextResponse.json(
                { hata: 'Veri doğrulama hatası', detay: dogrulama.error },
                { status: 422 }
            );
        }

        const temizVeri = dogrulama.data;

        // 4. MÜKERRER KONTROL
        const kodAlani = tip === 'kumas' ? 'kumas_kodu' : 'aksesuar_kodu';
        const kodDegeri = tip === 'kumas' ? temizVeri.kumas_kodu : temizVeri.aksesuar_kodu;

        const { data: mevcut } = await supabaseAdmin
            .from(tablo)
            .select('id')
            .eq(kodAlani, kodDegeri);

        if (mevcut && mevcut.length > 0) {
            return NextResponse.json(
                { hata: `Bu ${tip === 'kumas' ? 'kumaş' : 'aksesuar'} kodu zaten kayıtlı!` },
                { status: 409 }
            );
        }

        // 5. VERİTABANINA KAYDET
        const { data, error } = await supabaseAdmin.from(tablo).insert([temizVeri]).select();

        if (error) throw error;

        // 6. KARA KUTU LOG
        await supabaseAdmin.from('b0_sistem_loglari').insert([{
            tablo_adi: tablo,
            islem_tipi: 'EKLEME',
            kullanici_adi: 'Server API (Güvenli Ekleme)',
            eski_veri: { bilgi: `${kodDegeri} kodu ile yeni kayıt eklendi.` }
        }]).catch(() => { /* log hatası sistemi durdurmasın */ });

        return NextResponse.json({ basarili: true, kayit: data?.[0] }, { status: 201 });

    } catch (error) {
        console.error('[/api/kumas-ekle] Hata:', error.message);
        await hataBildir('/api/kumas-ekle', error);
        return NextResponse.json(
            { hata: 'Sunucu hatası: ' + error.message },
            { status: 500 }
        );
    }
}
