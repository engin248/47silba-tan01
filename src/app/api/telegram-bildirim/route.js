import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { supabaseAdmin } from '@/lib/supabaseAdmin';


=======
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co').trim();
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key').trim();
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
const MAX_ISTEK = 5;              // [C2-THROTTLE] Dakikada maksimum 5 mesaj
const ZAMAN_ARALIGI_SN = 60;
const DUPLICATE_BEKLEME_SN = 7200; // [C2-DUPLICATE] 2 saat içinde aynı alarm tekrar gitmesin

// [AYR-02] Mesajın hangi kategoriye ait olduğunu belirle
function kategoriyiBelirle(mesaj) {
    const m = (mesaj || '').toLowerCase();
    if (m.includes('üretim') || m.includes('iş emri') || m.includes('kesim') || m.includes('uretim')) return 'bildirim_uretim';
    if (m.includes('stok') || m.includes('kritik stok') || m.includes('depo')) return 'bildirim_stok';
    if (m.includes('sipariş') || m.includes('siparis') || m.includes('teslim')) return 'bildirim_siparis';
    if (m.includes('personel') || m.includes('devamsizlik') || m.includes('maas') || m.includes('prim')) return 'bildirim_personel';
    return null;
}

<<<<<<< HEAD
export async function GET() {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
    return NextResponse.json({
        success: true,
        durum: TELEGRAM_BOT_TOKEN ? 'yapilandirildi' : 'token_eksik',
        zaman: new Date().toISOString(),
    });
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        status: 200,
        headers: {
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function POST(request) {
    try {
        // G3 FIX (Müfettiş 19.03.2026): Internal API Key Auth Zırhı eklendi.
        // Bu endpoint'e sadece kendi sistemimiz erişebilir, dışarıdan spam engellendi.
        const authHeader = request.headers.get('authorization') || '';
        const internalKey = process.env.INTERNAL_API_KEY || process.env.CRON_SECRET || '';
        if (internalKey && authHeader !== `Bearer ${internalKey}`) {
            return NextResponse.json({ success: false, error: 'YETKİSİZ ERİŞİM!' }, { status: 403 });
        }

        const ipFallback = 'Anonim-' + Math.random().toString(36).substring(2, 9);
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ipFallback;

        // Spam Zırhı Kök Çözümü (maybeSingle & Error Handling eklendi)
        const { data: dbKayit, error: dbError } = await supabaseAdmin.from('b0_api_spam_kalkani').select('*').eq('ip_adresi', ip).maybeSingle();

        // EĞER tablo yoksa, yetki yoksa veya Supabase çöktüyse sessizce devam etmek yerine bunu durdur
        if (dbError) throw new Error("Spam Kalkanı DB Hatası: " + dbError.message);

=======
export async function POST(request) {
    // ── [C5] AUTH KATMANI ──────────────────────────────────────────────
    // Sunucu-sunucu çağrılar x-internal-key header'ı ile doğrulanır.
    // Browser çağrıları (ErrorBoundary, UI) header göndermez → spam shield devam eder.
    const gelenKey = request.headers.get('x-internal-key');
    if (gelenKey !== null && gelenKey !== undefined) {
        const sunucuKey = (process.env.INTERNAL_API_KEY || '').replace(/[\r\n'"]/g, '').trim();
        if (!sunucuKey || gelenKey !== sunucuKey) {
            return NextResponse.json({ error: 'Yetkisiz: geçersiz internal key.' }, { status: 401 });
        }
    }
    // ─────────────────────────────────────────────────────────────────────

    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Bilinmeyen-IP';

        // Spam Zırhı
        const { data: dbKayit } = await supabase.from('b0_api_spam_kalkani').select('*').eq('ip_adresi', ip).single();
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        let engellendi = false;
        if (dbKayit) {
            const farkSaniye = (new Date().getTime() - new Date(dbKayit.son_vurus_saati).getTime()) / 1000;
            if (farkSaniye < ZAMAN_ARALIGI_SN) {
<<<<<<< HEAD
                if (dbKayit.spam_sayaci >= MAX_ISTEK) {
                    engellendi = true;
                } else {
                    const { error: updErr } = await supabaseAdmin.from('b0_api_spam_kalkani').update({ spam_sayaci: dbKayit.spam_sayaci + 1 }).eq('ip_adresi', ip);
                    if (updErr) console.error("Spam Update Error:", updErr.message);
                }
            } else {
                const { error: updErr2 } = await supabaseAdmin.from('b0_api_spam_kalkani').update({ spam_sayaci: 1, son_vurus_saati: new Date().toISOString() }).eq('ip_adresi', ip);
                if (updErr2) console.error("Spam Reset Error:", updErr2.message);
            }
        } else {
            const { error: insErr } = await supabaseAdmin.from('b0_api_spam_kalkani').insert([{ ip_adresi: ip, spam_sayaci: 1 }]);
            if (insErr) console.error("Spam Insert Error:", insErr.message);
=======
                if (dbKayit.spam_sayaci >= MAX_ISTEK) engellendi = true;
                else await supabase.from('b0_api_spam_kalkani').update({ spam_sayaci: dbKayit.spam_sayaci + 1 }).eq('ip_adresi', ip);
            } else {
                await supabase.from('b0_api_spam_kalkani').update({ spam_sayaci: 1, son_vurus_saati: new Date().toISOString() }).eq('ip_adresi', ip);
            }
        } else {
            await supabase.from('b0_api_spam_kalkani').insert([{ ip_adresi: ip, spam_sayaci: 1 }]);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        }
        if (engellendi) {
            return NextResponse.json({ success: false, error: 'Telegram zirhi devrede. Cok fazla istek.' }, { status: 429 });
        }

        // [C2-DUPLICATE] Aynı mesajın 2 saat içinde tekrar gidişini engelle
        const body_raw = await request.clone().json().catch(() => ({}));
        const mesajOnizleme = (body_raw?.mesaj || '').substring(0, 80);
        if (mesajOnizleme) {
            let dupCheck = null;
            try {
<<<<<<< HEAD
                const { data } = await supabaseAdmin
=======
                const { data } = await supabase
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                    .from('b0_api_spam_kalkani')
                    .select('son_vurus_saati, son_mesaj_ozeti')
                    .eq('son_mesaj_ozeti', mesajOnizleme)
                    .single();
                dupCheck = data;
<<<<<<< HEAD
            } catch (dupErr) { console.error('[TELEGRAM DUP-CHECK HATASI]', dupErr?.message); /* Duplicate check fail - yine de gonder */ }

            if (dupCheck) {
                const gecenSn = (new Date().getTime() - new Date(dupCheck.son_vurus_saati).getTime()) / 1000;
=======
            } catch { /* duplicate kaydı yoksa sessiz geç */ }
            if (dupCheck) {
                const gecenSn = (Date.now() - new Date(dupCheck.son_vurus_saati).getTime()) / 1000;
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                if (gecenSn < DUPLICATE_BEKLEME_SN) {
                    return NextResponse.json({ success: false, engellendi: true, sebep: `Duplicate koruma: Bu alarm ${Math.round((DUPLICATE_BEKLEME_SN - gecenSn) / 60)} dakika sonra tekrar gönderilebilir.` });
                }
            }
            // Yeni gönderimde özeti kaydet
<<<<<<< HEAD
            await supabaseAdmin.from('b0_api_spam_kalkani').upsert([{ ip_adresi: `msg_hash_${mesajOnizleme.replace(/\s/g, '')}`, spam_sayaci: 1, son_vurus_saati: new Date().toISOString(), son_mesaj_ozeti: mesajOnizleme }], { onConflict: 'ip_adresi' });
=======
            await supabase.from('b0_api_spam_kalkani').upsert([{ ip_adresi: `msg_hash_${mesajOnizleme.replace(/\s/g, '')}`, spam_sayaci: 1, son_vurus_saati: new Date().toISOString(), son_mesaj_ozeti: mesajOnizleme }], { onConflict: 'ip_adresi' });
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        }

        const body = await request.json();
        const { mesaj, chat_id, zorunlu } = body;

        // [AYR-02] Bildirim Tercihleri Filtresi
        if (!zorunlu) {
            try {
<<<<<<< HEAD
                const { data: ayarlarData } = await supabaseAdmin.from('b1_sistem_ayarlari').select('deger').limit(1).maybeSingle();
=======
                const { data: ayarlarData } = await supabase.from('b1_sistem_ayarlari').select('deger').limit(1).maybeSingle();
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
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
<<<<<<< HEAD

        let veri = {};
        try { veri = await res.json(); } catch { /* ignore */ }

        return NextResponse.json({ success: res.ok, data: veri }, { status: res.ok ? 200 : 500 });
=======
        const data = await res.json();
        return NextResponse.json({ success: data.ok, data });
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
