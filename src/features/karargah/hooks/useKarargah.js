'use client';
/**
 * features/karargah/hooks/useKarargah.js
 * M1 Karargah — CEO Dashboard (canlı metrikler + AI öneriler)
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { karargahMetrikleriGetir, karargahKanaliKur } from '../services/karargahApi';

export function useKarargah() {
    const [metrikler, setMetrikler] = useState(null);
    const [oneriler, setOneriler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [sonGuncelleme, setSonGuncelleme] = useState(null);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const m = await karargahMetrikleriGetir();
            setMetrikler(m);
            setSonGuncelleme(new Date().toLocaleTimeString('tr-TR'));
            // AI önerilerini ayrı yükle (ağır sorgu)
            import('@/lib/aiOneri').then(mod => mod.aiOneriUret().then(setOneriler)).catch(() => { });
        } catch (e) { goster('Dashboard yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        const kanal = karargahKanaliKur(yukle);
        yukle();
        // 5 dakikada bir otomatik yenile
        const interval = setInterval(yukle, 5 * 60 * 1000);
        return () => { supabase.removeChannel(kanal); clearInterval(interval); };
    }, [yukle]);

    const ozet = metrikler ? {
        toplamSiparis: metrikler.siparisler.toplam,
        aktifUretim: metrikler.uretim.aktif,
        kritikStok: metrikler.stok.kritik,
        bekleyenOnay: metrikler.muhasebe.bekleyen,
        toplamMaliyet: metrikler.muhasebe.toplamMaliyet,
        trendOnaylandi: metrikler.arge.onaylandi,
        ajanDurumu: metrikler.ajanlar.sonDurum,
    } : null;

    return { metrikler, ozet, oneriler, loading, mesaj, sonGuncelleme, yenile: yukle };
}
