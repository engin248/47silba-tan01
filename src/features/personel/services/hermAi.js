/**
 * features/personel/services/hermAi.js
 * Personel modülü HermAI adaptörü — prim ve performans kararlarını açıklar.
 */
import { runHermLoop } from '@/lib/ai/hermLoop';

/**
 * @param {object} personel - Analiz edilecek personel kaydı (b1_personel)
 * @param {object[]} tumPersonel - Tüm personel listesi (bağlam için)
 */
export async function personelHermAi(personel = {}, tumPersonel = []) {
    const gecmisUcretler = tumPersonel
        .map(p => parseFloat(p.saatlik_ucret_tl || 0))
        .filter(n => n > 0);

    const gunlukCalisma = parseInt(personel.gunluk_calisma_dk || 480);
    const ucret = parseFloat(personel.saatlik_ucret_tl || 0);
    const aylikKazanc = (ucret * (gunlukCalisma / 60)) * 22;

    // Prim eşiği: Dakika başı 2.5 TL × 22 gün × çalışma dakikası
    const DAKIKA_BASI = 2.5;
    const hayaliUretim = gunlukCalisma * 22 * DAKIKA_BASI;
    const primHakki = hayaliUretim > aylikKazanc;

    const etkenler = [
        { ad: 'Saatlik Ücret (TL)', deger: ucret, agirlik: 2.0 },
        { ad: 'Günlük Çalışma (dk)', deger: gunlukCalisma, agirlik: 1.5 },
        { ad: 'Aylık Kazanç (TL)', deger: aylikKazanc, agirlik: 1.8 },
        { ad: 'Prim Hakkı', deger: primHakki ? 1 : 0, agirlik: 2.5 },
    ];

    return runHermLoop({
        aiKarari: { ...personel, primHakki, aylikKazanc },
        etkenler,
        gecmisDegerler: gecmisUcretler,
        anaMetrik: ucret,
        gecmisKararlar: tumPersonel.map(p => ({
            etiket: p.rol || 'belirsiz',
            degerler: { ucret: p.saatlik_ucret_tl, calisma: p.gunluk_calisma_dk },
        })),
        birim: 'personel_prim',
    });
}
