import { AjanRepository } from '@/repositories/AjanRepository';
import { telegramBildirim } from '@/lib/utils';

export class AjanService {
    constructor() {
        this.repository = new AjanRepository();
    }

    /**
     * KAMERA_GIZLI_EDGE tipindeki 2 DAKİKA IDLE senaryosunu işler
     */
    async processKameraGizliEdge({ kameraId, kameraAdi, sebep, image }) {
        // 1. Loglama (Repository Katmanı)
        try {
            await this.repository.logCameraEvent({
                kameraId,
                eventType: 'idle_alert',
                videoUrl: 'Edge AI Tarafından 2 Dakika Hareketsizlik Tespit Edildi'
            });
        } catch (dbErr) {
            console.warn('[AjanService] DB Loglaması başarısız ancak işleme devam ediliyor.', dbErr.message);
        }

        // 2. OpenAI Vision Analizi (Bussiness Logic)
        let aiSonucu = 'Görüntü iletilmedi veya hatalı.';
        if (image) {
            aiSonucu = await this.analyzeImageWithAI(image);
        }

        // 3. Telegram Analiz ve Fotoğraf Bildirimi
        const mesaj = `🚨 YAPAY ZEKA GÖZCÜ ALARMI\n\n📍 Konum: ${kameraAdi || 'Bilinmiyor'}\n⏱️ Durum: ${sebep.replace(/_/g, ' ')}\n⚠️ Uyarı: Bantta beklenen hareket gerçekleşmedi.\n\n🤖 AI Analizi (Vision):\n${aiSonucu}`;
        await this.sendTelegramNotification(mesaj, image);

        return aiSonucu; // Controller'a sadece analiz sonucunu döner
    }

    /**
     * OpenAI GPT-4o-Mini ile görüntü yorumlama
     */
    async analyzeImageWithAI(image) {
        const openAiKey = process.env.OPENAI_API_KEY;
        if (!openAiKey) {
            return 'OpenAI API Anahtarı eksik.';
        }

        try {
            // HATA 1 GİDERİLDİ: Çift Base64 öneki çakışması engellendi.
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
                                { type: 'text', text: 'Endüstriyel üretim bandı fotoğrafı. 2 dakikadır hareket algılanmadı. Lütfen sadece şu 2 soruya çok kısa, net Türkçe cevap ver: 1) Ortamda işçi var mı? 2) Olağandışı bir durum (kaza, bayılma, makine arızası vb.) gözüküyor mu? Özet/Süs istemiyorum, doğrudan analiz ver.' },
                                { type: 'image_url', image_url: { url: formattedImage } }
                            ]
                        }
                    ],
                    max_tokens: 150
                })
            });

            const aiData = await response.json();
            if (aiData.error) {
                return `OpenAI Hatası: ${aiData.error.message}`;
            }

            return aiData.choices[0].message.content.trim();
        } catch (aiErr) {
            return `AI Bağlantı Hatası: ${aiErr.message}`;
        }
    }

    /**
     * Telegram üzerinden Blob Buffer / Form-Data resmi fırlatma
     */
    async sendTelegramNotification(mesaj, image) {
        try {
            const tgToken = process.env.TELEGRAM_BOT_TOKEN;
            const tgOrta = process.env.TELEGRAM_CHAT_ID;

            // HATA 3 GİDERİLDİ: Doğrudan Fotoğraflı Kanıtlı (Proof) Telegram Gönderimi
            if (tgToken && tgOrta && image) {
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
                telegramBildirim(mesaj); // Fallback: Sadece metin at
            }
        } catch (tgDigerHata) {
            console.error('[AjanService] Telegram Fotoğraf Atma Hatası. Metne geçiş yapılıyor:', tgDigerHata.message);
            telegramBildirim(mesaj);
        }
    }
}
