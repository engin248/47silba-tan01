'use client';
/**
 * features/guvenlik/hooks/useGuvenlik.js
 * M24 Güvenlik — RBAC + Audit Log + Giriş Kilidi
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useGuvenlik(kullanici) {
    const [loglar, setLoglar] = useState([]);
    const [girisGirisimleri, setGirisGirisimleri] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtre, setFiltre] = useState({ islem: 'hepsi', tarih: '' });

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const [logRes, girisRes] = await Promise.allSettled([
                supabase.from('b0_sistem_loglari').select('*').order('created_at', { ascending: false }).limit(200),
                supabase.from('b0_giris_girisimleri').select('*').order('created_at', { ascending: false }).limit(50),
            ]);
            if (logRes.status === 'fulfilled') setLoglar(logRes.value.data || []);
            if (girisRes.status === 'fulfilled') setGirisGirisimleri(girisRes.value.data || []);
        } catch (e) { goster('Log yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (kullanici?.grup !== 'tam') return;
        const kanal = supabase.channel('guvenlik-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b0_sistem_loglari' }, yukle)
            .subscribe();
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [kullanici, yukle]);

    const kilidAc = async (kullaniciAdi) => {
        const { error } = await supabase.from('b0_giris_girisimleri').update({ kilitli: false, deneme_sayisi: 0 }).eq('kullanici_adi', kullaniciAdi);
        if (!error) { goster(`✅ ${kullaniciAdi} kilidi açıldı.`); yukle(); }
        else goster(error.message, 'error');
    };

    const filtreliLoglar = loglar.filter(l => {
        const islemOk = filtre.islem === 'hepsi' || l.islem_tipi === filtre.islem;
        const tarihOk = !filtre.tarih || l.created_at?.startsWith(filtre.tarih);
        return islemOk && tarihOk;
    });

    const kilitliHesaplar = girisGirisimleri.filter(g => g.kilitli);

    const istatistik = {
        toplamLog: loglar.length,
        silme: loglar.filter(l => l.islem_tipi === 'SILME').length,
        guncelleme: loglar.filter(l => l.islem_tipi === 'UPDATE').length,
        kilitliHeap: kilitliHesaplar.length,
    };

    return { loglar, filtreliLoglar, girisGirisimleri, kilitliHesaplar, loading, mesaj, filtre, setFiltre, istatistik, kilidAc, yukle };
}
