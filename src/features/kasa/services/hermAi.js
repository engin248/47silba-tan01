/**
 * features/kasa/services/hermAi.js
 * Kasa modülü HermAI adaptörü — gelir/gider ve bakiye kararlarını açıklar.
 */
import { runHermLoop } from '@/lib/ai/hermLoop';

/**
 * @param {object} islem - Analiz edilecek kasa işlemi (b1_kasa_islemleri)
 * @param {object[]} gecmisIslemler - Geçmiş kasa işlemleri (bağlam için)
 */
export async function kasaHermAi(islem = {}, gecmisIslemler = []) {
    const gecmisTutarlar = gecmisIslemler
        .map(i => Math.abs(parseFloat(i.tutar_tl || 0)))
        .filter(n => n > 0);

    const tutar = parseFloat(islem.tutar_tl || 0);
    const gelirMi = islem.islem_tipi === 'gelir' || tutar > 0;

    const etkenler = [
        { ad: 'İşlem Tutarı (TL)', deger: Math.abs(tutar), agirlik: 2.5 },
        { ad: 'İşlem Tipi', deger: gelirMi ? 1 : 0, agirlik: 2.0 },
        { ad: 'Bakiye Etkisi', deger: parseFloat(islem.sonuc_bakiye || 0), agirlik: 1.5 },
    ];

    return runHermLoop({
        aiKarari: islem,
        etkenler,
        gecmisDegerler: gecmisTutarlar,
        anaMetrik: Math.abs(tutar),
        gecmisKararlar: gecmisIslemler.map(i => ({
            etiket: i.islem_tipi || 'belirsiz',
            degerler: { tutar: i.tutar_tl },
        })),
        birim: 'kasa_islem',
    });
}
