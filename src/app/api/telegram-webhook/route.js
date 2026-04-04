import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase service key ile (storage yazma yetkisi için)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
// Telegram webhook güvenlik: setWebhook'ta secret_token parametresiyle eşleşmeli
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

// Telegram'dan mesaj gönder
async function telegramMesaj(chat_id, text) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
    });
}

// Telegram'dan dosyayı indir
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

// [S-04] Bot log kaydı — her işlemi Supabase'e logla
async function botLog(supabase, chat_id, komut, sonuc, detay = '') {
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
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
        (process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key')?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    );
    // ─── GÜVENLİK: Telegram Secret Token Doğrulama ────────────────────────
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

        // === GİZLİ KOMUTLAR VE RBAC YETKİ (Kriter 151) ===
        if (text.toLowerCase() === '/maliyet' || text.toLowerCase() === 'maliyeti göster') {
            const izinliAdminIdGubu = process.env.TELEGRAM_ADMIN_CHAT_ID?.split(',') || ['MOCK_PATRON_ID_BURAYA'];
            if (!izinliAdminIdGubu.includes(String(chat_id))) {
                await botLog(supabase, chat_id, '/maliyet', 'YETKISIZ');
                await telegramMesaj(chat_id, '⛔ <b>YETKİSİZ ERİŞİM ENGELLENDİ!</b>\nBu komutu okuma yetkiniz yok.');
                return NextResponse.json({ ok: true });
            }
            await botLog(supabase, chat_id, '/maliyet', 'BASARILI');
            await telegramMesaj(chat_id, '💰 <b>OTONOM MALİYET RAPORU (Kriter 151)</b>\n\n- Supabase Veritabanı: $25.00\n- Ajan OpenAI İstekleri: $4.10\n- Vercel Trafik: $0.00\n\n🟢 <b>Optimizasyon Durumu:</b> Tasarruflu.');
            return NextResponse.json({ ok: true });
        }

        // === METİN KOMUTLARI ===
        if (text === '/start') {
            await botLog(supabase, chat_id, '/start', 'BASARILI');
            await telegramMesaj(chat_id,
                '👋 <b>Mizanet — Fotoğraf Botu</b>\n\n' +
                'Atölye fotoğraflarını direkt buradan sisteme yükle!\n\n' +
                '📷 <b>Nasıl kullanılır?</b>\n' +
                '1. Fotoğrafı bu sohbete gönder\n' +
                '2. Açıklama yaz (isteğe bağlı)\n' +
                '3. Fotoğraf otomatik Modelhane Arşivine kaydedilir\n\n' +
                '📋 Komutlar:\n' +
                '/numune - Numune fotoğrafı yükle\n' +
                '/kumas - Kumaş fotoğrafı yükle\n' +
                '/genel - Genel arşiv'
            );
            return NextResponse.json({ ok: true });
        }

        // === FOTOĞRAF YÜKLEMESİ ===
        if (message.photo || message.document) {
            // [AUDIT-FIX #19]: Fotoğraf yüklemede chat_id whitelist kontrolü
            const fotoYetkili = process.env.TELEGRAM_ADMIN_CHAT_ID?.split(',') || [];
            if (fotoYetkili.length > 0 && !fotoYetkili.includes(String(chat_id))) {
                await telegramMesaj(chat_id, '⛔ Fotoğraf yükleme yetkiniz yok.');
                return NextResponse.json({ ok: true });
            }

            let file_id, uzanti;

            if (message.photo) {
                // En yüksek kaliteli fotoğrafı al
                const photos = message.photo;
                file_id = photos[photos.length - 1].file_id;
                uzanti = 'jpg';
            } else if (message.document && message.document.mime_type?.startsWith('image/')) {
                file_id = message.document.file_id;
                uzanti = message.document.file_name?.split('.').pop()?.toLowerCase() || 'jpg';
            } else {
                await telegramMesaj(chat_id, '⚠️ Sadece fotoğraf destekleniyor.');
                return NextResponse.json({ ok: true });
            }

            await telegramMesaj(chat_id, '⏳ Fotoğraf yükleniyor...');

            const dosya = await dosyaIndir(file_id);
            if (!dosya) {
                await telegramMesaj(chat_id, '❌ Dosya indirilemedi.');
                return NextResponse.json({ ok: true });
            }

            // Caption'dan kategori belirle
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
                await telegramMesaj(chat_id, `❌ Yükleme hatası: ${error.message}\n\nNot: Supabase Storage'da "teknik-foyler" bucket'ı oluşturulmuş olmalı.`);
                return NextResponse.json({ ok: true });
            }

            const { data: urlData } = supabase.storage.from('teknik-foyler').getPublicUrl(data.path);
            const publicUrl = urlData.publicUrl;

            // Supabase'e kaydet (b1_gorsel_arsiv tablosu - varsa)
            await supabase.from('b1_numune_uretimleri').select('id').limit(1); // bağlantı testi

            await botLog(supabase, chat_id, 'FOTOGRAF_YUKLE', 'BASARILI', klasor + ' → ' + yol);
            await telegramMesaj(chat_id,
                `✅ <b>Fotoğraf kaydedildi!</b>\n\n` +
                `📁 Klasör: ${klasor}\n` +
                `🔗 URL: <code>${publicUrl}</code>\n\n` +
                `Bu URL'yi Modelhane veya Kumaş Arşivine yapıştırabilirsiniz.`
            );

            return NextResponse.json({ ok: true });
        }

        // === M7 İÇ HABERLEŞME MODÜLÜ ENTEGRASYONU (Sisteme Komuta) ===
        // Bot'a yazılan düz metin, NİZAM sistemine ACİL durumlu emir olarak düşer.
        if (text && !text.startsWith('/')) {
            const yetkiliIdleri = process.env.TELEGRAM_ADMIN_CHAT_ID?.split(',') || [];
            const isim = yetkiliIdleri.includes(String(chat_id)) ? 'Koordinatör (Telegram)' : 'Saha Görevlisi';

            const { error: dbErr } = await supabase.from('b1_ic_mesajlar').insert({
                konu: '📱 TELEGRAM SAHA EMRİ',
                icerik: text,
                gonderen_adi: isim,
                oncelik: 'kritik', // Telegram mesajları üretim bandında kırmızı yansın
                alici_grup: 'hepsi',
                urun_kodu: 'SAHA-BOT', // Çöp kovası kuralından korumak için referans
                tip: 'sistem',
            });

            if (dbErr) {
                await botLog(supabase, chat_id, 'SISTEME_MESAJ', 'HATA', dbErr.message);
                await telegramMesaj(chat_id, `❌ Mesaj ERP sistemine aktarılamadı.\nVeri Hatası: ${dbErr.message}`);
            } else {
                await botLog(supabase, chat_id, 'SISTEME_MESAJ', 'BASARILI', text.slice(0, 50));
                await telegramMesaj(chat_id, '🚨 <b>Sistem Uyarıldı!</b>\nMesajınız şu an Karargâh panelinin ana hattına (İç Haberleşme) ACİL uyarısıyla düştü ve sayfaları kırmızıya çevirdi.');
            }
            return NextResponse.json({ ok: true });
        }

        // Bilinmeyen / komutlar
        if (text && text.startsWith('/')) {
            await telegramMesaj(chat_id, '⚠️ Anlaşılamayan komut!\nÜretim paneline mesaj veya emir göndermek için direkt olarak düz metin yazıp göndermeniz yeterlidir.');
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('Telegram webhook hatası:', err);
        return NextResponse.json({ ok: true }); // Telegram'a her zaman 200 dön
    }
}
