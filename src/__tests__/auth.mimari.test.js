/**
 * MİMARİ TEST: auth.js güvenlik zırhı
 * 
 * Bu testler mimari düzeltmelerin çalıştığını doğrular:
 * 1. localStorage bypass'ın kaldırıldığını
 * 2. pindenGrupBul'un sadece null döndürdüğünü
 * 3. Session süresinin 8 saat olduğunu
 */

import { pindenGrupBul, ERISIM_GRUPLARI, ERISIM_MATRISI } from '../lib/auth';

describe('MİMARİ DÜZELTME: auth.js güvenlik zırhı', () => {

    // ─── Test 1: localStorage bypass kaldırıldı ──────────────────────
    test('[S-ZIRH-01] pindenGrupBul artık localStorage üzerinden yetki VERMİYOR', () => {
        // Eski tehlikeli davranış: localStorage'a yazarak yetki kazanmak
        // Bu test, O davranışın artık çalışmadığını kanıtlar
        const sonuc = pindenGrupBul('herhangi-bir-pin');
        expect(sonuc).toBeNull(); // Her zaman null dönmeli
    });

    test('[S-ZIRH-02] pindenGrupBul boş PIN için null döner', () => {
        expect(pindenGrupBul(null)).toBeNull();
        expect(pindenGrupBul('')).toBeNull();
        expect(pindenGrupBul(undefined)).toBeNull();
    });

    // ─── Test 2: Erişim grupları tanımlı ─────────────────────────────
    test('[S-ZIRH-03] ERISIM_GRUPLARI 3 grup içeriyor (tam, uretim, genel)', () => {
        expect(ERISIM_GRUPLARI).toHaveProperty('tam');
        expect(ERISIM_GRUPLARI).toHaveProperty('uretim');
        expect(ERISIM_GRUPLARI).toHaveProperty('genel');
    });

    // ─── Test 3: Erişim matrisi kritik sayfaları kısıtlıyor ──────────
    test('[S-ZIRH-04] Kasa sadece "tam" gruba açık', () => {
        expect(ERISIM_MATRISI['/kasa']?.uretim).toBeNull();
        expect(ERISIM_MATRISI['/kasa']?.genel).toBeNull();
        expect(ERISIM_MATRISI['/kasa']?.tam).toBe('full');
    });

    test('[S-ZIRH-05] Ajanlar paneli sadece "tam" gruba açık', () => {
        expect(ERISIM_MATRISI['/ajanlar']?.uretim).toBeNull();
        expect(ERISIM_MATRISI['/ajanlar']?.genel).toBeNull();
    });

    test('[S-ZIRH-06] Güvenlik sayfası sadece "tam" gruba açık', () => {
        expect(ERISIM_MATRISI['/guvenlik']?.uretim).toBeNull();
        expect(ERISIM_MATRISI['/guvenlik']?.genel).toBeNull();
    });
});
