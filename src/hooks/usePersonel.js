/**
 * usePersonel — Personel CRUD + Devam Hook
 * Kullanım: const { personeller, devamlar, yukle, kaydet, sil, loading, mesaj } = usePersonel(kullanici);
 */
'use client';
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim } from '@/lib/utils';

export function usePersonel(kullanici) {
    const [personeller, setPersoneller] = useState([]);
    const [devamlar, setDevamlar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    const goster = createGoster(setMesaj);

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı')), 10000));
            const [pRes, dRes] = await Promise.all([
                Promise.race([
                    supabase.from('b2_personel').select('*').order('created_at', { ascending: false }).limit(200),
                    timeout
                ]),
                Promise.race([
                    supabase.from('b2_personel_devam').select('*').order('tarih', { ascending: false }).limit(500),
                    timeout
                ])
            ]);
            if (pRes.error) throw pRes.error;
            if (dRes.error) throw dRes.error;
            setPersoneller(pRes.data || []);
            setDevamlar(dRes.data || []);
        } catch (e) {
            goster('Personel verileri alınamadı: ' + e.message, 'error');
        }
        setLoading(false);
    }, [kullanici]);

    const devamKaydet = async (personelId, tarih, durum, gecikme) => {
        const payload = { personel_id: personelId, tarih, durum, gecikme_dk: gecikme || 0 };
        const { error } = await supabase.from('b2_personel_devam').upsert([payload], { onConflict: 'personel_id,tarih' });
        if (error) { goster('Devam kaydedilemedi: ' + error.message, 'error'); return false; }
        goster('✅ Devam kaydedildi.');
        telegramBildirim(`👤 DEVAM: ${durum.toUpperCase()} | Personel ID: ${personelId} | ${tarih}`);
        return true;
    };

    return { personeller, devamlar, loading, mesaj, yukle, devamKaydet, goster };
}
