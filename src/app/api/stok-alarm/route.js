// src/app/api/stok-alarm/route.js
// [A-06] Stok Kritik Uyarı Sistemi + Telegram Entegrasyonu
import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
=======
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'),
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key')
);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

const STOK_ESIGI = 5;   // Minimum stok adedi eşiği

export async function GET(request) {
    try {
        // Kritik stok altındakileri bul
        const { data: kritikUrunler, error } = await supabase
            .from('b2_urun_katalogu')
<<<<<<< HEAD
            .select('id, urun_adi, urun_kodu, stok_adeti')
            .lt('stok_adeti', STOK_ESIGI)
            .order('stok_adeti', { ascending: true })
=======
            .select('id, urun_adi, urun_kodu, stok_adedi, kategori')
            .lt('stok_adedi', STOK_ESIGI)
            .order('stok_adedi', { ascending: true })
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            .limit(50);

        if (error) throw error;

        return NextResponse.json({
            kritik: kritikUrunler || [],
            sayac: kritikUrunler?.length || 0,
            esik: STOK_ESIGI,
            tarih: new Date().toISOString(),
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const manuel = body.manuel === true;

        // Kritik stok altındakileri bul
        const { data: kritikUrunler, error } = await supabase
            .from('b2_urun_katalogu')
<<<<<<< HEAD
            .select('id, urun_adi, urun_kodu, stok_adeti')
            .lt('stok_adeti', STOK_ESIGI)
            .order('stok_adeti', { ascending: true })
=======
            .select('id, urun_adi, urun_kodu, stok_adedi, kategori')
            .lt('stok_adedi', STOK_ESIGI)
            .order('stok_adedi', { ascending: true })
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            .limit(20);

        if (error) throw error;

        if (!kritikUrunler || kritikUrunler.length === 0) {
            return NextResponse.json({ mesaj: 'Kritik stok yok.', gonderildi: false });
        }

        // Telegram mesajı oluştur
        const satirlar = kritikUrunler.map(u =>
<<<<<<< HEAD
            `  • ${u.urun_adi} (${u.urun_kodu || '—'}): ${u.stok_adeti} adet`
=======
            `  • ${u.urun_adi} (${u.urun_kodu || '—'}): ${u.stok_adedi} adet`
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        ).join('\n');

        const mesaj = `⚠️ KRİTİK STOK UYARISI\n${new Date().toLocaleString('tr-TR')}\n\n${kritikUrunler.length} ürün kritik stok altında:\n${satirlar}\n\n📦 Hemen tedarik başlatın!`;

        // Telegram bildirim gönder
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        let telegramOk = false;
        if (telegramToken && chatId) {
            const tRes = await fetch(
                `https://api.telegram.org/bot${telegramToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: mesaj,
                        parse_mode: 'HTML',
                    }),
                    signal: AbortSignal.timeout(8000),
                }
            ).catch(() => null);
            telegramOk = tRes?.ok || false;
        }

<<<<<<< HEAD
        try {
            await supabase.from('b0_sistem_loglari').insert([{
                tablo_adi: 'b2_urun_katalogu',
                islem_tipi: 'STOK_ALARM',
                kullanici_adi: 'sistem',
                eski_veri: { kritik_urun_sayisi: kritikUrunler.length, manuel, telegram: telegramOk },
            }]);
        } catch (logHata) { /* log hatası sistemi durdurmasın */ }
=======
        // Log yaz
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: 'b2_urun_katalogu',
            islem_tipi: 'STOK_ALARM',
            kullanici_adi: 'sistem',
            eski_veri: { kritik_urun_sayisi: kritikUrunler.length, manuel, telegram: telegramOk },
        }]).catch(() => null);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

        return NextResponse.json({
            kritik: kritikUrunler,
            sayac: kritikUrunler.length,
            telegram: telegramOk,
            mesaj: telegramOk ? '✅ Telegram bildirimi gönderildi' : '📊 Rapor hazır (Telegram token eksik)',
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
