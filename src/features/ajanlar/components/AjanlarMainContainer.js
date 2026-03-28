'use client';
// @ts-nocheck
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect, useRef } from 'react';
import { Bot, Plus, CheckCircle2, AlertTriangle, RefreshCw, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import AjanKomutaGostergesi from '@/components/AjanKomutaGostergesi';
import AjanOrchestrator from './AjanOrchestrator';
import {
    ajanVerileriniGetir,
    ajanGorevEkle,
    ajanGorevSil,
    ajanGercekZamanliKur
} from '../services/ajanlarApi';

// Alt Modüller
import AjanlarIstatistikCards from './tabs/AjanlarIstatistikCards';
import AjanlarGorevTahtasi from './tabs/AjanlarGorevTahtasi';
import AjanlarKonfigurasyon from './tabs/AjanlarKonfigurasyon';
import AjanlarMaliyetTab from './tabs/AjanlarMaliyetTab';

// Sabitler
const VARSAYILAN_KONFIGUR = {
    trendyol: { isim: 'Trendyol Gölge Avcısı', ikon: '🛒', renk: '#f97316', gorevler: [{ id: 'ty_1', ad: 'Sepete Ekleme Deltası Takibi', aktif: true, tablo: 'b1_arge_products', neden_pasif: '' }] },
    tiktok: { isim: 'TikTok Gözcüsü', ikon: '🎵', renk: '#000000', gorevler: [{ id: 'tk_1', ad: 'Videolarda Viral Kopma Hızı', aktif: true, tablo: 'b1_arge_products', neden_pasif: '' }] },
    instagram: { isim: 'Instagram Radar Botu', ikon: '📸', renk: '#e1306c', gorevler: [{ id: 'ig_1', ad: 'Koleksiyona Kaydetme Sıcaklık Skoru', aktif: true, tablo: 'b1_arge_products', neden_pasif: '' }] },
    facebook: { isim: 'Facebook Demografi Analizörü', ikon: '📘', renk: '#1877f2', gorevler: [{ id: 'fb_1', ad: 'Organik Büyüme Ayrımı', aktif: true, tablo: 'b1_arge_products', neden_pasif: '' }] },
    motor: { isim: 'M1 Merkezi Karar Motoru (Zırh)', ikon: '⚙️', renk: '#10b981', gorevler: [{ id: 'mt_1', ad: 'Sosyal Sinyal ile Pazar Satışını Üst Üste Oturtma', aktif: true, tablo: 'b1_arge_products', neden_pasif: '' }, { id: 'mt_4', ad: 'Geçmiş Satış Kayıtlarından Tarihsel Doğrulama', aktif: false, tablo: 'b2_siparisler', neden_pasif: 'Geçmiş ciro datası boş' }] }
};

const BOS_FORM = {
    gorev_adi: '', gorev_tipi: 'arastirma', oncelik: 'normal',
    gorev_emri: '', hedef_modul: 'arge', hedef_tablo: 'b1_arge_trendler',
    ajan_adi: 'Trend Kâşifi', yetki_internet: true, yetki_supabase_yaz: true,
    yetki_supabase_oku: true, yetki_ai_kullan: true, yetki_dosya_olustur: false,
    koordinator_notu: '',
};

export default function AjanlarMainContainer() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [sekme, setSekme] = useState('gorevler');
    const [gorevler, setGorevler] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOS_FORM);
    const [calistiriliyor, setCalistiriliyor] = useState({});
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtre, setFiltre] = useState('hepsi');
    const [secilenGorev, setSecilenGorev] = useState(null);
    const [istatistik, setIstatistik] = useState({ toplam: 0, tamamlandi: 0, calisıyor: 0, hata: 0, bekliyor: 0 });
    const [islemdeId, setIslemdeId] = useState(null);
    const [konfig, setKonfig] = useState(() => {
        if (typeof window !== 'undefined') { const k = localStorage.getItem('ajan_konfig'); return k ? JSON.parse(k) : VARSAYILAN_KONFIGUR; }
        return VARSAYILAN_KONFIGUR;
    });
    const pollingRef = useRef(undefined);
    const goster = createGoster(setMesaj);

    useEffect(() => {
        let ajanPin = false;
        try { ajanPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { ajanPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || ajanPin;
        setYetkiliMi(erisebilir);

        let kanal;
        if (erisebilir) kanal = ajanGercekZamanliKur(() => yukle());
        yukle();
        return () => { if (kanal) supabase.removeChannel(kanal); };
    }, [kullanici]);

    useEffect(() => {
        pollingRef.current = setInterval(() => {
            setGorevler(prev => { if (prev.some(g => g.durum === 'calisıyor')) yukleSessiz(); return prev; });
        }, 5000);
        return () => clearInterval(pollingRef.current);
    }, []);

    const sDurum = (data) => {
        if (!data) return;
        setIstatistik({
            toplam: data.length, tamamlandi: data.filter(g => g.durum === 'tamamlandi').length,
            'calisıyor': data.filter(g => g.durum === 'calisıyor').length, hata: data.filter(g => g.durum === 'hata').length,
            bekliyor: data.filter(g => g.durum === 'bekliyor').length,
        });
    };

    const yukleSessiz = async () => {
        try {
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000));
            const r = await ajanVerileriniGetir(timeout);
            if (r?.data) { setGorevler(r.data); sDurum(r.data); }
        } catch { }
    };

    const yukle = async () => {
        try {
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı (10sn)')), 10000));
            const r = await ajanVerileriniGetir(timeout);
            if (r?.data) { setGorevler(r.data); sDurum(r.data); }
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const gorevGonder = async () => {
        if (!form.gorev_adi.trim()) return goster('Görev adı zorunludur!', 'error');
        if (!form.gorev_emri.trim()) return goster('Görev emri zorunludur!', 'error');
        if (islemdeId === 'yeniGorev') return;
        setIslemdeId('yeniGorev');

        try {
            const r = await ajanGorevEkle(form);
            if (r.offline) {
                goster('İnternet Yok: Görev offline kuyruğa alındı.', 'success');
            } else {
                goster('✅ Görev sisteme iletildi!');
                telegramBildirim(`🤖 YENİ OTONOM GÖREV\nAjan: ${form.ajan_adi}\nGörev: ${form.gorev_adi}`);
                if (form.oncelik === 'acil') setTimeout(() => gorevCalistir(r.data.id), 500);
            }
            setForm(BOS_FORM); setFormAcik(false); yukle();
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const gorevCalistir = async (gorev_id) => {
        if (!window.confirm("⚠️ DİKKAT: Otonom Ajan başlatılması API maliyeti oluşturacaktır. Onaylıyor musunuz?")) return;
        setCalistiriliyor(p => ({ ...p, [gorev_id]: true }));
        try {
            const gorevObj = gorevler.find(g => g.id === gorev_id);
            let endpoint = '/api/ajan-calistir';
            if (gorevObj && (gorevObj.ajan_adi.includes('Yargıç') || gorevObj.ajan_adi.includes('Matematik'))) endpoint = '/api/ajan-yargic';
            else if (gorevObj && gorevObj.ajan_adi.includes('Köprü')) endpoint = '/api/kopru-ajan';

            const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gorev_id }) });
            const d = await res.json();
            d.basarili ? goster('✅ AI Görevi tamamlandı!') : goster('⚠️ ' + (d.error || 'Hata'), 'error');
        } catch (e) { goster('Bağlantı hatası', 'error'); }
        setCalistiriliyor(p => ({ ...p, [gorev_id]: false }));
        yukle();
    };

    const gorevSil = async (id) => {
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici);
        if (!yetkili) return goster(yetkiMesaj || 'Yetkisiz.', 'error');
        if (!confirm('Görevi sil?')) return;
        if (islemdeId === 'sil_' + id) return;
        setIslemdeId('sil_' + id);

        try {
            await ajanGorevSil(id, kullanici?.label || 'Saha Yetkilisi');
            setGorevler(p => p.filter(g => g.id !== id));
            if (secilenGorev?.id === id) setSecilenGorev(null);
            goster('Görev silindi!');
        } catch (error) { goster('Silinemedi: ' + error.message, 'error'); }
        setIslemdeId(null);
    };

    const gorevToggle = (ajanKey, gorevId) => {
        const yeni = { ...konfig };
        const idx = yeni[ajanKey].gorevler.findIndex(g => g.id === gorevId);
        yeni[ajanKey].gorevler[idx] = { ...yeni[ajanKey].gorevler[idx], aktif: !yeni[ajanKey].gorevler[idx].aktif };
        setKonfig(yeni);
        localStorage.setItem('ajan_konfig', JSON.stringify(yeni));
        goster(`${yeni[ajanKey].gorevler[idx].aktif ? '✅ Aktif' : '⏸ Pasif'}: ${yeni[ajanKey].gorevler[idx].ad}`);
    };

    if (!yetkiliMi) {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} className="p-12 text-center bg-red-950/20 border-2 border-red-900/50 rounded-2xl m-8">
                <Lock size={48} className="text-red-500 mx-auto mb-4" />
                <h2 className="text-red-500 text-xl font-black uppercase tracking-widest">YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p className="text-red-300 font-bold mt-2">AI Ajan komuta merkezi verileri gizlidir. Üretim PİN / Tam Yetki gereklidir.</p>
            </div>
        );
    }

    return (
        <div className="font-sans">
            {/* BAŞLIK */}
            <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#122b27] border-2 border-indigo-500/50 rounded-2xl flex items-center justify-center shadow-lg">
                        <Bot size={28} className="text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white m-0 tracking-tight">AI Ajan Komuta Merkezi</h1>
                        <p className="text-xs text-emerald-400 mt-1 font-bold uppercase tracking-widest">[M1] Otonom Karargah Ağı</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={yukle} className="bg-[#122b27] border border-[#1e4a43] text-emerald-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#0b1d1a] transition-all cursor-pointer">
                        <RefreshCw size={14} /> Yenile
                    </button>
                    <button onClick={() => setFormAcik(!formAcik)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-all outline-none border-none cursor-pointer">
                        <Plus size={16} /> Görev Emri
                    </button>
                    <a href="/denetmen" className="no-underline">
                        <button className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-black px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md outline-none cursor-pointer">
                            <Bot size={16} /> Müfettiş
                        </button>
                    </a>
                </div>
            </div>

            {/* MESAJ */}
            <div className={`flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border-2 font-bold text-sm transition-all ${mesaj.text ? 'opacity-100 h-auto' : 'opacity-0 h-0 p-0 mb-0 overflow-hidden'} ${mesaj.type === 'error' ? 'border-red-900 bg-red-950/40 text-red-400' : 'border-emerald-900 bg-emerald-950/40 text-emerald-400'}`}>
                {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                {mesaj.text}
            </div>

            <div className="mb-6"><AjanKomutaGostergesi /></div>
            <AjanlarIstatistikCards istatistik={istatistik} />

            {/* SEKMELER */}
            <div className="flex gap-2 mb-6 bg-[#0b1d1a] border border-[#1e4a43] rounded-2xl p-2 overflow-x-auto custom-scrollbar">
                {[{ k: 'gorevler', label: '📋 Görev Tahtası' }, { k: 'konfigur', label: '⚙️ Yapılandırma' }, { k: 'orkestrator', label: '🎯 Otonom (Worker)' }, { k: 'maliyet', label: '💸 Maliyet (API)' }].map(s => (
                    <button key={s.k} onClick={() => setSekme(s.k)} className={`shrink-0 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest cursor-pointer transition-colors ${sekme === s.k ? 'bg-indigo-600 text-white shadow-lg' : 'bg-transparent text-emerald-600/70 border border-transparent hover:text-emerald-400'}`}>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* İÇERİKLER */}
            {sekme === 'gorevler' && <AjanlarGorevTahtasi formAcik={formAcik} setFormAcik={setFormAcik} form={form} setForm={setForm} gorevGonder={gorevGonder} islemdeId={islemdeId} filtre={filtre} setFiltre={setFiltre} gorevler={gorevler} loading={loading} calistiriliyor={calistiriliyor} gorevCalistir={gorevCalistir} secilenGorev={secilenGorev} setSecilenGorev={setSecilenGorev} gorevSil={gorevSil} yukleSessiz={yukleSessiz} goster={goster} />}
            {sekme === 'konfigur' && <AjanlarKonfigurasyon konfig={konfig} gorevToggle={gorevToggle} telegramBildirim={telegramBildirim} goster={goster} yukle={yukle} />}
            {sekme === 'orkestrator' && yetkiliMi && <div className="bg-[#122b27] rounded-3xl p-6 border-2 border-[#1e4a43]"><AjanOrchestrator /></div>}
            {sekme === 'maliyet' && yetkiliMi && <AjanlarMaliyetTab />}
        </div>
    );
}
