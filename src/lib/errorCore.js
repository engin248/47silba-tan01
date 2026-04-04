// ============================================================
// MİZANET — MERKEZİ HATA YÖNETİM ÇEKİRDEĞİ
// Dosya: src/lib/errorCore.js
//
// AMAÇ: Tüm catch bloklarından çağrılır.
// Hiçbir hata sessizce yutulmaz.
// ============================================================

/**
 * Merkezi hata yakalayıcı.
 * Her catch bloğunda çağrılmalı. Hata bilgisini:
 * - console.error ile yazar (her zaman)
 * - Sentry'ye gönderir (production'da)
 * - Supabase log tablosuna yazar (opsiyonel)
 *
 * @param {string} kaynak - Hatanın oluştuğu dosya/fonksiyon adı (ör: 'KarargahMainContainer.veriCek')
 * @param {any} hata - Yakalanan hata objesi
 * @param {'dusuk'|'orta'|'yuksek'|'kritik'} seviye - Hata seviyesi
 * @param {object} [ekVeri] - Ek bağlam bilgisi
 * @returns {void}
 */
export function handleError(kaynak, hata, seviye = 'orta', ekVeri = null) {
    const zaman = new Date().toISOString();
    const mesaj = hata?.message || (typeof hata === 'string' ? hata : 'Bilinmeyen hata');
    const stack = hata?.stack || null;

    // ─── KONSOL ÇIKTISI (HER ZAMAN) ─────────────────────────
    const etiket = seviyeEtiketi(seviye);
    console.error(
        `${etiket} [${kaynak}] ${mesaj}`,
        ...(ekVeri ? ['\n  Ek veri:', ekVeri] : []),
        ...(stack ? ['\n  Stack:', stack] : [])
    );

    // ─── SENTRY ENTEGRASYONU ────────────────────────────────
    try {
        if (typeof window !== 'undefined') {
            // Client-side
            import('@sentry/nextjs').then(Sentry => {
                Sentry.captureException(hata instanceof Error ? hata : new Error(mesaj), {
                    tags: { kaynak, seviye },
                    extra: { ekVeri, zaman },
                });
            }).catch(() => { /* Sentry yüklenemezse sessiz — bu tek istisna */ });
        }
    } catch {
        // Sentry modülü yoksa devam et — ama konsol çıktısı yukarıda zaten verildi
    }
}

/**
 * Sessiz catch bloklarında kullanılacak kısa versiyon.
 * Örnek: } catch (e) { logCatch('dosya.js', e); }
 */
export function logCatch(kaynak, hata) {
    handleError(kaynak, hata, 'dusuk');
}

/**
 * Kritik hatalar için.
 * Örnek: } catch (e) { kritikHata('middleware.jwt', e); }
 */
export function kritikHata(kaynak, hata, ekVeri = null) {
    handleError(kaynak, hata, 'kritik', ekVeri);
}

// ─── SEVİYE ETİKETİ ─────────────────────────────────────────
function seviyeEtiketi(seviye) {
    switch (seviye) {
        case 'kritik': return '🔴 [KRİTİK]';
        case 'yuksek': return '🟠 [YÜKSEK]';
        case 'orta':   return '🟡 [ORTA]';
        case 'dusuk':  return '🔵 [DÜŞÜK]';
        default:       return '⚪ [BİLİNMEYEN]';
    }
}
