'use client';
/**
 * features/kalip/hooks/useKalip.js
 * M16 Kalıp Arşivi — Beden & Desen Yönetimi
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import {
    kaliplariGetir, kalipKaydet as apiKaydet,
    kalipGuncelle, kalipSil as apiSil,
    kalipKanaliKur, BOSH_FORM, BEDENLER,
} from '../services/kalipApi';

export function useKalip(kullanici) {
    const [kalipler, setKalipler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOSH_FORM);
    const [duzenleId, setDuzenleId] = useState(null);
    const [aramaMetni, setAramaMetni] = useState('');

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = useCallback(async () => {
        setLoading(true);
        try { setKalipler(await kaliplariGetir()); }
        catch (e) { goster('Kalıplar yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        const kanal = kalipKanaliKur(yukle);
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [yukle]);

    const kaydet = async () => {
        if (!form.kalip_kodu?.trim()) return goster('Kalıp kodu zorunlu!', 'error');
        if (!form.kalip_adi?.trim()) return goster('Kalıp adı zorunlu!', 'error');
        setLoading(true);
        try {
            if (duzenleId) {
                await kalipGuncelle(duzenleId, form);
                goster('✅ Kalıp güncellendi!');
            } else {
                const { offline } = await apiKaydet(form);
                goster(offline ? '⚡ Çevrimdışı: Kuyruğa alındı.' : '✅ Kalıp eklendi!');
            }
            setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); yukle();
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    const sil = async (id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Kalıp silmek için PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Pasif arşive kaldırılsın mı?')) return;
        try { await apiSil(id, kullanici?.label); goster('Arşive kaldırıldı.'); yukle(); }
        catch (e) { goster(e.message, 'error'); }
    };

    const duzenleAc = (k) => { setForm({ kalip_kodu: k.kalip_kodu, kalip_adi: k.kalip_adi, model_kodu: k.model_kodu || '', bedenler: k.bedenler || [], gorsel_url: k.gorsel_url || '', notlar: k.notlar || '' }); setDuzenleId(k.id); setFormAcik(true); };
    const filtreliKalipler = kalipler.filter(k => !aramaMetni || k.kalip_kodu?.toLowerCase().includes(aramaMetni.toLowerCase()) || k.kalip_adi?.toLowerCase().includes(aramaMetni.toLowerCase()));

    return { kalipler, filtreliKalipler, loading, mesaj, formAcik, setFormAcik, form, setForm, duzenleId, aramaMetni, setAramaMetni, BEDENLER, kaydet, sil, duzenleAc };
}
