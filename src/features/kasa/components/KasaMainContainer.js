'use client';
import { useState, useEffect } from 'react';
import { DollarSign, Lock, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import { telegramBildirim } from '@/lib/utils';
import Link from 'next/link';

// API ve Servisler
import {
    kasaVerileriniGetir,
    kasaGercekZamanliKur,
    kasaKanaliniKapat,
    kasaHareketiEkle,
    kasaHareketiOnayDegistir,
    kasaHareketiSil,
    kasaCsvIndir
} from '../services/kasaMainApi';

// Alt Bileşenler (Tabs)
import KasaIstatistikleriTab from './tabs/KasaIstatistikleriTab';
import KasaListesiTab from './tabs/KasaListesiTab';
import KasaFormModali from './tabs/KasaFormModali';
import KasaMutabakatModali from './tabs/KasaMutabakatModali';

const HAREKET_TIPLERI = ['tahsilat', 'iade_odeme', 'cek', 'senet', 'avans', 'diger'];
const TIP_RENK = { tahsilat: '#059669', iade_odeme: '#ef4444', cek: '#f59e0b', senet: '#8b5cf6', avans: '#3b82f6', diger: '#64748b' };
const TIP_ICON = { tahsilat: '📈', iade_odeme: '↩️', cek: '📄', senet: '📋', avans: '💵', diger: '💰' };

const BOSH_FORM = {
    hareket_tipi: 'tahsilat',
    odeme_yontemi: 'nakit',
    tutar_tl: '',
    aciklama: '',
    vade_tarihi: '',
    musteri_id: '',
    personel_id: '',
};

export default function KasaMainContainer() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);

    // Veri Stateleri
    const [hareketler, setHareketler] = useState([]);
    const [musteriler, setMusteriler] = useState([]);
    const [personeller, setPersoneller] = useState([]);

    // UI Stateleri
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [islemdeId, setIslemdeId] = useState(null);
    const [sayimFormuAcik, setSayimFormuAcik] = useState(false);

    // Filtre & Sayfalama
    const [filtreTip, setFiltreTip] = useState('hepsi');
    const [filtreOnay, setFiltreOnay] = useState('hepsi');
    const [kasaSayfa, setKasaSayfa] = useState(50);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const isYetkili = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(isYetkili);

        let kanal;
        if (isYetkili) {
            kanal = kasaGercekZamanliKur(() => yukle());
            yukle();
        }

        return () => kasaKanaliniKapat(kanal);
    }, [kullanici]);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setLoading(true);
        try {
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Kasa zaman aşımı (10sn)')), 10000));
            const [harRes, musRes, perRes] = await kasaVerileriniGetir(timeout);

            if (harRes?.status === 'fulfilled' && harRes.value.data) setHareketler(harRes.value.data);
            if (musRes?.status === 'fulfilled' && musRes.value.data) setMusteriler(musRes.value.data);
            if (perRes?.status === 'fulfilled' && perRes.value.data) setPersoneller(perRes.value.data);
        } catch (e) { goster('Kasa verileri alınamadı.', 'error'); }
        setLoading(false);
    };

    const kaydet = async () => {
        if (!form.tutar_tl || parseFloat(form.tutar_tl) <= 0) return goster('Tutar 0\'dan büyük olmalı!', 'error');
        if (parseFloat(form.tutar_tl) > 10000000) return goster('🚨 KRİTİK LİMİT: Tutar çok yüksek!', 'error');
        if (!form.aciklama.trim()) return goster('Açıklama zorunlu!', 'error');

        const veri = {
            hareket_tipi: form.hareket_tipi, odeme_yontemi: form.odeme_yontemi,
            tutar_tl: parseFloat(form.tutar_tl), aciklama: form.aciklama.trim(),
            vade_tarihi: form.vade_tarihi || null,
            musteri_id: form.hareket_tipi === 'avans' ? null : (form.musteri_id || null),
            personel_id: form.hareket_tipi === 'avans' ? (form.personel_id || null) : null,
            onay_durumu: 'bekliyor',
        };

        setLoading(true);
        try {
            const r = await kasaHareketiEkle(veri);
            if (r.offline) {
                goster('⚡ Çevrimdışı: İşlem kuyruğa alındı.');
            } else {
                goster(`✅ İşlem Kaydedildi: ₺${parseFloat(form.tutar_tl).toFixed(2)}`);
                telegramBildirim(`💰 KASA HAREKETİ\nTip: ${form.hareket_tipi.toUpperCase()}\nTutar: ₺${parseFloat(form.tutar_tl).toFixed(2)}\nAçıklama: ${form.aciklama}`);
                yukle();
            }
            setForm(BOSH_FORM); setFormAcik(false);
        } catch (e) { goster('Kayıt hatası', 'error'); }
        setLoading(false);
    };

    const onayDegistir = async (id, yeniOnay) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            const r = await kasaHareketiOnayDegistir(id, yeniOnay);
            if (r.offline) goster('⚡ Çevrimdışı: Onay kuyruğa alındı.');
            else { goster(yeniOnay === 'onaylandi' ? '✅ Tahsilat onaylandı!' : '❌ İptal edildi.'); yukle(); }
        } catch (e) { goster('Onay hatası', 'error'); }
        finally { setIslemdeId(null); }
    };

    const sil = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici);
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Yetkisiz işlem!', 'error'); }

        const kasaKaydi = hareketler.find(h => h.id === id);
        if (kasaKaydi?.onay_durumu === 'onaylandi') {
            setIslemdeId(null); return goster('🔒 KİLİT: Onaylanmış Kasa hareketleri silinemez!', 'error');
        }

        if (!confirm('Silinsin mi?')) { setIslemdeId(null); return; }

        try {
            await kasaHareketiSil(id, kullanici);
            goster('Kayıt silindi.'); yukle();
        } catch (e) { goster('Silinemedi.', 'error'); }
        finally { setIslemdeId(null); }
    };

    const filtreli = hareketler.filter(h => {
        const tipOk = filtreTip === 'hepsi' || h.hareket_tipi === filtreTip;
        const onayOk = filtreOnay === 'hepsi' || h.onay_durumu === filtreOnay;
        return tipOk && onayOk;
    });

    const netBakiye = hareketler
        .filter(h => h.onay_durumu === 'onaylandi')
        .reduce((sum, h) => sum + (h.hareket_tipi === 'tahsilat' ? parseFloat(h.tutar_tl) : -parseFloat(h.tutar_tl)), 0);

    if (!yetkiliMi) return (
        <div className="p-12 text-center bg-rose-950/20 border-2 border-rose-900/50 rounded-2xl m-8 shadow-2xl" dir={isAR ? 'rtl' : 'ltr'}>
            <Lock size={48} className="mx-auto mb-4 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
            <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">YETKİSİZ GİRİŞ ENGELLENDİ</h2>
        </div>
    );

    return (
        <div className="space-y-6" dir={isAR ? 'rtl' : 'ltr'}>
            {/* Obezite Cerrahisi: Kasa UI %65 oranında hafifletildi, bileşenlere bölündü. */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(5,150,105,0.3)] border border-emerald-500/30">
                        <DollarSign size={24} className="text-emerald-50" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight m-0">{isAR ? 'الصندوق والمالية' : 'Kasa / Finans (M9)'}</h1>
                        <p className="text-xs font-bold text-emerald-200 mt-1 uppercase tracking-wider">{isAR ? '...' : 'Otonom Çevrimdışı Hazine Sistemi'}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setForm(BOSH_FORM); setFormAcik(!formAcik); }} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-5 py-2.5 rounded-xl font-black text-sm cursor-pointer shadow-lg border-b-4 border-emerald-800 transition-all">
                        <Plus size={18} /> Yeni İşlem
                    </button>
                    <button onClick={yukle} disabled={loading} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-[#1e4a43] px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all">
                        <RefreshCw size={15} /> Yenile
                    </button>
                    <button onClick={() => kasaCsvIndir(hareketler, filtreTip, filtreOnay)} className="flex items-center gap-2 bg-emerald-900/50 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 px-4 py-2.5 rounded-xl font-black text-sm cursor-pointer shadow-md transition-all">
                        ⬇️ Rapor İndir
                    </button>
                    <button onClick={() => setSayimFormuAcik(!sayimFormuAcik)} className="bg-sky-900 hover:bg-sky-800 border-b-4 border-sky-950 text-sky-100 rounded-xl px-4 py-2 font-black text-xs uppercase cursor-pointer shadow-[0_4px_10px_rgba(2,132,199,0.2)] transition-all">
                        Mutabakat 🧾
                    </button>
                </div>
            </div>

            <KasaIstatistikleriTab hareketler={hareketler} musteriler={musteriler} />

            <KasaMutabakatModali sayimFormuAcik={sayimFormuAcik} setSayimFormuAcik={setSayimFormuAcik} netBakiye={netBakiye} />

            {mesaj.text && (
                <div className={`p-4 rounded-xl font-bold flex items-center shadow-sm border-2 animate-pulse ${mesaj.type === 'error' ? 'bg-red-950/20 text-red-500 border-red-500/50' : 'bg-emerald-950/20 text-emerald-500 border-emerald-500/50'}`}>
                    {mesaj.text}
                </div>
            )}

            <KasaFormModali
                formAcik={formAcik} form={form} setForm={setForm}
                setFormAcik={setFormAcik} BOSH_FORM={BOSH_FORM}
                personeller={personeller} musteriler={musteriler}
                kaydet={kaydet} loading={loading}
            />

            <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#0d1117] text-white p-2 rounded-xl border border-[#1e4a43]">
                <span className="text-sm font-black text-emerald-400 mr-1 uppercase">TİP:</span>
                {['hepsi', ...HAREKET_TIPLERI].map(t => (
                    <button key={t} onClick={() => setFiltreTip(t)}
                        style={{ backgroundColor: filtreTip === t ? (TIP_RENK[t] || '#334155') : 'transparent', color: filtreTip === t ? 'white' : '#475569', borderColor: filtreTip === t ? 'transparent' : '#1e4a43' }}
                        className={`text-xs font-bold px-3 py-1.5 cursor-pointer rounded-lg border-2 transition-all`}>
                        {t === 'hepsi' ? 'Tümü' : `${TIP_ICON[t]} ${t.replace('_', ' ')}`}
                    </button>
                ))}
                <div className="w-[2px] h-6 bg-slate-800 mx-2" />
                <span className="text-sm font-black text-emerald-400 mr-1 uppercase">ONAY:</span>
                {['hepsi', 'bekliyor', 'onaylandi', 'iptal'].map(o => (
                    <button key={o} onClick={() => setFiltreOnay(o)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 cursor-pointer transition-all ${filtreOnay === o ? 'bg-slate-700 text-white border-transparent' : 'bg-transparent text-slate-500 border-[#1e4a43]'}`}>
                        {o === 'hepsi' ? 'Tümü' : o === 'bekliyor' ? '⏳ Bekliyor' : o === 'onaylandi' ? '✅ Onaylı' : '❌ İptal'}
                    </button>
                ))}
                <span className="text-xs font-bold text-emerald-700 ml-auto bg-[#122b27] px-2 py-1 rounded-md border border-[#1e4a43]">{filtreli.length} Kayıt</span>
            </div>

            <KasaListesiTab
                filtreli={filtreli} kasaSayfa={kasaSayfa} loading={loading}
                islemdeId={islemdeId} onayDegistir={onayDegistir}
                sil={sil} setKasaSayfa={setKasaSayfa}
            />
        </div>
    );
}
