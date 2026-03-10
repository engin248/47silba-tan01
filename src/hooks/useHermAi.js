'use client';
/**
 * src/hooks/useHermAi.js — HermAI Kullanım Hook'u
 *
 * Herhangi bir modülden tek satırla HermAI çalıştırmayı sağlar.
 * Mevcut aiOneri.js ve aiKararMotoru.js ile birlikte kullanılır.
 *
 * Kullanım:
 *   import { useHermAi } from '@/hooks/useHermAi';
 *
 *   function SiparisOnayi({ siparis }) {
 *     const { hermCalistir, hermSonuc, hermYukleniyor } = useHermAi();
 *
 *     const handleOnayla = async () => {
 *       await hermCalistir({
 *         aiKarari: siparis,
 *         etkenler: [
 *           { ad: 'Talep Skoru', deger: siparis.talep_skoru, agirlik: 1.5 },
 *           { ad: 'Stok Durumu', deger: siparis.stok_adeti, agirlik: 1.0 },
 *           { ad: 'Kâr Marjı', deger: siparis.kar_marji, agirlik: 2.0 },
 *         ],
 *         gecmisDegerler: gecmisKarMarjlari,  // geçmiş sayısal dizi
 *         anaMetrik: siparis.kar_marji,
 *         birim: 'siparis',
 *       });
 *     };
 *
 *     return (
 *       <>
 *         <button onClick={handleOnayla}>Onayla</button>
 *         <HermAiAciklama sonuc={hermSonuc} />
 *       </>
 *     );
 *   }
 */
import { useState, useCallback } from 'react';
import { runHermLoop } from '@/lib/ai/hermLoop';

export function useHermAi() {
    const [hermSonuc, setHermSonuc] = useState(null);
    const [hermYukleniyor, setHermYukleniyor] = useState(false);
    const [hermHata, setHermHata] = useState(null);

    /**
     * HermAI döngüsünü çalıştırır.
     * @param {import('@/lib/ai/hermLoop').HermLoopGiris} params
     */
    const hermCalistir = useCallback(async (params) => {
        setHermYukleniyor(true);
        setHermHata(null);
        try {
            const sonuc = await runHermLoop(params);
            setHermSonuc(sonuc);
            return sonuc;
        } catch (err) {
            const hata = { status: 'error', sebep: err.message };
            setHermHata(hata);
            setHermSonuc(null);
            return hata;
        } finally {
            setHermYukleniyor(false);
        }
    }, []);

    /** Sonucu temizle (modal kapatınca vs.) */
    const hermTemizle = useCallback(() => {
        setHermSonuc(null);
        setHermHata(null);
    }, []);

    return { hermCalistir, hermSonuc, hermYukleniyor, hermHata, hermTemizle };
}
