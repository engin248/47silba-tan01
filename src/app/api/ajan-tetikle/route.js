import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';

// GVENLİK DZELTME: Hardcoded fallback key kaldırıldı — ENV yoksa boş string kalır, hibir istek eşleşmez.
const INTERNAL_API_KEY = (process.env.INTERNAL_API_KEY || '').replace(/[\r\n]+/g, '').trim();

if (!INTERNAL_API_KEY) {
    console.error('[AJAN-TETIKLE] KRİTİK: INTERNAL_API_KEY env değişkeni tanımlı değil! Tm istekler reddedilecek.');
}

export async function POST(request) {
    try {
        // 1. KK SEBEP (GVENLİK) ANALİZİ: İstek yetkili mi?
        const apiKey = request.headers.get('x-internal-api-key');
        if (apiKey !== INTERNAL_API_KEY) {
            console.error(`[AJAN-TETIKLE] HATA: Yetkisiz erişim denemesi (401).`);
            return NextResponse.json({ hata: 'Yetkisiz erişim. API Key geersiz.' }, { status: 401 });
        }

        // 2. PAYLOAD (GVDE) KONTROL
        const body = await request.json().catch(() => null);

        if (!body) {
            console.error('[AJAN-TETIKLE] HATA: Boş veya geersiz JSON payload (400).');
            return NextResponse.json({ hata: 'Geersiz veri formatı.' }, { status: 400 });
        }

        const { ajanTipi, kameraId, kameraAdi, sebep, image } = body;

        // 3. OPERASYONEL VERİ KONTROL
        if (ajanTipi === 'KAMERA_GIZLI_EDGE' && sebep === '2_DK_IDLE') {

            // HATA 2 GİDERİLDİ: Supabase hatası sessizce geilemez, konsola basılmalıdır.
            const { error: dbErr } = await supabase.from('camera_events').insert([{
                camera_id: kameraId || null,
                event_type: 'idle_alert',
                video_url: 'Edge AI Tarafından 2 Dakika Hareketsizlik Tespit Edildi',
            }]);

            if (dbErr) {
                console.error('[AJAN-TETIKLE] Supabase Log Hatası:', dbErr.message);
            }

            // --- OpenAI Vision Analizi ---
            let aiSonucu = 'Grnt iletilmedi veya hatalı.';
            if (image) {
                try {
                    const openAiKey = process.env.OPENAI_API_KEY;
                    if (!openAiKey) {
                        aiSonucu = 'OpenAI API Anahtarı eksik.';
                    } else {
                        // HATA 1 GİDERİLDİ: ift Base64 neki akışması engellendi.
                        const formattedImage = image.startsWith('data:image') ? image : `data:image/jpeg;base64,${image}`;

                        // HATA 4 GİDERİLDİ: OpenAI Key Regex \r\n temizliği
                        const response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${openAiKey.replace(/[\r\n]+/g, '').trim()}`
                            },
                            body: JSON.stringify({
                                model: 'gpt-4o-mini',
                                messages: [
                                    {
                                        role: 'user',
                                        content: [
                                            { type: 'text', text: 'Endstriyel retim bandı fotoğrafı. 2 dakikadır hareket algılanmadı. Ltfen sadece şu 2 soruya ok kısa, net Trke cevap ver: 1) Ortamda işi var mı? 2) Olağandışı bir durum (kaza, bayılma, makine arızası vb.) gzkyor mu? zet/Ss istemiyorum, doğrudan analiz ver.' },
                                            { type: 'image_url', image_url: { url: formattedImage } }
                                        ]
                                    }
                                ],
                                max_tokens: 150
                            })
                        });

                        const aiData = await response.json();
                        if (aiData.error) {
                            aiSonucu = `OpenAI Hatası: ${aiData.error.message}`;
                        } else {
                            aiSonucu = aiData.choices[0].message.content.trim();
                        }
                    }
                } catch (aiErr) {
                    aiSonucu = `AI Bağlantı Hatası: ${aiErr.message}`;
                }
            }

            let mesaj = `🚨 YAPAY ZEKA GZC ALARMI\n\n📍 Konum: ${kameraAdi || 'Bilinmiyor'}\n⏱️ Durum: ${sebep.replace(/_/g, ' ')}\n️ Uyarı: Bantta beklenen hareket gerekleşmedi.\n\n🤖 AI Analizi (Vision):\n${aiSonucu}`;

            // HATA 3 GİDERİLDİ: Doğrudan Fotoğraflı Kanıtlı (Proof) Telegram Gnderimi
            try {
                const tgToken = process.env.TELEGRAM_BOT_TOKEN;
                const tgOrta = process.env.TELEGRAM_CHAT_ID;

                if (tgToken && tgOrta && image) {
                    // Yalnızca base64 olan kısmı ayıkla
                    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
                    const buffer = Buffer.from(base64Data, 'base64');
                    const blob = new Blob([buffer], { type: 'image/jpeg' });

                    const formData = new FormData();
                    formData.append('chat_id', tgOrta.replace(/[\r\n]+/g, '').trim());
                    formData.append('caption', mesaj);
                    formData.append('photo', blob, 'alarm.jpg');

                    await fetch(`https://api.telegram.org/bot${tgToken.replace(/[\r\n]+/g, '').trim()}/sendPhoto`, {
                        method: 'POST',
                        body: formData
                    });
                } else {
                    telegramBildirim(mesaj); // Resim veya token yoksa sadece metin at fallback
                }
            } catch (tgDigerHata) {
                console.error('[AJAN-TETIKLE] Telegram Fotoğraf Atma Hatası. Metne geiş yapılıyor:', tgDigerHata.message);
                telegramBildirim(mesaj);
            }

            return NextResponse.json({
                durum: 'basarili',
                mesaj: 'Ajan bildirimi alındı, AI yorumladı ve işlendi.',
                analiz: aiSonucu
            }, { status: 200 });

        } else {

            return NextResponse.json({
                durum: 'reddedildi',
                mesaj: 'Tanımsız ajan tipi veya olay tetikleyicisi.',
                kod: 422
            }, { status: 422 });
        }

    } catch (error) {
        // 5. KK SEBEP TEMİZLİĞİ: Hata yakalama ve izole etme
        console.error('[AJAN-TETIKLE] CRITICAL SERVER ERROR:', error.message);
        return NextResponse.json({
            hata: 'Sunucu tarafında işlem sırasında kritik bir hata oluştu.',
            detay: error.message
        }, { status: 500 });
    }
}
