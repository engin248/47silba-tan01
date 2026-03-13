import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const MAX_ISTEK = 15;
const ZAMAN_ARALIGI_SN = 60;

// [AYR-02] Mesajın hangi kategoriye ait olduğunu belirle
function kategoriyiBelirle(mesaj) {
    const m = (mesaj || '').toLowerCase();
    if (m.includes('üretim') || m.includes('iş emri') || m.includes('kesim') || m.includes('uretim')) return 'bildirim_uretim';
    if (m.includes('stok') || m.includes('kritik stok') || m.includes('depo')) return 'bildirim_stok';
    if (m.includes('sipariş') || m.includes('siparis') || m.includes('teslim')) return 'bildirim_siparis';
    if (m.includes('personel') || m.includes('devamsizlik') || m.includes('maas') || m.includes('prim')) return 'bildirim_personel';
    return null;
}

export async function POST(request) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Bilinmeyen-IP';

        // Spam Zırhı
        const { data: dbKayit } = await supabase.from('b0_api_spam_kalkani').select('*').eq('ip_adresi', ip).single();
        let engellendi = false;
        if (dbKayit) {
            const farkSaniye = (new Date() - new Date(dbKayit.son_vurus_saati)) / 1000;
            if (farkSaniye < ZAMAN_ARALIGI_SN) {
                if (dbKayit.spam_sayaci >= MAX_ISTEK) engellendi = true;
                else await supabase.from('b0_api_spam_kalkani').update({ spam_sayaci: dbKayit.spam_sayaci + 1 }).eq('ip_adresi', ip);
            } else {
                await supabase.from('b0_api_spam_kalkani').update({ spam_sayaci: 1, son_vurus_saati: new Date().toISOString() }).eq('ip_adresi', ip);
            }
        } else {
            await supabase.from('b0_api_spam_kalkani').insert([{ ip_adresi: ip, spam_sayaci: 1 }]);
        }
        if (engellendi) {
            return NextResponse.json({ success: false, error: 'Telegram zirhi devrede. Cok fazla istek.' }, { status: 429 });
        }

        const body = await request.json();
        const { mesaj, chat_id, zorunlu } = body;

        // [AYR-02] Bildirim Tercihleri Filtresi
        if (!zorunlu) {
            try {
                const { data: ayarlarData } = await supabase.from('b1_sistem_ayarlari').select('deger').limit(1).maybeSingle();
                if (ayarlarData?.deger) {
                    const ayarlar = JSON.parse(ayarlarData.deger);
                    const kategori = kategoriyiBelirle(mesaj);
                    if (kategori && ayarlar[kategori] === false) {
                        return NextResponse.json({ success: false, engellendi: true, sebep: `${kategori} bildirimleri kullanici tarafindan kapatildi.` });
                    }
                }
            } catch { /* Ayarlar okunamazsa gonder */ }
        }

        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
        const TELEGRAM_CHAT_ID = (process.env.TELEGRAM_CHAT_ID || chat_id)?.trim();

        if (!TELEGRAM_BOT_TOKEN) {
            return NextResponse.json({ success: false, error: 'Telegram Bot Token ENV dosyasinda bulunamadi.' }, { status: 500 });
        }
        if (!TELEGRAM_CHAT_ID) {
            return NextResponse.json({ success: false, error: 'Chat ID eksik.' }, { status: 400 });
        }

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: mesaj, parse_mode: 'HTML' })
        });
        const data = await res.json();
        return NextResponse.json({ success: data.ok, data });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
