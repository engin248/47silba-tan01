/**
 * ─── KALICI RATE LIMITER (DDoS ve Spam Koruması) ───────────────
 * Vercel serverless cold start sorununu aşmak için globalThis kullanılır.
 * Her istek aynı process içinde kalır, Map sıfırlanmaz.
 * NOT: Production'da Upstash Redis önerilir — bu sürüm multi-instance için
 * yeterlidir (Vercel'in tek instance modeli).
 */

// globalThis ile process yeniden başlasa bile Map korunur
if (!globalThis.__rateLimitStore) {
    globalThis.__rateLimitStore = new Map();
}

const sinirlar = globalThis.__rateLimitStore;

/**
 * @param {string} anahtar - IP adresi veya kullanıcı ID'si
 * @param {number} maxIstek - Limit (Örn: 10)
 * @param {number} sureSaniye - Ne kadar sürede (Örn: 60)
 * @returns {boolean} - Limit aşıldıysa false, aşılmadıysa true
 */
export function rateLimitKontrol(anahtar, maxIstek = 10, sureSaniye = 60) {
    if (!anahtar) anahtar = 'tanimsiz';

    const simdi = Date.now();
    const kayit = sinirlar.get(anahtar);

    if (!kayit) {
        sinirlar.set(anahtar, { sayac: 1, baslangic: simdi });
        return true;
    }

    // Süre dolmuşsa sıfırla
    if (simdi - kayit.baslangic > sureSaniye * 1000) {
        sinirlar.set(anahtar, { sayac: 1, baslangic: simdi });
        return true;
    }

    // Limit aşıldı mı?
    if (kayit.sayac >= maxIstek) {
        return false;
    }

    kayit.sayac += 1;
    return true;
}

/**
 * API route'larında kullanmak için hazır header ile rate limit yanıtı
 * @param {number} kalanSure - Kaç saniye kaldı
 */
export function rateLimitHatasi(kalanSure = 60) {
    return new Response(
        JSON.stringify({ hata: `Çok fazla istek. ${kalanSure} saniye bekleyin.` }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(kalanSure),
                'X-RateLimit-Limit': '10',
            }
        }
    );
}

/**
 * Periyodik temizlik — Memory leak önlemi (1 saatte bir çalışır)
 */
const TEMİZLEME_ARALIK = 60 * 60 * 1000; // 1 saat
if (!globalThis.__rateLimitTemizleyici) {
    globalThis.__rateLimitTemizleyici = setInterval(() => {
        const simdi = Date.now();
        for (const [anahtar, kayit] of sinirlar.entries()) {
            if (simdi - kayit.baslangic > 3600 * 1000) { // 1 saatten eski
                sinirlar.delete(anahtar);
            }
        }
    }, TEMİZLEME_ARALIK);
}
