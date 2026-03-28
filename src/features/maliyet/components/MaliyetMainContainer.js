'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect, useCallback, useRef } from 'react';
import { DollarSign, Plus, Upload, ChevronDown, Lock, BarChart2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import Link from 'next/link';
import { idb } from '@/lib/idbKalkan';

import MaliyetGirisTab from './tabs/MaliyetGirisTab';
import SiparisAnalizTab from './tabs/SiparisAnalizTab';
import TrendTab from './tabs/TrendTab';
import SatisFiyatiTab from './tabs/SatisFiyatiTab';
import MaliyetFormModal from './tabs/MaliyetFormModal';
import MaliyetOzetKartlar from './tabs/MaliyetOzetKartlar';

const MALIYET_TIPLERI = ['personel_iscilik', 'hammadde_kumas', 'isletme_gideri', 'sarf_malzeme', 'fire_kaybi', 'sabit_gider', 'nakliye_lojistik'];
const MALIYET_RENK = { personel_iscilik: '#3b82f6', hammadde_kumas: '#8b5cf6', isletme_gideri: '#f59e0b', sarf_malzeme: '#10b981', fire_kaybi: '#ef4444', sabit_gider: '#06b6d4', nakliye_lojistik: '#f97316' };
const MALIYET_LABEL = { personel_iscilik: '👷 Personel', hammadde_kumas: '🧵 Hammadde', isletme_gideri: '🏭 İşletme', sarf_malzeme: '📦 Sarf', fire_kaybi: '🔥 Fire', sabit_gider: '🏠 Sabit', nakliye_lojistik: '🚚 Nakliye' };
const BOSH_FORM = { order_id: '', maliyet_tipi: 'hammadde_kumas', kalem_aciklama: '', tutar_tl: '', miktar: '', birim: 'adet', birim_fiyat: '' };

const SEKMELER = [
    { id: 'giris', label: '📋 Maliyet Girişi' },
    { id: 'analiz', label: '📊 Sipariş Analizi' },
    { id: 'trend', label: '📈 Dönemsel Trend (12 Ay)' },
    { id: 'satis', label: '💰 Karlılık Motoru' },
];

export default function MaliyetMainContainer() {
    const { kullanici, sayfaErisim } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [sekme, setSekme] = useState('giris');

    // Data State
    const [maliyetler, setMaliyetler] = useState([]);
    const [orderler, setOrderler] = useState([]);

    // UI Form State
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [duzenleId, setDuzenleId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    // Filtre State
    const [filtreTip, setFiltreTip] = useState('hepsi');
    const [filtreOrder, setFiltreOrder] = useState('hepsi');
    const [karMarji, setKarMarji] = useState(30);
    const [menuAcik, setMenuAcik] = useState(false);
    const [csvModal, setCsvModal] = useState(false);
    const [csvText, setCsvText] = useState('');
    const [aramaMetni, setAramaMetni] = useState('');
    const [islemdeId, setIslemdeId] = useState(null);
    const [maliyetSayfa, setMaliyetSayfa] = useState(50);
    const menuRef = useRef(null);

    const goster = createGoster(setMesaj);

    useEffect(() => {
        const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAcik(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            // IDB Kalkan Zırhı Entegrasyonu
            const otonomSync = async () => {
                const timeout = (ms) => new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı')), ms));

                const p1 = supabase.from('b1_maliyet_kayitlari').select('*').order('created_at', { ascending: false }).limit(500);
                const p2 = supabase.from('production_orders')
                    .select('id, quantity, b1_model_taslaklari(model_kodu, model_adi)')
                    .order('created_at', { ascending: false }).limit(300);

                const [{ data: m }, { data: sifarisler }] = await Promise.race([Promise.all([p1, p2]), timeout(10000)]);

                if (m) { setMaliyetler(m); await idb.bulkUpsert('m13_maliyet', m); }
                if (sifarisler) setOrderler(sifarisler.map(o => ({
                    id: o.id, quantity: o.quantity || 1,
                    b1_model_taslaklari: o.b1_model_taslaklari || { model_kodu: 'ORD-BAGIMSIZ', model_adi: 'Bağlantısız' }
                })));
            };

            const localData = await idb.getAllWithLimit('m13_maliyet', 500, 0);
            if (!localData || localData.length === 0) {
                await otonomSync();
            } else {
                setMaliyetler(localData);
                otonomSync(); // Arka planda güncelle
            }

        } catch (error) { goster('IDB Fallback Aktif (Ağ yavaş): ' + error.message, 'error'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        const uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const isYetkili = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(isYetkili);

        let kanal = null;
        if (isYetkili) {
            kanal = supabase.channel('maliyet-gercek-zamanli')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_maliyet_kayitlari' }, yukle)
                .subscribe();
            yukle();
        }
        return () => { if (kanal) supabase.removeChannel(kanal); };
    }, [kullanici?.grup, kullanici?.id, yukle]);

    const handleMiktarFiyatDegisim = (field, val) => {
        const yeniForm = { ...form, [field]: val };
        if (yeniForm.miktar && yeniForm.birim_fiyat) {
            yeniForm.tutar_tl = (parseFloat(yeniForm.miktar) * parseFloat(yeniForm.birim_fiyat)).toFixed(2);
        }
        setForm(yeniForm);
    };

    const kaydet = async () => {
        if (!form.order_id) return goster('Sipariş seçiniz!', 'error');
        if (!form.kalem_aciklama.trim()) return goster('Açıklama zorunlu!', 'error');

        let gercekTutar = parseFloat(form.tutar_tl) || 0;
        if (form.miktar && form.birim_fiyat) {
            const gercekCarpim = parseFloat(form.miktar) * parseFloat(form.birim_fiyat);
            if (Math.abs(gercekTutar - gercekCarpim) > 0.01) gercekTutar = parseFloat(gercekCarpim.toFixed(2));
        }

        if (gercekTutar <= 0) return goster('Geçerli tutar giriniz!', 'error');

        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_maliyet_kayitlari', duzenleId ? 'UPDATE' : 'INSERT', form);
            return goster('⚡ Çevrimdışı: M13 Kuyruğa alındı.');
        }

        setLoading(true);
        try {
            const payload = { order_id: form.order_id, maliyet_tipi: form.maliyet_tipi, kalem_aciklama: form.kalem_aciklama.trim(), tutar_tl: gercekTutar, onay_durumu: 'hesaplandi' };
            if (duzenleId) {
                const { error } = await supabase.from('b1_maliyet_kayitlari').update(payload).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ Maliyet güncellendi!');
            } else {
                const { error } = await supabase.from('b1_maliyet_kayitlari').insert([payload]);
                if (error) throw error;
                goster('✅ Maliyet kaydedildi!');
                telegramBildirim(`💸 YENİ MALİYET\nT.: ₺${payload.tutar_tl}\nK.: ${MALIYET_LABEL[payload.maliyet_tipi]}\nA.: ${payload.kalem_aciklama}`);
            }
            setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); await yukle();
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const duzenle = (m) => {
        setForm({ order_id: m.order_id, maliyet_tipi: m.maliyet_tipi, kalem_aciklama: m.kalem_aciklama, tutar_tl: m.tutar_tl, miktar: '', birim: 'adet', birim_fiyat: '' });
        setDuzenleId(m.id); setFormAcik(true); setSekme('giris');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onayla = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            await supabase.from('b1_maliyet_kayitlari').update({ onay_durumu: 'onaylandi' }).eq('id', id);
            await yukle(); goster('✅ Maliyet onaylandı');
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const sil = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        const { yetkili, mesaj: yMsj } = await silmeYetkiDogrula(kullanici);
        if (!yetkili) { setIslemdeId(null); return goster(yMsj || 'Hatalı yetki!', 'error'); }
        if (!confirm('Bu maliyet kalemi KALICI OLARAK silinecek. Onaylıyor musunuz?')) { setIslemdeId(null); return; }

        try {
            await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_maliyet_kayitlari', islem_tipi: 'SILME', kullanici_adi: 'M13 Sorumlusu', eski_veri: { id } }]);
            await supabase.from('b1_maliyet_kayitlari').delete().eq('id', id);
            await yukle(); goster('🗑️ Silindi ve Loglandı.');
        } catch (error) { goster('Silme hatası: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const csvYukle = async () => {
        const satirlar = csvText.trim().split('\n').filter(s => s.trim());
        if (satirlar.length === 0) return goster('CSV boş!', 'error');
        setLoading(true);
        try {
            let basarili = 0, hatali = 0, oplar = [];
            for (const satir of satirlar) {
                const parts = satir.split(',').map(p => p.trim());
                if (parts.length < 4) { hatali++; continue; }
                const modelBul = orderler.find(o => o.b1_model_taslaklari?.model_kodu === parts[0]);
                if (!modelBul) { hatali++; continue; }
                oplar.push({ order_id: modelBul.id, maliyet_tipi: MALIYET_TIPLERI.includes(parts[1]) ? parts[1] : 'isletme_gideri', kalem_aciklama: parts[2], tutar_tl: parseFloat(parts[3]) || 0, onay_durumu: 'hesaplandi' });
            }
            if (oplar.length > 0) {
                await supabase.from('b1_maliyet_kayitlari').insert(oplar);
                basarili = oplar.length;
            }
            goster(`✅ ${basarili} kayıt eklendi. ${hatali > 0 ? ` ⚠ ${hatali} hatalı.` : ''}`);
        } catch (error) { goster('Yükleme hatası: ' + error.message, 'error'); }
        setCsvModal(false); setCsvText(''); setLoading(false); await yukle();
    };

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 border-2 border-rose-900/50 rounded-2xl m-8 relative overflow-hidden group">
                <Lock size={64} className="mx-auto mb-6 text-rose-500 animate-pulse drop-shadow-[0_0_15px_#dc2626]" />
                <h2 className="text-2xl font-black text-rose-500 uppercase tracking-[0.2em] mb-4">MALİYET KARARGAHI ERİŞİMİ REDDEDİLDİ</h2>
                <p className="text-rose-300 font-bold m-0 max-w-lg mx-auto">M13 Maliyet Verileri finansal sırlar içerir ve yalnızca 'Yönetici / Tam Erişim' grubuna veya özel PİN'e tabidir.</p>
            </div>
        );
    }

    const toplamlar = MALIYET_TIPLERI.reduce((acc, tip) => {
        acc[tip] = maliyetler.filter(m => m.maliyet_tipi === tip).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
        return acc;
    }, {});
    const genelToplam = Object.values(toplamlar).reduce((s, v) => s + v, 0);
    const onaysiz = maliyetler.filter(m => m.onay_durumu === 'hesaplandi').length;

    const siparisFistiklari = orderler.map(o => {
        const sipMaliyetler = maliyetler.filter(m => m.order_id === o.id);
        const sipToplam = sipMaliyetler.reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
        const adet = parseInt(o.quantity) || 1;
        const birimMaliyet = adet > 0 ? sipToplam / adet : 0;
        return { ...o, sipToplam, adet, birimMaliyet, kalemSayisi: sipMaliyetler.length };
    }).filter(o => o.kalemSayisi > 0);

    const filtreli = maliyetler.filter(m => {
        const tipOk = filtreTip === 'hepsi' || m.maliyet_tipi === filtreTip;
        const orderOk = filtreOrder === 'hepsi' || m.order_id === filtreOrder;
        const aramaOk = !aramaMetni || m.kalem_aciklama?.toLowerCase().includes(aramaMetni.toLowerCase());
        return tipOk && orderOk && aramaOk;
    });

    return (
        <div className="min-h-screen text-white p-4 md:p-8" dir={isAR ? 'rtl' : 'ltr'}>

            {/* Olay Bildirim */}
            {mesaj.text && (
                <div className={`p-4 mb-6 rounded-xl font-bold border-2 ${mesaj.type === 'error' ? 'bg-red-950/40 text-red-500 border-red-900' : 'bg-emerald-950/40 text-emerald-500 border-emerald-900'} shadow-sm animate-fade-in`}>
                    {mesaj.text}
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[16px] flex items-center justify-center shadow-[0_0_20px_rgba(4,120,87,0.4)] border border-emerald-500/30">
                        <DollarSign size={28} className="text-emerald-50" />
                    </div>
                    <div>
                        <h1 className="text-2.5xl font-black text-white tracking-tight m-0 uppercase">Maliyet Karargahı (M13)</h1>
                        <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mt-1.5 opacity-90 border-l-[3px] border-emerald-500 pl-2">Birim Maliyet · Kârlılık · Zırh Korumalı</p>
                    </div>
                </div>

                <div ref={menuRef} className="relative flex shadow-[0_4px_14px_rgba(4,120,87,0.3)] hover:shadow-[0_4px_20px_rgba(4,120,87,0.5)] rounded-xl transition-all">
                    <button onClick={() => { setForm(BOSH_FORM); setDuzenleId(null); setFormAcik(!formAcik); setSekme('giris'); setMenuAcik(false); }}
                        className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-3 rounded-l-xl font-black text-sm border-y border-l border-emerald-500/30 cursor-pointer">
                        <Plus size={18} /> YENİ GİDER İŞLE
                    </button>
                    <button onClick={() => setMenuAcik(!menuAcik)}
                        className="bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-3 rounded-r-xl border-y border-r border-emerald-500/30 border-l border-l-emerald-600 cursor-pointer">
                        <ChevronDown size={18} />
                    </button>
                    {menuAcik && (
                        <div className="absolute top-[110%] right-0 bg-[#0d1117] border-2 border-[#1e4a43] rounded-xl shadow-2xl min-w-[260px] z-50 overflow-hidden">
                            <button onClick={() => { setCsvModal(true); setMenuAcik(false); }} className="flex items-center gap-3 w-full px-5 py-4 hover:bg-[#122b27] text-white font-black text-sm text-left transition-colors border-0 cursor-pointer">
                                <Upload size={18} className="text-violet-500" /> Excel (CSV) Toplu Yükleme
                            </button>
                            <Link href="/muhasebe" className="no-underline block">
                                <button className="flex items-center gap-3 w-full px-5 py-4 hover:bg-[#122b27] border-t border-[#1e4a43] text-emerald-500 font-black text-sm text-left transition-colors cursor-pointer bg-transparent">
                                    <BarChart2 size={18} className="text-emerald-400" /> M14 Muhasebeye Geç
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <MaliyetOzetKartlar genelToplam={genelToplam} toplamlar={toplamlar} siparisFistiklari={siparisFistiklari} onaysiz={onaysiz} />

            <MaliyetFormModal
                formAcik={formAcik} setFormAcik={setFormAcik} form={form} setForm={setForm} BOSH_FORM={BOSH_FORM}
                duzenleId={duzenleId} setDuzenleId={setDuzenleId} kaydet={kaydet} loading={loading}
                orderler={orderler} MALIYET_TIPLERI={MALIYET_TIPLERI} MALIYET_LABEL={MALIYET_LABEL}
                handleMiktarFiyatDegisim={handleMiktarFiyatDegisim}
            />

            {/* SEKMELER */}
            <div className="flex gap-2 mb-6 border-b-2 border-[#1e4a43] flex-wrap">
                {SEKMELER.map(s => (
                    <button key={s.id} onClick={() => setSekme(s.id)}
                        className={`px-5 py-3 border-0 rounded-t-xl cursor-pointer font-black text-[0.82rem] uppercase tracking-wider transition-colors ${sekme === s.id ? 'bg-emerald-600 text-white' : 'bg-transparent text-slate-400 hover:text-emerald-200 hover:bg-[#122b27]'}`}>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* TAB İÇERİKLERİ */}
            {sekme === 'giris' && (
                <MaliyetGirisTab
                    filtreTip={filtreTip} setFiltreTip={setFiltreTip} MALIYET_TIPLERI={MALIYET_TIPLERI} MALIYET_LABEL={MALIYET_LABEL}
                    filtreOrder={filtreOrder} setFiltreOrder={setFiltreOrder} orderler={orderler}
                    aramaMetni={aramaMetni} setAramaMetni={setAramaMetni} filtreli={filtreli}
                    maliyetSayfa={maliyetSayfa} setMaliyetSayfa={setMaliyetSayfa} MALIYET_RENK={MALIYET_RENK}
                    duzenle={duzenle} onayla={onayla} sil={sil} islemdeId={islemdeId}
                />
            )}
            {sekme === 'analiz' && <SiparisAnalizTab siparisFistiklari={siparisFistiklari} MALIYET_TIPLERI={MALIYET_TIPLERI} MALIYET_RENK={MALIYET_RENK} MALIYET_LABEL={MALIYET_LABEL} maliyetler={maliyetler} />}
            {sekme === 'trend' && <TrendTab maliyetler={maliyetler} />}
            {sekme === 'satis' && <SatisFiyatiTab siparisFistiklari={siparisFistiklari} karMarji={karMarji} setKarMarji={setKarMarji} />}

            {/* CSV MODAL */}
            {csvModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0b1d1a] border-2 border-[#1e4a43] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-white m-0 text-lg flex items-center gap-2">
                                <Upload size={20} className="text-violet-500" /> B04 Otonom Excel Yükleyici
                            </h3>
                            <button onClick={() => { setCsvModal(false); setCsvText(''); }} className="bg-transparent border-0 text-slate-400 hover:text-white cursor-pointer"><X size={24} /></button>
                        </div>
                        <div className="bg-violet-950/20 border-2 border-violet-900/50 rounded-xl p-4 mb-5 text-xs text-violet-300 font-bold uppercase tracking-widest leading-loose">
                            SÜTUNLAR: <strong className="text-white">MODEL_KODU, MALİYET_TİPİ, AÇIKLAMA, TUTAR</strong><br />
                            <span className="text-[0.6rem] text-violet-400">TİPLER: personel_iscilik, hammadde_kumas, isletme_gideri, sarf_malzeme, fire_kaybi, sabit_gider, nakliye_lojistik</span>
                        </div>
                        <textarea
                            value={csvText} onChange={e => setCsvText(e.target.value)}
                            placeholder={'MDL-001, hammadde_kumas, Kumas alimi, 4500\nMDL-001, personel_iscilik, Usta Ali, 850'}
                            rows={8} className="w-full bg-[#122b27] border-2 border-slate-700 rounded-xl p-4 text-white font-mono text-xs outline-none focus:border-violet-500 mb-5 whitespace-nowrap overflow-auto"
                        />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setCsvModal(false); setCsvText(''); }} className="px-5 py-2.5 bg-slate-800 text-slate-300 font-black text-sm rounded-xl cursor-pointer border-0">İptal</button>
                            <button onClick={csvYukle} disabled={loading || !csvText.trim()} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-sm rounded-xl flex items-center gap-2 cursor-pointer border-0 shadow-lg disabled:opacity-50 transition-colors">
                                <Upload size={16} /> VERİYİ BAS
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
