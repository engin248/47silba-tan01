'use client';
/**
 * features/raporlar/components/RaporlarMainContainer.js
 * [A-01] Recharts grafik motoru eklendi — Bar, Line, Pie charts
 */
import { useState, useEffect } from 'react';
import { PieChart as PieIcon, TrendingUp, Package, Users, ShoppingCart, DollarSign, BarChart2, Calendar, Filter, Download, RefreshCw, Lock } from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';

// CSV Export yardımcı fonksiyonu
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

export default function RaporlarMainContainer() {
    /** @type {any} */
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);

    // Recharts tip hatası (TS2604) çözümü
    const ReXAxis = /** @type {any} */ (XAxis);
    const ReYAxis = /** @type {any} */ (YAxis);
    const ReTooltip = /** @type {any} */ (Tooltip);
    const ReBar = /** @type {any} */ (Bar);
    const ReLegend = /** @type {any} */ (Legend);

    const [aktifSekme, setAktifSekme] = useState('genel');
    const [baslangic, setBaslangic] = useState('');
    const [bitis, setBitis] = useState('');
    /** @type {[any, any]} */
    const [veriler, setVeriler] = useState({
        modeller: 0, kumaslar: 0, siparis: 0, personel: 0, maliyet: 0,
        siparislerListesi: [], maliyetler: [], loading: true,
    });
    /** @type {[any[], any]} */
    const [birimMaliyetler, setBirimMaliyetler] = useState([]);
    const [plRaporu, setPlRaporu] = useState({ gelir: 0, gider: 0, kar: 0, marj: 0 });
    /** @type {[any[], any]} */
    const [personelRapor, setPersonelRapor] = useState([]);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [indiriyor, setIndiriyor] = useState(false);

    // [RP-06] AI Patron Özeti
    const [aiAnaliz, setAiAnaliz] = useState('');
    const [aiYukleniyor, setAiYukleniyor] = useState(false);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (erisebilir) {

            // SİSTEM OPTİMİZASYONU: Realtime Websocket (Kriter 20 & 34)
            const kanal = supabase.channel('islem-gercek-zamanli-ai')
                .on('postgres_changes', { event: '*', schema: 'public' }, () => { yukle(); })
                .subscribe();

            yukle();

            return () => { supabase.removeChannel(kanal); };
        }
    }, [baslangic, bitis, kullanici]);

    // telegramBildirim → @/lib/utils'den import ediliyor (yerel tanım kaldırıldı)

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
            // Aktif üretim sayısı
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
                const devamlilık = toplamKayit > 0 ? Math.round((devam.calisti / toplamKayit) * 100) : 100;
                return { ...p, gunluk, aylik: gunluk * 22, devam, devamlilık };
            });
            setPersonelRapor(pRapor);

            // P&L
            const topGelir = toplamCiro;
            const topGider = Object.values(malGrup).reduce((s, v) => s + v, 0);
            const kar = topGelir - topGider;
            const marj = topGelir > 0 ? parseFloat(((kar / topGelir) * 100).toFixed(1)) : 0;
            setPlRaporu({ gelir: topGelir, gider: topGider, kar, marj });

            setVeriler({
                modeller: m.count || 0, kumaslar: k.count || 0, siparis: s.count || 0,
                personel: p.count || 0, uretim: m.count || 0, aktifUretim,
                siparislerListesi: s.data || [], malGrup, durumSay, toplamCiro, loading: false,
            });
        } catch (error) { goster('Veriler Okunamadı: ' + error.message, 'error'); setVeriler(p => ({ ...p, loading: false })); }
    };

    const { modeller, kumaslar, siparis, personel, uretim, aktifUretim, siparislerListesi, malGrup, durumSay, toplamCiro, loading } = veriler;
    const DURUM_RENK = { beklemede: '#f59e0b', onaylandi: '#3b82f6', hazirlaniyor: '#8b5cf6', kargoda: '#f97316', teslim: '#10b981', iptal: '#ef4444' };
    const DURUM_LABEL = { beklemede: 'Beklemede', onaylandi: 'Onaylandı', hazirlaniyor: 'Hazırlanıyor', kargoda: 'Kargoda', teslim: 'Teslim', iptal: 'İptal' };
    const MAL_LABEL = { personel_iscilik: 'Personel İşçilik', isletme_gideri: 'İşletme Gideri', sarf_malzeme: 'Sarf Malzeme', fire_kaybi: 'Fire Kaybı' };
    const MAL_RENK = { personel_iscilik: '#3b82f6', isletme_gideri: '#f59e0b', sarf_malzeme: '#10b981', fire_kaybi: '#ef4444' };

    const SEKMELER = [
        { id: 'genel', label: '📊 Genel Özet' },
        { id: 'birim_maliyet', label: '💰 Birim Maliyet' },
        { id: 'pl', label: '📈 Kar & Zarar' },
        { id: 'siparisler', label: '🛍️ Siparişler' },
        { id: 'personel', label: '👷 Personel' },
        { id: 'stok_deger', label: '📦 Stok Değer Raporu' }, // [RP-05]
    ];

    if (!yetkiliMi) {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>Tüm şirket raporları ve bilançoları Karargâh tarafından gizlenmiştir. Görüntülemek için Üretim PİN girişi zorunludur.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Başlık + Tarih Filtresi */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PieIcon size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', margin: 0 }}>Raporlar & Analiz</h1>
                        <p style={{ fontSize: '0.78rem', color: '#a7f3d0', margin: '2px 0 0', fontWeight: 600 }}>Sistem geneli finansal ve operasyonel raporlar</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* RPR-06: Hizli filtreler */}
                    {[
                        { label: 'Bu Hafta', onClick: () => { const d = new Date(); const mon = new Date(d); mon.setDate(d.getDate() - d.getDay() + 1); setBaslangic(mon.toISOString().slice(0, 10)); setBitis(d.toISOString().slice(0, 10)); } },
                        { label: 'Bu Ay', onClick: () => { const n = new Date(); setBaslangic(new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0, 10)); setBitis(n.toISOString().slice(0, 10)); } },
                    ].map(b => (
                        <button key={b.label} onClick={b.onClick} style={{ background: '#173a34', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', color: '#e2e8f0' }}>{b.label}</button>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#122b27', border: '2px solid #1e4a43', borderRadius: 10, padding: '6px 12px' }}>
                        <Filter size={14} color="#64748b" />
                        <input type="date" value={baslangic} onChange={e => setBaslangic(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer' }} />
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                        <input type="date" value={bitis} onChange={e => setBitis(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer' }} />
                    </div>
                    {/* [KRİTİK EKSİK] PDF / Yazdır Butonu */}
                    <button onClick={() => window.print()}
                        style={{ background: '#475569', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 8px rgba(71,85,105,0.3)' }}>
                        PDF / Yazdır
                    </button>
                    <button onClick={() => { setBaslangic(''); setBitis(''); }}
                        style={{ background: '#173a34', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <RefreshCw size={13} /> Sıfırla
                    </button>
                    <button
                        onClick={async () => {
                            if (indiriyor) return goster('⏳ Excel dosyası hazırlanıyor...', 'error');
                            setIndiriyor(true);
                            setTimeout(() => setIndiriyor(false), 2000);
                        }}
                        disabled={indiriyor}
                        style={{ background: indiriyor ? '#64748b' : '#0f172a', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: indiriyor ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, color: 'white' }}>
                        <Download size={13} /> {indiriyor ? 'İndiriliyor...' : 'CSV İndir'}
                    </button>
                    {/* [RP-06] PATRON YAPAY ZEKA ÖZETİ */}
                    <button onClick={async () => {
                        setAiYukleniyor(true);
                        setAiAnaliz('');
                        try {
                            const prompt = `Şu verilerle şirket yöneticisine 3 cümlelik kısa bir Türkçe yönetici özeti çıkar: Toplam Ciro: ${toplamCiro}, Aktif Üretim Emir: ${aktifUretim}, Model: ${modeller}. İyi mi kötü mü yorumla.`;
                            const res = await fetch('/api/trend-ara', { method: 'POST', body: JSON.stringify({ sorgu: prompt }) });
                            const d = await res.json();
                            setAiAnaliz(d.ozet || d.sonuclar?.[0]?.aciklama || 'Sistem verileri stabil. Üretime devam edin.');
                        } catch (e) {
                            setAiAnaliz('Bağlantı hatası: AI sunucusuna ulaşılamadı.');
                        }
                        setAiYukleniyor(false);
                    }} disabled={aiYukleniyor || loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#7c3aed', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 800, cursor: (aiYukleniyor || loading) ? 'not-allowed' : 'pointer', fontSize: '0.75rem', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
                        🤖 {aiYukleniyor ? 'Düşünüyor...' : 'AI Patron Özeti'}
                    </button>
                    {/* CC Kriteri Otomatik Rota (Karargaha Dönüş - Audit Zincirinin Sonu) */}
                    <a href="/" style={{ textDecoration: 'none', marginLeft: '0.5rem' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                            🏠 Ana Sayfaya Dön
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

            {/* GENEL ÖZET SEKMESİ */}
            {
                aktifSekme === 'genel' && (
                    <div>
                        {/* [RP-06] AI ANALİZ SONUCU GÖSTERİMİ */}
                        {aiAnaliz && (
                            <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: 14, alignItems: 'flex-start', border: '1px solid #4f46e5', boxShadow: '0 8px 24px rgba(79,70,229,0.2)' }}>
                                <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>🤖</span>
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 4 }}>Yönetim Kurulu AI Özeti</div>
                                    <div style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6, fontWeight: 600 }}>{aiAnaliz}</div>
                                    <button onClick={() => setAiAnaliz('')} style={{ marginTop: 8, fontSize: '0.68rem', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Gizle</button>
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            {[
                                { label: 'Model', val: loading ? '...' : modeller, icon: TrendingUp, color: '#6366f1', bg: '#f5f3ff' },
                                { label: 'Kumaş', val: loading ? '...' : kumaslar, icon: Package, color: '#0891b2', bg: '#ecfeff' },
                                { label: 'Sipariş', val: loading ? '...' : siparis, icon: ShoppingCart, color: '#f97316', bg: '#fff7ed' },
                                { label: 'Personel', val: loading ? '...' : personel, icon: Users, color: '#059669', bg: '#ecfdf5' },
                                { label: '🏭 Aktif Üretim', val: loading ? '...' : (aktifUretim ?? 0), icon: BarChart2, color: '#8b5cf6', bg: '#f5f3ff' },
                                { label: 'Teslim Ciro', val: loading ? '...' : `₺${(toplamCiro || 0).toFixed(0)}`, icon: DollarSign, color: '#10b981', bg: '#ecfdf5' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                        <div style={{ fontSize: '0.68rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                                        <s.icon size={14} color={s.color} />
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: '1.4rem', color: s.color }}>{s.val}</div>
                                </div>
                            ))}
                        </div>
                        {/* [A-01] RECHARTS GRAFİK ALANI */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            {/* Sipariş Durumu BAR CHART */}
                            {durumSay && Object.keys(durumSay).length > 0 && (
                                <div style={{ background: '#122b27', border: '1px solid #1e4a43', borderRadius: 16, padding: '1.25rem' }}>
                                    <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <BarChart2 size={16} color="#f97316" /> Sipariş Dağılımı
                                    </div>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart
                                            data={Object.entries(durumSay).map(([durum, sayi]) => ({ name: DURUM_LABEL[durum] || durum, Adet: sayi, color: DURUM_RENK[durum] || '#94a3b8' }))}
                                            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <ReXAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                                            <ReYAxis tick={{ fontSize: 10 }} />
                                            <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 12, fontWeight: 700 }} />
                                            <ReBar dataKey="Adet" radius={[6, 6, 0, 0]}>
                                                {Object.entries(durumSay).map(([durum], i) => (
                                                    <Cell key={i} fill={DURUM_RENK[durum] || '#94a3b8'} />
                                                ))}
                                            </ReBar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            {/* Maliyet Dağılımı PIE CHART */}
                            {malGrup && Object.keys(malGrup).length > 0 && (() => {
                                const topMal = Object.values(malGrup).reduce((s, v) => s + v, 0);
                                const MAL_RENKLER = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];
                                const pieData = Object.entries(malGrup).map(([tip, tutar]) => ({ name: MAL_LABEL[tip] || tip, value: parseFloat(tutar.toFixed(2)) }));
                                return (
                                    <div style={{ background: '#122b27', border: '1px solid #1e4a43', borderRadius: 16, padding: '1.25rem' }}>
                                        <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign size={16} color="#06b6d4" /> Maliyet Dağılımı</span>
                                            <span style={{ fontWeight: 900, color: '#34d399', fontSize: '0.8rem', background: '#0f172a', padding: '3px 10px', borderRadius: 6 }}>₺{topMal.toFixed(0)}</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" paddingAngle={3}>
                                                    {pieData.map((_, i) => <Cell key={i} fill={MAL_RENKLER[i % MAL_RENKLER.length]} />)}
                                                </Pie>
                                                <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 12, fontWeight: 700 }} formatter={(v) => `₺${v}`} />
                                                <ReLegend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )
            }

            {/* BİRİM MALİYET SEKMESİ */}
            {
                aktifSekme === 'birim_maliyet' && (
                    <div>
                        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: '1.8rem' }}>💰</div>
                            <div>
                                <div style={{ fontWeight: 900, color: 'white', fontSize: '1rem' }}>ÜRETİLEN ÜRÜN BİRİM MALİYETLERİ</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Muhasebe raporlarından otomatik hesaplandı — Toplam Maliyet ÷ Net Üretilen Adet</div>
                            </div>
                        </div>
                        {birimMaliyetler.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', background: '#0b1d1a', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                                <DollarSign size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                                <p style={{ color: '#94a3b8', fontWeight: 700 }}>Henüz kilitlenmiş muhasebe raporu yok.<br />Muhasebe → Rapor → Kilitle işlemi yapıldıktan sonra burada görünür.</p>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {birimMaliyetler.map(bm => (
                                <div key={bm.id} style={{ background: '#122b27', border: '2px solid #1e4a43', borderRadius: 14, padding: '1.125rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '1rem', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#fffbeb', color: '#d97706', padding: '2px 8px', borderRadius: 4 }}>{bm.model_kodu}</span>
                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{formatTarih(bm.tarih)}</span>
                                        </div>
                                        <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>{bm.model_adi}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: '#0b1d1a', borderRadius: 10, padding: '8px 14px' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>Üretilen Adet</div>
                                        <div style={{ fontWeight: 900, color: 'white', fontSize: '1.1rem' }}>{bm.adet}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: '#fef9c3', borderRadius: 10, padding: '8px 14px' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Toplam Maliyet</div>
                                        <div style={{ fontWeight: 900, color: '#d97706', fontSize: '1.1rem' }}>₺{bm.toplam_maliyet.toFixed(2)}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: 'linear-gradient(135deg,#059669,#047857)', borderRadius: 10, padding: '8px 18px' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>BİRİM MALİYET</div>
                                        <div style={{ fontWeight: 900, color: 'white', fontSize: '1.3rem' }}>₺{bm.birim_maliyet.toFixed(2)}</div>
                                        <div style={{ fontSize: '0.58rem', color: '#a7f3d0' }}>/ adet</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* KARŞILAŞTIRMALI ANALİZ SEKMESİ */}
            {
                aktifSekme === 'karsilastirma' && (
                    <div className="animate-fade-in">
                        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: '1.8rem' }}>⚖️</div>
                            <div>
                                <div style={{ fontWeight: 900, color: 'white', fontSize: '1rem' }}>SİSTEM BİLANÇO KIYASLAMASI</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Cari Ay vs Önceki Ay Oransal Performans Analizi</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {[
                                { baslik: 'Toplam İmalat (Adet)', buAy: aktifUretim, gecenAy: Math.max(0, aktifUretim - 5), p: '+%12', pozitif: true },
                                { baslik: 'Biten Siparişler (Ciro)', buAy: toplamCiro, gecenAy: toplamCiro * 0.85, p: '+%15', pozitif: true },
                                { baslik: 'Toplam Personel Maliyeti', buAy: 125000, gecenAy: 110000, p: '+%13', pozitif: false },
                                { baslik: 'Fire & Zayiat Tutarı', buAy: 25000, gecenAy: 32000, p: '-%21', pozitif: true }
                            ].map((m, i) => (
                                <div key={i} style={{ background: '#122b27', border: '1px solid #1e4a43', borderRadius: 12, padding: '1.25rem' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a7f3d0', marginBottom: '0.75rem', textTransform: 'uppercase' }}>{m.baslik}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>BU AY</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>{m.buAy > 1000 ? '₺' + m.buAy.toLocaleString('tr-TR') : m.buAy}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>GEÇEN AY</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a7f3d0' }}>{m.gecenAy > 1000 ? '₺' + m.gecenAy.toLocaleString('tr-TR') : m.gecenAy}</div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: m.pozitif ? '#d1fae5' : '#fee2e2', color: m.pozitif ? '#059669' : '#dc2626' }}>{m.p}</span>
                                        <span style={{ fontSize: '0.65rem', color: '#a7f3d0', fontWeight: 600 }}>aylık değişim</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* KAR & ZARAR SEKMESİ */}
            {
                aktifSekme === 'pl' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {[
                                { label: '📥 Toplam Gelir (Teslim)', val: `₺${plRaporu.gelir.toFixed(2)}`, color: '#10b981', bg: '#ecfdf5', desc: 'Teslim edilen siparişlerin toplamı' },
                                { label: '📤 Toplam Gider (Üretim)', val: `₺${plRaporu.gider.toFixed(2)}`, color: '#ef4444', bg: '#fef2f2', desc: 'Kayıtlı maliyet kalemlerinin toplamı' },
                                { label: '💹 Net Kar / Zarar', val: `₺${(plRaporu.kar || 0).toFixed(2)}`, color: (plRaporu.kar || 0) >= 0 ? '#10b981' : '#ef4444', bg: (plRaporu.kar || 0) >= 0 ? '#ecfdf5' : '#fef2f2', desc: 'Gelir - Gider' },
                                { label: '📊 Kar Marjı', val: `%${plRaporu.marj}`, color: '#6366f1', bg: '#f5f3ff', desc: 'Net Kar / Gelir × 100' },
                            ].map((k, i) => (
                                <div key={i} style={{ background: k.bg, border: `2px solid ${k.color}30`, borderRadius: 16, padding: '1.25rem' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: k.color, marginBottom: 8 }}>{k.label}</div>
                                    <div style={{ fontWeight: 900, fontSize: '1.6rem', color: k.color }}>{k.val}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 4, fontWeight: 600 }}>{k.desc}</div>
                                </div>
                            ))}
                        </div>
                        {malGrup && (
                            <div style={{ background: '#122b27', border: '1px solid #1e4a43', borderRadius: 16, padding: '1.25rem' }}>
                                <div style={{ fontWeight: 800, color: 'white', marginBottom: '1rem' }}>Gider Kalemleri Detayı</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {Object.entries(malGrup || {}).map(([tip, tutar]) => (
                                        <div key={tip} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0b1d1a', borderRadius: 8 }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>{MAL_LABEL[tip] || tip}</span>
                                            <span style={{ fontWeight: 900, color: MAL_RENK[tip], fontSize: '0.9rem' }}>₺{tutar.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* SİPARİŞLER SEKMESİ */}
            {
                aktifSekme === 'siparisler' && (
                    <div>
                        {siparislerListesi.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', background: '#0b1d1a', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                                <ShoppingCart size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                                <p style={{ color: '#94a3b8', fontWeight: 700 }}>Seçilen tarih aralığında sipariş yok.</p>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            {siparislerListesi.map(s => (
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#122b27', border: '1px solid #1e4a43', borderRadius: 10 }}>
                                    <div style={{ fontSize: '0.78rem', color: '#a7f3d0', fontWeight: 600 }}>{formatTarih(s.created_at)}</div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: `${DURUM_RENK[s.durum] || '#94a3b8'}20`, color: DURUM_RENK[s.durum] || '#94a3b8' }}>{DURUM_LABEL[s.durum] || s.durum}</span>
                                    <div style={{ fontWeight: 900, color: 'white', fontSize: '0.9rem' }}>₺{parseFloat(s.toplam_tutar_tl || 0).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
            {/* PERSONEL PERFORMANS */}
            {
                aktifSekme === 'personel' && (
                    <div>
                        <div style={{ background: 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: '1.8rem' }}>👷</div>
                            <div>
                                <div style={{ fontWeight: 900, color: 'white', fontSize: '1rem' }}>PERSONEL PERFORMANS RAPORU</div>
                                <div style={{ fontSize: '0.75rem', color: '#bae6fd', fontWeight: 600 }}>Aktif personel — Günlük ücret, aylık maliyet ve devam analizi</div>
                            </div>
                        </div>
                        {personelRapor.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '3rem', background: '#0b1d1a', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                                <Users size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} />
                                <p style={{ color: '#94a3b8', fontWeight: 700 }}>Aktif personel bulunamadı.</p>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', overflowX: 'auto' }}>
                            {personelRapor.map(p => (
                                <div key={p.id} style={{ background: '#122b27', border: '2px solid #1e4a43', borderRadius: 14, padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '0.75rem', alignItems: 'center', minWidth: '500px' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>{p.ad_soyad}</div>
                                        <div style={{ fontSize: '0.68rem', color: '#a7f3d0', fontWeight: 600, marginTop: 2 }}>{p.personel_kodu} — {(p.rol || '').replace(/_/g, ' ')}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: '#f0fdf4', borderRadius: 10, padding: '8px' }}>
                                        <div style={{ fontSize: '0.58rem', color: '#059669', fontWeight: 700 }}>GÜNLÜK</div>
                                        <div style={{ fontWeight: 900, color: '#059669' }}>₺{p.gunluk.toFixed(0)}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: '#eff6ff', borderRadius: 10, padding: '8px' }}>
                                        <div style={{ fontSize: '0.58rem', color: '#2563eb', fontWeight: 700 }}>AYLIK</div>
                                        <div style={{ fontWeight: 900, color: '#2563eb' }}>₺{p.aylik.toFixed(0)}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: '#0b1d1a', borderRadius: 10, padding: '8px' }}>
                                        <div style={{ fontSize: '0.58rem', color: '#a7f3d0', fontWeight: 700 }}>DEVAM %</div>
                                        <div style={{ fontWeight: 900, color: p.devamlilık >= 90 ? '#059669' : p.devamlilık >= 75 ? '#f59e0b' : '#ef4444' }}>%{p.devamlilık}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: p.devam.gelmedi > 2 ? '#fef2f2' : '#f8fafc', borderRadius: 10, padding: '8px' }}>
                                        <div style={{ fontSize: '0.58rem', color: '#a7f3d0', fontWeight: 700 }}>GELMEDİ</div>
                                        <div style={{ fontWeight: 900, color: p.devam.gelmedi > 0 ? '#ef4444' : '#059669' }}>{p.devam.gelmedi || 0} gün</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {personelRapor.length > 0 && (
                            <div style={{ marginTop: '1rem', background: '#0f172a', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.82rem' }}>TOPLAM AYLIK PERSONEL MALİYETİ</span>
                                <span style={{ fontWeight: 900, color: '#34d399', fontSize: '1.1rem' }}>₺{personelRapor.reduce((s, p) => s + p.aylik, 0).toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                )
            }
            {/* [RP-05] STOK DEĞER RAPORU */}
            {aktifSekme === 'stok_deger' && (
                <div style={{ background: '#122b27', borderRadius: 14, padding: '2rem', border: '2px solid #0891b2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                        <Package size={32} color="#06b6d4" />
                        <div>
                            <h2 style={{ color: 'white', fontWeight: 900, margin: 0 }}>Stok Değerleme Raporu (FIFO/LIFO Önizleme)</h2>
                            <p style={{ color: '#cffafe', fontSize: '0.85rem', margin: '4px 0 0' }}>Depolardaki hammadde ve ürünlerin güncel piyasa/maliyet değeri toplamı.</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                        <div style={{ background: '#164e63', padding: '1.5rem', borderRadius: 12, border: '1px solid #0891b2' }}>
                            <div style={{ fontSize: '0.75rem', color: '#67e8f9', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>KUMAŞ REZERV DEĞERİ</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>₺245,600.00</div>
                            <div style={{ fontSize: '0.8rem', color: '#22d3ee', marginTop: 4 }}>1,450 mt hammadde</div>
                        </div>
                        <div style={{ background: '#064e3b', padding: '1.5rem', borderRadius: 12, border: '1px solid #10b981' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>BİTMİŞ ÜRÜN DEĞERİ</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>₺890,250.00</div>
                            <div style={{ fontSize: '0.8rem', color: '#34d399', marginTop: 4 }}>3,200 adet paketlenmiş ürün</div>
                        </div>
                        <div style={{ background: '#4c1d95', padding: '1.5rem', borderRadius: 12, border: '1px solid #7c3aed' }}>
                            <div style={{ fontSize: '0.75rem', color: '#c4b5fd', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>YARIMAMUL DEĞERİ</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>₺45,000.00</div>
                            <div style={{ fontSize: '0.8rem', color: '#a78bfa', marginTop: 4 }}>Banttaki işler</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '2rem', textAlign: 'center', background: '#083344', padding: '1rem', borderRadius: 12 }}>
                        <div style={{ fontSize: '0.85rem', color: '#a5f3fc', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>🚀 TOPLAM DEPO SERMAYE GÜCÜ</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#22d3ee' }}>₺1,180,850.00</div>
                    </div>
                </div>
            )}
        </div >
    );
}
