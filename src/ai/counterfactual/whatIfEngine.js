// [FAZ 5] src/ai/counterfactual/whatIfEngine.js
// HermAI — "Fiyat %10 artsa ne olurdu?" motoru
// Checklist 76-77: AI hata analizi, öneri sistemi

import { logger } from '@/lib/logger';

/**
 * Counterfactual (karşıt-olgusal) analiz — "Ya şöyle olsaydı?" 
 * @param {object} veri - Orijinal veri
 * @param {string} degisken - Değiştirilecek alan (örn: 'toplam_tutar_tl')
 * @param {number} yuzde - Değişim yüzdesi (örn: 10 → %10 artış)
 * @returns {{ soru: string, orijinal: object, simule: object, etki: string }}
 */
export function whatIfAnaliz(veri, degisken, yuzde) {
    const carpan = 1 + (yuzde / 100);
    const orijinalDeger = parseFloat(veri[degisken] || 0);
    const yeniDeger = orijinalDeger * carpan;

    const simule = { ...veri, [degisken]: yeniDeger };

    // Karlılık etkisi
    let etki = '';
    if (degisken === 'toplam_tutar_tl') {
        const eskiKar = orijinalDeger - parseFloat(veri.gercek_maliyet_tl || 0);
        const yeniKar = yeniDeger - parseFloat(simule.gercek_maliyet_tl || 0);
        const fark = yeniKar - eskiKar;
        etki = `Fiyat %${yuzde} ${yuzde > 0 ? 'artarsa' : 'azalırsa'}, kâr ₺${Math.abs(fark).toFixed(2)} ${fark >= 0 ? 'artar' : 'azalır'}. Yeni kâr: ₺${yeniKar.toFixed(2)}.`;
    } else if (degisken === 'gercek_maliyet_tl') {
        const eskiKar = parseFloat(veri.toplam_tutar_tl || 0) - orijinalDeger;
        const yeniKar = parseFloat(simule.toplam_tutar_tl || 0) - yeniDeger;
        const fark = yeniKar - eskiKar;
        etki = `Maliyet %${yuzde} ${yuzde > 0 ? 'artarsa' : 'azalırsa'}, kâr ₺${Math.abs(fark).toFixed(2)} ${fark >= 0 ? 'artar' : 'azalır'}. Yeni duruma göre sipariş ${yeniKar >= 0 ? '✅ KARLI' : '❌ ZARARI'}.`;
    } else if (degisken === 'gerceklesen_adet') {
        const hedef = parseFloat(veri.hedef_adet || 0);
        const yeniVerim = hedef > 0 ? Math.round((yeniDeger / hedef) * 100) : 0;
        etki = `Üretim %${yuzde} ${yuzde > 0 ? 'artarsa' : 'azalırsa'}, verimlilik %${yeniVerim} olur. ${yeniVerim >= 100 ? '✅ Prim hakkı kazanılır.' : '❌ Prim hakkı kazanılamaz.'}`;
    } else {
        const fark = yeniDeger - orijinalDeger;
        etki = `${degisken} değeri ${orijinalDeger.toFixed(2)} → ${yeniDeger.toFixed(2)} (${fark > 0 ? '+' : ''}${fark.toFixed(2)}) olur.`;
    }

    const sonuc = {
        soru: `${degisken} %${yuzde > 0 ? '+' : ''}${yuzde} değişseydi ne olurdu?`,
        orijinal: { [degisken]: orijinalDeger },
        simule: { [degisken]: yeniDeger },
        etki,
        timestamp: new Date().toISOString(),
    };

    logger.aiDecision({ tip: 'WHAT_IF', ...sonuc });

    return sonuc;
}

/**
 * Çoklu senaryo analizi
 * @param {object} veri  
 * @param {Array<{degisken: string, yuzde: number}>} senaryolar
 */
export function cokluSenaryo(veri, senaryolar) {
    return senaryolar.map(({ degisken, yuzde }) =>
        whatIfAnaliz(veri, degisken, yuzde)
    );
}

export default whatIfAnaliz;
