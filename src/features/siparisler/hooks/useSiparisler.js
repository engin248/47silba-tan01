'use client';
// @ts-nocheck
/**
 * features/siparisler/hooks/useSiparisler.js
 * M10 Siparişler — Tüm State & İş Mantığı
 *
 *   import { useSiparisler } from '@/features/siparisler';
 *   const { siparisler, kaydet, durumGuncelle, ... } = useSiparisler(kullanici);
 */
import { useState, useEffect, useCallback } from 'react';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import { supabase } from '@/lib/supabase';
import {
    fetchSiparisler, fetchSiparisDetay,
    siparisKaydet, durumGuncelle as apiDurumGuncelle,
    siparisSil as apiSiparisSil,
    siparisNoUret, kalemlerToplam,
    BOSH_FORM,
} from '../services/siparislerApi';

export function useSiparisler(kullanici) {
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [siparisler, setSiparisler] = useState([]);
    const [musteriler, setMusteriler] = useState([]);
    const [urunler, setUrunler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    // Form state
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [kalemler, setKalemler] = useState([]);

    // Detay + modal
    const [aktifSiparis, setAktifSiparis] = useState(null);
    const [kargoModal, setKargoModal] = useState(null);
    const [kargoNo, setKargoNo] = useState('');

    // Filtreler
    const [filtreKanal, setFiltreKanal] = useState('hepsi');
    const [filtreDurum, setFiltreDurum] = useState('hepsi');
    const [filtreAcil, setFiltreAcil] = useState(false);
    const [aramaMetni, setAramaMetni] = useState('');

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const { siparisler: s, musteriler: m, urunler: u } = await fetchSiparisler();
            setSiparisler(s); setMusteriler(m); setUrunler(u);
        } catch (e) { goster('Veriler alınamadı: ' + e.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        let satisPin = false;
        try { satisPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { satisPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const ok = kullanici?.grup === 'tam' || satisPin;
        setYetkiliMi(ok);
        if (!ok) return;
        const kanal = supabase.channel('siparisler-realtime')
            .on('postgres_changes', { event: '*', schema: 'public' }, yukle)
            .subscribe();
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [kullanici, yukle]);

    // ── Kalem İşlemleri ────────────────────────────────────────────────────────
    const kalemEkle = () => setKalemler(p => [...p, { urun_id: '', beden: '', renk: '', adet: 1, birim_fiyat_tl: 0, iskonto_pct: 0 }]);
    const kalemGuncelle = (i, alan, val) => {
        const yeni = [...kalemler];
        yeni[i] = { ...yeni[i], [alan]: val };
        if (alan === 'urun_id') {
            const u = urunler.find(u => u.id === val);
            if (u) yeni[i].birim_fiyat_tl = parseFloat(u.satis_fiyati_tl);
        }
        setKalemler(yeni);
    };
    const kalemSil = (i) => setKalemler(p => p.filter((_, idx) => idx !== i));

    // ── Form Validasyon + Kaydet ───────────────────────────────────────────────
    const kaydet = async () => {
        if (!form.siparis_no.trim()) return goster('Sipariş no zorunlu!', 'error');
        if (form.siparis_no.length > 50) return goster('Sipariş no çok uzun!', 'error');
        if (kalemler.length === 0) return goster('En az 1 ürün kalemi zorunlu!', 'error');
        if (kalemler.length > 50) return goster('Maksimum 50 kalem!', 'error');
        if (form.notlar.length > 300) return goster('Notlar çok uzun!', 'error');
        if (kalemler.some(k => !k.urun_id)) return goster('Tüm kalemlerin ürünü seçili olmalı!', 'error');
        if (kalemler.some(k => !k.adet || parseInt(k.adet) < 1)) return goster('Adet 1\'den küçük olamaz!', 'error');
        setLoading(true);
        try {
            await siparisKaydet(form, kalemler);
            goster('✅ Sipariş oluşturuldu!');
            setForm(BOSH_FORM); setKalemler([]); setFormAcik(false); yukle();
        } catch (e) { goster(e.message, 'error'); }
        setLoading(false);
    };

    // ── Durum Güncelle ─────────────────────────────────────────────────────────
    const durumGuncelleAction = async (id, durum, ekstra = {}) => {
        try {
            await apiDurumGuncelle(id, durum, ekstra);
            const mesajMap = { teslim: '✅ Sipariş teslim edildi. Stoklar düşüldü.', kargoda: '🚚 Kargoya verildi.' };
            goster(mesajMap[durum] || 'Durum güncellendi.');
            yukle();
            if (aktifSiparis?.id === id) setAktifSiparis(p => ({ ...p, durum, ...ekstra }));
        } catch (e) { goster(e.message, 'error'); }
    };

    const kargoGonder = async () => {
        if (!kargoModal) return;
        if (kargoNo.length > 50) return goster('Kargo takip no çok uzun!', 'error');
        await durumGuncelleAction(kargoModal.id, 'kargoda', { kargo_takip_no: kargoNo.trim() || null });
        setKargoModal(null); setKargoNo('');
    };

    // ── Silme ────────────────────────────────────────────────────────────────
    const siparisSil = async (id) => {
        const { yetkili, mesaj: m } = await silmeYetkiDogrula(kullanici, 'Silmek için Yönetici PIN girin:');
        if (!yetkili) return goster(m || 'Yetkisiz işlem.', 'error');
        if (!confirm('Sipariş ve tüm kalemleri silinsin mi?')) return;
        try {
            await apiSiparisSil(id, siparisler);
            goster('Sipariş silindi.');
            if (aktifSiparis?.id === id) setAktifSiparis(null);
            yukle();
        } catch (e) { goster(e.message, 'error'); }
    };

    // ── Detay ────────────────────────────────────────────────────────────────
    const detayAc = async (siparis) => {
        setAktifSiparis(siparis);
        try {
            const detay = await fetchSiparisDetay(siparis.id);
            setAktifSiparis({ ...siparis, kalemler: detay });
        } catch (e) { goster('Detaylar okunamadı: ' + e.message, 'error'); }
    };

    // ── Filtreli Liste ────────────────────────────────────────────────────────
    const filtreli = siparisler.filter(s => {
        const kanalOk = filtreKanal === 'hepsi' || s.kanal === filtreKanal;
        const durumOk = filtreDurum === 'hepsi' || s.durum === filtreDurum;
        const acilOk = !filtreAcil || s.acil === true;
        const aramaOk = !aramaMetni || [s.siparis_no, s.b2_musteriler?.ad_soyad, s.kanal]
            .some(v => v?.toLowerCase().includes(aramaMetni.toLowerCase()));
        return kanalOk && durumOk && acilOk && aramaOk;
    });

    const istatistik = {
        toplam: siparisler.length,
        bekleyen: siparisler.filter(s => s.durum === 'beklemede').length,
        kargoda: siparisler.filter(s => s.durum === 'kargoda').length,
        gelir: siparisler.filter(s => s.durum === 'teslim').reduce((s, o) => s + parseFloat(o.toplam_tutar_tl || 0), 0),
        // [KG-09] Kanal dağılımı — gerçek DB verisinden, hardcode değil
        kanalDagilimi: (() => {
            const kanalMap = {};
            siparisler.forEach(s => {
                const k = s.kanal || 'diger';
                if (!kanalMap[k]) kanalMap[k] = { kanal: k, adet: 0, tutar: 0 };
                kanalMap[k].adet++;
                kanalMap[k].tutar += parseFloat(s.toplam_tutar_tl || 0);
            });
            return Object.values(kanalMap)
                .sort((a, b) => b.adet - a.adet)
                .map(k => ({ ...k, yuzde: siparisler.length > 0 ? ((k.adet / siparisler.length) * 100).toFixed(1) : 0 }));
        })(),
    };


    const formSifirla = () => { setForm({ ...BOSH_FORM, siparis_no: siparisNoUret() }); setFormAcik(f => !f); };

    return {
        yetkiliMi, siparisler, musteriler, urunler, loading, mesaj, filtreli, istatistik,
        form, setForm, formAcik, setFormAcik, formSifirla, kalemler,
        kalemEkle, kalemGuncelle, kalemSil, kalemlerToplam: () => kalemlerToplam(kalemler),
        kaydet, aktifSiparis, setAktifSiparis, detayAc,
        kargoModal, setKargoModal, kargoNo, setKargoNo, kargoGonder,
        siparisSil, durumGuncelle: durumGuncelleAction,
        filtreKanal, setFiltreKanal, filtreDurum, setFiltreDurum,
        filtreAcil, setFiltreAcil, aramaMetni, setAramaMetni,
    };
}
