'use client';
/**
 * features/modelhane/hooks/useModelhane.js
 * M5 Modelhane — Tasarım & Model Yönetimi  (versiyon takibi v1/v2 dahil)
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { telegramBildirim } from '@/lib/utils';

export function useModelhane(kullanici) {
    const [modeller, setModeller] = useState([]);
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
            const { data, error } = await supabase.from('b1_model_taslaklari')
                .select('*').order('created_at', { ascending: false }).limit(200);
            if (error) throw error;
            setModeller(data || []);
        } catch (e) { goster('Veri yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        let pin = false;
        try { pin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { pin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        if (!(kullanici?.grup === 'tam' || pin)) return;
        const kanal = supabase.channel('modelhane-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_model_taslaklari' }, yukle)
            .subscribe();
        yukle();
        return () => { supabase.removeChannel(kanal); };
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
            if (!navigator.onLine) {
                await cevrimeKuyrugaAl('b1_model_taslaklari', duzenleId ? 'UPDATE' : 'INSERT', duzenleId ? { ...payload, id: duzenleId } : payload);
                goster('⚡ Çevrimdışı: Kuyruğa alındı.'); setFormAcik(false); setDuzenleId(null); setForm(BOSH_FORM); setLoading(false); return;
            }
            if (duzenleId) {
                // Versiyon artır
                const { data: mevcut } = await supabase.from('b1_model_taslaklari').select('versiyon').eq('id', duzenleId).single();
                payload.versiyon = (mevcut?.versiyon || 1) + 1;
                const { error } = await supabase.from('b1_model_taslaklari').update(payload).eq('id', duzenleId);
                if (error) throw error;
                goster(`✅ Model güncellendi (v${payload.versiyon})`);
            } else {
                const { error } = await supabase.from('b1_model_taslaklari').insert([{ ...payload, versiyon: 1 }]);
                if (error) throw error;
                telegramBildirim(`🎨 YENİ MODEL\n${payload.model_kodu} — ${payload.model_adi}`);
                goster('✅ Model eklendi!');
            }
            setFormAcik(false); setDuzenleId(null); setForm(BOSH_FORM); yukle();
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, yeniDurum) => {
        const { error } = await supabase.from('b1_model_taslaklari').update({ durum: yeniDurum }).eq('id', id);
        if (!error) { goster(`✅ Durum: ${yeniDurum}`); yukle(); }
        else goster(error.message, 'error');
    };

    const sil = async (id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Model silmek için PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Model silinsin mi?')) return;
        await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_model_taslaklari', islem_tipi: 'SILME', kullanici_adi: kullanici?.label || 'Model Sorumlusu', eski_veri: { id } }]).catch(() => { });
        const { error } = await supabase.from('b1_model_taslaklari').delete().eq('id', id);
        if (!error) { goster('Model silindi.'); yukle(); }
        else goster(error.message, 'error');
    };

    const duzenleAc = (m) => { setForm({ model_kodu: m.model_kodu, model_adi: m.model_adi, model_adi_ar: m.model_adi_ar || '', hedef_adet: String(m.hedef_adet || ''), durum: m.durum, aciklama: m.aciklama || '', video_url: m.video_url || '', versiyon: m.versiyon }); setDuzenleId(m.id); setFormAcik(true); };

    const filtreliModeller = modeller.filter(m => {
        const durumOk = filtreDurum === 'hepsi' || m.durum === filtreDurum;
        const aramaOk = !aramaMetni || m.model_kodu?.toLowerCase().includes(aramaMetni.toLowerCase()) || m.model_adi?.toLowerCase().includes(aramaMetni.toLowerCase());
        return durumOk && aramaOk;
    });

    const istatistik = { toplam: modeller.length, taslak: modeller.filter(m => m.durum === 'taslak').length, uretimde: modeller.filter(m => m.durum === 'uretimde').length, tamamlandi: modeller.filter(m => m.durum === 'tamamlandi').length };

    return { modeller, filtreliModeller, loading, mesaj, aramaMetni, setAramaMetni, filtreDurum, setFiltreDurum, formAcik, setFormAcik, duzenleId, form, setForm, istatistik, kaydet, durumGuncelle, sil, duzenleAc };
}

export const BOSH_FORM = { model_kodu: '', model_adi: '', model_adi_ar: '', hedef_adet: '', durum: 'taslak', aciklama: '', video_url: '', versiyon: 1 };
export const DURUMLAR = ['taslak', 'onaylandi', 'uretimde', 'tamamlandi', 'iptal'];
