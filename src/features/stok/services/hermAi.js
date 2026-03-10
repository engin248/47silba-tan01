/**
 * features/stok/services/hermAi.js
 * Stok modülü HermAI adaptörü — kritik stok ve sevkiyat kararlarını açıklar.
 */
import { runHermLoop } from '@/lib/ai/hermLoop';

/**
 * @param {object} urun - Analiz edilecek ürün kaydı (b2_urun_katalogu)
 * @param {object[]} tumUrunler - Tüm ürün listesi (bağlam için)
 */
export async function stokHermAi(urun = {}, tumUrunler = []) {
    const gecmisStoklar = tumUrunler
        .map(u => parseFloat(u.stok_adeti || 0))
        .filter(n => !isNaN(n));

    const stok = parseInt(urun.stok_adeti || 0);
    const minStok = parseInt(urun.min_stok || 10);
    const kritikOran = minStok > 0 ? (stok / minStok) : 1;

    const etkenler = [
        { ad: 'Stok Adeti', deger: stok, agirlik: 2.0 },
        { ad: 'Min. Stok Eşiği', deger: minStok, agirlik: 1.5 },
        { ad: 'Kritik Oran', deger: Math.min(kritikOran, 5), agirlik: 2.5 },
        { ad: 'Satış Fiyatı (TL)', deger: parseFloat(urun.satis_fiyati_tl || 0), agirlik: 1.0 },
    ];

    return runHermLoop({
        aiKarari: { ...urun, kritikOran },
        etkenler,
        gecmisDegerler: gecmisStoklar,
        anaMetrik: stok,
        gecmisKararlar: tumUrunler.map(u => ({
            etiket: (parseInt(u.stok_adeti || 0) <= parseInt(u.min_stok || 10)) ? 'kritik' : 'normal',
            degerler: { stok: u.stok_adeti, min: u.min_stok },
        })),
        birim: 'stok_urun',
    });
}
