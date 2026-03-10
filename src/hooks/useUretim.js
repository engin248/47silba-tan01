/**
 * useUretim — İş Emirleri Hook
 */
'use client';
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim } from '@/lib/utils';

export function useUretim(kullanici) {
    const [isEmirleri, setIsEmirleri] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const goster = createGoster(setMesaj);

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('b1_is_emirleri')
                .select('*, b1_model_taslaklari(model_kodu,model_adi)')
                .order('created_at', { ascending: false })
                .limit(300);
            if (error) throw error;
            setIsEmirleri(data || []);
        } catch (e) {
            goster('İş emirleri alınamadı: ' + e.message, 'error');
        }
        setLoading(false);
    }, [kullanici]);

    const durumGuncelle = async (id, yeniDurum, modelKodu) => {
        const { error } = await supabase.from('b1_is_emirleri').update({ durum: yeniDurum }).eq('id', id);
        if (error) { goster('Güncelleme hatası: ' + error.message, 'error'); return false; }
        goster(`✅ İş emri: ${yeniDurum}`);
        telegramBildirim(`🏭 İŞ EMRİ: ${yeniDurum.toUpperCase()} | Model: ${modelKodu}`);
        return true;
    };

    const sil = async (id) => {
        const { error } = await supabase.from('b1_is_emirleri').delete().eq('id', id);
        if (error) { goster('Silme hatası: ' + error.message, 'error'); return false; }
        goster('Silindi.');
        return true;
    };

    return { isEmirleri, loading, mesaj, yukle, durumGuncelle, sil, goster };
}
