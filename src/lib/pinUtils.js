// ============================================================
// MİZANET — PIN YARDIMCI FONKSİYONLARI
// Dosya: src/lib/pinUtils.js
//
// AMAÇ: 6+ dosyada tekrarlanan PIN kontrol kalıbı burada.
// Tek güncelleme noktası — tüm sistem güncellenir.
// ============================================================

import { logCatch } from './errorCore';

const PIN_KEY = 'sb47_uretim_pin';

/**
 * Session'dan PIN durumunu kontrol eder.
 * Eski tekrarlanan kalıp:
 *   try { pin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); }
 *   catch { pin = !!sessionStorage.getItem('sb47_uretim_pin'); }
 *
 * @returns {boolean} PIN mevcut mu
 */
export function getPinDurumu() {
    if (typeof window === 'undefined') return false;
    try {
        return !!atob(sessionStorage.getItem(PIN_KEY) || '');
    } catch (e) {
        logCatch('pinUtils.getPinDurumu', e);
        return !!sessionStorage.getItem(PIN_KEY);
    }
}

/**
 * PIN değerini session'a yazar.
 * @param {string} pin
 */
export function setPinDurumu(pin) {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(PIN_KEY, btoa(pin));
    } catch (e) {
        logCatch('pinUtils.setPinDurumu', e);
        sessionStorage.setItem(PIN_KEY, pin);
    }
}

/**
 * PIN'i siler.
 */
export function temizlePin() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(PIN_KEY);
}
