'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { FileCheck, TrendingDown, TrendingUp, Lock, Trash2, Edit2, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import { idb } from '@/lib/idbKalkan';
import Link from 'next/link';

import BilancoTab from './tabs/BilancoTab';
import FaturaTab from './tabs/FaturaTab';
import UretimIstatistikKartlari from './tabs/UretimIstatistikKartlari';
import UretimBekleyenRaporlar from './tabs/UretimBekleyenRaporlar';
import RaporDuzenleModal from './modals/RaporDuzenleModal';
import { birimMaliyet, asimPct, DURUM_RENK, DURUM_LABEL, MALIYET_LABEL } from './MuhasebeUtils';

export default function MuhasebeMainContainer() {
    const { kullanici: rawKullanici } = useAuth();
    const kullanici = rawKullanici;
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [raporlar, setRaporlar] = useState([]);
    const [secilenRapor, setSecilenRapor] = useState(null);
    const [ilgiliMaliyetler, setIlgiliMaliyetler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [raporsizemOrders, setRaporsizemOrders] = useState([]);
    const [aramaMetni, setAramaMetni] = useState('');
    const [muhasebeSekmesi, setMuhasebeSekmesi] = useState('uretim');
    const [duzenleModal, setDuzenleModal] = useState(null);
    const [duzenleForm, setDuzenleForm] = useState({ zayiat_adet: '', hedeflenen_maliyet_tl: '', notlar: '', ek_maliyet_tl: '' });
    const [islemdeId, setIslemdeId] = useState(null);

    const goster = createGoster(setMesaj);

    const yukle = async () => {
        setLoading(true);
        try {
            const otonomSync = async () => {
                const req1 = supabase.from('b1_muhasebe_raporlari').select('*').order('created_at', { ascending: false }).limit(300);
                const req2 = supabase.from('production_orders')
                    .select('id, quantity, status, b1_model_taslaklari:model_id(model_kodu, model_adi)')
                    .eq('status', 'completed')
                    .order('updated_at', { ascending: false }).limit(300);

                const timeoutPromise = () => new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı')), 10000));
                const [rRes, mRes] = await Promise.race([Promise.allSettled([req1, req2]), timeoutPromise()]);

                let currentRaporlar = [];
                if (rRes.status === 'fulfilled' && rRes.value.data) {
                    currentRaporlar = rRes.value.data;
                }
                if (mRes.status === 'fulfilled' && mRes.value.data) {
                    currentRaporlar = currentRaporlar.map(r => {
                        const eslesenEmir = mRes.value.data.find(o => o.id === r.order_id);
                        return { ...r, model_kodu: eslesenEmir?.b1_model_taslaklari?.model_kodu || r.model_kodu || null, model_adi: eslesenEmir?.b1_model_taslaklari?.model_adi || r.model_adi || null };
                    });
                    setRaporlar(currentRaporlar);
                    await idb.bulkUpsert('m14_muhasebe', currentRaporlar);

                    const raporOrderIds = new Set(currentRaporlar.map(r => r.order_id));
                    const maplenmisEmirler = mRes.value.data.map(o => ({
                        id: o.id, model_kodu: o.b1_model_taslaklari?.model_kodu || 'Bilinmiyor',
                        model_adi: o.b1_model_taslaklari?.model_adi || 'Bilinmeyen Model', hedef_adet: o.quantity || 0
                    }));
                    setRaporsizemOrders(maplenmisEmirler.filter(o => !raporOrderIds.has(o.id)));
                }
            };

            const localData = await idb.getAllWithLimit('m14_muhasebe', 300, 0);
            if (!localData || localData.length === 0) {
                await otonomSync();
            } else {
                setRaporlar(localData);
                otonomSync(); // background sync
            }
        } catch (error) { goster('IDB Fallback Aktif (Ağ yavaş): ' + error.message, 'error'); }
        setLoading(false);
    };

    useEffect(() => {
        const isYetkili = kullanici?.grup === 'tam' || !!sessionStorage.getItem('sb47_uretim_token');
        setYetkiliMi(isYetkili);

        let kanal = null;
        if (isYetkili && !document.hidden) {
            kanal = supabase.channel('muhasebe-realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_muhasebe_raporlari' }, yukle)
                .subscribe();
            yukle();
        }
        const handleVis = () => { if (document.hidden && kanal) { supabase.removeChannel(kanal); } else if (!document.hidden && isYetkili) { yukle(); } };
        document.addEventListener('visibilitychange', handleVis);

        return () => { if (kanal) supabase.removeChannel(kanal); document.removeEventListener('visibilitychange', handleVis); };
    }, [kullanici]);

    const raporSec = async (rapor) => {
        setSecilenRapor(rapor);
        try {
            const { data, error } = await supabase.from('b1_maliyet_kayitlari').select('*').eq('order_id', rapor.order_id).order('created_at').limit(500);
            if (error) throw error;
            setIlgiliMaliyetler(data || []);
        } catch (error) { goster('Detay yüklenemedi.', 'error'); }
    };

    const durumGuncelle = async (id, yeniDurum) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'UPDATE', { id, rapor_durumu: yeniDurum, ...(yeniDurum === 'onaylandi' ? { onay_tarihi: new Date().toISOString() } : {}) });
            if (secilenRapor?.id === id) setSecilenRapor(p => ({ ...p, rapor_durumu: yeniDurum }));
            setIslemdeId(null);
            return goster('⚡ Çevrimdışı: Durum kuyruğa alındı.');
        }
        try {
            await supabase.from('b1_muhasebe_raporlari').update({ rapor_durumu: yeniDurum, ...(yeniDurum === 'onaylandi' ? { onay_tarihi: new Date().toISOString() } : {}) }).eq('id', id);
            goster(`✅ Durum: ${DURUM_LABEL[yeniDurum]}`); yukle();
            if (secilenRapor?.id === id) setSecilenRapor(p => ({ ...p, rapor_durumu: yeniDurum }));
            telegramBildirim(`📋 MUHASEBE GÜNCELLEMESİ:\nRapor durumu değiştirildi: ${yeniDurum.toUpperCase()}`);
        } catch (e) { goster('Hata', 'error'); }
        finally { setIslemdeId(null); }
    };

    const devirKapat = async (rapor) => {
        if (islemdeId === 'devir_' + rapor.id) return;
        setIslemdeId('devir_' + rapor.id);
        const { yetkili, mesaj: yMsj } = await silmeYetkiDogrula(kullanici);
        if (!yetkili) { setIslemdeId(null); return goster(yMsj || 'Yetkisiz!', 'error'); }
        if (!confirm('Raporu onaylayıp 2. Birime kilitliyorsunuz. Emin misiniz?')) { setIslemdeId(null); return; }

        try {
            await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_muhasebe_raporlari', islem_tipi: 'UPDATE', kullanici_adi: kullanici?.label || 'Muhasebe Yetkilisi', eski_veri: { mesaj: rapor.model_kodu + ' muhasebesi kilitlendi.' } }]);
            await supabase.from('b1_muhasebe_raporlari').update({ rapor_durumu: 'kilitlendi', devir_durumu: true, onay_tarihi: new Date().toISOString() }).eq('id', rapor.id);
            goster('✅ Rapor kilitlendi ve 2. Birime devredildi!'); yukle(); setSecilenRapor(null);
            telegramBildirim(`🔒 DEVİR ONAYLANDI! Rapor KİLİTLENDİ.`);
        } catch (error) { goster('Devir hatası: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const uretimdenRaporOlustur = async (model) => {
        setLoading(true);
        try {
            const { data: m } = await supabase.from('b1_maliyet_kayitlari').select('tutar_tl').eq('order_id', model.id);
            let toplam = (m || []).reduce((s, k) => s + parseFloat(k.tutar_tl || 0), 0);
            const yuzde15 = parseFloat((toplam * 0.15).toFixed(2));
            if (yuzde15 > 0) {
                await supabase.from('b1_maliyet_kayitlari').insert([{ order_id: model.id, maliyet_tipi: 'isletme_gideri', kalem_aciklama: 'Otonom GÜG (%15 İşletme/Amortisman Payı)', tutar_tl: yuzde15, onay_durumu: 'hesaplandi' }]);
                toplam += yuzde15;
            }
            const payload = { order_id: model.id, gerceklesen_maliyet_tl: parseFloat(toplam.toFixed(2)), net_uretilen_adet: model.hedef_adet || 0, zayiat_adet: 0, rapor_durumu: 'sef_onay_bekliyor', devir_durumu: false };
            await supabase.from('b1_muhasebe_raporlari').insert([payload]);
            goster(`✅ Rapor oluşturuldu. Toplam GÜG Dahil: ₺${toplam.toFixed(2)}`); yukle();
        } catch (error) { goster('Oluşturma hatası', 'error'); }
        setLoading(false);
    };

    const raporSil = async (rapor) => {
        if (islemdeId === 'sil_' + rapor.id) return;
        setIslemdeId('sil_' + rapor.id);
        if (rapor.rapor_durumu === 'kilitlendi') { setIslemdeId(null); return goster('Kilitli rapor silinemez!', 'error'); }
        const { yetkili, mesaj: sMsj } = await silmeYetkiDogrula(kullanici);
        if (!yetkili) { setIslemdeId(null); return goster(sMsj || 'Yetkisiz!', 'error'); }
        if (!confirm('Rapor SİLİNECEK. Emin misiniz?')) { setIslemdeId(null); return; }
        try {
            await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_muhasebe_raporlari', islem_tipi: 'SILME', kullanici_adi: kullanici?.label || 'Muhasebe Yetkilisi', eski_veri: { id: rapor.id, model_kodu: rapor.model_kodu } }]);
            await supabase.from('b1_muhasebe_raporlari').delete().eq('id', rapor.id);
            goster('🗑️ Silindi ve Loglandı.'); if (secilenRapor?.id === rapor.id) setSecilenRapor(null); yukle();
        } catch (error) { goster('Silme hatası', 'error'); }
        finally { setIslemdeId(null); }
    };

    const duzenleKaydet = async () => {
        if (!duzenleModal) return;
        setLoading(true);
        try {
            const payload = duzenleModal.zeyilname_modu
                ? { ek_maliyet_tl: parseFloat(duzenleForm.ek_maliyet_tl) || 0, notlar: duzenleForm.notlar?.trim() || null }
                : { zayiat_adet: parseInt(duzenleForm.zayiat_adet) || 0, hedeflenen_maliyet_tl: parseFloat(duzenleForm.hedeflenen_maliyet_tl) || 0, notlar: duzenleForm.notlar?.trim() || null };
            await supabase.from('b1_muhasebe_raporlari').update(payload).eq('id', duzenleModal.id);
            goster('✅ Güncellendi!'); yukle();
            if (secilenRapor?.id === duzenleModal.id) setSecilenRapor(p => ({ ...p, ...payload }));
            setDuzenleModal(null);
        } catch (error) { goster('Hata', 'error'); }
        setLoading(false);
    };

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 border-2 border-rose-900/50 rounded-2xl m-8" dir={isAR ? 'rtl' : 'ltr'}>
                <Lock size={48} className="mx-auto mb-4 text-rose-500 drop-shadow-[0_0_15px_#f43f5e]" />
                <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p className="text-rose-300 font-bold mt-2">M14 Muhasebe Karargahı gizlidir. Üretim PİN / Tam Yetki zorunludur.</p>
            </div>
        );
    }

    const filtreliRaporlar = raporlar.filter(r => !aramaMetni || r.model_kodu?.toLowerCase().includes(aramaMetni.toLowerCase()) || r.model_adi?.toLowerCase().includes(aramaMetni.toLowerCase()));
    const istatistik = { toplam: raporlar.length, bekleyen: raporlar.filter(r => r.rapor_durumu === 'sef_onay_bekliyor').length, onaylandi: raporlar.filter(r => r.rapor_durumu === 'onaylandi').length, kilitli: raporlar.filter(r => r.rapor_durumu === 'kilitlendi').length };

    return (
        <div className="space-y-6" dir={isAR ? 'rtl' : 'ltr'}>
            <div className={`p-4 rounded-xl font-bold transition-all ${mesaj.text ? 'opacity-100 mb-6' : 'opacity-0 m-0 h-0 overflow-hidden'} ${mesaj.type === 'error' ? 'bg-red-950/40 border border-red-900 text-red-500' : 'bg-emerald-950/40 border border-emerald-900 text-emerald-500'}`}>
                {mesaj.text}
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#0b1d1a] border border-[#1e4a43] rounded-[16px] flex items-center justify-center shadow-lg">
                        <FileCheck size={28} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2.5xl font-black text-white m-0 uppercase tracking-tight">Muhasebe (M14)</h1>
                        <p className="text-emerald-500 text-[0.65rem] font-bold uppercase tracking-widest border-emerald-900 mt-1">İncele → Şef Onayı → Kilitle → Final</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 bg-[#122b27] p-2 rounded-xl border border-[#1e4a43]">
                {[{ id: 'uretim', label: '📄 Z-Raporları (M14)' }, { id: 'bilanco', label: '⚖️ Bilanço (MU-06)' }, { id: 'fatura', label: '📅 Vergi (MU-03)' }].map(s => (
                    <button key={s.id} onClick={() => setMuhasebeSekmesi(s.id)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${muhasebeSekmesi === s.id ? 'bg-emerald-600 text-white shadow-[0_4px_14px_rgba(4,120,87,0.4)]' : 'bg-transparent text-emerald-600/60 hover:text-emerald-400 border border-transparent'}`}>
                        {s.label}
                    </button>
                ))}
            </div>

            {muhasebeSekmesi === 'bilanco' && <BilancoTab />}
            {muhasebeSekmesi === 'fatura' && <FaturaTab />}

            {muhasebeSekmesi === 'uretim' && (
                <div className="animate-fade-in space-y-6">
                    <UretimIstatistikKartlari istatistik={istatistik} />

                    <div className="relative max-w-md">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} placeholder="Z-Raporu ara..."
                            className="w-full pl-11 pr-4 py-3 bg-[#122b27] border-2 border-[#1e4a43] text-white rounded-xl text-sm font-bold outline-none focus:border-emerald-500 placeholder:text-slate-600" />
                    </div>

                    <UretimBekleyenRaporlar raporsizemOrders={raporsizemOrders} loading={loading} uretimdenRaporOlustur={uretimdenRaporOlustur} />

                    <div className="flex flex-wrap lg:flex-nowrap gap-6 items-start">
                        {/* Sol Liste */}
                        <div className="w-full lg:w-5/12 shrink-0 flex flex-col gap-3">
                            {filtreliRaporlar.map(r => {
                                const pct = asimPct(r);
                                const isKilitli = r.rapor_durumu === 'kilitlendi';
                                const aktf = secilenRapor?.id === r.id;

                                return (
                                    <div key={r.id} onClick={() => raporSec(r)}
                                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 ${aktf ? 'bg-[#0d1117] border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-[#122b27] border-[#1e4a43]'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex gap-2 mb-1.5">
                                                    <span className="text-[0.65rem] font-black bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded uppercase tracking-widest">{r.model_kodu || 'RAPOR'}</span>
                                                    <span className="text-[0.65rem] font-black px-2 py-0.5 rounded tracking-widest uppercase border" style={{ color: DURUM_RENK[r.rapor_durumu], borderColor: DURUM_RENK[r.rapor_durumu] + '40' }}>{DURUM_LABEL[r.rapor_durumu]}</span>
                                                </div>
                                                <div className="font-black text-white text-[0.95rem]">{r.model_adi || 'Bilinmeyen Model'}</div>
                                            </div>
                                            <div className="flex flex-col gap-2 items-end">
                                                <div className={`font-black text-xs flex items-center gap-1 ${pct > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                    {pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} %{Math.abs(pct)} Sapma
                                                </div>
                                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                    {!isKilitli ? (
                                                        <>
                                                            <button onClick={() => { setDuzenleForm({ zayiat_adet: String(r.zayiat_adet || 0), hedeflenen_maliyet_tl: String(r.hedeflenen_maliyet_tl || ''), notlar: r.notlar || '', ek_maliyet_tl: '0' }); setDuzenleModal({ ...r, zeyilname_modu: false }); }}
                                                                className="bg-sky-950 border border-sky-900 text-sky-400 p-1.5 rounded-lg flex items-center cursor-pointer transition-colors hover:bg-sky-900 hover:text-white"><Edit2 size={13} /></button>
                                                            <button onClick={() => raporSil(r)} disabled={islemdeId === 'sil_' + r.id}
                                                                className="bg-rose-950 border border-rose-900 text-rose-500 p-1.5 rounded-lg flex items-center cursor-pointer transition-colors hover:bg-rose-900 hover:text-white disabled:opacity-50"><Trash2 size={13} /></button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => { setDuzenleForm({ zayiat_adet: String(r.zayiat_adet || 0), hedeflenen_maliyet_tl: String(r.hedeflenen_maliyet_tl || ''), notlar: r.notlar || '', ek_maliyet_tl: String(r.ek_maliyet_tl || 0) }); setDuzenleModal({ ...r, zeyilname_modu: true }); }}
                                                            className="bg-amber-950/40 text-amber-500 border border-amber-900/50 hover:bg-amber-900 hover:text-white px-2.5 py-1 rounded-lg font-black text-[0.65rem] uppercase tracking-widest cursor-pointer transition-colors">➕ Zeyilname</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-1">
                                            <div className="bg-[#0b1d1a] border border-[#1e4a43] rounded-xl p-3">
                                                <div className="text-[0.65rem] text-slate-500 font-black uppercase tracking-widest mb-1">Hedef Maliyet</div>
                                                <div className="font-black text-slate-300">₺{parseFloat(r.hedeflenen_maliyet_tl || 0).toLocaleString()}</div>
                                            </div>
                                            <div className="bg-[#0b1d1a] border border-emerald-900/40 rounded-xl p-3">
                                                <div className="text-[0.65rem] text-emerald-500/80 font-black uppercase tracking-widest mb-1">Gerçekleşen Tpl.</div>
                                                <div className="font-black text-emerald-400">₺{parseFloat(r.gerceklesen_maliyet_tl || 0).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sağ Detay */}
                        {secilenRapor && (
                            <div className="w-full lg:w-7/12 shrink-0 bg-[#0d1117] border border-[#1e4a43] shadow-[0_4px_30px_rgba(4,120,87,0.1)] rounded-3xl p-6 lg:sticky lg:top-6 min-h-[400px]">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#1e4a43]">
                                    <h2 className="font-black text-white text-lg m-0 flex items-center gap-2"><span className="text-emerald-500 text-2xl">📊</span> Final Z-Raporu</h2>
                                    <button onClick={() => setSecilenRapor(null)} className="w-8 h-8 flex items-center justify-center bg-transparent hover:bg-slate-800 text-slate-400 rounded-lg cursor-pointer transition-colors"><X size={20} /></button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                    {[
                                        { l: 'Hedef Bütçe', v: `₺${parseFloat(secilenRapor.hedeflenen_maliyet_tl || 0).toLocaleString()}`, c: 'text-white' },
                                        { l: 'Toplam Maliyet', v: `₺${(parseFloat(secilenRapor.gerceklesen_maliyet_tl || 0) + parseFloat(secilenRapor.ek_maliyet_tl || 0)).toLocaleString()}`, c: 'text-emerald-400' },
                                        { l: 'Zeyilname (Ek)', v: `₺${parseFloat(secilenRapor.ek_maliyet_tl || 0).toLocaleString()}`, c: 'text-amber-500' },
                                        { l: 'Birim Mal.', v: `₺${birimMaliyet(secilenRapor)}`, c: 'text-sky-400' },
                                        { l: 'Net Üretim', v: `${secilenRapor.net_uretilen_adet} ad.`, c: 'text-fuchsia-400' },
                                        { l: 'Zayiat', v: `${secilenRapor.zayiat_adet} ad.`, c: 'text-rose-500' }
                                    ].map((m, i) => (
                                        <div key={i} className="bg-[#122b27] border border-[#1e4a43] text-center rounded-xl p-3 shadow-inner">
                                            <div className="text-[0.65rem] text-slate-500 font-black uppercase tracking-widest mb-1">{m.l}</div>
                                            <div className={`font-black tracking-tight text-lg ${m.c}`}>{m.v}</div>
                                        </div>
                                    ))}
                                </div>

                                {secilenRapor.notlar && (
                                    <div className="bg-[#122b27] border-l-4 border-indigo-500 rounded-lg p-4 mb-6 text-sm font-bold text-slate-300">
                                        <span className="text-indigo-400 font-black uppercase text-[0.65rem] tracking-widest block mb-1">M14 KARARGAH NOTU:</span>
                                        {secilenRapor.notlar}
                                    </div>
                                )}

                                {ilgiliMaliyetler.length > 0 && (() => {
                                    const d = ilgiliMaliyetler.reduce((acc, c) => ({ ...acc, [c.maliyet_tipi || 'diger']: (acc[c.maliyet_tipi || 'diger'] || 0) + parseFloat(c.tutar_tl || 0) }), {});
                                    const tipRenk = { personel_iscilik: 'bg-sky-500', hammadde_kumas: 'bg-fuchsia-500', isletme_gideri: 'bg-amber-500', sarf_malzeme: 'bg-emerald-500', diger: 'bg-slate-500', fire_kaybi: 'bg-rose-500' };
                                    return (
                                        <div className="mb-6 bg-[#0b1d1a] border border-[#1e4a43] p-5 rounded-2xl shadow-inner">
                                            <div className="text-[0.65rem] font-black text-emerald-400 uppercase tracking-widest mb-4">GİDER DAĞILIM ANALİZİ</div>
                                            <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                {Object.entries(d).sort((a, b) => b[1] - a[1]).map(([t, val]) => (
                                                    <div key={t} className="flex justify-between items-center text-sm py-2 px-3 border-b border-[#1e4a43]/50 last:border-0 hover:bg-[#122b27] rounded-lg transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${tipRenk[t] || tipRenk.diger}`}></div>
                                                            <span className="font-bold text-slate-300">{MALIYET_LABEL[t] || t}</span>
                                                        </div>
                                                        <span className="font-black text-white font-mono">₺{val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="flex flex-col gap-3">
                                    {secilenRapor.rapor_durumu === 'taslak' && <button onClick={() => durumGuncelle(secilenRapor.id, 'sef_onay_bekliyor')} disabled={islemdeId === secilenRapor.id} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl py-3 border-0 border-b-4 border-amber-800 cursor-pointer shadow-lg disabled:opacity-50 transition-all">📤 ŞEF ONAYINA GÖNDER</button>}
                                    {secilenRapor.rapor_durumu === 'sef_onay_bekliyor' && <button onClick={() => durumGuncelle(secilenRapor.id, 'onaylandi')} disabled={islemdeId === secilenRapor.id} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl py-3 border-0 border-b-4 border-emerald-800 cursor-pointer shadow-lg disabled:opacity-50 transition-all">✅ MUHASEBE ONAYINI VER</button>}
                                    {secilenRapor.rapor_durumu === 'onaylandi' && <button onClick={() => devirKapat(secilenRapor)} disabled={islemdeId === 'devir_' + secilenRapor.id} className="w-full bg-[#122b27] hover:bg-[#0b1d1a] border-2 border-[#1e4a43] text-emerald-400 font-black rounded-xl py-3 cursor-pointer shadow-lg disabled:opacity-50 transition-all">🔒 RAPORU KİLİTLE & ARŞİVLE</button>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <RaporDuzenleModal duzenleModal={duzenleModal} setDuzenleModal={setDuzenleModal} duzenleForm={duzenleForm} setDuzenleForm={setDuzenleForm} loading={loading} duzenleKaydet={duzenleKaydet} />
        </div>
    );
}
