'use client';
/**
 * features/stok/hooks/useStok.js
 * M11 Stok & Depo — Tüm State & İş Mantığı
 *
 *   import { useStok } from '@/features/stok';
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import {
    stokVeriGetir, stokHareketiKaydet as apiKaydet,
    stokHareketSil as apiSil, kritikStokKontrol,
    stokKanaliKur, BOSH_HAREKET,
} from '../services/stokApi';

export function useStok(kullanici, erisim) {
    const [stokEnvanteri, setStokEnvanteri] = useState([]);
    const [hareketler, setHareketler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [formAcik, setFormAcik] = useState(false);
    const [yeniHareket, setYeniHareket] = useState(BOSH_HAREKET);
    const [arama, setArama] = useState('');

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const { stokEnvanteri: s, hareketler: h } = await stokVeriGetir();
            setStokEnvanteri(s);
            setHareketler(h);
        } catch (e) { goster('Ağ veya zaman aşımı: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (erisim === 'yok') return;
        const kanal = stokKanaliKur(yukle);
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [erisim, yukle]);

    const stokHareketiKaydetAction = async () => {
        if (!yeniHareket.urun_id) return goster('Lütfen bir ürün seçin!', 'error');
        if (!yeniHareket.adet || yeniHareket.adet <= 0) return goster('Adet sıfırdan büyük olmalı!', 'error');
        setLoading(true);
        const payload = {
            urun_id: yeniHareket.urun_id,
            hareket_tipi: yeniHareket.hareket_tipi,
            adet: parseInt(yeniHareket.adet, 10),
            aciklama: yeniHareket.aciklama.trim() || 'Belirtilmedi',
        };
        try {
            const { offline } = await apiKaydet(payload);
            if (offline) {
                goster('⚡ Çevrimdışı: Stok hareketi kuyruğa alındı.');
            } else {
                goster('✅ Depo işlemi mühürlendi!');
                // Kritik stok alarm
                const urun = stokEnvanteri.find(u => u.id === payload.urun_id);
                if (urun) {
                    let net = urun.net_stok;
                    if (payload.hareket_tipi === 'giris' || payload.hareket_tipi === 'iade') net += payload.adet;
                    if (payload.hareket_tipi === 'cikis' || payload.hareket_tipi === 'fire') net -= payload.adet;
                    kritikStokKontrol(urun, net, payload);
                }
                yukle();
            }
            setYeniHareket(BOSH_HAREKET);
            setFormAcik(false);
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    const hareketSil = async (id, urunKodu) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Hareketi iptal için PIN:');
        if (!yetkili) return goster(m || 'Yetkisiz.', 'error');
        if (!confirm('Bu hareketi sil?')) return;
        try {
            await apiSil(id, urunKodu, kullanici?.label);
            goster('Kayıt silindi ve B0\'a raporlandı.');
            yukle();
        } catch (e) { goster(e.message, 'error'); }
    };

    const filtrelenmisStok = stokEnvanteri.filter(s =>
        s.urun_kodu?.toLowerCase().includes(arama.toLowerCase()) ||
        s.urun_adi?.toLowerCase().includes(arama.toLowerCase())
    );

    return {
        stokEnvanteri, filtrelenmisStok, hareketler, loading, mesaj,
        formAcik, setFormAcik, yeniHareket, setYeniHareket,
        arama, setArama, stokHareketiKaydet: stokHareketiKaydetAction, hareketSil,
    };
}
