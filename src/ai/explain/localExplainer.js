// [FAZ 5] src/ai/explain/localExplainer.js
// HermAI — "Bu karar neden alındı?" motoru
// Checklist 78: AI karar doğrulama mekanizması

import { logger } from '@/lib/logger';

/**
 * Tekil bir kararın nedenini açıklar.
 * @param {object} veri - Analiz edilecek veri (sipariş, model, uretim vb.)
 * @param {string} karar - AI'nin verdiği karar
 * @param {object} [secenekler] - Ek seçenekler
 * @returns {{ neden: string, guven: number, etkenler: object[], counterfactual: string }}
 */
export function localAcikla(veri, karar, secenekler = {}) {
    const etkenler = [];
    let aciklama = '';

    // Sipariş karlılık analizi
    if (veri.toplam_tutar_tl !== undefined && veri.gercek_maliyet_tl !== undefined) {
        const karZarar = parseFloat(veri.toplam_tutar_tl || 0) - parseFloat(veri.gercek_maliyet_tl || 0);
        const karMarji = veri.toplam_tutar_tl > 0
            ? ((karZarar / veri.toplam_tutar_tl) * 100).toFixed(1)
            : 0;

        etkenler.push({ faktor: 'Gelir', deger: veri.toplam_tutar_tl, agirlik: 0.4 });
        etkenler.push({ faktor: 'Maliyet', deger: veri.gercek_maliyet_tl, agirlik: 0.4 });
        etkenler.push({ faktor: 'Kar Marjı %', deger: karMarji, agirlik: 0.2 });

        aciklama = karZarar >= 0
            ? `Bu sipariş ₺${karZarar.toFixed(2)} kâr üretiyor (marj: %${karMarji}). Kritik etken: gelir/maliyet dengesi pozitif.`
            : `Bu sipariş ₺${Math.abs(karZarar).toFixed(2)} ZARAR ediyor. Maliyet geliri aşıyor — fiyat veya maliyet revizyonu gerekli.`;
    }

    // Üretim performans analizi
    if (veri.hedef_adet !== undefined && veri.gerceklesen_adet !== undefined) {
        const verimlilik = veri.hedef_adet > 0
            ? Math.round((veri.gerceklesen_adet / veri.hedef_adet) * 100)
            : 0;

        etkenler.push({ faktor: 'Hedef Adet', deger: veri.hedef_adet, agirlik: 0.5 });
        etkenler.push({ faktor: 'Gerçekleşen Adet', deger: veri.gerceklesen_adet, agirlik: 0.5 });

        aciklama = verimlilik >= 100
            ? `Personel hedefini %${verimlilik} oranında aştı. Prim hakkı kazanıldı.`
            : `Personel hedefin %${verimlilik}'ini tamamladı. Hedef altı performans.`;
    }

    // Stok alarm analizi
    if (veri.stok_adeti !== undefined && veri.min_stok !== undefined) {
        etkenler.push({ faktor: 'Mevcut Stok', deger: veri.stok_adeti, agirlik: 0.6 });
        etkenler.push({ faktor: 'Min Stok Sınırı', deger: veri.min_stok, agirlik: 0.4 });

        aciklama = veri.stok_adeti <= veri.min_stok
            ? `Stok kritik seviyenin altına düştü (${veri.stok_adeti} ≤ ${veri.min_stok}). Acil tedarik/üretim gerekli.`
            : `Stok seviyesi yeterli (${veri.stok_adeti} > ${veri.min_stok}).`;
    }

    // Güven skoru: etken sayısına ve veriye göre
    const guven = Math.min(0.95, 0.5 + (etkenler.length * 0.1) + (aciklama ? 0.2 : 0));

    const sonuc = {
        karar,
        neden: aciklama || 'Bu karar verilen verilerden türetilmiştir.',
        guven: parseFloat(guven.toFixed(2)),
        etkenler: etkenler.sort((a, b) => b.agirlik - a.agirlik),
        timestamp: new Date().toISOString(),
    };

    // Loglama
    logger.aiDecision({ tip: 'LOCAL_EXPLAIN', ...sonuc });

    return sonuc;
}

export default localAcikla;
