'use client';
/**
 * features/muhasebe/hooks/useMuhasebe.js
 * M14 Muhasebe — Tüm State & İş Mantığı
 *
 *   import { useMuhasebe } from '@/features/muhasebe';
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import {
    fetchMuhasebeVerileri, fetchIlgiliMaliyetler,
    durumGuncelle as apiDurumGuncelle, devirKapat as apiDevirKapat,
    uretimdenRaporOlustur as apiRaporOlustur, maliyetiSenkronize as apiSenkronize,
    duzenleKaydet as apiDuzenleKaydet, raporSil as apiRaporSil,
} from '../services/muhasebeApi';

export function useMuhasebe(kullanici) {
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [raporlar, setRaporlar] = useState([]);
    const [raporsizemOrders, setRaporsizemOrders] = useState([]);
    const [secilenRapor, setSecilenRapor] = useState(null);
    const [ilgiliMaliyetler, setIlgiliMaliyetler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [aramaMetni, setAramaMetni] = useState('');
    const [duzenleModal, setDuzenleModal] = useState(null);
    const [duzenleForm, setDuzenleForm] = useState({ zayiat_adet: '', hedeflenen_maliyet_tl: '', notlar: '' });

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const { raporlar: r, raporsizemOrders: o } = await fetchMuhasebeVerileri();
            setRaporlar(r); setRaporsizemOrders(o);
        } catch (e) { goster('Ağ bağlantısı koptu! ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        let pin = false;
        try { pin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { pin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const ok = kullanici?.grup === 'tam' || pin;
        setYetkiliMi(ok);
        if (!ok) return;
        const kanal = supabase.channel('muhasebe-realtime')
            .on('postgres_changes', { event: '*', schema: 'public' }, yukle)
            .subscribe();
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [kullanici, yukle]);

    const raporSec = async (rapor) => {
        setSecilenRapor(rapor);
        try {
            const detay = await fetchIlgiliMaliyetler(rapor.order_id);
            setIlgiliMaliyetler(detay);
        } catch (e) { goster('Detay yüklenemedi: ' + e.message, 'error'); }
    };

    const durumGuncelleAction = async (id, yeniDurum) => {
        try {
            const res = await apiDurumGuncelle(id, yeniDurum, kullanici?.label);
            goster(res.offline ? '⚡ Çevrimdışı: kuyruğa alındı.' : `✅ Rapor durumu: ${yeniDurum}`);
            yukle();
            if (secilenRapor?.id === id) setSecilenRapor(p => ({ ...p, rapor_durumu: yeniDurum }));
        } catch (e) { goster('Hata: ' + e.message, 'error'); }
    };

    const devirKapatAction = async (rapor) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Devir işlemi için Koordinatör PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz işlem.', 'error');
        if (!confirm('Bu raporu onaylıyor ve 2. Birime devir için kilitleniyor musunuz?')) return;
        try {
            const res = await apiDevirKapat(rapor, kullanici?.label);
            goster(res.offline ? '⚡ Çevrimdışı: Devir kuyruğa yazıldı!' : '✅ Rapor kilitlendi. 2. Birime devir tamamlandı!');
            yukle(); setSecilenRapor(null);
        } catch (e) { goster('Devir hatası: ' + e.message, 'error'); }
    };

    const uretimdenRaporOlusturAction = async (model) => {
        setLoading(true);
        try {
            const res = await apiRaporOlustur(model);
            goster(res.offline
                ? '⚡ Çevrimdışı: Rapor tablete kaydedildi.'
                : `✅ ${model.model_adi} için rapor oluşturuldu. Toplam: ₺${res.toplam.toFixed(2)}`);
            yukle();
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    const maliyetiSenkronizeAction = async (rapor) => {
        try {
            const toplam = await apiSenkronize(rapor);
            goster(`✅ Maliyet güncellendi: ₺${toplam.toFixed(2)}`);
            yukle();
            if (secilenRapor?.id === rapor.id) setSecilenRapor(p => ({ ...p, gerceklesen_maliyet_tl: toplam }));
        } catch (e) { goster('Senkronizasyon hatası: ' + e.message, 'error'); }
    };

    const duzenleAc = (rapor) => {
        if (rapor.rapor_durumu === 'kilitlendi') return goster('Kilitli raporlar düzenlenemez!', 'error');
        setDuzenleForm({
            zayiat_adet: String(rapor.zayiat_adet || 0),
            hedeflenen_maliyet_tl: String(rapor.hedeflened_maliyet_tl || ''),
            notlar: rapor.notlar || '',
        });
        setDuzenleModal(rapor);
    };

    const duzenleKaydetAction = async () => {
        if (!duzenleModal) return;
        setLoading(true);
        try {
            const payload = await apiDuzenleKaydet(duzenleModal.id, duzenleForm);
            goster('✅ Rapor güncellendi!');
            yukle();
            if (secilenRapor?.id === duzenleModal.id) setSecilenRapor(p => ({ ...p, ...payload }));
            setDuzenleModal(null);
        } catch (e) { goster('Düzenleme hatası: ' + e.message, 'error'); }
        setLoading(false);
    };

    const raporSilAction = async (rapor) => {
        if (rapor.rapor_durumu === 'kilitlendi') return goster('Kilitli raporlar silinemez!', 'error');
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Raporu silmek için Yönetici PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm(`"${rapor.model_kodu || rapor.id?.slice(0, 8)}" raporunu siliyorsunuz. Emin misiniz?`)) return;
        try {
            await apiRaporSil(rapor, kullanici?.label);
            goster('Rapor silindi.');
            if (secilenRapor?.id === rapor.id) setSecilenRapor(null);
            yukle();
        } catch (e) { goster('Silme hatası: ' + e.message, 'error'); }
    };

    const filtreliRaporlar = raporlar.filter(r =>
        !aramaMetni ||
        r.model_kodu?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        r.model_adi?.toLowerCase().includes(aramaMetni.toLowerCase())
    );

    const istatistik = {
        toplam: raporlar.length,
        bekleyen: raporlar.filter(r => r.rapor_durumu === 'sef_onay_bekliyor').length,
        onaylandi: raporlar.filter(r => r.rapor_durumu === 'onaylandi').length,
        kilitli: raporlar.filter(r => r.rapor_durumu === 'kilitlendi').length,
    };

    return {
        yetkiliMi, raporlar, raporsizemOrders, filtreliRaporlar, istatistik, loading, mesaj,
        secilenRapor, setSecilenRapor, ilgiliMaliyetler, raporSec,
        aramaMetni, setAramaMetni,
        durumGuncelle: durumGuncelleAction,
        devirKapat: devirKapatAction,
        uretimdenRaporOlustur: uretimdenRaporOlusturAction,
        maliyetiSenkronize: maliyetiSenkronizeAction,
        duzenleModal, setDuzenleModal, duzenleForm, setDuzenleForm,
        duzenleAc, duzenleKaydet: duzenleKaydetAction,
        raporSil: raporSilAction,
    };
}
