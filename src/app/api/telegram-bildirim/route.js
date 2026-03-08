import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

// Supabase İstemcisi (Admin / Service Rolü Yoksa Anonim ile bağlanır, ama IP logu RLS ile açık yapıldı)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── KÖR NOKTA 2 (YENİDEN ONARILDI): API SPAM ZIRHI (Persistent DB Limiter) ───
// Serverless (Vercel) RAM temizlediği için Map() kullanılamazdı. Veritabanına alındı.
const MAX_ISTEK = 15; // 1 Dakikada Max 15 Telegram mesajı
const ZAMAN_ARALIGI_SN = 60; // 60 saniye

export async function POST(request) {
    try {
        // IP Tespiti (Vercel Node / Nginx vb)
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Bilinmeyen-IP';

        // Zırh Kontrolü (Veritabanına Sorgu)
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
            console.warn(`[KATI SİBER ZIRH] Spam Engellendi! IP: ${ip}`);
            return NextResponse.json({ success: false, error: 'Telegram zırhı devrede. Çok fazla istek attınız, lütfen en az 1 dakika bekleyin.' }, { status: 429 });
        }

        const body = await request.json();
        const { mesaj, chat_id } = body;

        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        // Eğer env dosyasında TELEGRAM_CHAT_ID yoksa, deneme amaçlı kendi ID'nizi veya Grubunuzun ID'sini girmelisiniz.
        // Şimdilik test için hatalı id'ye atmasını engellemek veya demo göstermek amaçlı varsayılan bir ID arayalım.
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || chat_id;

        if (!TELEGRAM_BOT_TOKEN) {
            return NextResponse.json({ success: false, error: 'Telegram Bot Token ENV dosyasında bulunamadı.' }, { status: 500 });
        }

        if (!TELEGRAM_CHAT_ID) {
            console.warn('Telegram Chat ID eksik! Mesaj gönderilmedi.');
            return NextResponse.json({ success: false, error: 'Chat ID eksik.' }, { status: 400 });
        }

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: mesaj,
                parse_mode: 'HTML'
            })
        });

        const data = await res.json();
        return NextResponse.json({ success: data.ok, data });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
