/**
 * useMuhasebe — Muhasebe Giriş ve Özet Hook
 */
'use client';
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim } from '@/lib/utils';

export function useMuhasebe(kullanici) {
    const [kayitlar, setKayitlar] = useState([]);
    const [ozet, setOzet] = useState({ gelir: 0, gider: 0, net: 0 });
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const goster = createGoster(setMesaj);

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('b2_muhasebe')
                .select('*')
                .order('tarih', { ascending: false })
                .limit(500);
            if (error) throw error;
            const tum = data || [];
            setKayitlar(tum);

            const gelir = tum.filter(k => k.tip === 'gelir').reduce((a, k) => a + (parseFloat(k.tutar) || 0), 0);
            const gider = tum.filter(k => k.tip === 'gider').reduce((a, k) => a + (parseFloat(k.tutar) || 0), 0);
            setOzet({ gelir, gider, net: gelir - gider });
        } catch (e) {
            goster('Muhasebe verileri alınamadı: ' + e.message, 'error');
        }
        setLoading(false);
    }, [kullanici]);

    const kaydet = async (payload) => {
        const { error } = await supabase.from('b2_muhasebe').insert([{
            ...payload,
            kullanici_adi: kullanici?.label || 'Sistem',
        }]);
        if (error) { goster('Kayıt hatası: ' + error.message, 'error'); return false; }
        goster('✅ Muhasebe kaydedildi.');
        telegramBildirim(`💰 MUHASEBE: ${payload.tip?.toUpperCase()} | ₺${payload.tutar} | ${payload.aciklama}`);
        await yukle();
        return true;
    };

    return { kayitlar, ozet, loading, mesaj, yukle, kaydet, goster };
}
