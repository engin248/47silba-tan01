'use client';
import { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, RefreshCw, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';

// API ve Servisler (Zırhlı)
import {
    musteriVerileriniGetir,
    musteriEkleGuncelle,
    musteriKaraListeDurumDegistir,
    musteriSil,
    musteriGecmisiniGetir,
    musteriGecmisineNotEkle
} from '../services/musterilerApi';

// Alt Bileşenler (Tabs)
import MusteriIstatistikleriTab from './tabs/MusteriIstatistikleriTab';
import MusteriListesiTab from './tabs/MusteriListesiTab';
import MusteriFormDrawer from './tabs/MusteriFormDrawer';
import MusteriGecmisModali from './tabs/MusteriGecmisModali';

export const MUSTERI_TIPLERI = ['bireysel', 'toptan', 'magaza'];
export const TIP_LABEL = { bireysel: '👤 Bireysel', toptan: '🏭 Toptan', magaza: '🏪 Mağaza' };
export const TIP_RENK = { bireysel: '#3b82f6', toptan: '#8b5cf6', magaza: '#f59e0b' };
const BOSH_FORM = {
    musteri_kodu: '', ad_soyad: '', ad_soyad_ar: '', musteri_tipi: 'bireysel',
    telefon: '', email: '', adres: '', vergi_no: '', kara_liste: false, risk_limiti: '', aktif: true, segment: 'B', notlar: ''
};

export default function MusterilerMainContainer() {
    const { kullanici } = useAuth();
    const { lang, setLang } = useLang();
    const [yetkiliMi, setYetkiliMi] = useState(false);

    const [musteriler, setMusteriler] = useState([]);
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [duzenleId, setDuzenleId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [islemdeId, setIslemdeId] = useState(null);

    // Filtre
    const [aramaMetni, setAramaMetni] = useState('');
    const [filtreTip, setFiltreTip] = useState('hepsi');
    const [filtreKara, setFiltreKara] = useState(false);

    // Timeline (Geçmiş)
    const [timelineAcik, setTimelineAcik] = useState(false);
    const [seciliMusteri, setSeciliMusteri] = useState(null);
    const [timelineLoglari, setTimelineLoglari] = useState([]);
    const [yeniNot, setYeniNot] = useState('');
    const [notEkleniyor, setNotEkleniyor] = useState(false);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (erisebilir) {
            const kanal = supabase.channel('musteriler-gercek-zamanli')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_musteriler' }, yukle)
                .subscribe();
            yukle();
            return () => { supabase.removeChannel(kanal); };
        }
    }, [kullanici]);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setLoading(true);
        try {
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı (10sn)')), 10000));
            const [mRes] = await musteriVerileriniGetir(timeout);
            if (mRes?.status === 'fulfilled' && mRes.value.data) setMusteriler(mRes.value.data);
        } catch (e) { goster('Müşteri verileri alınamadı', 'error'); }
        setLoading(false);
    };

    const kaydet = async () => {
        if (islemdeId === 'kayit') return;
        setIslemdeId('kayit');
        if (!form.musteri_kodu.trim()) { setIslemdeId(null); return goster('Müşteri kodu zorunlu!', 'error'); }
        if (!form.ad_soyad.trim()) { setIslemdeId(null); return goster('Ad Soyad zorunlu!', 'error'); }

        const payload = {
            musteri_kodu: form.musteri_kodu.trim().toUpperCase(),
            ad_soyad: form.ad_soyad.trim(), ad_soyad_ar: form.ad_soyad_ar?.trim() || null,
            musteri_tipi: form.musteri_tipi, telefon: form.telefon?.trim() || null,
            email: form.email?.trim() || null, adres: form.adres?.trim() || null,
            vergi_no: form.vergi_no?.trim() || null, kara_liste: form.kara_liste || false,
            risk_limiti: form.risk_limiti ? parseFloat(form.risk_limiti) : null,
            aktif: form.aktif !== false,
        };

        setLoading(true);
        try {
            const r = await musteriEkleGuncelle(duzenleId, payload);
            if (r.offline) goster('⚡ Çevrimdışı: Müşteri kaydı kuyruğa alındı.');
            else { goster(r.mod === 'UPDATE' ? '✅ Müşteri güncellendi!' : '✅ Yeni müşteri eklendi!'); yukle(); }
            setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null);
        } catch (e) { goster('Kayıt hatası: ' + e.message, 'error'); }
        finally { setLoading(false); setIslemdeId(null); }
    };

    const timelineAc = async (m) => {
        setSeciliMusteri(m); setTimelineAcik(true); setTimelineLoglari([]);
        try {
            const data = await musteriGecmisiniGetir(m.musteri_kodu);
            setTimelineLoglari(data);
        } catch (e) { goster('Geçmiş yüklenemedi.', 'error'); }
    };

    const notEkle = async () => {
        if (!yeniNot.trim() || !seciliMusteri) return;
        setNotEkleniyor(true);
        try {
            await musteriGecmisineNotEkle(seciliMusteri.musteri_kodu, yeniNot, kullanici?.label || 'Saha Yetkilisi');
            setYeniNot('');
            const newData = await musteriGecmisiniGetir(seciliMusteri.musteri_kodu);
            setTimelineLoglari(newData);
            goster('Not eklendi.');
        } catch (e) { goster('Not eklenemedi.', 'error'); }
        finally { setNotEkleniyor(false); }
    };

    const duzenle = (m) => {
        setForm({ ...m });
        setDuzenleId(m.id); setFormAcik(true);
    };

    const karaListeDegistir = async (id, yeniDurum) => {
        if (islemdeId === 'kliste_' + id) return;
        setIslemdeId('kliste_' + id);
        try {
            const r = await musteriKaraListeDurumDegistir(id, yeniDurum);
            if (r.offline) goster('⚡ Çevrimdışı: Kara liste kuyruğa alındı.');
            else { goster(yeniDurum ? '🚫 Kara listeye alındı!' : '✅ Kara listeden çıkarıldı.'); yukle(); }
        } catch (e) { goster('Hata.', 'error'); }
        finally { setIslemdeId(null); }
    };

    const sil = async (id, kod) => {
        if (islemdeId === 'sil_' + id) return;
        setIslemdeId('sil_' + id);
        if (kullanici?.grup !== 'tam') { setIslemdeId(null); return goster('Silme yetkisi sadece Sistem Yöneticisine aittir.', 'error'); }
        if (!confirm(`"${kod}" müşterisi kalıcı silinecek. Emin misiniz?`)) { setIslemdeId(null); return; }

        try {
            await musteriSil(id, kod, kullanici?.label || 'Saha Yetkilisi');
            goster(`"${kod}" silindi.`); yukle();
        } catch (e) { goster('Silinemedi.', 'error'); }
        finally { setIslemdeId(null); }
    };

    const filtreli = musteriler.filter(m => {
        const tipOk = filtreTip === 'hepsi' || m.musteri_tipi === filtreTip;
        const karaOk = !filtreKara || m.kara_liste === true;
        const aramaOk = !aramaMetni || [m.musteri_kodu, m.ad_soyad, m.telefon, m.email].some(v => v?.toLowerCase()?.includes(aramaMetni.toLowerCase()));
        return tipOk && karaOk && aramaOk;
    });

    if (!yetkiliMi) return (
        <div className="p-12 text-center bg-rose-950/20 border-2 border-rose-900/50 rounded-2xl m-8">
            <Lock size={48} className="mx-auto mb-4 text-rose-500" />
            <h2 className="text-xl font-black text-rose-500">YETKİSİZ GİRİŞ ENGELLENDİ</h2>
        </div>
    );

    const isAR = lang === 'ar';

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(5,150,105,0.3)]">
                        <UserCheck size={24} className="text-emerald-50" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight m-0">{isAR ? 'إدارة العملاء CRM' : 'Müşteriler CRM (M2)'}</h1>
                        <p className="text-xs font-bold text-emerald-200 mt-1 uppercase tracking-wider">{isAR ? 'تسجيل → تتبع → قائمة سوداء' : 'Otonom Müşteri ve Risk Takibi'}</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                    <button onClick={() => setLang(lang === 'tr' ? 'ar' : 'tr')} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-bold text-slate-300 text-xs cursor-pointer hover:bg-slate-800 transition-colors">
                        {lang === 'tr' ? '🇸🇦 AR' : '🇹🇷 TR'}
                    </button>
                    <button onClick={yukle} disabled={loading} className="flex items-center gap-1.5 bg-slate-900 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-800 transition-colors">
                        <RefreshCw size={14} /> Yenile
                    </button>
                    <button onClick={() => { setForm(BOSH_FORM); setDuzenleId(null); setFormAcik(!formAcik); }} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-sm cursor-pointer border-0 shadow-lg transition-all border-b-4 border-emerald-800">
                        <Plus size={18} /> {isAR ? 'إضافة عميل' : 'Yeni MüşteriEkle'}
                    </button>
                </div>
            </div>

            <MusteriIstatistikleriTab musteriler={musteriler} />

            {mesaj.text && (
                <div className={`p-4 mb-6 rounded-xl font-bold flex items-center shadow-sm border-2 animate-pulse ${mesaj.type === 'error' ? 'bg-red-950/20 text-red-500 border-red-500/50' : 'bg-emerald-950/20 text-emerald-500 border-emerald-500/50'}`}>
                    {mesaj.text}
                </div>
            )}

            <MusteriFormDrawer formAcik={formAcik} form={form} setForm={setForm} BOSH_FORM={BOSH_FORM} duzenleId={duzenleId} setDuzenleId={setDuzenleId} setFormAcik={setFormAcik} kaydet={kaydet} loading={loading} />

            <div className="flex gap-2 mb-4 flex-wrap items-center bg-[#0d1117] text-white p-2 rounded-xl border border-[#1e4a43]">
                <div className="relative flex-1 min-w-[220px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} placeholder={isAR ? 'البحث...' : 'Müşteri Ara...'}
                        className="w-full bg-[#122b27] border border-[#1e4a43] text-white font-bold text-sm px-4 py-2 pl-9 rounded-lg outline-none focus:border-emerald-500" />
                </div>
                {['hepsi', ...MUSTERI_TIPLERI].map(t => (
                    <button key={t} onClick={() => setFiltreTip(t)}
                        className={`px-3 py-1.5 rounded-lg border-2 font-bold cursor-pointer transition-all text-xs ${filtreTip === t ? 'text-white border-transparent' : 'bg-[#122b27] text-slate-400 border-[#1e4a43]'}`}
                        style={{ backgroundColor: filtreTip === t ? (TIP_RENK[t] || '#334155') : '' }}>
                        {t === 'hepsi' ? 'Tümü' : TIP_LABEL[t]}
                    </button>
                ))}
                <button onClick={() => setFiltreKara(!filtreKara)}
                    className={`px-3 py-1.5 rounded-lg border-2 font-bold cursor-pointer transition-all text-xs ${filtreKara ? 'bg-red-950 border-red-900 text-red-500' : 'bg-[#122b27] border-[#1e4a43] text-slate-400'}`}>
                    🚫 Kara Liste
                </button>
                <span className="text-xs font-bold text-emerald-700 bg-[#122b27] border border-[#1e4a43] px-2 py-1 rounded ml-auto">{filtreli.length} kayıt</span>
            </div>

            <MusteriListesiTab
                filtreli={filtreli} loading={loading} aramaMetni={aramaMetni} islemdeId={islemdeId}
                timelineAc={timelineAc} karaListeDegistir={karaListeDegistir}
                duzenle={duzenle} sil={sil}
            />

            <MusteriGecmisModali
                timelineAcik={timelineAcik} setTimelineAcik={setTimelineAcik} seciliMusteri={seciliMusteri}
                timelineLoglari={timelineLoglari} yeniNot={yeniNot} setYeniNot={setYeniNot}
                notEkle={notEkle} notEkleniyor={notEkleniyor}
            />
        </div>
    );
}
