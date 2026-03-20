'use client';
/**
 * ─── API CLIENT ────────────────────────────────────────────────────────────
 * src/lib/apiClient.js
 *
 * Merkezi Fetch wrapper — tüm API çağrıları buradan geçer.
 * Sağladığı özellikler:
 *   ✅ Auth token otomatik eklenir (JWT cookie'den)
 *   ✅ Zaman aşımı koruması (varsayılan 10sn)
 *   ✅ Hata yakalama merkezi (401 → login yönlendirme)
 *   ✅ Retry (ağ kesintisinde 1x otomatik tekrar)
 *   ✅ Standart JSON I/O
 *
 * Kullanım:
 *   import { apiClient } from '@/lib/apiClient';
 *
 *   // GET
 *   const veri = await apiClient.get('/api/uretim-veri');
 *
 *   // POST
 *   const sonuc = await apiClient.post('/api/gorev-ekle', { baslik: 'Yeni görev' });
 */

const TIMEOUT_MS = 10_000; // 10 saniye
const RETRY_SAYISI = 1;      // Hata durumunda bir kez tekrar dene

// ─── Cookie okuyucu ──────────────────────────────────────────────
function cookieOku(ad) {
    if (typeof document === 'undefined') return null;
    const deger = document.cookie
        .split('; ')
        .find(r => r.startsWith(`${ad}=`))
        ?.split('=')[1];
    return deger ? decodeURIComponent(deger) : null;
}

// ─── JWT token al ────────────────────────────────────────────────
function tokenAl() {
    return cookieOku('sb47_jwt_token') || null;
}

// ─── 401 → Login yönlendirme ─────────────────────────────────────
function oturumSonlandir() {
    if (typeof window !== 'undefined') {
        // Tüm auth verilerini temizle
        localStorage.removeItem('sb47_auth');
        sessionStorage.clear();
        // Cookie temizle
        document.cookie = 'sb47_auth_session=; path=/; max-age=0';
        document.cookie = 'sb47_jwt_token=; path=/; max-age=0';
        // Login'e yönlendir
        window.location.href = '/giris?hata=oturum_suresi_doldu';
    }
}

// ─── Ana istek fonksiyonu ─────────────────────────────────────────
async function istek(url, secenekler = {}, denemSayisi = 0) {
    const { body, timeout = TIMEOUT_MS, ...digerSecenekler } = secenekler;

    const controller = new AbortController();
    const zamanlayici = setTimeout(() => controller.abort(), timeout);

    // Başlıkları oluştur
    const headers = {
        'Content-Type': 'application/json',
        ...digerSecenekler.headers,
    };

    // JWT varsa Authorization header ekle
    const token = tokenAl();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const yanit = await fetch(url, {
            ...digerSecenekler,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });

        clearTimeout(zamanlayici);

        // 401 → Oturum sona erdi
        if (yanit.status === 401) {
            oturumSonlandir();
            throw new Error('Oturum sona erdi. Lütfen tekrar giriş yapın.');
        }

        // 429 → Rate limit aşıldı
        if (yanit.status === 429) {
            throw new Error('Çok fazla istek gönderildi. Lütfen bekleyin.');
        }

        // 5xx → Sunucu hatası, retry
        if (yanit.status >= 500 && denemSayisi < RETRY_SAYISI) {
            console.warn(`[apiClient] ${yanit.status} hatası, ${denemSayisi + 1}. deneme: ${url}`);
            await new Promise(r => setTimeout(r, 1000)); // 1sn bekle
            return istek(url, secenekler, denemSayisi + 1);
        }

        // Yanıtı parse et
        const contentType = yanit.headers.get('content-type') || '';
        const veri = contentType.includes('application/json')
            ? await yanit.json()
            : await yanit.text();

        // HTTP hata → throw
        if (!yanit.ok) {
            const hata = typeof veri === 'object' ? (veri.hata || veri.error || 'Bilinmeyen hata') : veri;
            throw new Error(hata);
        }

        return veri;

    } catch (hata) {
        clearTimeout(zamanlayici);

        // Timeout hatası
        if (hata.name === 'AbortError') {
            // Retry
            if (denemSayisi < RETRY_SAYISI) {
                console.warn(`[apiClient] Zaman aşımı, yeniden deneniyor: ${url}`);
                return istek(url, secenekler, denemSayisi + 1);
            }
            throw new Error(`İstek zaman aşımına uğradı (${timeout / 1000}sn): ${url}`);
        }

        // Ağ hatası → retry
        if (!navigator.onLine && denemSayisi < RETRY_SAYISI) {
            throw new Error('İnternet bağlantısı yok. Çevrimdışı modda çalışılıyor.');
        }

        throw hata;
    }
}

// ─── Public API ──────────────────────────────────────────────────
export const apiClient = {
    /**
     * GET isteği
     * @param {string} url
     * @param {object} [secenekler]
     */
    get: (url, secenekler = {}) =>
        istek(url, { method: 'GET', ...secenekler }),

    /**
     * POST isteği
     * @param {string} url
     * @param {object} [veri]
     * @param {object} [secenekler]
     */
    post: (url, veri = {}, secenekler = {}) =>
        istek(url, { method: 'POST', body: veri, ...secenekler }),

    /**
     * PUT isteği
     */
    put: (url, veri = {}, secenekler = {}) =>
        istek(url, { method: 'PUT', body: veri, ...secenekler }),

    /**
     * DELETE isteği
     */
    delete: (url, secenekler = {}) =>
        istek(url, { method: 'DELETE', ...secenekler }),
};

export default apiClient;
