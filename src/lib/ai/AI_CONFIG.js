/**
 * /src/lib/ai/AI_CONFIG.js
 * [#22 FIX] Tek merkezi AI konfigürasyon dosyası.
 * Tüm AI çağrıları model versiyonu buradan almalı.
 * Model güncellemek için YALNIZCA bu dosyayı değiştir.
 */

export const AI_CONFIG = {
    // Ana model — Gemini 2.5 Flash (hız/maliyet dengesi)
    MAIN_MODEL: 'gemini-2.5-flash',

    // Vision model — görüntü analizi için
    VISION_MODEL: 'gemini-2.0-flash',

    // Fallback model — ana model çalışmazsa
    FALLBACK_MODEL: 'gemini-1.5-flash',

    // Zaman aşımları (ms)
    TIMEOUT_MS: {
        karar_motoru: 15000,   // aiKararMotoru.js
        vision: 20000,         // visionAjanCore.js
        yargic: 8000,          // yargic.js (VPS için)
    },

    // Rate limiting (dakikada max istek)
    RATE_LIMIT: {
        karar_motoru: 15,
    }
};
