'use client';
/**
 * features/ajanlar/hooks/useAjanlar.js
 * M19 AI Ajanlar — Tüm State & İş Mantığı
 * KAPSAM DIŞI: e-Fatura (GİB), SSK/SGK otomasyonu
 *
 *   import { useAjanlar } from '@/features/ajanlar';
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import {
    fetchGorevler, gorevOlustur, gorevCalistir as apiCalistir,
    gorevSil as apiSil, konfigurasyonOku, konfigurasyonKaydet,
    istatistikHesapla, BOS_FORM,
} from '../services/ajanlarApi';

// VARSAYILAN_KONFIGUR için AjanlarMainContainer'dan referans alacak;
// Bu hook'ta sadece localStorage'dan okuma yapılır, yoksa null döner.
// Container, kendi VARSAYILAN_KONFIGUR'unu hook'a parametre olarak verebilir.
export const VARSAYILAN_KONFIGUR = null; // Konteyner kendi config'ini sağlar

export function useAjanlar(kullanici) {
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [gorevler, setGorevler] = useState(/** @type {any[]} */([]));
    const [loading, setLoading] = useState(true);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [form, setForm] = useState(BOS_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [calistiriliyor, setCalistiriliyor] = useState({});
    const [filtre, setFiltre] = useState('hepsi');
    const [secilenGorev, setSecilenGorev] = useState(null);
    const [sekme, setSekme] = useState('gorevler');
    const [istatistik, setIstatistik] = useState({ toplam: 0, tamamlandi: 0, calisıyor: 0, hata: 0, bekliyor: 0 });
    const [konfig, setKonfig] = useState(() => konfigurasyonOku() || VARSAYILAN_KONFIGUR);
    const pollingRef = useRef(/** @type {any} */(null));
    const realtimeBagliRef = useRef(false);


    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const yukle = useCallback(async () => {
        try {
            const data = await fetchGorevler();
            setGorevler(data);
            setIstatistik(istatistikHesapla(data));
        } catch (e) { goster('Görevler yüklenemedi: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        let pin = false;
        try { pin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { pin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const ok = kullanici?.grup === 'tam' || pin;
        setYetkiliMi(ok);
        if (!ok) return;
        // [DÜZELTME]: Realtime bağlandığında realtimeBagliRef = true → polling devreye girmez
        const kanal = supabase.channel('ajanlar-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_ajan_gorevler' }, yukle)
            .subscribe((status) => {
                realtimeBagliRef.current = (status === 'SUBSCRIBED');
            });
        yukle();
        return () => {
            realtimeBagliRef.current = false;
            supabase.removeChannel(kanal);
        };
    }, [kullanici, yukle]);

    // [DÜZELTME]: Polling → sadece realtime koptuğunda fallback (double-fire engellendi)
    useEffect(() => {
        pollingRef.current = setInterval(() => {
            if (!realtimeBagliRef.current && gorevler.some(g => g.durum === 'calisıyor')) yukle();
        }, 5000);
        return () => clearInterval(pollingRef.current);
    }, [gorevler, yukle]);


    const gorevGonderAction = async () => {
        if (!form.gorev_adi.trim()) return goster('Görev adı zorunlu!', 'error');
        if (!form.gorev_emri.trim()) return goster('Görev emri zorunlu!', 'error');
        if (form.gorev_adi.length > 100) return goster('Görev adı çok uzun!', 'error');
        if (form.gorev_emri.length > 1000) return goster('Görev emri max 1000 karakter!', 'error');

        try {
            const data = await gorevOlustur(form);
            goster('✅ Görev oluşturuldu ve kuyruğa alındı!');
            setForm(BOS_FORM); setFormAcik(false); yukle();
            // Acil görevler otomatik başlatılır
            if (form.oncelik === 'acil') setTimeout(() => gorevCalistirAction(data.id), 500);
        } catch (e) {
            if (!navigator.onLine || e.message?.includes('fetch')) {
                await cevrimeKuyrugaAl({ tablo: 'b1_ajan_gorevler', islem_tipi: 'INSERT', veri: { ...form, durum: 'bekliyor' } });
                goster('İnternet yok: Görev çevrimdışı kuyruğa alındı.');
                setForm(BOS_FORM); setFormAcik(false);
            } else {
                goster(e.message, 'error');
            }
        }
    };

    const gorevCalistirAction = async (gorevId) => {
        setCalistiriliyor(p => ({ ...p, [gorevId]: true }));
        try {
            await apiCalistir(gorevId);
            goster('✅ Görev tamamlandı!');
        } catch (e) { goster('⚠️ ' + e.message, 'error'); }
        setCalistiriliyor(p => ({ ...p, [gorevId]: false }));
        yukle();
    };

    const gorevSilAction = async (id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Ajan görevini silmek için PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Görevi sil?')) return;
        try {
            await apiSil(id, kullanici?.label);
            setGorevler(p => p.filter(g => /** @type {any} */(g).id !== id));
            if (/** @type {any} */(secilenGorev)?.id === id) setSecilenGorev(null);

            goster('Görev silindi!');
        } catch (e) { goster('Silinemedi: ' + e.message, 'error'); }
    };

    const gorevToggle = (ajanKey, gorevId) => {
        const yeni = { ...konfig };
        const idx = yeni[ajanKey].gorevler.findIndex(g => g.id === gorevId);
        yeni[ajanKey].gorevler[idx] = { ...yeni[ajanKey].gorevler[idx], aktif: !yeni[ajanKey].gorevler[idx].aktif };
        setKonfig(yeni);
        konfigurasyonKaydet(yeni);
        goster(`${yeni[ajanKey].gorevler[idx].aktif ? '✅ Aktif' : '⏸ Pasif'}: ${yeni[ajanKey].gorevler[idx].ad}`);
    };

    const filtreliGorevler = filtre === 'hepsi' ? gorevler : gorevler.filter(g => g.durum === filtre);

    return {
        yetkiliMi, gorevler, filtreliGorevler, loading, mesaj, istatistik,
        form, setForm, formAcik, setFormAcik,
        calistiriliyor, filtre, setFiltre,
        secilenGorev, setSecilenGorev,
        sekme, setSekme, konfig,
        gorevGonder: gorevGonderAction,
        gorevCalistir: gorevCalistirAction,
        gorevSil: gorevSilAction,
        gorevToggle,
    };
}
