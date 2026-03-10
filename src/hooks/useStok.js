/**
 * useStok — Stok Yönetim Hook
 */
'use client';
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim } from '@/lib/utils';

export function useStok(kullanici) {
    const [stoklar, setStoklar] = useState([]);
    const [hareketler, setHareketler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const goster = createGoster(setMesaj);

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const [sRes, hRes] = await Promise.all([
                supabase.from('b1_stok').select('*').order('updated_at', { ascending: false }).limit(500),
                supabase.from('b1_stok_hareketleri').select('*').order('created_at', { ascending: false }).limit(200),
            ]);
            if (sRes.error) throw sRes.error;
            setStoklar(sRes.data || []);
            setHareketler(hRes.data || []);

            // Kritik stok uyarısı
            const kritik = (sRes.data || []).filter(s => s.miktar <= (s.kritik_seviye || 0));
            if (kritik.length > 0) {
                telegramBildirim(`⚠️ KRİTİK STOK UYARISI\n${kritik.map(s => `${s.urun_adi}: ${s.miktar} ${s.birim}`).join('\n')}`);
            }
        } catch (e) {
            goster('Stok verileri alınamadı: ' + e.message, 'error');
        }
        setLoading(false);
    }, [kullanici]);

    const hareket = async (stokId, tip, miktar, aciklama) => {
        const { error } = await supabase.from('b1_stok_hareketleri').insert([{
            stok_id: stokId, hareket_tipi: tip, miktar, aciklama,
            kullanici_adi: kullanici?.label || 'Sistem',
        }]);
        if (error) { goster('Hareket kaydedilemedi: ' + error.message, 'error'); return false; }
        goster(`✅ Stok hareketi kaydedildi (${tip})`);
        await yukle();
        return true;
    };

    return { stoklar, hareketler, loading, mesaj, yukle, hareket, goster };
}
