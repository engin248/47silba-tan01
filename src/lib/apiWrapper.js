/**
 * src/lib/apiWrapper.js — API Route Merkezi Hata Yakalama
 *
 * Tüm API route'lar için standardize edilmiş hata yakalama wrapper'ı.
 * Sessiz hata bastırmayı engelleyerek her API hatasının raporlanmasını sağlar.
 *
 * Kullanım:
 *   import { apiHandler } from '@/lib/apiWrapper';
 *
 *   export const POST = apiHandler(async (request) => {
 *       // İş mantığı burada
 *       return NextResponse.json({ basarili: true });
 *   });
 */
import { NextResponse } from 'next/server';
import { hataBildir } from './hataBildirim';

/**
 * API route handler'ını merkezi hata yakalama ile sarar.
 * @param {Function} handler - API route handler fonksiyonu
 * @param {object} [options] - Opsiyonel konfigürasyon
 * @param {string} [options.modul] - Modül adı (hata raporlama için)
 * @returns {Function} Sarılmış handler
 */
export function apiHandler(handler, options = {}) {
    return async (request, context) => {
        const modulAdi = options.modul || new URL(request.url).pathname;
        try {
            return await handler(request, context);
        } catch (error) {
            // 1. Console'a logla — her zaman
            console.error(`[API HATA] ${modulAdi}:`, error?.message || error);

            // 2. Telegram'a bildir — fire-and-forget
            try {
                const ip = request.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || 'bilinmeyen';
                await hataBildir(modulAdi, error, `IP: ${ip}`);
            } catch (bildirimHata) {
                console.error('[API-WRAPPER] Hata bildirimi gönderilemedi:', bildirimHata?.message);
            }

            // 3. Kullanıcıya güvenli hata yanıtı dön
            return NextResponse.json(
                {
                    hata: 'Sunucu hatası oluştu. Lütfen tekrar deneyin.',
                    ref: Date.now().toString(36).toUpperCase(),
                },
                { status: 500 }
            );
        }
    };
}

/**
 * GET handler wrapper — apiHandler'ın GET versiyonu
 */
export function apiGetHandler(handler, options = {}) {
    return apiHandler(handler, options);
}

/**
 * POST handler wrapper — apiHandler'ın POST versiyonu
 */
export function apiPostHandler(handler, options = {}) {
    return apiHandler(handler, options);
}
