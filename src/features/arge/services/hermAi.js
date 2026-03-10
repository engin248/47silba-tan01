/**
 * features/arge/services/hermAi.js
 * Arge modülü HermAI adaptörü — trend ve öneri kararlarını açıklar.
 *
 * Kullanım (arge hookunda veya bileşeninde):
 *   import { argeHermAi } from '@/features/arge/services/hermAi';
 *
 *   const sonuc = await argeHermAi(seciliTrend, gecmisTrendler);
 *   // sonuc.aciklamaTR → "Bu trend önerildi çünkü..."
 */
import { runHermLoop } from '@/lib/ai/hermLoop';

/**
 * @param {object} trend  - Analiz edilecek trend kaydı (b1_arge_trendler satırı)
 * @param {object[]} gecmisTrendler - Geçmiş tüm trendler (bağlam için)
 */
export async function argeHermAi(trend = {}, gecmisTrendler = []) {
    // Geçmiş talep skorlarından bağlam motoru için dizi
    const gecmisSkorlar = gecmisTrendler
        .map(t => parseFloat(t.talep_skoru || 0))
        .filter(n => !isNaN(n));

    // Bu kararı etkileyen faktörler
    const etkenler = [
        { ad: 'Talep Skoru', deger: parseFloat(trend.talep_skoru || 0), agirlik: 2.0 },
        { ad: 'Platform Etkisi', deger: trend.platform === 'trendyol' ? 1 : trend.platform === 'instagram' ? 0.8 : 0.5, agirlik: 1.5 },
        { ad: 'Onay Durumu', deger: trend.durum === 'onaylandi' ? 1 : 0, agirlik: 1.0 },
    ];

    return runHermLoop({
        aiKarari: trend,
        etkenler,
        gecmisDegerler: gecmisSkorlar,
        anaMetrik: parseFloat(trend.talep_skoru || 0),
        gecmisKararlar: gecmisTrendler.map(t => ({
            etiket: t.durum || 'belirsiz',
            degerler: { skor: t.talep_skoru },
        })),
        birim: 'arge_trend',
    });
}
