/**
 * useSupabaseYetki — Evrensel Yetki + Realtime Hook
 * Kullanım: const { yetkiliMi, yukleniyor } = useSupabaseYetki(kullanici, 'b1_tablo', () => yukle());
 */
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { yetkiKontrol } from '@/lib/utils';

/**
 * @param {object} kullanici - useAuth()'dan gelen kullanici nesnesi
 * @param {string|null} realtimeTablo - Realtime dinlenecek Supabase tablo adı (null = kapalı)
 * @param {function|null} onDegisim - Tablo değişince çalışacak callback
 * @returns {{ yetkiliMi: boolean, yukleniyor: boolean }}
 */
export function useSupabaseYetki(kullanici, realtimeTablo = null, onDegisim = null) {
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [yukleniyor, setYukleniyor] = useState(true);

    useEffect(() => {
        const erisebilir = yetkiKontrol(kullanici);
        setYetkiliMi(erisebilir);
        setYukleniyor(false);

        if (!erisebilir || !realtimeTablo) return;

        if (onDegisim) onDegisim();

        const kanal = supabase
            .channel(`realtime-${realtimeTablo}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: realtimeTablo }, () => {
                if (onDegisim) onDegisim();
            })
            .subscribe();

        return () => supabase.removeChannel(kanal);
    }, [kullanici]);

    return { yetkiliMi, yukleniyor };
}
