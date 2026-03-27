'use client';
/**
 * features/kesim/hooks/useKesim.js
 * M17 Kesim Emirleri — Kumaş Kesim Takibi
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import {
    kesimVeriGetir, kesimEmriKaydet as apiKaydet,
    kesimDurumGuncelle, kesimSil as apiSil,
    kesimKanaliKur, BOSH_FORM,
} from '../services/kesimApi';

export function useKesim(kullanici) {
    const [kesimler, setKesimler] = useState([]);
    const [kumaslar, setKumaslar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOSH_FORM);
    const [filtreDurum, setFiltreDurum] = useState('hepsi');

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const { kesimler: k, kumaslar: km } = await kesimVeriGetir();
            setKesimler(k); setKumaslar(km);
        } catch (e) { goster('Kesimler yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        const kanal = kesimKanaliKur(yukle);
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [yukle]);

    const kaydet = async () => {
        if (!form.kumas_id) return goster('Kumaş seçiniz!', 'error');
        if (!form.miktar_mt || parseFloat(form.miktar_mt) <= 0) return goster('Miktar giriniz!', 'error');
        setLoading(true);
        const secilenKumas = kumaslar.find(k => k.id === form.kumas_id);
        try {
            const { offline } = await apiKaydet({ ...form, kumas_kodu: secilenKumas?.kumas_kodu || '', miktar_mt: parseFloat(form.miktar_mt) });
            goster(offline ? '⚡ Çevrimdışı: Kuyruğa alındı.' : '✅ Kesim emri oluşturuldu!');
            setForm(BOSH_FORM); setFormAcik(false); yukle();
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, durum) => {
        try { await kesimDurumGuncelle(id, durum); goster(`✅ Durum: ${durum}`); yukle(); }
        catch (e) { goster(e.message, 'error'); }
    };

    const sil = async (id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Kesim emri silmek için PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Silinsin mi?')) return;
        try { await apiSil(id, kullanici?.label); goster('Silindi.'); yukle(); }
        catch (e) { goster(e.message, 'error'); }
    };

    const filtreliKesimler = kesimler.filter(k => filtreDurum === 'hepsi' || k.durum === filtreDurum);
    const istatistik = { toplam: kesimler.length, bekliyor: kesimler.filter(k => k.durum === 'bekliyor').length, tamamlandi: kesimler.filter(k => k.durum === 'tamamlandi').length };

    return { kesimler, filtreliKesimler, kumaslar, loading, mesaj, formAcik, setFormAcik, form, setForm, filtreDurum, setFiltreDurum, istatistik, kaydet, durumGuncelle, sil };
}
