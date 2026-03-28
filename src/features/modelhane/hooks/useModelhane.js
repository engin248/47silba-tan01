'use client';
/**
 * features/modelhane/hooks/useModelhane.js
 * M5 Modelhane — Tasarım & Model Yönetimi  (versiyon takibi v1/v2 dahil)
 */
import { useState, useEffect, useCallback } from 'react';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import { telegramBildirim } from '@/lib/utils';
import {
    modelleriGetir, modelEkle, modelGuncelle,
    modelDurumGuncelle, modelSil, logNumuneDikimi,
    modelhaneKanaliKur
} from '../services/modelhaneApi';

export function useModelhane(kullanici) {
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [modeller, setModeller] = useState(/** @type {any[]} */([]));
    const [m3Talepleri, setM3Talepleri] = useState(/** @type {any[]} */([]));
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [aramaMetni, setAramaMetni] = useState('');
    const [filtreDurum, setFiltreDurum] = useState('hepsi');
    const [formAcik, setFormAcik] = useState(false);
    const [duzenleId, setDuzenleId] = useState(null);
    const [form, setForm] = useState(BOSH_FORM);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const data = await modelleriGetir();
            setModeller(data.modeller || []);
            setM3Talepleri(data.kaliplar || []);
        } catch (e) { goster('Veri yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        let pin = false;
        try { pin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { pin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const ok = kullanici?.grup === 'tam' || pin;
        setYetkiliMi(ok);
        if (!ok) return;

        const kanal = modelhaneKanaliKur(yukle);
        yukle();
        return () => { kanal.unsubscribe(); };
    }, [kullanici, yukle]);

    const kaydet = async () => {
        if (!form.model_kodu?.trim()) return goster('Model kodu zorunlu!', 'error');
        if (!form.model_adi?.trim()) return goster('Model adı zorunlu!', 'error');
        setLoading(true);
        try {
            const payload = {
                model_kodu: form.model_kodu.toUpperCase().trim(),
                model_adi: form.model_adi.trim(),
                model_adi_ar: form.model_adi_ar?.trim() || null,
                hedef_adet: parseInt(form.hedef_adet) || 0,
                durum: form.durum || 'taslak',
                aciklama: form.aciklama?.trim() || null,
                video_url: form.video_url?.trim() || null,
                versiyon: form.versiyon || 1,
            };
            if (duzenleId) {
                const result = await modelGuncelle(duzenleId, payload, form.versiyon);
                if (result.offline) goster('⚡ Çevrimdışı: Kuyruğa alındı.');
                else goster(`✅ Model güncellendi (v${result.versiyon})`);
            } else {
                const result = await modelEkle(payload);
                if (result.offline) goster('⚡ Çevrimdışı: Kuyruğa alındı.');
                else {
                    telegramBildirim(`🎨 YENİ MODEL\n${payload.model_kodu} — ${payload.model_adi}`);
                    goster('✅ Model eklendi!');
                }
            }
            setFormAcik(false); setDuzenleId(null); setForm(BOSH_FORM); yukle();
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, yeniDurum) => {
        try {
            await modelDurumGuncelle(id, yeniDurum);
            goster(`✅ Durum: ${yeniDurum}`); yukle();
        } catch (error) { goster(error.message, 'error'); }
    };

    const sil = async (id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Model silmek için PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Model silinsin mi?')) return;

        try {
            await modelSil(id, kullanici?.label || 'Model Sorumlusu');
            goster('Model silindi.'); yukle();
        } catch (error) { goster(error.message, 'error'); }
    };

    const duzenleAc = (m) => { setForm({ model_kodu: m.model_kodu, model_adi: m.model_adi, model_adi_ar: m.model_adi_ar || '', hedef_adet: String(m.hedef_adet || ''), durum: m.durum, aciklama: m.aciklama || '', video_url: m.video_url || '', versiyon: m.versiyon }); setDuzenleId(m.id); setFormAcik(true); };

    // NUMUNE BANDI YÖNETİMİ (M4 Kronometre Bitişi)
    const numuneDikimiBitir = async (model_id, sureSn) => {
        try {
            await logNumuneDikimi(model_id, sureSn);
            goster('Dikim süresi maliyet hanesine yazıldı.', 'success');
            yukle(); // Ekrani yenile
        } catch (e) {
            goster('Hata: ' + e.message, 'error');
        }
    };

    const filtreliModeller = modeller.filter(m => {
        const durumOk = filtreDurum === 'hepsi' || m.durum === filtreDurum;
        const aramaOk = !aramaMetni || m.model_kodu?.toLowerCase().includes(aramaMetni.toLowerCase()) || m.model_adi?.toLowerCase().includes(aramaMetni.toLowerCase());
        return durumOk && aramaOk;
    });

    // M3'ten Numunesi dikilmemişler (Sol bölme)
    const m3DikimBekleyenler = m3Talepleri.filter(k => k.b1_model_taslaklari?.durum !== 'numune_dikildi' && k.b1_model_taslaklari?.durum !== 'uretime_hazir');

    // Numunesi dikilmiş, Prova ve Teknik Analizi bekleyen modeller (Sağ bölme)
    const teknikAnalizVerileri = modeller.filter(m => m.durum === 'numune_dikildi' || m.durum === 'iptal_riskli');

    const istatistik = { toplam: modeller.length, taslak: modeller.filter(m => m.durum === 'taslak').length, uretimde: modeller.filter(m => m.durum === 'uretimde').length, tamamlandi: modeller.filter(m => m.durum === 'tamamlandi').length };

    return { yetkiliMi, modeller, m3Talepleri: m3DikimBekleyenler, teknikAnalizVerileri, numuneDikimiBitir, filtreliModeller, loading, mesaj, aramaMetni, setAramaMetni, filtreDurum, setFiltreDurum, formAcik, setFormAcik, duzenleId, form, setForm, istatistik, kaydet, durumGuncelle, sil, duzenleAc };
}

export const BOSH_FORM = { model_kodu: '', model_adi: '', model_adi_ar: '', hedef_adet: '', durum: 'taslak', aciklama: '', video_url: '', versiyon: 1 };
export const DURUMLAR = ['taslak', 'onaylandi', 'uretimde', 'tamamlandi', 'iptal'];
