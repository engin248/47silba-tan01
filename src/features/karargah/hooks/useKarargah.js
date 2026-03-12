'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { komutSchema } from '../schemas/komutSchema';

export function useKarargah() {
    const [stats, setStats] = useState({ ciro: 0, maliyet: 0, personel: 0, fire: 0, yukleniyor: true });
    const [alarms, setAlarms] = useState([]);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    // UI states
    const [commandText, setCommandText] = useState('');
    const [aiSorgu, setAiSorgu] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const [simulasyon, setSimulasyon] = useState(0);

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const hizliGorevAtama = async () => {
        try {
            komutSchema.parse({ komut: commandText });
            goster(`Görev başarıyla alındı: ${commandText}`);
            setCommandText('');
        } catch (error) {
            goster(error.errors[0].message, 'error');
        }
    };

    const aiAnalizBaslat = () => {
        setIsAiLoading(true);
        setTimeout(() => {
            setIsAiLoading(false);
            goster('AI Analiz Sonucu: Talep Yüksek', 'success');
            setAiSorgu('');
        }, 1500);
    };

    const veriCek = useCallback(async () => {
        try {
            setStats({ ciro: 1250000, maliyet: 840000, personel: 120000, fire: 2.4, yukleniyor: false });
            setAlarms([
                { id: 1, text: 'Modelhane onay gecikmesi', tip: 'sari', zarar: 2500, neden: 'Tedarikçi Kumaş Gecikmesi' },
                { id: 2, text: 'Kesim makinesi ısınma uyarısı', tip: 'kirmizi', zarar: 8500, neden: 'Aşırı Yükleme / Dinlendirilmedi' }
            ]);
        } catch (err) {
            goster('Hata: ' + err.message, 'error');
        }
    }, []);

    useEffect(() => {
        veriCek();
        const kanal = supabase.channel('karargah-realtime')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                veriCek();
            })
            .subscribe();

        return () => { supabase.removeChannel(kanal); };
    }, [veriCek]);

    return {
        stats, alarms,
        commandText, setCommandText, hizliGorevAtama,
        aiSorgu, setAiSorgu, isAiLoading, aiAnalizBaslat,
        simulasyon, setSimulasyon,
        mesaj
    };
}
