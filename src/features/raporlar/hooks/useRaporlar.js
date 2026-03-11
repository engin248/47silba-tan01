'use client';
/**
 * features/raporlar/hooks/useRaporlar.js
 * M11 Raporlar & Analiz — Tüm State & İş Mantığı
 *
 *   import { useRaporlar } from '@/features/raporlar';
 *   const { veriler, plRaporu, personelRapor, yukle, csvIndir ... } = useRaporlar(kullanici);
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatTarih, telegramBildirim } from '@/lib/utils';

// ── CSV Export yardımcısı ─────────────────────────────────────────────────────
export function csvIndir(baslik, satirlar, dosyaAdi) {
    const encode = (val) => {
        const s = String(val ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const icerik = [baslik, ...satirlar].map(r => r.map(encode).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + icerik], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${dosyaAdi}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ── Sabitler ──────────────────────────────────────────────────────────────────
export const DURUM_RENK = {
    beklemede: '#f59e0b', onaylandi: '#3b82f6', hazirlaniyor: '#8b5cf6',
    kargoda: '#f97316', teslim: '#10b981', iptal: '#ef4444',
};
export const DURUM_LABEL = {
    beklemede: 'Beklemede', onaylandi: 'Onaylandı', hazirlaniyor: 'Hazırlanıyor',
    kargoda: 'Kargoda', teslim: 'Teslim', iptal: 'İptal',
};
export const MAL_LABEL = {
    personel_iscilik: 'Personel İşçilik', isletme_gideri: 'İşletme Gideri',
    sarf_malzeme: 'Sarf Malzeme', fire_kaybi: 'Fire Kaybı',
};
export const MAL_RENK = {
    personel_iscilik: '#3b82f6', isletme_gideri: '#f59e0b',
    sarf_malzeme: '#10b981', fire_kaybi: '#ef4444',
};
export const SEKMELER = [
    { id: 'genel', label: '📊 Genel Özet' },
    { id: 'birim_maliyet', label: '💰 Birim Maliyet' },
    { id: 'pl', label: '📈 Kar & Zarar' },
    { id: 'siparisler', label: '🛍️ Siparişler' },
    { id: 'personel', label: '👷 Personel' },
];

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useRaporlar(kullanici) {
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [aktifSekme, setAktifSekme] = useState('genel');
    const [baslangic, setBaslangic] = useState('');
    const [bitis, setBitis] = useState('');
    const [indiriyor, setIndiriyor] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    const [veriler, setVeriler] = useState({
        modeller: 0, kumaslar: 0, siparis: 0, personel: 0, uretim: 0, aktifUretim: 0,
        siparislerListesi: [], malGrup: {}, durumSay: {}, toplamCiro: 0, loading: true,
    });
    const [birimMaliyetler, setBirimMaliyetler] = useState([]);
    const [plRaporu, setPlRaporu] = useState({ gelir: 0, gider: 0, kar: 0, marj: 0 });
    const [personelRapor, setPersonelRapor] = useState([]);

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const yukle = useCallback(async () => {
        setVeriler(p => ({ ...p, loading: true }));
        const tarihFiltre = (sorgu) => {
            if (baslangic) sorgu = sorgu.gte('created_at', new Date(baslangic).toISOString());
            if (bitis) sorgu = sorgu.lte('created_at', new Date(bitis + 'T23:59:59').toISOString());
            return sorgu;
        };
        try {
            const [m, k, s, p, ml, sl, _muh, maliyetGrup] = await Promise.all([
                supabase.from('b1_model_taslaklari').select('id', { count: 'exact', head: true }),
                supabase.from('b1_kumas_arsivi').select('id', { count: 'exact', head: true }),
                tarihFiltre(supabase.from('b2_siparisler').select('id,durum,toplam_tutar_tl,created_at', { count: 'exact' })).order('created_at', { ascending: false }).limit(200),
                supabase.from('b1_personel').select('id', { count: 'exact', head: true }),
                tarihFiltre(supabase.from('b1_maliyet_kayitlari').select('maliyet_tipi,tutar_tl,order_id')).limit(200),
                tarihFiltre(supabase.from('b2_siparisler').select('durum,toplam_tutar_tl')).limit(200),
                supabase.from('b1_muhasebe_raporlari').select('*').eq('devir_durumu', true).limit(200),
                supabase.from('b1_maliyet_kayitlari').select('order_id,tutar_tl').not('order_id', 'is', null).limit(500),
            ]);

            // Maliyet grubu hesapla
            const malGrup = {};
            (ml.data || []).forEach(r => {
                malGrup[r.maliyet_tipi] = (malGrup[r.maliyet_tipi] || 0) + parseFloat(r.tutar_tl || 0);
            });

            // Sipariş durum dağılımı
            const durumSay = {};
            (sl.data || []).forEach(r => { durumSay[r.durum] = (durumSay[r.durum] || 0) + 1; });
            const toplamCiro = (sl.data || [])
                .filter(r => r.durum === 'teslim')
                .reduce((s, r) => s + parseFloat(r.toplam_tutar_tl || 0), 0);

            // Birim maliyet hesapla
            const { data: modelList } = await supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500);
            const malOrderGrup = {};
            (maliyetGrup.data || []).forEach(r => {
                if (!malOrderGrup[r.order_id]) malOrderGrup[r.order_id] = 0;
                malOrderGrup[r.order_id] += parseFloat(r.tutar_tl || 0);
            });
            const bm = Object.entries(malOrderGrup).map(([oid, toplam]) => {
                const model = (modelList || []).find(mod => mod.id === oid);
                return { id: oid, model_kodu: model?.model_kodu || '?', model_adi: model?.model_adi || 'Bilinmiyor', adet: 1, toplam_maliyet: toplam, birim_maliyet: toplam, tarih: new Date().toISOString() };
            });
            setBirimMaliyetler(bm);

            // Personel raporu
            const { data: pList } = await supabase.from('b1_personel').select('*').eq('durum', 'aktif').limit(200);
            const { data: devamList } = await supabase.from('b1_personel_devam').select('personel_id,durum,tarih').limit(1000);
            const devamGrup = {};
            (devamList || []).forEach(d => {
                if (!devamGrup[d.personel_id]) devamGrup[d.personel_id] = { calisti: 0, izinli: 0, hastalik: 0, gelmedi: 0 };
                devamGrup[d.personel_id][d.durum] = (devamGrup[d.personel_id][d.durum] || 0) + 1;
            });
            const pRapor = (pList || []).map(per => {
                const s = parseFloat(per.saatlik_ucret_tl || 0);
                const dk = parseInt(per.gunluk_calisma_dk || 480);
                const gunluk = s * dk / 60;
                const devam = devamGrup[per.id] || { calisti: 0, izinli: 0, hastalik: 0, gelmedi: 0 };
                const topKayit = Object.values(devam).reduce((a, b) => a + b, 0);
                const devamlilık = topKayit > 0 ? Math.round((devam.calisti / topKayit) * 100) : 100;
                return { ...per, gunluk, aylik: gunluk * 22, devam, devamlilık };
            });
            setPersonelRapor(pRapor);

            // P&L
            const topGider = Object.values(malGrup).reduce((s, v) => s + v, 0);
            const kar = toplamCiro - topGider;
            const marj = toplamCiro > 0 ? ((kar / toplamCiro) * 100).toFixed(1) : 0;
            setPlRaporu({ gelir: toplamCiro, gider: topGider, kar, marj });

            setVeriler({ modeller: m.count || 0, kumaslar: k.count || 0, siparis: s.count || 0, personel: p.count || 0, uretim: m.count || 0, aktifUretim: m.count || 0, siparislerListesi: s.data || [], malGrup, durumSay, toplamCiro, loading: false });
        } catch (e) {
            goster('Veriler okunamadı: ' + e.message, 'error');
            setVeriler(p => ({ ...p, loading: false }));
        }
    }, [baslangic, bitis]);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);
        if (!erisebilir) return;
        const kanal = supabase.channel('raporlar-realtime').on('postgres_changes', { event: '*', schema: 'public' }, yukle).subscribe();
        yukle();
        return () => { supabase.removeChannel(kanal); };
    }, [kullanici, yukle]);

    // CSV indirme
    const csvIndir2 = () => {
        if (indiriyor) return goster('⏳ Hazırlanıyor...', 'error');
        setIndiriyor(true);
        let basari = false;
        try {
            if (aktifSekme === 'siparisler') { csvIndir(['Tarih', 'Durum', 'Tutar (TL)'], veriler.siparislerListesi.map(s => [formatTarih(s.created_at), s.durum, parseFloat(s.toplam_tutar_tl || 0).toFixed(2)]), 'siparisler'); basari = true; }
            else if (aktifSekme === 'birim_maliyet') { csvIndir(['Model Kodu', 'Model Adı', 'Adet', 'Toplam', 'Birim'], birimMaliyetler.map(b => [b.model_kodu, b.model_adi, b.adet, b.toplam_maliyet.toFixed(2), b.birim_maliyet.toFixed(2)]), 'birim_maliyet'); basari = true; }
            else if (aktifSekme === 'personel') { csvIndir(['Ad Soyad', 'Rol', 'Günlük ₺', 'Aylık ₺', 'Devam %', 'Gelmedi'], personelRapor.map(p => [p.ad_soyad, p.rol, p.gunluk.toFixed(0), p.aylik.toFixed(0), p.devamlilık, p.devam.gelmedi || 0]), 'personel'); basari = true; }
            else if (aktifSekme === 'pl') { csvIndir(['Kalem', 'Tutar (₺)'], [['Toplam Gelir', plRaporu.gelir.toFixed(2)], ['Toplam Gider', plRaporu.gider.toFixed(2)], ['Net Kar/Zarar', (plRaporu.kar || 0).toFixed(2)], ['Kar Marjı %', plRaporu.marj]], 'kar_zarar'); basari = true; }
            if (basari) telegramBildirim(`🚨 Karargâh Raporları CSV indirildi — Sekme: ${aktifSekme}`);
        } finally { setTimeout(() => setIndiriyor(false), 3000); }
    };

    return {
        yetkiliMi, aktifSekme, setAktifSekme,
        baslangic, setBaslangic, bitis, setBitis,
        veriler, birimMaliyetler, plRaporu, personelRapor,
        loading: veriler.loading, mesaj, indiriyor,
        yukle, csvIndir: csvIndir2,
    };
}
