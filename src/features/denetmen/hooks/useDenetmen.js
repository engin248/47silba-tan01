'use client';
/**
 * features/denetmen/hooks/useDenetmen.js
 * M13 Denetmen — Kalite Kontrol & Audit Log
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
    denetimLoglariniGetir, denetimKaydi,
    denetimDurumGuncelle, denetmenKanaliKur,
} from '../services/denetmenApi';

export function useDenetmen(kullanici) {
    const [denetimLoglari, setDenetimLoglari] = useState([]);
    const [sistemLoglari, setSistemLoglari] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [formAcik, setFormAcik] = useState(false);
    const [filtre, setFiltre] = useState('hepsi');
    const [form, setForm] = useState(BOSH_FORM);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const { denetimLoglari: d, sistemLoglari: s } = await denetimLoglariniGetir();
            setDenetimLoglari(d); setSistemLoglari(s);
        } catch (e) { goster('Loglar yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (kullanici?.grup !== 'tam') return;
        const kanal = denetmenKanaliKur(yukle);
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [kullanici, yukle]);

    const kaydet = async () => {
        if (!form.baslik?.trim()) return goster('Başlık zorunlu!', 'error');
        setLoading(true);
        try {
            await denetimKaydi({ ...form, kullanici_adi: kullanici?.label || 'Denetmen' });
            goster('✅ Denetim kaydedildi!');
            setForm(BOSH_FORM); setFormAcik(false); yukle();
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, durum) => {
        try { await denetimDurumGuncelle(id, durum); goster(`✅ Durum: ${durum}`); yukle(); }
        catch (e) { goster(e.message, 'error'); }
    };

    const filtreliDenetim = denetimLoglari.filter(d => filtre === 'hepsi' || d.durum === filtre || d.tip === filtre);
    const istatistik = { toplam: denetimLoglari.length, kritik: denetimLoglari.filter(d => d.kritik).length, bekleyen: denetimLoglari.filter(d => d.durum === 'bekliyor').length, sistemLog: sistemLoglari.length };

    return { denetimLoglari, filtreliDenetim, sistemLoglari, loading, mesaj, formAcik, setFormAcik, form, setForm, filtre, setFiltre, istatistik, kaydet, durumGuncelle };
}

const BOSH_FORM = { baslik: '', aciklama: '', tip: 'uretim_kalite', kritik: false, durum: 'bekliyor' };
