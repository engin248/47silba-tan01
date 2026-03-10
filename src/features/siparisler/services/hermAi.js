/**
 * features/siparisler/services/hermAi.js
 * Siparişler modülü HermAI adaptörü — sipariş kabul/red kararlarını açıklar.
 */
import { runHermLoop } from '@/lib/ai/hermLoop';

/**
 * @param {object} siparis - Analiz edilecek sipariş kaydı
 * @param {object[]} gecmisSiparisler - Geçmiş siparişler (bağlam için)
 */
export async function siparisHermAi(siparis = {}, gecmisSiparisler = []) {
    const gecmisTutarlar = gecmisSiparisler
        .map(s => parseFloat(s.toplam_tutar_tl || 0))
        .filter(n => n > 0);

    const etkenler = [
        { ad: 'Sipariş Tutarı (TL)', deger: parseFloat(siparis.toplam_tutar_tl || 0), agirlik: 2.0 },
        { ad: 'Kanal', deger: siparis.kanal === 'toptan' ? 1 : 0.6, agirlik: 1.5 },
        { ad: 'Termin Aciliyeti', deger: siparis.oncelik === 'acil' ? 1 : 0, agirlik: 1.8 },
        { ad: 'Adet', deger: parseInt(siparis.toplam_adet || 0), agirlik: 1.0 },
    ];

    return runHermLoop({
        aiKarari: siparis,
        etkenler,
        gecmisDegerler: gecmisTutarlar,
        anaMetrik: parseFloat(siparis.toplam_tutar_tl || 0),
        gecmisKararlar: gecmisSiparisler.map(s => ({
            etiket: s.durum || 'belirsiz',
            degerler: { tutar: s.toplam_tutar_tl, kanal: s.kanal },
        })),
        birim: 'siparis',
    });
}
