'use client';
/**
 * features/musteriler/hooks/useMusteriler.js
 * M9 Müşteriler & CRM — Sipariş Geçmişi Dahil
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export function useMusteriler(kullanici) {
    const [musteriler, setMusteriler] = useState([]);
    const [secilenMusteri, setSecilenMusteri] = useState(null);
    const [siparisgecmisi, setSiparisGecmisi] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [formAcik, setFormAcik] = useState(false);
    const [aramaMetni, setAramaMetni] = useState('');
    const [form, setForm] = useState(BOSH_FORM);
    const [duzenleId, setDuzenleId] = useState(null);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('b2_musteriler')
                .select('*').order('created_at', { ascending: false }).limit(200);
            if (error) throw error;
            setMusteriler(data || []);
        } catch (e) { goster('Müşteriler yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        const kanal = supabase.channel('musteriler-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_musteriler' }, yukle)
            .subscribe();
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [yukle]);

    const musteriSec = async (musteri) => {
        setSecilenMusteri(musteri);
        try {
            const { data } = await supabase.from('b2_siparisler')
                .select('id,siparis_no,durum,toplam_tutar_tl,created_at')
                .eq('musteri_id', musteri.id).order('created_at', { ascending: false }).limit(50);
            setSiparisGecmisi(data || []);
        } catch (e) { goster('Sipariş geçmişi alınamadı.', 'error'); }
    };

    const kaydet = async () => {
        if (!form.ad_soyad?.trim()) return goster('Ad Soyad zorunlu!', 'error');
        if (!form.telefon?.trim()) return goster('Telefon zorunlu!', 'error');
        setLoading(true);
        try {
            const payload = { ad_soyad: form.ad_soyad.trim(), ad_soyad_ar: form.ad_soyad_ar?.trim() || null, telefon: form.telefon.trim(), email: form.email?.trim() || null, adres: form.adres?.trim() || null, musteri_bolge: form.musteri_bolge || null, notlar: form.notlar?.trim() || null };
            if (!navigator.onLine) { await cevrimeKuyrugaAl('b2_musteriler', duzenleId ? 'UPDATE' : 'INSERT', duzenleId ? { ...payload, id: duzenleId } : payload); goster('⚡ Çevrimdışı: Kuyruğa alındı.'); setFormAcik(false); setLoading(false); return; }
            if (duzenleId) {
                const { error } = await supabase.from('b2_musteriler').update(payload).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Müşteri güncellendi!');
            } else {
                const { error } = await supabase.from('b2_musteriler').insert([payload]);
                if (error) throw error;
                goster('✅ Müşteri eklendi!');
            }
            setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); yukle();
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    const sil = async (id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Müşteri silmek için PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Müşteri silinsin mi?')) return;
        await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b2_musteriler', islem_tipi: 'SILME', kullanici_adi: kullanici?.label || 'CRM', eski_veri: { id } }]).catch(() => { });
        const { error } = await supabase.from('b2_musteriler').delete().eq('id', id);
        if (!error) { goster('Silindi.'); if (secilenMusteri?.id === id) setSecilenMusteri(null); yukle(); }
        else goster(error.message, 'error');
    };

    const filtreliMusteriler = musteriler.filter(m => !aramaMetni || m.ad_soyad?.toLowerCase().includes(aramaMetni.toLowerCase()) || m.telefon?.includes(aramaMetni));

    return { musteriler, filtreliMusteriler, secilenMusteri, siparisgecmisi, loading, mesaj, formAcik, setFormAcik, form, setForm, aramaMetni, setAramaMetni, duzenleId, setDuzenleId, musteriSec, kaydet, sil };
}

export const BOSH_FORM = { ad_soyad: '', ad_soyad_ar: '', telefon: '', email: '', adres: '', musteri_bolge: '', notlar: '' };
export const BOLGELER = ['istanbul', 'ankara', 'izmir', 'anadolu', 'ihracat_korfez', 'ihracat_diger'];
