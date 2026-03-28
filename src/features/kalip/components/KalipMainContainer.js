'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { BookOpen, Plus, CheckCircle2, AlertTriangle, Ruler, ChevronRight, Trash2, Lock, Tag, Box, Layers, Scissors, Settings } from 'lucide-react';
import { telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import Link from 'next/link';
import {
    modellerVeTrendleriGetir, kaliplarVeModelleriGetir,
    modelTaslakKaydet, kalipPastalKaydet,
    kalipTabloElemaniSil, kalipKanaliKur
} from '../services/kalipApi';

const BEDENLER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const HEDEF_KITLE = ['kadin', 'erkek', 'cocuk', 'unisex'];
const SEZON = ['ilkbahar', 'yaz', 'sonbahar', 'kis', '4mevsim'];

const BOSH_MODEL = { id: null, model_kodu: '', model_adi: '', model_adi_ar: '', trend_id: '', hedef_kitle: 'kadin', sezon: 'yaz', aciklama: '' };
const BOSH_KALIP = { id: null, model_id: '', kalip_adi: '', bedenler: ['S', 'M', 'L', 'XL'], pastal_boyu_cm: '', pastal_eni_cm: '', fire_orani_yuzde: '5', versiyon: 'v1.0', kalip_dosya_url: '' };

export default function KalipMainContainer() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [sekme, setSekme] = useState('modeller');
    const [modeller, setModeller] = useState(/** @type {any[]} */([]));
    const [kaliplar, setKaliplar] = useState(/** @type {any[]} */([]));
    const [trendler, setTrendler] = useState(/** @type {any[]} */([]));
    const [formModel, setFormModel] = useState(BOSH_MODEL);
    const [formKalip, setFormKalip] = useState(BOSH_KALIP);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [islemdeId, setIslemdeId] = useState(null);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        let kanal;
        const baslatKanal = () => {
            if (erisebilir && !document.hidden) {
                kanal = kalipKanaliKur(yukle);
            }
        };

        const durdurKanal = () => { if (kanal) { kanal.unsubscribe(); kanal = null; } };
        const handleVisibility = () => { if (document.hidden) { durdurKanal(); } else { baslatKanal(); yukle(); } };

        baslatKanal();
        yukle();

        document.addEventListener('visibilitychange', handleVisibility);
        return () => { durdurKanal(); document.removeEventListener('visibilitychange', handleVisibility); };
    }, [sekme, kullanici?.id, kullanici?.grup]);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setLoading(true);
        try {
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 saniye)')), 10000));

            if (sekme === 'modeller') {
                const data = await Promise.race([modellerVeTrendleriGetir(), timeout]);
                setModeller(data.modeller);
                setTrendler(data.trendler);
            } else {
                const data = await Promise.race([kaliplarVeModelleriGetir(), timeout]);
                setKaliplar(data.kaliplar);
                setModeller(data.modeller);
            }
        } catch (error) {
            goster('Bağlantı Hatası: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const kaydetModel = async () => {
        if (!formModel.model_kodu.trim() || formModel.model_kodu.length > 50) return goster('Model kodu zorunlu ve en fazla 50 karakter olmalı!', 'error');
        if (!formModel.model_adi.trim() || formModel.model_adi.length > 200) return goster('Model adı zorunlu ve en fazla 200 karakter olmalı!', 'error');
        setLoading(true);
        try {
            const result = await modelTaslakKaydet(formModel);
            if (result.isUpdate) {
                goster('✅ Model güncellendi!');
            } else {
                goster('✅ Model taslağı oluşturuldu!');
                telegramBildirim(`📐 YENİ MODEL TASLAĞI\nKod: ${formModel.model_kodu.toUpperCase()}\nAdı: ${formModel.model_adi}\nSezon: ${formModel.sezon}\nİlk Model Taslağı sisteme işlendi.`);
            }
            setFormModel(BOSH_MODEL); setFormAcik(false); yukle();
        } catch (error) {
            if (!navigator.onLine || error.message.includes('fetch')) {
                await cevrimeKuyrugaAl({
                    tablo: 'b1_model_taslaklari', islem_tipi: 'INSERT', veri: { ...formModel, model_kodu: formModel.model_kodu.toUpperCase().trim(), durum: 'taslak' }
                });
                goster('İnternet Yok: Sistem modeli çevrimdışı kuyruğa aldı.', 'success');
                setFormModel(BOSH_MODEL); setFormAcik(false);
            } else goster('Hata: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const kaydetKalip = async () => {
        if (!formKalip.model_id) return goster('Model seçilmesi zorunlu!', 'error');
        if (!formKalip.kalip_adi.trim() || formKalip.kalip_adi.length > 200) return goster('Kalıp adı zorunlu ve en fazla 200 karakter olmalı!', 'error');
        if (formKalip.bedenler.length === 0) return goster('En az 1 beden seçin!', 'error');
        if (!formKalip.pastal_boyu_cm || parseFloat(formKalip.pastal_boyu_cm) <= 0) return goster('Pastal boyu zorunlu (>0)!', 'error');
        if (!formKalip.pastal_eni_cm || parseFloat(formKalip.pastal_eni_cm) <= 0) return goster('Pastal eni zorunlu (>0)!', 'error');
        if (parseFloat(formKalip.fire_orani_yuzde) < 0) return goster('Fire oranı eksi olamaz!', 'error');
        setLoading(true);
        try {
            const result = await kalipPastalKaydet(formKalip);
            if (result.isUpdate) {
                goster('✅ Kalıp güncellendi!');
            } else {
                goster('✅ Kalıp kaydedildi!');
                telegramBildirim(`📏 YENİ KALIP\nKalıp: ${formKalip.kalip_adi}\nBoyut: ${formKalip.pastal_boyu_cm}x${formKalip.pastal_eni_cm}cm\nKalıp kaydı eklendi.`);
            }
            setFormKalip(BOSH_KALIP); setFormAcik(false); yukle();
        } catch (error) {
            if (!navigator.onLine || error.message.includes('fetch')) {
                await cevrimeKuyrugaAl({ tablo: 'b1_model_kaliplari', islem_tipi: 'INSERT', veri: { ...formKalip } });
                goster('İnternet Yok: Sistem kalıbı çevrimdışı kuyruğa aldı.', 'success');
                setFormKalip(BOSH_KALIP); setFormAcik(false);
            } else goster('Hata: ' + error.message, 'error');
        }
        setLoading(false);
    };

    const sil = async (tablo, id) => {
        if (islemdeId) return goster('Lütfen önceki işlemin bitmesini bekleyin.', 'error');
        setIslemdeId('sil_' + id);
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici, 'Silmek için Yönetici PIN kodu girin:');
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Yetkisiz İşlem!', 'error'); }
        if (!confirm('KESİN OLARAK SİLMEK İSTİYOR MUSUNUZ?')) { setIslemdeId(null); return; }

        try {
            await kalipTabloElemaniSil(tablo, id, 'M3 Yetkilisi');
            yukle(); goster('Başarıyla Silindi!');
        } catch (error) { goster('Silme hatası: ' + error.message, 'error'); } finally { setIslemdeId(null); }
    };

    const metrajHesap = () => {
        const boy = parseFloat(formKalip.pastal_boyu_cm) / 100;
        const en = parseFloat(formKalip.pastal_eni_cm) / 100;
        const fire = parseFloat(formKalip.fire_orani_yuzde) / 100;
        if (boy && en) {
            const m2 = (boy * en) * (1 + fire);
            const total = m2 * (formKalip.bedenler.length || 1);
            return {
                tekil: m2.toFixed(3),
                toplam: total.toFixed(3)
            };
        }
        return { tekil: '—', toplam: '—' };
    };

    const toggleBeden = (b) => setFormKalip(p => ({ ...p, bedenler: p.bedenler.includes(b) ? p.bedenler.filter(x => x !== b) : [...p.bedenler, b] }));

    const DURUM_RENK = { taslak: 'text-gray-400 bg-[#21262d]', kumas_secildi: 'text-emerald-400 bg-emerald-500/20', kalip_hazir: 'text-amber-400 bg-amber-500/20', numune_onay_bekliyor: 'text-blue-400 bg-blue-500/20', uretim_hazir: 'text-emerald-400 bg-emerald-500/20', iptal: 'text-rose-400 bg-rose-500/20' };

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 shadow-2xl rounded-2xl m-8 border-2 border-rose-900/50">
                <Lock size={48} className="mx-auto mb-4 text-rose-500" />
                <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">YETKİSİZ GİRİŞ (M3)</h2>
                <p className="text-rose-300 font-bold mt-2">Bu alan sadece tasarım mühendisleri ve kalıphaneye açıktır.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>

                {/* BAŞLIK */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[#21262d] pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-900 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-500/30">
                            <BookOpen size={24} className="text-amber-50" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight m-0 uppercase">M3: Kalıp & Üretim Planlama</h1>
                            <p className="text-xs font-bold text-amber-300/80 mt-1 uppercase tracking-wider flex items-center gap-2">
                                <Ruler size={14} /> Kritik Aşama: Metraj hesaplamasını titizlikle yapın.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setFormAcik(!formAcik)} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg text-xs font-black transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center gap-2 uppercase tracking-widest">
                            <Plus size={16} /> {sekme === 'modeller' ? 'YENİ MODEL TASLAĞI' : 'YENİ KALIP & PASTAL'}
                        </button>
                        <Link href="/modelhane">
                            <button className="bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-white px-5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 uppercase tracking-widest">
                                M4 MODELHANE (DİKİM) <ChevronRight size={16} />
                            </button>
                        </Link>
                    </div>
                </div>

                {/* MESAJ */}
                {mesaj.text && (
                    <div className={`flex items-center gap-3 px-4 py-3 mb-6 rounded-lg font-bold text-xs uppercase tracking-widest border border-l-4 ${mesaj.type === 'error' ? 'border-rose-500/50 border-l-rose-500 bg-rose-500/10 text-rose-400' : 'border-emerald-500/50 border-l-emerald-500 bg-emerald-500/10 text-emerald-400'}`}>
                        {mesaj.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />} {mesaj.text}
                    </div>
                )}

                {/* KPI */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                        <span className="text-sm font-bold uppercase tracking-wider text-[#8b949e]">Model Taslağı</span>
                        <div className="text-2xl font-black text-white mt-1">{modeller.length}</div>
                    </div>
                    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                        <span className="text-sm font-bold uppercase tracking-wider text-amber-400">Onaylı Kalıp / Pastal</span>
                        <div className="text-2xl font-black text-white mt-1">{kaliplar.length}</div>
                    </div>
                    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                        <span className="text-sm font-bold uppercase tracking-wider text-blue-400">Ortalama Beden Seti</span>
                        <div className="text-2xl font-black text-white mt-1">4.5 <span className="text-xs text-[#8b949e]">Beden/Model</span></div>
                    </div>
                    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                        <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">Üretime Geçiş (M4)</span>
                        <div className="text-2xl font-black text-white mt-1">100%</div>
                    </div>
                </div>

                {/* SEKMELER */}
                <div className="flex gap-2 mb-6 border-b border-[#21262d] pb-2">
                    <button onClick={() => { setSekme('modeller'); setFormAcik(false); }} className={`px-5 py-2.5 rounded-t-lg text-xs font-black uppercase tracking-widest transition-colors ${sekme === 'modeller' ? 'bg-[#161b22] text-amber-500 border-t border-x border-[#30363d]' : 'text-[#8b949e] hover:text-white'}`}>
                        📐 MODEL TASLAKLARI
                    </button>
                    <button onClick={() => { setSekme('kaliplar'); setFormAcik(false); }} className={`px-5 py-2.5 rounded-t-lg text-xs font-black uppercase tracking-widest transition-colors ${sekme === 'kaliplar' ? 'bg-[#161b22] text-amber-500 border-t border-x border-[#30363d]' : 'text-[#8b949e] hover:text-white'}`}>
                        📏 KALIPLAR & BEDENLER
                    </button>
                </div>

                <div className="bg-[#1aa3]"></div>

                {/* MODEL FORMU */}
                {formAcik && sekme === 'modeller' && (
                    <div className="bg-[#121c1a] lg:bg-[#161b22] border border-amber-500/50 rounded-xl p-6 mb-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><BookOpen size={120} /></div>
                        <h3 className="font-black text-amber-500 mb-4 text-xs uppercase tracking-widest">📐 {formModel.id ? 'Model Düzenle (Değişiklik M4\'ü Etkileyebilir!)' : 'Yeni Model Taslağı'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                            <div><label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Model Kodu *</label><input className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" value={formModel.model_kodu} onChange={e => setFormModel({ ...formModel, model_kodu: e.target.value })} placeholder="MDL-001" /></div>
                            <div><label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Model Adı *</label><input className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" value={formModel.model_adi} onChange={e => setFormModel({ ...formModel, model_adi: e.target.value })} placeholder="Yazlık Keten Gömlek" /></div>
                            <div>
                                <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">İlgili Trend (M1 İstihbaratı)</label>
                                <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" value={formModel.trend_id} onChange={e => setFormModel({ ...formModel, trend_id: e.target.value })}>
                                    <option value="">— M1 Trendlerinden Seç —</option>
                                    {trendler.map(t => <option key={t.id} value={t.id}>{t.product_name?.substring(0, 50)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Hedef Kitle</label>
                                <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none uppercase" value={formModel.hedef_kitle} onChange={e => setFormModel({ ...formModel, hedef_kitle: e.target.value })}>
                                    {HEDEF_KITLE.map(h => <option key={h} value={h} className="uppercase">{h}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Sezon</label>
                                <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none uppercase" value={formModel.sezon} onChange={e => setFormModel({ ...formModel, sezon: e.target.value })}>
                                    {SEZON.map(s => <option key={s} value={s} className="uppercase">{s}</option>)}
                                </select>
                            </div>
                            <div className="lg:col-span-3"><label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Açıklama / Reçete Notları</label><textarea className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none min-h-[60px]" value={formModel.aciklama} onChange={e => setFormModel({ ...formModel, aciklama: e.target.value })} /></div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6 border-t border-[#30363d] pt-4 relative z-10">
                            <button onClick={() => { setFormModel(BOSH_MODEL); setFormAcik(false); }} className="px-5 py-2 rounded-lg font-bold text-xs bg-[#21262d] text-white hover:bg-[#30363d] transition-colors uppercase tracking-widest">İptal</button>
                            <button onClick={kaydetModel} disabled={loading} className="px-6 py-2 rounded-lg font-black text-xs bg-amber-600 hover:bg-amber-500 text-white uppercase tracking-widest shadow-lg shadow-amber-500/20">{loading ? '...' : 'MODELİ MÜHÜRLE'}</button>
                        </div>
                    </div>
                )}

                {/* KALIP FORMU */}
                {formAcik && sekme === 'kaliplar' && (
                    <div className="bg-[#121c1a] lg:bg-[#161b22] border border-amber-500/50 rounded-xl p-6 mb-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Ruler size={120} /></div>
                        <h3 className="font-black text-amber-500 mb-4 text-xs uppercase tracking-widest">📏 {formKalip.id ? 'Kalıp Düzenle' : 'Yeni Kalıp & Pastal Ekle'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Bağımlı Model Seç *</label>
                                <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" value={formKalip.model_id} onChange={e => setFormKalip({ ...formKalip, model_id: e.target.value })}>
                                    <option value="">— M3 Taslaklarından Seç —</option>
                                    {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} — {m.model_adi}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2"><label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Kalıp Parça Adı *</label><input className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" value={formKalip.kalip_adi} onChange={e => setFormKalip({ ...formKalip, kalip_adi: e.target.value })} placeholder="Kaban Ön Beden Tam Kalıp" /></div>
                            <div><label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Pastal Boyu (cm) *</label><input type="number" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none font-mono" value={formKalip.pastal_boyu_cm} onChange={e => setFormKalip({ ...formKalip, pastal_boyu_cm: e.target.value })} placeholder="280" /></div>
                            <div><label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Pastal Eni (cm) *</label><input type="number" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none font-mono" value={formKalip.pastal_eni_cm} onChange={e => setFormKalip({ ...formKalip, pastal_eni_cm: e.target.value })} placeholder="150" /></div>
                            <div><label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">Fire Oranı (%)</label><input type="number" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none font-mono" value={formKalip.fire_orani_yuzde} onChange={e => setFormKalip({ ...formKalip, fire_orani_yuzde: e.target.value })} placeholder="5" /></div>

                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex flex-col justify-center text-center">
                                <span className="text-[0.65rem] font-black uppercase text-amber-500 tracking-widest mb-1 leading-tight">Tekil / Toplam İhtiyaç (m²)</span>
                                <div className="text-xl font-black font-mono text-amber-400">
                                    {metrajHesap().tekil} <span className="text-xs text-amber-500/50">/</span> {metrajHesap().toplam}
                                </div>
                            </div>

                            <div className="lg:col-span-4">
                                <label className="block text-sm font-black text-[#8b949e] mb-2 uppercase tracking-widest">Beden Serilemesi (Seçiniz)</label>
                                <div className="flex flex-wrap gap-2">
                                    {BEDENLER.map(b => (
                                        <button key={b} type="button" onClick={() => toggleBeden(b)} className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors border ${formKalip.bedenler.includes(b) ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-amber-500/50'}`}>
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-4">
                                <label className="block text-sm font-black text-[#8b949e] mb-1 uppercase tracking-widest">[KA-01 / KA-06] Dijital Kalıp / Çizim Resmi (URL)</label>
                                <div className="flex gap-2">
                                    <input className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-blue-400 font-mono focus:border-amber-500 outline-none" value={formKalip.kalip_dosya_url} onChange={e => setFormKalip({ ...formKalip, kalip_dosya_url: e.target.value })} placeholder="Resim linki (.jpg/.png) veya DXF/PDF belgesi url'si..." />
                                    <button type="button" onClick={() => alert('Sistem Depolama Modülü hazırlığında. Şimdilik dış link (.jpg/.png vb.) kullanınız.')} className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] rounded-lg border border-[#30363d] text-xs font-black uppercase transition-colors whitespace-nowrap">📸 Dosya Seç</button>
                                </div>
                                {formKalip.kalip_dosya_url && (formKalip.kalip_dosya_url.includes('.png') || formKalip.kalip_dosya_url.includes('.jpg') || formKalip.kalip_dosya_url.includes('.jpeg')) && (
                                    <div className="mt-3 border border-[#30363d] rounded-lg overflow-hidden h-[120px] w-[180px] bg-[#0d1117] relative flex items-center justify-center">
                                        <img src={formKalip.kalip_dosya_url} alt="Kalıp Önizleme" className="max-w-full max-h-full object-contain opacity-80" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6 border-t border-[#30363d] pt-4 relative z-10">
                            <button onClick={() => { setFormKalip(BOSH_KALIP); setFormAcik(false); }} className="px-5 py-2 rounded-lg font-bold text-xs bg-[#21262d] text-white hover:bg-[#30363d] transition-colors uppercase tracking-widest">İptal</button>
                            <button onClick={kaydetKalip} disabled={loading} className="px-6 py-2 rounded-lg font-black text-xs bg-amber-600 hover:bg-amber-500 text-white uppercase tracking-widest shadow-lg shadow-amber-500/20">{loading ? '...' : 'KALIBI MÜHÜRLE'}</button>
                        </div>
                    </div>
                )}

                {/* MODELLER LISTESI */}
                {sekme === 'modeller' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {modeller.length === 0 && !loading && (
                            <div className="lg:col-span-3 text-center py-20 border border-dashed border-[#30363d] rounded-xl text-[#8b949e]">Model bulunamadı. Lütfen yeni bir taslak oluşturun.</div>
                        )}
                        {modeller.map(m => (
                            <div key={m.id} className="bg-[#161b22] border border-[#21262d] hover:border-[#30363d] rounded-xl p-5 shadow-lg flex flex-col justify-between transition-colors">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black bg-[#21262d] text-emerald-400 border border-[#30363d] px-2 py-0.5 rounded tracking-widest">{m.model_kodu}</span>
                                            {m.trend_id && <Tag size={12} className="text-amber-500" />}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setFormModel({ id: m.id, model_kodu: m.model_kodu, model_adi: m.model_adi, model_adi_ar: m.model_adi_ar || '', trend_id: m.trend_id || '', hedef_kitle: m.hedef_kitle, sezon: m.sezon, aciklama: m.aciklama || '' }); setSekme('modeller'); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[#8b949e] hover:text-white transition-colors"><Settings size={14} /></button>
                                            <button onClick={() => sil('b1_model_taslaklari', m.id)} disabled={islemdeId === 'sil_' + m.id} className="text-rose-500 hover:text-rose-400 transition-colors disabled:opacity-50"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-white text-sm mb-2">{m.model_adi}</h3>
                                    <p className="text-sm text-[#8b949e] mb-3 line-clamp-2">{m.aciklama || 'Reçete detayı girilmedi.'}</p>
                                </div>
                                <div className="border-t border-[#21262d] pt-3 flex flex-wrap gap-2 items-center">
                                    <span className="text-xs font-bold uppercase text-white bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">{m.sezon}</span>
                                    <span className="text-xs font-bold uppercase text-white bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">{m.hedef_kitle}</span>
                                    <span className={`text-xs font-black uppercase px-2 py-1 rounded border border-[#30363d] ml-auto ${DURUM_RENK[m.durum] || 'text-gray-400'}`}>{m.durum?.replace('_', ' ')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* KALIPLAR LISTESI */}
                {sekme === 'kaliplar' && (
                    <div className="flex flex-col gap-4">
                        {kaliplar.length === 0 && !loading && (
                            <div className="text-center py-20 border border-dashed border-[#30363d] rounded-xl text-[#8b949e]">Kayıtlı kalıp/pastal bulunamadı. Lütfen ekleyin.</div>
                        )}
                        {kaliplar.map(k => {
                            const boy = parseFloat(k.pastal_boyu_cm) / 100;
                            const en = parseFloat(k.pastal_eni_cm) / 100;
                            const fire = parseFloat(k.fire_orani_yuzde) / 100;
                            const metraj = (boy * en * (1 + fire)).toFixed(3);

                            return (
                                <div key={k.id} className="bg-[#161b22] border border-[#21262d] hover:border-[#30363d] rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 shadow-lg transition-colors">
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-sm font-black bg-[#21262d] text-emerald-400 border border-[#30363d] px-2 py-0.5 rounded tracking-widest">{k.b1_model_taslaklari?.model_kodu}</span>
                                            <ChevronRight size={14} className="text-[#8b949e]" />
                                            <h3 className="font-bold text-white text-sm m-0">{k.kalip_adi}</h3>
                                            <span className="text-xs font-black text-amber-500 border border-amber-500/20 bg-amber-500/10 px-2 rounded-full">{k.versiyon}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {(k.bedenler || []).map(b => (
                                                <span key={b} className="text-xs font-black bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-widest">{b}</span>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm font-bold text-[#8b949e] uppercase tracking-widest items-center">
                                            <span className="flex items-center gap-1"><Ruler size={12} className="text-amber-500" /> {k.pastal_boyu_cm}cm × {k.pastal_eni_cm}cm</span>
                                            <span className="flex items-center gap-1"><Scissors size={12} className="text-rose-400" /> Fire: %{k.fire_orani_yuzde}</span>
                                        </div>
                                        {/* KA-06 Gorsel Render */}
                                        {k.kalip_dosya_url && (
                                            <div className="mt-3">
                                                {(k.kalip_dosya_url.includes('.png') || k.kalip_dosya_url.includes('.jpg') || k.kalip_dosya_url.includes('.jpeg')) ? (
                                                    <a href={k.kalip_dosya_url} target="_blank" className="block max-w-[150px] border border-[#30363d] rounded-lg overflow-hidden relative">
                                                        <img src={k.kalip_dosya_url} alt="Çizim" className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity" />
                                                    </a>
                                                ) : (
                                                    <a href={k.kalip_dosya_url} target="_blank" className="text-blue-400 font-mono text-xs hover:underline bg-[#0d1117] px-2 py-1.5 rounded border border-[#30363d] inline-flex items-center gap-2">🔗 PDF/DXF Dosyayı Aç</a>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="shrink-0 flex gap-4 w-full md:w-auto mt-4 md:mt-0 items-center justify-between md:justify-end">
                                        <div className="bg-[#0d1117] border border-amber-500/30 rounded-lg p-3 text-center min-w-[120px]">
                                            <div className="text-[0.65rem] font-black text-amber-500/70 uppercase tracking-widest mb-1">Gereken (m²)</div>
                                            <div className="text-xl font-black font-mono text-amber-500 leading-none">{(metraj * (k.bedenler?.length || 1)).toFixed(3)}</div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button onClick={() => { setFormKalip({ id: k.id, model_id: k.model_id || '', kalip_adi: k.kalip_adi, bedenler: k.bedenler || [], pastal_boyu_cm: String(k.pastal_boyu_cm || ''), pastal_eni_cm: String(k.pastal_eni_cm || ''), fire_orani_yuzde: String(k.fire_orani_yuzde || '5'), versiyon: k.versiyon || 'v1.0', kalip_dosya_url: k.kalip_dosya_url || '' }); setSekme('kaliplar'); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-[#21262d] hover:bg-[#30363d] text-white p-2 rounded-lg transition-colors"><Settings size={14} /></button>
                                            <button onClick={() => sil('b1_model_kaliplari', k.id)} disabled={islemdeId === 'sil_' + k.id} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 p-2 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
