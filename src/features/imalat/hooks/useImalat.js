'use client';
/**
 * features/imalat/hooks/useImalat.js
 * M7 İmalat Emirleri — Üretim Takibi
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import {
    imalatEmirleriGetir, imalatEmriKaydet as apiKaydet,
    imalatDurumGuncelle, imalatEmriSil as apiSil,
    imalatKanaliKur, BOSH_FORM, DURUMLAR, DURUM_RENK,
} from '../services/imalatApi';

export function useImalat(kullanici) {
    const [emirler, setEmirler] = useState([]);
    const [modeller, setModeller] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOSH_FORM);
    const [filtreDurum, setFiltreDurum] = useState('hepsi');
    const [aramaMetni, setAramaMetni] = useState('');

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const { emirler: e, modeller: m } = await imalatEmirleriGetir();
            setEmirler(e); setModeller(m);
        } catch (e) { goster('İmalat emirleri yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        const kanal = imalatKanaliKur(yukle);
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [yukle]);

    const kaydet = async () => {
        if (!form.model_id) return goster('Model seçiniz!', 'error');
        if (!form.hedef_adet || parseInt(form.hedef_adet) <= 0) return goster('Hedef adet giriniz!', 'error');
        setLoading(true);
        try {
            const { offline } = await apiKaydet({ ...form, hedef_adet: parseInt(form.hedef_adet) });
            goster(offline ? '⚡ Çevrimdışı: Kuyruğa alındı.' : '✅ İmalat emri oluşturuldu!');
            setForm(BOSH_FORM); setFormAcik(false); yukle();
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, durum) => {
        try { await imalatDurumGuncelle(id, durum); goster(`✅ Durum: ${durum}`); yukle(); }
        catch (e) { goster(e.message, 'error'); }
    };

    const sil = async (id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'İmalat emri silmek için PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Silinsin mi?')) return;
        try { await apiSil(id, kullanici?.label); goster('Silindi.'); yukle(); }
        catch (e) { goster(e.message, 'error'); }
    };

    const filtreliEmirler = emirler.filter(e => {
        const durumOk = filtreDurum === 'hepsi' || e.durum === filtreDurum;
        const aramaOk = !aramaMetni || e.model_id?.toLowerCase?.().includes(aramaMetni.toLowerCase());
        return durumOk && aramaOk;
    });

    const istatistik = { toplam: emirler.length, aktif: emirler.filter(e => e.durum === 'uretimde').length, bekleyen: emirler.filter(e => e.durum === 'bekliyor').length, tamamlandi: emirler.filter(e => e.durum === 'tamamlandi').length };

    return { emirler, filtreliEmirler, modeller, loading, mesaj, formAcik, setFormAcik, form, setForm, filtreDurum, setFiltreDurum, aramaMetni, setAramaMetni, istatistik, DURUMLAR, DURUM_RENK, kaydet, durumGuncelle, sil };
}
