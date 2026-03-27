import { NextResponse } from 'next/server';
import { AjanService } from '@/services/AjanService';

// GÜVENLİK DÜZELTME: Hardcoded fallback key kaldırıldı — ENV yoksa boş string kalır, hiçbir istek eşleşmez.
const INTERNAL_API_KEY = (process.env.INTERNAL_API_KEY || '').replace(/[\r\n]+/g, '').trim();

if (!INTERNAL_API_KEY) {
    console.error('[AJAN-TETIKLE] KRİTİK: INTERNAL_API_KEY env değişkeni tanımlı değil! Tüm istekler reddedilecek.');
}

// Controller Katmanı (Service çağırımı için örneklem)
const ajanService = new AjanService();

export async function POST(request) {
    try {
        // 1. KİMLİK SEBEP (GÜVENLİK) ANALİZİ: İstek yetkili mi?
        const apiKey = request.headers.get('x-internal-api-key');
        if (apiKey !== INTERNAL_API_KEY) {
            console.error(`[AJAN-TETIKLE] HATA: Yetkisiz erişim denemesi (401).`);
            return NextResponse.json({ hata: 'Yetkisiz erişim. API Key geçersiz.' }, { status: 401 });
        }

        // 2. PAYLOAD (GÖVDE) KONTROL
        const body = await request.json().catch(() => null);

        if (!body) {
            console.error('[AJAN-TETIKLE] HATA: Boş veya geçersiz JSON payload (400).');
            return NextResponse.json({ hata: 'Geçersiz veri formatı.' }, { status: 400 });
        }

        const { ajanTipi, kameraId, kameraAdi, sebep, image } = body;

        // 3. İŞ MANTIĞINA (SERVICE PATTERN) BÖLME
        if (ajanTipi === 'KAMERA_GIZLI_EDGE' && sebep === '2_DK_IDLE') {

            // AI, Telegram ve Loglama işlemleri artık Servis (Business Katmanı) tarafından izole yönetilir
            const aiSonucu = await ajanService.processKameraGizliEdge({ kameraId, kameraAdi, sebep, image });

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
        // 5. KÖK SEBEP TEMİZLİĞİ: Hata yakalama ve izole etme
        console.error('[AJAN-TETIKLE] CRITICAL SERVER ERROR:', error.message);
        return NextResponse.json({
            hata: 'Sunucu tarafında işlem sırasında kritik bir hata oluştu.',
            detay: error.message
        }, { status: 500 });
    }
}
