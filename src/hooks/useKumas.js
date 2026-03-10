/**
 * useKumas — Kumaş ve Aksesuar Hook
 */
'use client';
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster } from '@/lib/utils';

export function useKumas(kullanici) {
    const [kumaslar, setKumaslar] = useState([]);
    const [aksesuarlar, setAksesuarlar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const goster = createGoster(setMesaj);

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const [kRes, aRes] = await Promise.all([
                supabase.from('b1_kumas_arsivi').select('*').order('created_at', { ascending: false }).limit(300),
                supabase.from('b1_aksesuar_arsivi').select('*').order('created_at', { ascending: false }).limit(300),
            ]);
            if (kRes.error) throw kRes.error;
            if (aRes.error) throw aRes.error;
            setKumaslar(kRes.data || []);
            setAksesuarlar(aRes.data || []);
        } catch (e) {
            goster('Kumaş verileri alınamadı: ' + e.message, 'error');
        }
        setLoading(false);
    }, [kullanici]);

    return { kumaslar, aksesuarlar, loading, mesaj, yukle, goster };
}
