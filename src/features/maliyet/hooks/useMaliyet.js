'use client';
/**
 * features/maliyet/hooks/useMaliyet.js
 * B-06 FIX: maliyetApi.js'e bağlandı — artık boş şablon değil
 * Tablo: b1_maliyet_kayitlari, b1_model_taslaklari
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
    maliyetleriGetir, modelleriGetir, maliyetKaydet as apiKaydet,
    maliyetGuncelle, maliyetSil as apiSil,
    maliyetKanaliKur, KALEM_TIPLERI, BOSH_FORM,
} from '../services/maliyetApi';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

export function useMaliyet(kullanici) {
    const [maliyetler, setMaliyetler] = useState([]);
    const [modeller, setModeller] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOSH_FORM);
    const [duzenleId, setDuzenleId] = useState(null);
    const [filtreTip, setFiltreTip] = useState('hepsi');
    const [aramaMetni, setAramaMetni] = useState('');

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const [mal, mod] = await Promise.all([
                maliyetleriGetir(),
                modelleriGetir(),
            ]);
            setMaliyetler(mal);
            setModeller(mod);
        } catch (e) {
            goster('Maliyet verileri yüklenemedi: ' + e.message, 'error');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const kanal = maliyetKanaliKur(yukle);
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [yukle]);

    const kaydet = async () => {
        if (!form.order_id) return goster('İş emri seçiniz!', 'error');
        if (!form.tutar_tl || parseFloat(form.tutar_tl) <= 0) return goster('Geçerli tutar giriniz!', 'error');
        if (!form.kalem_aciklama?.trim()) return goster('Açıklama zorunlu!', 'error');
        setLoading(true);
        try {
            const payload = {
                order_id: form.order_id,
<<<<<<< HEAD
                maliyet_tipi: form.maliyet_tipi || 'personel_iscilik',
=======
                kalem_turu: form.kalem_turu || 'personel_iscilik',
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                kalem_aciklama: form.kalem_aciklama.trim(),
                tutar_tl: parseFloat(form.tutar_tl),
                miktar: form.miktar ? parseFloat(form.miktar) : null,
                birim: form.birim || 'adet',
                onay_durumu: 'hesaplandi',
            };
            if (duzenleId) {
                await maliyetGuncelle(duzenleId, payload);
                goster('✅ Maliyet güncellendi!');
            } else {
                const { offline } = await apiKaydet(payload);
                goster(offline ? '⚡ Çevrimdışı: Kuyruğa alındı.' : '✅ Maliyet kaydedildi!');
            }
            setForm(BOSH_FORM);
            setFormAcik(false);
            setDuzenleId(null);
            yukle();
        } catch (e) {
            goster(e.message, 'error');
        }
        setLoading(false);
    };

    const sil = async (id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Maliyet kaydı silmek için PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Maliyet kaydı silinsin mi?')) return;
        try {
            await apiSil(id, kullanici?.label);
            goster('Silindi.');
            yukle();
        } catch (e) {
            goster(e.message, 'error');
        }
    };

    const duzenleAc = (m) => {
        setForm({
            order_id: m.order_id || '',
<<<<<<< HEAD
            maliyet_tipi: m.maliyet_tipi || 'personel_iscilik',
=======
            kalem_turu: m.kalem_turu || m.maliyet_tipi || 'personel_iscilik',
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            kalem_aciklama: m.kalem_aciklama || '',
            tutar_tl: String(m.tutar_tl || ''),
            miktar: String(m.miktar || ''),
            birim: m.birim || 'adet',
        });
        setDuzenleId(m.id);
        setFormAcik(true);
    };

    const filtreliMaliyetler = maliyetler.filter(m => {
<<<<<<< HEAD
        const tipOk = filtreTip === 'hepsi' || m.maliyet_tipi === filtreTip;
=======
        const tipOk = filtreTip === 'hepsi' || m.kalem_turu === filtreTip || m.maliyet_tipi === filtreTip;
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        const aramaOk = !aramaMetni || m.kalem_aciklama?.toLowerCase().includes(aramaMetni.toLowerCase());
        return tipOk && aramaOk;
    });

    const istatistik = {
        toplam: maliyetler.length,
        toplamTutar: maliyetler.reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0),
<<<<<<< HEAD
        personel: maliyetler.filter(m => m.maliyet_tipi === 'personel_iscilik').length,
        isletme: maliyetler.filter(m => m.maliyet_tipi === 'isletme_gideri').length,
=======
        personel: maliyetler.filter(m => m.kalem_turu === 'personel_iscilik' || m.maliyet_tipi === 'personel_iscilik').length,
        isletme: maliyetler.filter(m => m.kalem_turu === 'isletme_gideri' || m.maliyet_tipi === 'isletme_gideri').length,
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    };

    return {
        maliyetler, filtreliMaliyetler, modeller, loading, mesaj,
        formAcik, setFormAcik, form, setForm, duzenleId, setDuzenleId,
        filtreTip, setFiltreTip, aramaMetni, setAramaMetni,
        istatistik, KALEM_TIPLERI,
        kaydet, sil, duzenleAc, yukle,
    };
}
