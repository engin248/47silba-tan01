/**
 * src/lib/ai/hermExplainer.js — HermAI Açıklayıcı Motorlar
 *
 * İki modda çalışır:
 *   1. Yerel (Local) — Tek bir kararı açıklar: "Neden bu sipariş önerildi?"
 *   2. Genel (General) — Tüm kararların örüntüsünü çıkarır: "Sistem nasıl karar veriyor?"
 *
 * Mevcut aiKararMotoru.js ile ÇAKIŞMAZ — o karar üretir, bu açıklar.
 *
 * Kullanım:
 *   import { localExplain, generalExplain } from '@/lib/ai/hermExplainer';
 *   const aciklama = localExplain(karar, etkenler);
 *   const kurallar = generalExplain(kararListesi);
 */

// ─── Yerel Açıklayıcı ─────────────────────────────────────────────────────────
/**
 * Tek bir AI kararının nedenini açıklar.
 *
 * @param {object} karar - AI'nın verdiği karar objesi
 * @param {Array<{ad: string, deger: number, agirlik: number}>} etkenler - Kararı etkileyen faktörler
 * @param {string} [birim=''] - İşletme birimi (örn: 'siparis', 'prim', 'stok')
 * @returns {{ aciklamaTR, karsiOlgu, enOnemliEtken, guvenskoru }}
 */
export function localExplain(karar, etkenler = [], birim = '') {
    if (!etkenler || etkenler.length === 0) {
        return {
            aciklamaTR: 'Bu karar için yeterli veri bulunamadı.',
            karsiOlgu: null,
            enOnemliEtken: null,
            guvenskoru: 0,
        };
    }

    // Etkenler ağırlıklı olarak sıralanır
    const sirali = [...etkenler]
        .map(e => ({ ...e, etki: Math.abs((e.deger || 0) * (e.agirlik || 1)) }))
        .sort((a, b) => b.etki - a.etki);

    const enOnemli = sirali[0];
    const ikinciOnemli = sirali[1];

    // Türkçe doğal dil açıklaması
    let aciklamaTR = `Bu karar için en belirleyici faktör "${enOnemli.ad}" oldu`;
    aciklamaTR += ` (etki: %${Math.min(99, Math.round((enOnemli.etki / sirali.reduce((s, e) => s + e.etki, 0)) * 100))})`;
    if (ikinciOnemli) {
        aciklamaTR += `, ardından "${ikinciOnemli.ad}" geldi.`;
    } else {
        aciklamaTR += '.';
    }
    if (birim) aciklamaTR = `[${birim.toUpperCase()}] ${aciklamaTR}`;

    // Karşı-olgusal: "Şu değişseydi ne olurdu?"
    const karsiOlgu = enOnemli
        ? `"${enOnemli.ad}" %10 daha ${enOnemli.deger > 0 ? 'düşük' : 'yüksek'} olsaydı, karar değişebilirdi.`
        : null;

    // Güven skoru: etki yoğunluğuna göre
    const guvenskoru = Math.min(100, Math.round(
        (enOnemli.etki / Math.max(1, sirali.reduce((s, e) => s + e.etki, 0))) * 100
    ));

    return {
        aciklamaTR,
        karsiOlgu,
        enOnemliEtken: enOnemli.ad,
        guvenskoru,
        tumEtkenler: sirali.slice(0, 5), // Max 5 etken
    };
}

// ─── Genel Açıklayıcı ─────────────────────────────────────────────────────────
/**
 * Birden fazla kararın örüntüsünü IF-THEN kurallarına çevirir.
 *
 * @param {Array<{etiket: string, degerler: object}>} kararListesi - Geçmiş kararlar
 * @returns {{ kurallar: string[], ozetTR: string }}
 */
export function generalExplain(kararListesi = []) {
    if (!kararListesi || kararListesi.length === 0) {
        return { kurallar: [], ozetTR: 'Kural çıkarmak için yeterli karar geçmişi yok.' };
    }

    const kurallar = [];
    const etiketSayisi = {};

    kararListesi.forEach(k => {
        const etiket = k.etiket || 'bilinmiyor';
        etiketSayisi[etiket] = (etiketSayisi[etiket] || 0) + 1;
    });

    // En sık tekrarlayan karar tipi
    const siraliEtiketler = Object.entries(etiketSayisi)
        .sort((a, b) => b[1] - a[1]);

    siraliEtiketler.slice(0, 3).forEach(([etiket, sayi]) => {
        const oran = Math.round((sayi / kararListesi.length) * 100);
        kurallar.push(`KURAL: Geçmiş kararların %${oran}'i "${etiket}" tipinde oldu.`);
    });

    const ozetTR = `Sistem genel olarak "${siraliEtiketler[0]?.[0] || '-'}" kararları veriyor ` +
        `(${kararListesi.length} kararın analizi).`;

    return { kurallar, ozetTR };
}
