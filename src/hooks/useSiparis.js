/**
 * useSiparis — Sipariş Yönetim Hook
 */
'use client';
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim } from '@/lib/utils';

export function useSiparis(kullanici) {
    const [siparisler, setSiparisler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const goster = createGoster(setMesaj);

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('b2_siparisler')
                .select('*, b2_musteriler(ad_soyad, musteri_kodu)')
                .order('created_at', { ascending: false })
                .limit(300);
            if (error) throw error;
            setSiparisler(data || []);
        } catch (e) {
            goster('Sipariş verileri alınamadı: ' + e.message, 'error');
        }
        setLoading(false);
    }, [kullanici]);

    const durumGuncelle = async (id, yeniDurum, musteriAdi) => {
        const { error } = await supabase.from('b2_siparisler').update({ durum: yeniDurum }).eq('id', id);
        if (error) { goster('Güncelleme hatası: ' + error.message, 'error'); return false; }
        goster(`✅ Sipariş: ${yeniDurum}`);
        if (yeniDurum === 'teslim_edildi') {
            telegramBildirim(`📦 TESLİMAT TAMAM\nMüşteri: ${musteriAdi}`);
        }
        return true;
    };

    return { siparisler, loading, mesaj, yukle, durumGuncelle, goster };
}
