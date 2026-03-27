'use client';
import { useState, useEffect } from 'react';
import { PieChart, TrendingUp, Package, Users, ShoppingCart, DollarSign, BarChart2, Calendar, Filter, Download, RefreshCw, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';

const formatTarih = (iso) => { if (!iso) return 'ÃÃÃ¶'; const d = new Date(iso); return d.toLocaleDateString('tr-TR'); };

// CSV Export yardââmcââ fonksiyonu
const csvIndir = (baslik, satirlar, dosyaAdi) => {
    const encodeField = (val) => {
        const s = String(val ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const icerik = [baslik, ...satirlar].map(r => r.map(encodeField).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + icerik], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${dosyaAdi}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
};

export default function RaporlarSayfasi() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [aktifSekme, setAktifSekme] = useState('genel');
    const [baslangic, setBaslangic] = useState('');
    const [bitis, setBitis] = useState('');
    const [veriler, setVeriler] = useState({
        modeller: 0, kumaslar: 0, siparis: 0, personel: 0, maliyet: 0,
        siparislerListesi: [], maliyetler: [], loading: true,
    });
    const [birimMaliyetler, setBirimMaliyetler] = useState([]);
    const [plRaporu, setPlRaporu] = useState({ gelir: 0, gider: 0, karMarji: 0 });
    const [personelRapor, setPersonelRapor] = useState([]);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [indiriyor, setIndiriyor] = useState(false);

    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (erisebilir) {

            // [AI ZIRHI]: Realtime Websocket (Kriter 20 & 34)
            const kanal = supabase.channel('islem-gercek-zamanli-ai')
                .on('postgres_changes', { event: '*', schema: 'public' }, () => { yukle(); })
                .subscribe();

            yukle();

            return () => { supabase.removeChannel(kanal); };
        }
    }, [baslangic, bitis, kullanici]);

    const telegramBildirim = (mesaj_metni) => {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 10000);
        fetch('/api/telegram-bildirim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesaj: mesaj_metni }),
            signal: controller.signal
        }).finally(() => clearTimeout(tId)).catch(() => null);
    };

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setVeriler(p => ({ ...p, loading: true }));

        const tarihFiltre = (sorgu) => {
            if (baslangic) sorgu = sorgu.gte('created_at', new Date(baslangic).toISOString());
            if (bitis) sorgu = sorgu.lte('created_at', new Date(bitis + 'T23:59:59').toISOString());
            return sorgu;
        };

        try {
            const [m, k, s, p, ml, sl, muh, maliyetGrup] = await Promise.all([
                supabase.from('b1_model_taslaklari').select('id', { count: 'exact', head: true }),
                supabase.from('b1_kumas_arsivi').select('id', { count: 'exact', head: true }),
                tarihFiltre(supabase.from('b2_siparisler').select('id,durum,toplam_tutar_tl,created_at', { count: 'exact' })).order('created_at', { ascending: false }).limit(200),
                supabase.from('b1_personel').select('id', { count: 'exact', head: true }),
                tarihFiltre(supabase.from('b1_maliyet_kayitlari').select('maliyet_tipi,tutar_tl,order_id')).limit(200),
                tarihFiltre(supabase.from('b2_siparisler').select('durum,toplam_tutar_tl')).limit(200),
                supabase.from('b1_muhasebe_raporlari').select('*').eq('devir_durumu', true).limit(200),
                supabase.from('b1_maliyet_kayitlari').select('order_id,tutar_tl').not('order_id', 'is', null).limit(500),
            ]);

            const malGrup = {};
            (ml.data || []).forEach(r => {
                malGrup[r.maliyet_tipi] = (malGrup[r.maliyet_tipi] || 0) + parseFloat(r.tutar_tl || 0);
            });

            const durumSay = {};
            (sl.data || []).forEach(r => { durumSay[r.durum] = (durumSay[r.durum] || 0) + 1; });
            const toplamCiro = (sl.data || []).filter(r => r.durum === 'teslim').reduce((s, r) => s + parseFloat(r.toplam_tutar_tl || 0), 0);
            // Aktif ââretim sayââsââ
            const aktifUretim = (m.count || 0);

            // Birim maliyet
            const { data: modelListForBM } = await supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500);

            const malOrderGrup = {};
            (maliyetGrup.data || []).forEach(r => {
                const oid = r.order_id;
                if (!malOrderGrup[oid]) malOrderGrup[oid] = 0;
                malOrderGrup[oid] += parseFloat(r.tutar_tl || 0);
            });

            const bm = Object.entries(malOrderGrup).map(([oid, toplam]) => {
                const model = (modelListForBM || []).find(mod => mod.id === oid);
                return {
                    id: oid, model_kodu: model?.model_kodu || '?', model_adi: model?.model_adi || 'Bilinmiyor',
                    adet: 1, toplam_maliyet: toplam, birim_maliyet: toplam, tarih: new Date().toISOString(),
                };
            });
            setBirimMaliyetler(bm);

            // Personel Raporu
            const { data: pList } = await supabase.from('b1_personel').select('*').eq('durum', 'aktif').limit(200);
            const { data: devamList } = await supabase.from('b1_personel_devam').select('personel_id,durum,tarih').limit(1000);
            const devamGrup = {};
            (devamList || []).forEach(d => {
                if (!devamGrup[d.personel_id]) devamGrup[d.personel_id] = { calisti: 0, izinli: 0, hastalik: 0, gelmedi: 0 };
                devamGrup[d.personel_id][d.durum] = (devamGrup[d.personel_id][d.durum] || 0) + 1;
            });
            const pRapor = (pList || []).map(p => {
                const s = parseFloat(p.saatlik_ucret_tl || 0);
                const dk = parseInt(p.gunluk_calisma_dk || 480);
                const gunluk = s * dk / 60;
                const devam = devamGrup[p.id] || { calisti: 0, izinli: 0, hastalik: 0, gelmedi: 0 };
                const toplamKayit = Object.values(devam).reduce((a, b) => a + b, 0);
                const devamlilââk = toplamKayit > 0 ? Math.round((devam.calisti / toplamKayit) * 100) : 100;
                return { ...p, gunluk, aylik: gunluk * 22, devam, devamlilââk };
            });
            setPersonelRapor(pRapor);

            // P&L
            const topGelir = toplamCiro;
            const topGider = Object.values(malGrup).reduce((s, v) => s + v, 0);
            const kar = topGelir - topGider;
            const marj = topGelir > 0 ? ((kar / topGelir) * 100).toFixed(1) : 0;
            setPlRaporu({ gelir: topGelir, gider: topGider, kar, marj });

            setVeriler({
                modeller: m.count || 0, kumaslar: k.count || 0, siparis: s.count || 0,
                personel: p.count || 0, uretim: m.count || 0, aktifUretim,
                siparislerListesi: s.data || [], malGrup, durumSay, toplamCiro, loading: false,
            });
        } catch (error) { goster('Veriler Okunamadââ: ' + error.message, 'error'); setVeriler(p => ({ ...p, loading: false })); }
    };

    const { modeller, kumaslar, siparis, personel, uretim, aktifUretim, siparislerListesi, malGrup, durumSay, toplamCiro, loading } = veriler;
    const DURUM_RENK = { beklemede: '#f59e0b', onaylandi: '#3b82f6', hazirlaniyor: '#8b5cf6', kargoda: '#f97316', teslim: '#10b981', iptal: '#ef4444' };
    const DURUM_LABEL = { beklemede: 'Beklemede', onaylandi: 'Onaylandââ', hazirlaniyor: 'Hazâârlanââyor', kargoda: 'Kargoda', teslim: 'Teslim', iptal: 'ââptal' };
    const MAL_LABEL = { personel_iscilik: 'Personel âââ¼ÅâÄilik', isletme_gideri: 'âââ¼Åletme Gideri', sarf_malzeme: 'Sarf Malzeme', fire_kaybi: 'Fire Kaybââ' };
    const MAL_RENK = { personel_iscilik: '#3b82f6', isletme_gideri: '#f59e0b', sarf_malzeme: '#10b981', fire_kaybi: '#ef4444' };

    const SEKMELER = [
        { id: 'genel', label: 'Â­ÅÃ´Ã¨ Genel âÃ»zet' },
        { id: 'birim_maliyet', label: 'Â­ÅÃâ Birim Maliyet' },
        { id: 'pl', label: 'Â­ÅÃ´Ãª Kar & Zarar' },
        { id: 'siparisler', label: 'Â­ÅÃ¸Ä±Â´Â©Ã Sipariâ¼Åler' },
        { id: 'personel', label: 'Â­ÅÃ¦Ã Personel' },
    ];

    if (!yetkiliMi) {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKââSââZ GââRâââ¼Å ENGELLENDââ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>Tââm â¼Åirket raporlarââ ve bilanâÄolarââ KarargâÃ³h tarafâândan gizlenmiâ¼Åtir. GâÃrâântââlemek iâÄin âÂ£retim PââN giriâ¼Åi zorunludur.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Baâ¼Ålââk + Tarih Filtresi */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PieChart size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Raporlar & Analiz</h1>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>Sistem geneli finansal ve operasyonel raporlar</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '2px solid #e5e7eb', borderRadius: 10, padding: '6px 12px' }}>
                        <Filter size={14} color="#64748b" />
                        <input type="date" value={baslangic} onChange={e => setBaslangic(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer' }} />
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>ÃÃÃ¶</span>
                        <input type="date" value={bitis} onChange={e => setBitis(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer' }} />
                    </div>
                    <button onClick={() => { setBaslangic(''); setBitis(''); }}
                        style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <RefreshCw size={13} /> Sââfâârla
                    </button>
                    <button
                        onClick={async () => {
                            if (indiriyor) return goster('ÃÃâ Excel dosyasââ hazâârlanââyor, lââtfen bekleyin...', 'error');
                            setIndiriyor(true);

                            let basari = false;
                            try {
                                if (aktifSekme === 'siparisler') {
                                    csvIndir(['Tarih', 'Durum', 'Tutar (TL)'], siparislerListesi.map(s => [formatTarih(s.created_at), s.durum, parseFloat(s.toplam_tutar_tl || 0).toFixed(2)]), 'siparisler');
                                    basari = true;
                                } else if (aktifSekme === 'birim_maliyet') {
                                    csvIndir(['Model Kodu', 'Model Adââ', 'Adet', 'Toplam Maliyet', 'Birim Maliyet'], birimMaliyetler.map(b => [b.model_kodu, b.model_adi, b.adet, b.toplam_maliyet.toFixed(2), b.birim_maliyet.toFixed(2)]), 'birim_maliyet');
                                    basari = true;
                                } else if (aktifSekme === 'personel') {
                                    csvIndir(['Ad Soyad', 'Rol', 'Gâânlââk (ÃÃ©â)', 'Aylââk (ÃÃ©â)', 'Devam %', 'Gelmedi'], personelRapor.map(p => [p.ad_soyad, p.rol, p.gunluk.toFixed(0), p.aylik.toFixed(0), p.devamlilââk, p.devam.gelmedi || 0]), 'personel');
                                    basari = true;
                                } else if (aktifSekme === 'pl') {
                                    csvIndir(['Kalem', 'Tutar (ÃÃ©â)'], [['Toplam Gelir', plRaporu.gelir.toFixed(2)], ['Toplam Gider', plRaporu.gider.toFixed(2)], ['Net Kar/Zarar', (plRaporu.kar || 0).toFixed(2)], ['Kar Marjââ %', plRaporu.marj]], 'kar_zarar');
                                    basari = true;
                                } else {
                                    alert('Lââtfen daha âÃnce bir sekme seâÄin (Siparisler, Birim Maliyet, Personel veya Kar&Zarar)');
                                }
                                if (basari) telegramBildirim(`Â­ÅÃÂ¿ DââKKAT!\nKarargâÃ³h Raporlarââ Excel formatiyla indirildi.\nSekme: ${aktifSekme}\nSisteme sââzma (Veri âÃ§ââkarma) varsa denetleyin.`);
                            } finally {
                                setTimeout(() => setIndiriyor(false), 3000); // 3 saniye anti-spam (U Kriteri) mââhimmat kalkanââ
                            }
                        }}
                        disabled={indiriyor}
                        style={{ background: indiriyor ? '#64748b' : '#0f172a', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: indiriyor ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, color: 'white' }}>
                        <Download size={13} /> {indiriyor ? 'âândiriliyor...' : 'CSV âândir'}
                    </button>
                    {/* CC Kriteri Otomatik Rota (Karargaha DâÃnâââ¼Å - Audit Zincirinin Sonu) */}
                    <a href="/" style={{ textDecoration: 'none', marginLeft: '0.5rem' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                            Â­ÅÃÃ¡ Ana Sayfaya DâÃn
                        </button>
                    </a>
                </div>
            </div>
            {mesaj.text && <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>{mesaj.text}</div>}

            {/* Sekmeler */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
                {SEKMELER.map(s => (
                    <button key={s.id} onClick={() => setAktifSekme(s.id)} style={{ padding: '8px 18px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', borderColor: aktifSekme === s.id ? '#047857' : '#e5e7eb', background: aktifSekme === s.id ? '#047857' : 'white', color: aktifSekme === s.id ? 'white' : '#374151' }}>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* GENEL âÃ»ZET SEKMESââ */}
            {aktifSekme === 'genel' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Model', val: loading ? '...' : modeller, icon: TrendingUp, color: '#6366f1', bg: '#f5f3ff' },
                            { label: 'Kumaâ¼Å', val: loading ? '...' : kumaslar, icon: Package, color: '#0891b2', bg: '#ecfeff' },
                            { label: 'Sipariâ¼Å', val: loading ? '...' : siparis, icon: ShoppingCart, color: '#f97316', bg: '#fff7ed' },
                            { label: 'Personel', val: loading ? '...' : personel, icon: Users, color: '#059669', bg: '#ecfdf5' },
                            { label: 'Â­ÅÃÂ¡ Aktif âÂ£retim', val: loading ? '...' : (aktifUretim ?? 0), icon: BarChart2, color: '#8b5cf6', bg: '#f5f3ff' },
                            { label: 'Teslim Ciro', val: loading ? '...' : `ÃÃ©â${(toplamCiro || 0).toFixed(0)}`, icon: DollarSign, color: '#10b981', bg: '#ecfdf5' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '0.875rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                                    <s.icon size={14} color={s.color} />
                                </div>
                                <div style={{ fontWeight: 900, fontSize: '1.4rem', color: s.color }}>{s.val}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {durumSay && Object.keys(durumSay).length > 0 && (
                            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: '1.25rem' }}>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}><BarChart2 size={16} color="#f97316" /> Sipariâ¼Å DaâÅââlââmââ</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {Object.entries(durumSay).map(([durum, sayi]) => {
                                        const top = Object.values(durumSay).reduce((s, v) => s + v, 0);
                                        const pct = top > 0 ? ((sayi / top) * 100).toFixed(0) : 0;
                                        return (
                                            <div key={durum}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>{DURUM_LABEL[durum] || durum}</span>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: DURUM_RENK[durum] || '#64748b' }}>{sayi}</span>
                                                </div>
                                                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: DURUM_RENK[durum] || '#64748b', borderRadius: 3, transition: 'width 0.6s ease' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {malGrup && Object.keys(malGrup).length > 0 && (
                            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: '1.25rem' }}>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign size={16} color="#06b6d4" /> Maliyet DaâÅââlââmââ</div>
                                {(() => {
                                    const topMal = Object.values(malGrup).reduce((s, v) => s + v, 0);
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {Object.entries(malGrup).map(([tip, tutar]) => {
                                                const pct = topMal > 0 ? ((tutar / topMal) * 100).toFixed(0) : 0;
                                                return (
                                                    <div key={tip}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151' }}>{MAL_LABEL[tip] || tip}</span>
                                                            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: MAL_RENK[tip] || '#64748b' }}>ÃÃ©â{tutar.toFixed(0)}</span>
                                                        </div>
                                                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${pct}%`, background: MAL_RENK[tip] || '#64748b', borderRadius: 3 }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div style={{ marginTop: 8, padding: '8px 12px', background: '#0f172a', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8' }}>GENEL TOPLAM</span>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#34d399' }}>ÃÃ©â{topMal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* BââRââM MALââYET SEKMESââ */}
            {aktifSekme === 'birim_maliyet' && (
                <div>
                    <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: '1.8rem' }}>Â­ÅÃâ</div>
                        <div>
                            <div style={{ fontWeight: 900, color: 'white', fontSize: '1rem' }}>âÂ£RETââLEN âÂ£RâÂ£N BââRââM MALââYETLERââ</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Muhasebe raporlarâândan otomatik hesaplandââ ÃÃÃ¶ Toplam Maliyet âÃ Net âÂ£retilen Adet</div>
                        </div>
                    </div>
                    {birimMaliyetler.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <DollarSign size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>Henââz kilitlenmiâ¼Å muhasebe raporu yok.<br />Muhasebe ÃÃ¥Ã Rapor ÃÃ¥Ã Kilitle iâ¼Ålemi yapââldââktan sonra burada gâÃrâânââr.</p>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {birimMaliyetler.map(bm => (
                            <div key={bm.id} style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 14, padding: '1.125rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '1rem', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#fffbeb', color: '#d97706', padding: '2px 8px', borderRadius: 4 }}>{bm.model_kodu}</span>
                                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{formatTarih(bm.tarih)}</span>
                                    </div>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{bm.model_adi}</div>
                                </div>
                                <div style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 10, padding: '8px 14px' }}>
                                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>âÂ£retilen Adet</div>
                                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.1rem' }}>{bm.adet}</div>
                                </div>
                                <div style={{ textAlign: 'center', background: '#fef9c3', borderRadius: 10, padding: '8px 14px' }}>
                                    <div style={{ fontSize: '0.6rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Toplam Maliyet</div>
                                    <div style={{ fontWeight: 900, color: '#d97706', fontSize: '1.1rem' }}>ÃÃ©â{bm.toplam_maliyet.toFixed(2)}</div>
                                </div>
                                <div style={{ textAlign: 'center', background: 'linear-gradient(135deg,#059669,#047857)', borderRadius: 10, padding: '8px 18px' }}>
                                    <div style={{ fontSize: '0.6rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>BââRââM MALââYET</div>
                                    <div style={{ fontWeight: 900, color: 'white', fontSize: '1.3rem' }}>ÃÃ©â{bm.birim_maliyet.toFixed(2)}</div>
                                    <div style={{ fontSize: '0.58rem', color: '#a7f3d0' }}>/ adet</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KAR & ZARAR SEKMESââ */}
            {aktifSekme === 'pl' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Â­ÅÃ´Ã Toplam Gelir (Teslim)', val: `ÃÃ©â${plRaporu.gelir.toFixed(2)}`, color: '#10b981', bg: '#ecfdf5', desc: 'Teslim edilen sipariâ¼Ålerin toplamââ' },
                            { label: 'Â­ÅÃ´Ã± Toplam Gider (âÂ£retim)', val: `ÃÃ©â${plRaporu.gider.toFixed(2)}`, color: '#ef4444', bg: '#fef2f2', desc: 'Kayââtlââ maliyet kalemlerinin toplamââ' },
                            { label: 'Â­ÅÃâ£ Net Kar / Zarar', val: `ÃÃ©â${(plRaporu.kar || 0).toFixed(2)}`, color: (plRaporu.kar || 0) >= 0 ? '#10b981' : '#ef4444', bg: (plRaporu.kar || 0) >= 0 ? '#ecfdf5' : '#fef2f2', desc: 'Gelir - Gider' },
                            { label: 'Â­ÅÃ´Ã¨ Kar Marjââ', val: `%${plRaporu.marj}`, color: '#6366f1', bg: '#f5f3ff', desc: 'Net Kar / Gelir âÃ¹ 100' },
                        ].map((k, i) => (
                            <div key={i} style={{ background: k.bg, border: `2px solid ${k.color}30`, borderRadius: 16, padding: '1.25rem' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: k.color, marginBottom: 8 }}>{k.label}</div>
                                <div style={{ fontWeight: 900, fontSize: '1.6rem', color: k.color }}>{k.val}</div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 4, fontWeight: 600 }}>{k.desc}</div>
                            </div>
                        ))}
                    </div>
                    {malGrup && (
                        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: '1.25rem' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Gider Kalemleri Detayââ</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {Object.entries(malGrup || {}).map(([tip, tutar]) => (
                                    <div key={tip} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>{MAL_LABEL[tip] || tip}</span>
                                        <span style={{ fontWeight: 900, color: MAL_RENK[tip], fontSize: '0.9rem' }}>ÃÃ©â{tutar.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* SââPARâââ¼ÅLER SEKMESââ */}
            {aktifSekme === 'siparisler' && (
                <div>
                    {siparislerListesi.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <ShoppingCart size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>SeâÄilen tarih aralâââÅâânda sipariâ¼Å yok.</p>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {siparislerListesi.map(s => (
                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', border: '1px solid #f1f5f9', borderRadius: 10 }}>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{formatTarih(s.created_at)}</div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: `${DURUM_RENK[s.durum] || '#94a3b8'}20`, color: DURUM_RENK[s.durum] || '#94a3b8' }}>{DURUM_LABEL[s.durum] || s.durum}</span>
                                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>ÃÃ©â{parseFloat(s.toplam_tutar_tl || 0).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* PERSONEL PERFORMANS */}
            {aktifSekme === 'personel' && (
                <div>
                    <div style={{ background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: '1.8rem' }}>Â­ÅÃ¦Ã</div>
                        <div>
                            <div style={{ fontWeight: 900, color: 'white', fontSize: '1rem' }}>PERSONEL PERFORMANS RAPORU</div>
                            <div style={{ fontSize: '0.75rem', color: '#bae6fd', fontWeight: 600 }}>Aktif personel ÃÃÃ¶ Gâânlââk ââcret, aylââk maliyet ve devam analizi</div>
                        </div>
                    </div>
                    {personelRapor.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <Users size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>Aktif personel bulunamadââ.</p>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {personelRapor.map(p => (
                            <div key={p.id} style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 14, padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{p.ad_soyad}</div>
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>{p.personel_kodu} ÃÃÃ¶ {(p.rol || '').replace(/_/g, ' ')}</div>
                                </div>
                                <div style={{ textAlign: 'center', background: '#f0fdf4', borderRadius: 10, padding: '8px' }}>
                                    <div style={{ fontSize: '0.58rem', color: '#059669', fontWeight: 700 }}>GâÂ£NLâÂ£K</div>
                                    <div style={{ fontWeight: 900, color: '#059669' }}>ÃÃ©â{p.gunluk.toFixed(0)}</div>
                                </div>
                                <div style={{ textAlign: 'center', background: '#eff6ff', borderRadius: 10, padding: '8px' }}>
                                    <div style={{ fontSize: '0.58rem', color: '#2563eb', fontWeight: 700 }}>AYLIK</div>
                                    <div style={{ fontWeight: 900, color: '#2563eb' }}>ÃÃ©â{p.aylik.toFixed(0)}</div>
                                </div>
                                <div style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 10, padding: '8px' }}>
                                    <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700 }}>DEVAM %</div>
                                    <div style={{ fontWeight: 900, color: p.devamlilââk >= 90 ? '#059669' : p.devamlilââk >= 75 ? '#f59e0b' : '#ef4444' }}>%{p.devamlilââk}</div>
                                </div>
                                <div style={{ textAlign: 'center', background: p.devam.gelmedi > 2 ? '#fef2f2' : '#f8fafc', borderRadius: 10, padding: '8px' }}>
                                    <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700 }}>GELMEDââ</div>
                                    <div style={{ fontWeight: 900, color: p.devam.gelmedi > 0 ? '#ef4444' : '#059669' }}>{p.devam.gelmedi || 0} gâân</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {personelRapor.length > 0 && (
                        <div style={{ marginTop: '1rem', background: '#0f172a', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.82rem' }}>TOPLAM AYLIK PERSONEL MALââYETââ</span>
                            <span style={{ fontWeight: 900, color: '#34d399', fontSize: '1.1rem' }}>ÃÃ©â{personelRapor.reduce((s, p) => s + p.aylik, 0).toFixed(2)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}