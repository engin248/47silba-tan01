/**
 * features/muhasebe/services/hermAi.js
 * Muhasebe modülü HermAI adaptörü — rapor onayı ve maliyet kararlarını açıklar.
 */
import { runHermLoop } from '@/lib/ai/hermLoop';

/**
 * @param {object} rapor - Analiz edilecek muhasebe raporu (b1_muhasebe_raporlari)
 * @param {object[]} gecmisRaporlar - Geçmiş raporlar (bağlam için)
 */
export async function muhasebeHermAi(rapor = {}, gecmisRaporlar = []) {
    const gecmisMaliyetler = gecmisRaporlar
        .map(r => parseFloat(r.gerceklesen_maliyet_tl || 0))
        .filter(n => n > 0);

    const hedef = parseFloat(rapor.hedeflenen_maliyet_tl || 0);
    const gercek = parseFloat(rapor.gerceklesen_maliyet_tl || 0);
    const asimOrani = hedef > 0 ? ((gercek - hedef) / hedef) * 100 : 0;

    const etkenler = [
        { ad: 'Gerçekleşen Maliyet (TL)', deger: gercek, agirlik: 2.0 },
        { ad: 'Hedeften Sapma (%)', deger: Math.abs(asimOrani), agirlik: 1.8 },
        { ad: 'Zayiat Adeti', deger: parseInt(rapor.zayiat_adet || 0), agirlik: 1.5 },
        { ad: 'Net Üretilen', deger: parseInt(rapor.net_uretilen_adet || 0), agirlik: 1.0 },
    ];

    return runHermLoop({
        aiKarari: rapor,
        etkenler,
        gecmisDegerler: gecmisMaliyetler,
        anaMetrik: gercek,
        gecmisKararlar: gecmisRaporlar.map(r => ({
            etiket: r.rapor_durumu || 'belirsiz',
            degerler: { maliyet: r.gerceklesen_maliyet_tl },
        })),
        birim: 'muhasebe_rapor',
    });
}
