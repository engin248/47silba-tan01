/**
 * features/karargah/services/hermAi.js
 * Karargah modülü HermAI adaptörü — sistem geneli özet ve kritik alarm kararları.
 */
import { runHermLoop } from '@/lib/ai/hermLoop';

/**
 * @param {object} sistemOzet - Karargah sistem özet verisi (metrikler)
 * @param {object[]} gecmisOzetler - Geçmiş sistemOzet kayıtları
 */
export async function karargahHermAi(sistemOzet = {}, gecmisOzetler = []) {
    const gecmisUretimler = gecmisOzetler
        .map(o => parseFloat(o.gunluk_uretim || 0))
        .filter(n => n > 0);

    const etkenler = [
        { ad: 'Günlük Üretim (adet)', deger: parseFloat(sistemOzet.gunluk_uretim || 0), agirlik: 2.0 },
        { ad: 'Kritik Stok Adeti', deger: parseInt(sistemOzet.kritik_stok_sayisi || 0), agirlik: 1.8 },
        { ad: 'Bekleyen Sipariş', deger: parseInt(sistemOzet.bekleyen_siparis || 0), agirlik: 1.5 },
        { ad: 'Aktif Personel', deger: parseInt(sistemOzet.aktif_personel || 0), agirlik: 1.0 },
    ];

    return runHermLoop({
        aiKarari: sistemOzet,
        etkenler,
        gecmisDegerler: gecmisUretimler,
        anaMetrik: parseFloat(sistemOzet.gunluk_uretim || 0),
        gecmisKararlar: gecmisOzetler.map(o => ({
            etiket: o.sistem_durumu || 'normal',
            degerler: { uretim: o.gunluk_uretim },
        })),
        birim: 'karargah_sistem',
    });
}
