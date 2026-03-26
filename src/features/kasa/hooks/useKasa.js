'use client';
// @ts-nocheck
/**
 * features/kasa/hooks/useKasa.js
 * M6 Kasa — Nakit Akış Yönetimi
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import {
    kasaHareketleriGetir, kasaHareketiKaydet as apiKaydet,
    kasaHareketiSil as apiSil, kasaBakiyeHesapla,
    kasaKanaliKur, BOSH_HAREKET,
} from '../services/kasaApi';

export function useKasa(kullanici) {
    const [hareketler, setHareketler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOSH_HAREKET);
    const [filtre, setFiltre] = useState('hepsi');
    const [aramaMetni, setAramaMetni] = useState('');

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = useCallback(async () => {
        setLoading(true);
        try { setHareketler(await kasaHareketleriGetir()); }
        catch (e) { goster('Kasa yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        const kanal = kasaKanaliKur(yukle);
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [yukle]);

    const kaydet = async () => {
        if (!form.tutar_tl || parseFloat(form.tutar_tl) <= 0) return goster('Tutar zorunlu!', 'error');
        setLoading(true);
        try {
            const { offline } = await apiKaydet({ ...form, tutar_tl: parseFloat(form.tutar_tl) });
            goster(offline ? '⚡ Çevrimdışı: Kuyruğa alındı.' : '✅ Kasa hareketi kaydedildi!');
            setForm(BOSH_HAREKET); setFormAcik(false); yukle();
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    const sil = async (id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Kasa hareketi silmek için PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Silinsin mi?')) return;
        try { await apiSil(id, kullanici?.label); goster('Silindi.'); yukle(); }
        catch (e) { goster(e.message, 'error'); }
    };

    const filtreliHareketler = hareketler.filter(h => {
        const tipOk = filtre === 'hepsi' || h.hareket_tipi === filtre;
        const aramaOk = !aramaMetni || h.aciklama?.toLowerCase().includes(aramaMetni.toLowerCase());
        return tipOk && aramaOk;
    });

    const bakiye = kasaBakiyeHesapla(hareketler);

    // [KK-01] Ödeme yöntemi dağılımı — gerçek DB verisi
    const odemeYontemi = ['nakit', 'kart', 'eft', 'havale', 'diger'];
    const odemeYontemiDagilimi = odemeYontemi.map(yontem => {
        const hareketler_filtreli = hareketler.filter(h => h.odeme_yontemi === yontem);
        const toplam = hareketler_filtreli.reduce((t, h) => t + parseFloat(h.tutar_tl || 0), 0);
        return { yontem, toplam, adet: hareketler_filtreli.length };
    }).filter(y => y.adet > 0);

    const toplamIslemTutari = hareketler.reduce((t, h) => t + parseFloat(h.tutar_tl || 0), 0);

    const istatistik = {
        bakiye,
        toplamGelir: hareketler.filter(h => h.hareket_tipi === 'gelir').reduce((t, h) => t + parseFloat(h.tutar_tl || 0), 0),
        toplamGider: hareketler.filter(h => h.hareket_tipi === 'gider').reduce((t, h) => t + parseFloat(h.tutar_tl || 0), 0),
        odemeYontemiDagilimi,
        toplamIslemTutari,
    };


    return { hareketler, filtreliHareketler, loading, mesaj, formAcik, setFormAcik, form, setForm, filtre, setFiltre, aramaMetni, setAramaMetni, istatistik, kaydet, sil };
}
