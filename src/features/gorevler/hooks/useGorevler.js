'use client';
/**
 * features/gorevler/hooks/useGorevler.js
 * M22 Görevler — Görev Takip Sistemi
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import { telegramBildirim } from '@/lib/utils';

export function useGorevler(kullanici) {
    const [gorevler, setGorevler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtre, setFiltre] = useState('hepsi');
    const [aramaMetni, setAramaMetni] = useState('');
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOSH_FORM);
    const [duzenleId, setDuzenleId] = useState(null);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('b1_gorevler')
                .select('id, baslik, aciklama, atanan_kisi, son_tarih, oncelik, durum, modul').order('created_at', { ascending: false }).limit(200);
            if (error) throw error;
            setGorevler(data || []);
        } catch (e) { goster('Görevler yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        const kanal = supabase.channel('gorevler-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_gorevler' }, yukle)
            .subscribe();
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [yukle]);

    const kaydet = async () => {
        if (!form.baslik?.trim()) return goster('Görev başlığı zorunlu!', 'error');
        setLoading(true);
        try {
            const payload = { baslik: form.baslik.trim(), aciklama: form.aciklama?.trim() || null, oncelik: form.oncelik || 'normal', durum: form.durum || 'bekliyor', bitis_tarihi: form.bitis_tarihi || null, atanan_kisi: form.atanan?.trim() || null };
            if (duzenleId) {
                const { error } = await supabase.from('b1_gorevler').update(payload).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Görev güncellendi!');
            } else {
                const { error } = await supabase.from('b1_gorevler').insert([payload]);
                if (error) throw error;
                if (form.oncelik === 'acil') telegramBildirim(`🚨 ACİL GÖREV!\n${payload.baslik}`);
                goster('✅ Görev eklendi!');
            }
            setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); yukle();
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, yeniDurum) => {
        const { error } = await supabase.from('b1_gorevler').update({ durum: yeniDurum, ...(yeniDurum === 'tamamlandi' ? { tamamlanma_tarihi: new Date().toISOString() } : {}) }).eq('id', id);
        if (!error) { goster(`✅ ${yeniDurum}`); yukle(); } else goster(error.message, 'error');
    };

    const sil = async (id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Görev silmek için PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Silinsin mi?')) return;
        const { error } = await supabase.from('b1_gorevler').delete().eq('id', id);
        if (!error) { goster('Silindi.'); yukle(); } else goster(error.message, 'error');
    };

    const filtreliGorevler = gorevler.filter(g => {
        const durumOk = filtre === 'hepsi' || g.durum === filtre || g.oncelik === filtre;
        const aramaOk = !aramaMetni || g.baslik?.toLowerCase().includes(aramaMetni.toLowerCase());
        return durumOk && aramaOk;
    });

    const istatistik = { toplam: gorevler.length, bekliyor: gorevler.filter(g => g.durum === 'bekliyor').length, devam: gorevler.filter(g => g.durum === 'devam').length, tamamlandi: gorevler.filter(g => g.durum === 'tamamlandi').length, acil: gorevler.filter(g => g.oncelik === 'acil').length };

    return { gorevler, filtreliGorevler, loading, mesaj, filtre, setFiltre, aramaMetni, setAramaMetni, formAcik, setFormAcik, form, setForm, duzenleId, setDuzenleId, istatistik, kaydet, durumGuncelle, sil };
}

export const BOSH_FORM = { baslik: '', aciklama: '', oncelik: 'normal', durum: 'bekliyor', bitis_tarihi: '', atanan: '' };
export const ONCELIKLER = ['dusuk', 'normal', 'yuksek', 'acil'];
export const DURUMLAR = ['bekliyor', 'devam', 'tamamlandi', 'iptal'];
