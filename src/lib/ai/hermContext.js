/**
 * src/lib/ai/hermContext.js — HermAI Bağlam Motoru
 *
 * Verinin istatistiksel sınırlarını öğrenir.
 * Gerçek dışı (imkânsız) senaryoları filtreler.
 *
 * Kullanım:
 *   import { buildContextEngine } from '@/lib/ai/hermContext';
 *   const ctx = buildContextEngine([100, 120, 95, 110]);
 *   ctx.isRealistic(500)  // → false (3σ dışında)
 */

/**
 * Sayısal dizi üzerinden istatistiksel bağlam motoru oluşturur.
 * @param {number[]} values - Geçmiş verilerin sayısal dizisi
 * @returns {{ isRealistic, mean, std }}
 */
export function buildContextEngine(values = []) {
    if (!values || values.length === 0) {
        // Veri yoksa her şeyi gerçekçi say (başlangıç durumu)
        return { isRealistic: () => true, mean: 0, std: 0 };
    }

    const clean = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const n = clean.length;
    const mean = clean.reduce((s, v) => s + v, 0) / n;
    const variance = clean.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    return {
        mean,
        std,
        /**
         * Verilen değer istatistiksel olarak gerçekçi mi? (3-sigma kuralı)
         * @param {number} value
         * @param {number} [sigma=3] - Kaç standart sapma tolerans
         */
        isRealistic: (value, sigma = 3) => {
            if (std === 0) return true; // Tüm veriler aynıysa her şey geçerli
            return Math.abs(parseFloat(value) - mean) <= sigma * std;
        },
    };
}
