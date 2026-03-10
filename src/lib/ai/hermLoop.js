/**
 * src/lib/ai/hermLoop.js — HermAI Yorumlayıcı Döngü Ana Motoru
 *
 * Hermenötik döngü: Parça → Bütün → Parça
 *
 * Bu fonksiyon mevcut AI kararı üzerine şeffaflık katmanı ekler.
 * aiKararMotoru.js'yi BOZMAZ, sadece kullanır.
 *
 * Kullanım:
 *   import { runHermLoop } from '@/lib/ai/hermLoop';
 *   const sonuc = await runHermLoop({
 *     aiKarari: { ... },       // aiKararMotoru'ndan gelen sonuç
 *     etkenler: [...],          // Kararı etkileyen faktörler
 *     gecmisKararlar: [...],    // Genel açıklama için geçmiş
 *     gecmisDegerler: [...],    // Bağlam motoru için geçmiş sayılar
 *     anaMetrik: 0,             // Gerçekçilik kontrolü yapılacak değer
 *     birim: 'siparis',         // İşletme birimi adı
 *   });
 */
import { buildContextEngine } from './hermContext';
import { localExplain, generalExplain } from './hermExplainer';
import { logger } from '@/lib/logger';

/**
 * @typedef {Object} HermLoopGiris
 * @property {object}   aiKarari          - Mevcut AI motoru çıktısı
 * @property {Array}    etkenler           - [{ad, deger, agirlik}]
 * @property {number[]} [gecmisDegerler]   - Bağlam için geçmiş sayısal değerler
 * @property {number}   [anaMetrik]        - Gerçekçilik kontrolü yapılacak ana değer
 * @property {Array}    [gecmisKararlar]   - [{etiket, degerler}] genel açıklama için
 * @property {string}   [birim]            - 'siparis' | 'prim' | 'stok' | ...
 */

/**
 * HermAI yorumlayıcı döngüyü çalıştırır.
 * @param {HermLoopGiris} params
 * @returns {Promise<object>}
 */
export async function runHermLoop({
    aiKarari = {},
    etkenler = [],
    gecmisDegerler = [],
    anaMetrik = null,
    gecmisKararlar = [],
    birim = '',
}) {
    // ── ADIM 1: Bağlam Motoru (Gerçekçilik Filtresi) ──────────────────────
    const ctx = buildContextEngine(gecmisDegerler);
    let gercekcilikDurumu = 'kontrol_edilmedi';

    if (anaMetrik !== null && gecmisDegerler.length > 0) {
        const gercekci = ctx.isRealistic(anaMetrik);
        gercekcilikDurumu = gercekci ? 'gercekci' : 'supra_sinir';

        if (!gercekci) {
            const uyari = {
                status: 'rejected',
                sebep: 'Veri istatistiksel sınırların dışında — güvenilmez senaryo',
                anaMetrik,
                ortalama: ctx.mean,
                standartSapma: ctx.std,
                birim,
            };
            logger.aiDecision({ tip: 'HERM_REJECTED', ...uyari });
            return uyari;
        }
    }

    // ── ADIM 2: Yerel Açıklama (Parça) ────────────────────────────────────
    const yerelAciklama = localExplain(aiKarari, etkenler, birim);

    // ── ADIM 3: Genel Açıklama (Bütün) ────────────────────────────────────
    const genelAciklama = generalExplain(gecmisKararlar);

    // ── ADIM 4: Tutarlılık Kontrolü (Döngü Kapanışı) ─────────────────────
    // Yerel karar genel örüntüyle uyumlu mu?
    const tutarli = yerelAciklama.guvenskoru >= 50;

    // ── ADIM 5: Her şeyi logla (Kriter 55, VV3, 80) ──────────────────────
    logger.aiDecision({
        tip: 'HERM_LOOP',
        birim,
        gercekcilikDurumu,
        yerelAciklama: yerelAciklama.aciklamaTR,
        genelOzet: genelAciklama.ozetTR,
        tutarli,
        anaMetrik,
    });

    // ── SONUÇ ─────────────────────────────────────────────────────────────
    return {
        status: tutarli ? 'explained' : 'risk',
        uyari: !tutarli
            ? `⚠️ Bu karar genel ${birim} örüntüsüyle tam örtüşmüyor. Gözden geçirin.`
            : null,

        // Yerel açıklama
        aciklamaTR: yerelAciklama.aciklamaTR,
        karsiOlgu: yerelAciklama.karsiOlgu,
        enOnemliEtken: yerelAciklama.enOnemliEtken,
        guvenskoru: yerelAciklama.guvenskoru,

        // Genel açıklama
        genelKurallar: genelAciklama.kurallar,
        genelOzet: genelAciklama.ozetTR,

        // Meta
        gercekcilikDurumu,
        birim,
    };
}
