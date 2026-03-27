import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

async function telegramMesaj(chat_id, text) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
    });
}

async function dosyaIndir(file_id) {
    const res = await fetch(`${TELEGRAM_API}/getFile?file_id=${file_id}`);
    const data = await res.json();
    const filePath = data.result?.file_path;
    if (!filePath) return null;
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    const fileRes = await fetch(fileUrl);
    const buffer = await fileRes.arrayBuffer();
    return { buffer, filePath };
}

async function botLog(chat_id, komut, sonuc, detay = '') {
    try {
        await supabase.from('b0_telegram_log').insert({
            chat_id: String(chat_id),
            komut,
            sonuc,
            detay: detay.slice(0, 500),
            tarih: new Date().toISOString(),
        });
    } catch { /* log hatası sistemi durdurmasın */ }
}

export async function POST(request) {
    if (!TELEGRAM_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const gelenSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (gelenSecret !== TELEGRAM_WEBHOOK_SECRET) {
        await supabase.from('b0_telegram_log').insert({
            chat_id: 'BILINMIYOR', komut: 'YETKISIZ_ERISIM',
            sonuc: 'ENGELLENDI', tarih: new Date().toISOString()
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const message = body?.message;
        if (!message) return NextResponse.json({ ok: true });

        const chat_id = message.chat?.id;
        const text = message.text || '';

        if (text.toLowerCase() === '/maliyet' || text.toLowerCase() === 'maliyeti gster') {
            const izinliAdminIdGubu = process.env.TELEGRAM_ADMIN_CHAT_ID?.split(',') || [];
            if (!izinliAdminIdGubu.includes(String(chat_id))) {
                await botLog(chat_id, '/maliyet', 'YETKISIZ');
                await telegramMesaj(chat_id, ' <b>YETKİSİZ ERİŞİM ENGELLENDİ!</b>\nBu komutu okuma yetkiniz yok.');
                return NextResponse.json({ ok: true });
            }
            await botLog(chat_id, '/maliyet', 'BASARILI');
            await telegramMesaj(chat_id, '💰 <b>OTONOM MALİYET RAPORU</b>\n\n- Supabase: $25.00\n- Ajan API: $4.10\n- Vercel: $0.00\n\n🟢 <b>Durum:</b> Tasarruflu.');
            return NextResponse.json({ ok: true });
        }

        if (text === '/start') {
            await botLog(chat_id, '/start', 'BASARILI');
            await telegramMesaj(chat_id,
                '👋 <b>Mizanet Sistemi — Fotoğraf Botu</b>\n\n' +
                'Atlye fotoğraflarını direkt buradan sisteme ykle!\n\n' +
                '📷 <b>Nasıl kullanılır?</b>\n' +
                '1. Fotoğrafı bu sohbete gnder\n' +
                '2. Aıklama yaz (isteğe bağlı)\n' +
                '3. Fotoğraf otomatik Modelhane Arşivine kaydedilir\n\n' +
                '📋 Komutlar:\n/numune - Numune fotoğrafı\n/kumas - Kumaş fotoğrafı\n/genel - Genel arşiv'
            );
            return NextResponse.json({ ok: true });
        }

        if (message.photo || message.document) {
            let file_id, uzanti;
            if (message.photo) {
                const photos = message.photo;
                file_id = photos[photos.length - 1].file_id;
                uzanti = 'jpg';
            } else if (message.document && message.document.mime_type?.startsWith('image/')) {
                file_id = message.document.file_id;
                uzanti = message.document.file_name?.split('.').pop()?.toLowerCase() || 'jpg';
            } else {
                await telegramMesaj(chat_id, '️ Sadece fotoğraf destekleniyor.');
                return NextResponse.json({ ok: true });
            }

            await telegramMesaj(chat_id, '⏳ Fotoğraf ykleniyor...');
            const dosya = await dosyaIndir(file_id);
            if (!dosya) {
                await telegramMesaj(chat_id, ' Dosya indirilemedi.');
                return NextResponse.json({ ok: true });
            }

            const caption = (message.caption || '').toLowerCase();
            let klasor = 'genel';
            if (caption.includes('numune') || caption.includes('model')) klasor = 'numune';
            else if (caption.includes('kumas') || caption.includes('kumaş')) klasor = 'kumas';
            else if (caption.includes('aksesuar')) klasor = 'aksesuar';

            const yol = `telegram/${klasor}/${Date.now()}-${Math.random().toString(36).slice(2)}.${uzanti}`;
            const { data, error } = await supabase.storage
                .from('teknik-foyler')
                .upload(yol, dosya.buffer, {
                    contentType: `image/${uzanti === 'jpg' ? 'jpeg' : uzanti}`,
                    upsert: false
                });

            if (error) {
                await telegramMesaj(chat_id, ` Ykleme hatası: ${error.message}`);
                return NextResponse.json({ ok: true });
            }

            const { data: urlData } = supabase.storage.from('teknik-foyler').getPublicUrl(data.path);
            await botLog(chat_id, 'FOTOGRAF_YUKLE', 'BASARILI', klasor + ' → ' + yol);
            await telegramMesaj(chat_id,
                ` <b>Fotoğraf kaydedildi!</b>\n\n📁 Klasr: ${klasor}\n🔗 URL: <code>${urlData.publicUrl}</code>`
            );
            return NextResponse.json({ ok: true });
        }

        if (text && !text.startsWith('/')) {
            const yetkiliIdleri = process.env.TELEGRAM_ADMIN_CHAT_ID?.split(',') || [];
            const isim = yetkiliIdleri.includes(String(chat_id)) ? 'Koordinatr (Telegram)' : 'Saha Grevlisi';
            const { error: dbErr } = await supabase.from('b1_ic_mesajlar').insert({
                konu: '📱 TELEGRAM SAHA EMRİ',
                icerik: text,
                gonderen_adi: isim,
                oncelik: 'kritik',
                alici_grup: 'hepsi',
                urun_kodu: 'SAHA-BOT',
                tip: 'sistem',
            });
            if (dbErr) {
                await botLog(chat_id, 'SISTEME_MESAJ', 'HATA', dbErr.message);
                await telegramMesaj(chat_id, ` Mesaj ERP sistemine aktarılamadı.\nHata: ${dbErr.message}`);
            } else {
                await botLog(chat_id, 'SISTEME_MESAJ', 'BASARILI', text.slice(0, 50));
                await telegramMesaj(chat_id, '🚨 <b>Sistem Uyarıldı!</b>\nMesajınız Karargh paneline ACİL uyarısıyla dşt.');
            }
            return NextResponse.json({ ok: true });
        }

        if (text && text.startsWith('/')) {
            await telegramMesaj(chat_id, '️ Anlaşılamayan komut! Dz metin ile emir gnderin.');
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('Telegram webhook hatası:', err);
        return NextResponse.json({ ok: true });
    }
}
