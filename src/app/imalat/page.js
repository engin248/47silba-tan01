'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { Camera, FileText, CheckCircle2, PlaySquare, PlusCircle, Save, Trash2, Edit, Mic, Video, Users, DollarSign, Clock, AlertTriangle, ShieldCheck, Play, Activity, CheckSquare, UploadCloud, Receipt, BarChart3, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { Lock } from 'lucide-react';

export default function Birim1AnaKarargah() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);

    // 4 ANA PENCERE (DEPARTMAN) DEVLET
    const [mainTab, setMainTab] = useState('teknik_gorus'); // teknik_gorus, modelhane, uretim, maliyet_muhasebe

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // =========================================================================
    // 1. PENCERE: TEKNK GRŞ & RN KABUL (FRMADAN GELEN MODEL / DOSYA)
    // =========================================================================
    const [teknikFoyler, setTeknikFoyler] = useState([]);
    const [yeniFoy, setYeniFoy] = useState({
        model_name: '',
        orjinal_gorsel_url: '',
        maliyet_siniri_tl: '',
        zorunlu_kumas_miktari_mt: '',
        esneme_payi_yuzde: ''
    });

    // =========================================================================
    // 2. PENCERE: MODELHANE & ŞLEM SIRASI BELRLEME (BANT/FASONA ATMA)
    // =========================================================================
    const [seciliModel, setSeciliModel] = useState(null); // şlem sras eklenecek model
    const [islemAdimlari, setIslemAdimlari] = useState([]);
    const [yeniAdim, setYeniAdim] = useState({ islem_adi: '', ideal_sure_dk: '', zorluk_derecesi: 5.0 });
    const [videoKayitAktif, setVideoKayitAktif] = useState(false);

    // =========================================================================
    // 3. PENCERE: RETM (BAND/FASON) VE PERSONEL GRDLER
    // =========================================================================
    const [sahadakiIsler, setSahadakiIsler] = useState([]);
    const [personeller, setPersoneller] = useState([]);

    // =========================================================================
    // 4. PENCERE: MALYET RAPORU, ANALZ VE MUHASEBE (FNAL)
    // =========================================================================
    const [onayBekleyenIsler, setOnayBekleyenIsler] = useState([]);

    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { uretimPin = !!sessionStorage.getItem('sb47_uretim_pin'); }

        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (erisebilir) {
            // [AI ZIRHI]: Realtime WebSocket (Kriter 20 & 34)
            const kanal = supabase.channel('imalat-gercek-zamanli')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'v2_order_production_steps' }, () => {
                    if (mainTab === 'uretim') yukleSahadakiIsler();
                    else if (mainTab === 'maliyet_muhasebe') yukleOnayBekleyenIsler();
                })
                .subscribe();

            if (mainTab === 'teknik_gorus') yukleTeknikFoyler();
            else if (mainTab === 'modelhane') yukleTeknikFoyler();
            else if (mainTab === 'uretim') { Promise.allSettled([yukleSahadakiIsler(), yuklePersoneller()]); }
            else if (mainTab === 'maliyet_muhasebe') yukleOnayBekleyenIsler();

            return () => { supabase.removeChannel(kanal); };
        }
    }, [mainTab, kullanici]);

    const telegramBildirim = (mesaj) => {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 10000);
        fetch('/api/telegram-bildirim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesaj }),
            signal: controller.signal
        }).finally(() => clearTimeout(tId)).catch(() => null);
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    // --- 1. PENCERE FONKSYONLARI ---
    const timeoutPromise = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Başlant zaman aşm (10 saniye)')), 10000));
    const yukleTeknikFoyler = async () => {
        try {
            const res = await Promise.race([supabase.from('v2_models').select('*').order('created_at', { ascending: false }).limit(200), timeoutPromise()]);
            if (res.error) throw res.error;
            if (res.data) setTeknikFoyler(res.data);
        } catch (error) { showMessage('Aş hatas: ' + error.message, 'error'); }
    };

    const teknikFoyKaydet = async () => {
        if (!yeniFoy.model_name.trim() || !yeniFoy.maliyet_siniri_tl) {
            return showMessage('Model Ad ve Maliyet Snr zorunludur! nisiyatif kullanlamaz.', 'error');
        }
        if (yeniFoy.model_name.length > 200) return showMessage('Model ad en fazla 200 karakter olmal!', 'error');

        setLoading(true);
        try {
            // ş U Kriteri: Mkerrer Kayt Engelleme
            const { data: mevcut } = await supabase.from('v2_models')
                .select('id').eq('model_name', yeniFoy.model_name.trim());

            if (mevcut && mevcut.length > 0) {
                setLoading(false);
                return showMessage(' Bu Model Zaten Teknik Fy Olarak Kaytl!', 'error');
            }

            const { error } = await supabase.from('v2_models').insert([{
                model_name: yeniFoy.model_name.trim(),
                description: `Kumaş htiyac: ${yeniFoy.zorunlu_kumas_miktari_mt} mt, Esneme: %${yeniFoy.esneme_payi_yuzde}. (Grsel URL: ${yeniFoy.orjinal_gorsel_url})`.substring(0, 490),
                difficulty_score: 5.0,
                material_cost: parseFloat(yeniFoy.maliyet_siniri_tl)
            }]);

            if (!error) {
                showMessage('FRMADAN GELEN MODEL "TEKNK FY" OLARAK KASAYA KLTLEND!');
                setYeniFoy({ model_name: '', orjinal_gorsel_url: '', maliyet_siniri_tl: '', zorunlu_kumas_miktari_mt: '', esneme_payi_yuzde: '' });
                telegramBildirim(`ş YEN TEKNK FY AILDI!\nModel: ${yeniFoy.model_name.trim()}\nLimit: ${yeniFoy.maliyet_siniri_tl}`);
                yukleTeknikFoyler();
            } else {
                throw error;
            }
        } catch (error) {
            if (!navigator.onLine || error.message?.includes('fetch')) {
                await cevrimeKuyrugaAl({ tablo: 'v2_models', islem_tipi: 'INSERT', veri: { model_name: yeniFoy.model_name.trim(), description: `Kumaş htiyac: ${yeniFoy.zorunlu_kumas_miktari_mt} mt, Esneme: %${yeniFoy.esneme_payi_yuzde}. (Grsel URL: ${yeniFoy.orjinal_gorsel_url})`.substring(0, 490), difficulty_score: 5.0, material_cost: parseFloat(yeniFoy.maliyet_siniri_tl) } });
                showMessage('nternet Yok: Yeni Teknik Fy ğevrimdş kuyruşa alnd.', 'success');
                setYeniFoy({ model_name: '', orjinal_gorsel_url: '', maliyet_siniri_tl: '', zorunlu_kumas_miktari_mt: '', esneme_payi_yuzde: '' });
            } else showMessage('Sunucu ğkt veya ulaşlamyor: ' + error.message, 'error');
        }
        setLoading(false);
    };

    // --- 2. PENCERE FONKSYONLARI ---
    const adimEkle = () => {
        if (!yeniAdim.islem_adi.trim() || !yeniAdim.ideal_sure_dk) return showMessage('şlem ad ve sre tahmini zorunlu!', 'error');
        if (yeniAdim.islem_adi.length > 150) return showMessage('şlem ad en fazla 150 karakter olmal!', 'error');
        setIslemAdimlari([...islemAdimlari, { id: Date.now(), ...yeniAdim }]);
        setYeniAdim({ islem_adi: '', ideal_sure_dk: '', zorluk_derecesi: 5.0 });
    };

    const adimSil = (id) => setIslemAdimlari(islemAdimlari.filter(a => a.id !== id));

    const uretimBandiVeyaFasonaFirlat = async () => {
        if (!seciliModel || islemAdimlari.length === 0) return showMessage('Model seğmediniz veya sral işlem (fy) girmediniz!', 'error');
        if (!videoKayitAktif) return showMessage('DKKAT! lk numuneyi dikerken Video kant oluşturmadnz. Şablon onaysz fasona gidemez!', 'error');

        setLoading(true);
        try {
            // ş U Kriteri: Modele ait bekleyen veya devam eden sipariş var m?
            const { data: mevcutSiparis } = await supabase.from('v2_production_orders')
                .select('id').eq('model_id', seciliModel.id).in('status', ['pending', 'in_progress']);

            if (mevcutSiparis && mevcutSiparis.length > 0) {
                setLoading(false);
                return showMessage(' Bu modele ait devam eden veya bekleyen bir retim emri zaten var!', 'error');
            }

            // Sadece rnek sipariş ve ilk adm banda atyoruz (Simlasyon)
            const { data: orderData, error: orderErr } = await supabase
                .from('v2_production_orders')
                .insert([{ order_code: 'FASON-ORD-' + Date.now(), model_id: seciliModel.id, quantity: 500, status: 'pending' }])
                .select().single();
            if (orderErr) throw orderErr;

            const { data: stepData } = await supabase.from('v2_production_steps')
                .insert([{ step_name: islemAdimlari[0].islem_adi, estimated_duration_minutes: islemAdimlari[0].ideal_sure_dk }])
                .select().single();

            const { data: wfData } = await supabase.from('v2_model_workflows')
                .insert([{ model_id: seciliModel.id, step_id: stepData.id, step_order: 1 }])
                .select().single();

            await supabase.from('v2_order_production_steps')
                .insert([{ order_id: orderData.id, model_workflow_id: wfData.id, status: 'assigned' }]);

            showMessage('ŞLEMLER ONAYLANDI! lk rn şablonu ve Kant Videosuyla birlikte Fasona / Seri retim Bandna frlatld!');
            telegramBildirim(`ş SER RETM BAŞLADI!\nModel: ${seciliModel.model_name}\nAtanan lk Adm: ${islemAdimlari[0].islem_adi}\nMiktar: 500 Adet`);
            setIslemAdimlari([]);
            setSeciliModel(null);
            setVideoKayitAktif(false);
        } catch (error) {
            if (!navigator.onLine || error.message?.includes('fetch')) {
                showMessage('nternet Yok: Sistem retim band işlemini ğevrimdş kuyruşa alamyor (Karmaşk Relasyonlar).', 'error');
            } else showMessage('Başlant veya Yetki Hatas: ' + error.message, 'error');
        }
        setLoading(false);
    };

    // --- 3. PENCERE FONKSYONLARI ---
    const yukleSahadakiIsler = async () => {
        try {
            const res = await Promise.race([supabase.from('v2_order_production_steps').select('*, v2_production_orders(order_code, quantity, v2_models(model_name))').neq('status', 'completed').limit(200), timeoutPromise()]);
            if (res.error) throw res.error;
            if (res.data) setSahadakiIsler(res.data);
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
    };

    const yuklePersoneller = async () => {
        try {
            const res = await Promise.race([supabase.from('v2_users').select('*').limit(100), timeoutPromise()]);
            if (res.error) throw res.error;
            if (res.data) setPersoneller(res.data);
        } catch (error) { showMessage('Personel listesi hatas: ' + error.message, 'error'); }
    };

    const sahadakiIsiBaslat = async (id) => {
        try {
            const { error } = await supabase.from('v2_order_production_steps').update({ status: 'in_progress', start_time: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            showMessage('SAHA: Kronometre ğalşmaya başlad. şğinin primi/maliyeti hesaplanyor.');
            telegramBildirim(` RETM: Kronometre Başlatld. Bant ğalşyor.`);
            yukleSahadakiIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
    };

    const sahadakiArizayiBildir = async (id) => {
        try {
            const { error } = await supabase.from('v2_order_production_steps').update({ status: 'blocked_machine' }).eq('id', id);
            if (error) throw error;
            showMessage('VCDAN-ADALET: Arza(Duruş) bildirildi. şğiden zarar kesilmeyecek, sisteme yazlacak.', 'error');
            telegramBildirim(` RETM DURDU!\nMakina Arzas veya Gecikme Bildirildi.`);
            yukleSahadakiIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
    };

    const sahadakiIsiBitir = async (id) => {
        try {
            const { error } = await supabase.from('v2_order_production_steps').update({ status: 'waiting_for_proof', end_time: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            showMessage('SAHA: ş Bitti! Analiz ve Onay iğin 4. Pencereye (Maliye/Karargah) yansd.');
            telegramBildirim(` RETM BANDI: Bir operasyon tamamland!\nMfettiş Onay ve Analiz Bekleniyor.`);
            yukleSahadakiIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
    };

    // --- 4. PENCERE FONKSYONLARI ---
    const yukleOnayBekleyenIsler = async () => {
        try {
            const res = await Promise.race([supabase.from('v2_order_production_steps').select('*, v2_production_orders(order_code, quantity, v2_models(model_name, material_cost))').eq('status', 'waiting_for_proof').limit(200), timeoutPromise()]);
            if (res.error) throw res.error;
            if (res.data) setOnayBekleyenIsler(res.data);
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
    };

    const finaleOnayVerMuhasebeyeYaz = async (islem) => {
        try {
            const { error } = await supabase.from('v2_order_production_steps').update({ status: 'completed' }).eq('id', islem.id);
            if (error) throw error;

            // FPY (Kusursuzluk) Onay simlasyonu
            if (islem.worker_id) { }

            showMessage(`MFETTŞ: Her şey kusursuz. Operasyon maliyeti ve rnler MUHASEBE szgecinden geğti. Kasa'ya +Net Deşer olarak yazld!`);
            telegramBildirim(`ş KALTE ONAYLANDI: 1 Parti kusursuz retim Muhasebe ve Finans raporlarna yansd!`);
            yukleOnayBekleyenIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
    };

    const hataliMalReddet = async (is) => {
        try {
            const { error } = await supabase.from('v2_order_production_steps').update({ status: 'assigned', rework_count: (is.rework_count || 0) + 1 }).eq('id', is.id);
            if (error) throw error;
            showMessage('MFETTŞ: Hatal Dikim Tespit Edildi! (FPY Dşt). şlem Fasona/Ustaya "Tekrar Dik" diye geri frlatld.', 'error');
            telegramBildirim(`ş KALTE REDD! retilen mal kusurlu. Revizyona (Tamire) gnderildi. Fire maliyeti hesaplanyor.`);
            yukleOnayBekleyenIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
    };

    if (!yetkiliMi) {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKSZ GRŞ ENGELLEND</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>M4 malat ve Bant verileri gizlidir. Grntlemek iğin retim PN girişi yapn.</p>
            </div>
        );
    }

    return (
        <div className="pb-20 font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase text-slate-800 tracking-tight">1. BRM: MALAT VE SIFIR NSYATF RETM KORDORU</h1>
                    <p className="text-sm text-gray-600 font-bold mt-1">Sektrdeki Fason / Taşeron insiyatifine, bilgi kirlilişine ve planszlşa son veren 4 Adml Tam Denetim Paneli.</p>
                </div>
                {/* CC Kriteri (M6 / Depo / Finans rotasna geğiş) */}
                <a href="/finans" style={{ textDecoration: 'none' }}>
                    <button className="flex items-center gap-2 bg-slate-900 text-white border-b-4 border-slate-950 px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all text-sm uppercase">
                        ş FNANS / DEPO (M6) GEŞ
                    </button>
                </a>
            </div>

            {message.text && (
                <div className={`p-4 mb-4 rounded-lg border-2 font-bold shadow-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-green-50 border-green-500 text-green-800'}`}>
                    {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                    {message.text}
                </div>
            )}

            {/* ANA PENCERELER (DEPARTMAN GEŞLER) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8 bg-slate-900 p-2 rounded-2xl shadow-xl">
                <button onClick={() => setMainTab('teknik_gorus')} className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all duration-300 ${mainTab === 'teknik_gorus' ? 'bg-blue-500 text-white scale-105 shadow-lg shadow-blue-500/50' : 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <FileText size={28} className="mb-2" /> 1. TEKNK GRŞ <span className="text-xs font-normal opacity-80">(Firma / Model Kabul)</span>
                </button>
                <button onClick={() => setMainTab('modelhane')} className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all duration-300 ${mainTab === 'modelhane' ? 'bg-emerald-500 text-white scale-105 shadow-lg shadow-emerald-500/50' : 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <CheckSquare size={28} className="mb-2" /> 2. LK RN ŞABLONU <span className="text-xs font-normal opacity-80">(Modelhane şlem Sras)</span>
                </button>
                <button onClick={() => setMainTab('uretim')} className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all duration-300 ${mainTab === 'uretim' ? 'bg-orange-500 text-white scale-105 shadow-lg shadow-orange-500/50' : 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <Activity size={28} className="mb-2" /> 3. SER RETM (BANT) <span className="text-xs font-normal opacity-80">(Personel ve Operasyon)</span>
                </button>
                <button onClick={() => setMainTab('maliyet_muhasebe')} className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all duration-300 ${mainTab === 'maliyet_muhasebe' ? 'bg-purple-600 text-white scale-105 shadow-lg shadow-purple-600/50' : 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <BarChart3 size={28} className="mb-2" /> 4. MALYET & MUHASEBE <span className="text-xs font-normal opacity-80">(Final Analiz Gişesi)</span>
                </button>
            </div>

            {/* ========================================================================================= */}
            {/* 1. PENCERE: TEKNK GRŞ VE RN KABUL DOSYASI                                            */}
            {/* ========================================================================================= */}
            {mainTab === 'teknik_gorus' && (
                <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Form Alan */}
                    <div className="card shadow-xl border-t-8 border-blue-500 bg-white">
                        <div className="flex items-center gap-3 border-b pb-4 mb-6">
                            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg"><UploadCloud size={24} /></div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">TEKNK GRŞ (rn Dosyas Ağma)</h2>
                                <p className="text-sm text-gray-500 font-bold mt-1">Dşardan (Firma/ArGe) gelen modelin anayasas burada yazlr. Alt limitler burada kilitlenir.</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">rn / Model Resmi Ad</label>
                                <input maxLength={200} type="text" className="form-input text-lg font-bold w-full border-2 border-slate-200 focus:border-blue-500" placeholder="rn: X Marka Kaşe Kaban (Erkek)" value={yeniFoy.model_name} onChange={e => setYeniFoy({ ...yeniFoy, model_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">Orijinal Model Grseli (Dosya/URL) <span>(Zorunlu)</span></label>
                                <input maxLength={1000} type="text" className="form-input w-full bg-slate-50" placeholder="https://ornek.com/model_resmi.jpg" value={yeniFoy.orjinal_gorsel_url} onChange={e => setYeniFoy({ ...yeniFoy, orjinal_gorsel_url: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide text-red-600">Maliyet Snr Başna (TL)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3 text-slate-400 font-bold"></span>
                                        <input type="number" className="form-input w-full pl-8 font-black text-red-600 border-red-200" placeholder="0.00" value={yeniFoy.maliyet_siniri_tl} onChange={e => setYeniFoy({ ...yeniFoy, maliyet_siniri_tl: e.target.value })} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 italic">Bu tutar geğilirse sistem krmz alarm verir.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide text-emerald-600">Zorunlu Kumaş (Metre)</label>
                                    <input type="number" step="0.1" className="form-input w-full font-bold text-emerald-700 border-emerald-200" placeholder="1.2" value={yeniFoy.zorunlu_kumas_miktari_mt} onChange={e => setYeniFoy({ ...yeniFoy, zorunlu_kumas_miktari_mt: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">Kumaş Esneme Pay Tolerans (%)</label>
                                <input type="number" className="form-input w-full bg-slate-50" placeholder="%5" value={yeniFoy.esneme_payi_yuzde} onChange={e => setYeniFoy({ ...yeniFoy, esneme_payi_yuzde: e.target.value })} />
                            </div>

                            <button onClick={teknikFoyKaydet} disabled={loading} className="w-full bg-blue-600 text-white font-black text-lg py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 mt-4">
                                <Database /> MHRLE VE TEKNK FY OLARAK KASAYA AT
                            </button>
                        </div>
                    </div>

                    {/* Veritaban Grntleme */}
                    <div className="card shadow-xl border border-slate-200 bg-slate-50">
                        <h2 className="text-xl font-black text-slate-700 mb-4 border-b pb-2 flex items-center gap-2"><Database size={20} /> Onaylanmş Teknik Fyler (Kasa)</h2>
                        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
                            {teknikFoyler.length === 0 && <p className="text-center text-gray-400 font-bold p-8">Sistemde teknik grş onaylanmş model yok.</p>}
                            {teknikFoyler.map((model) => (
                                <div key={model.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-black text-slate-800 text-lg">{model.model_name}</h3>
                                        <span className="bg-red-100 text-red-700 font-black px-3 py-1 rounded text-sm shrink-0">MAX: {model.material_cost || 0}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">{model.description}</p>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase mt-2 pt-2 border-t">ID: {model.id}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================================= */}
            {/* 2. PENCERE: MODELHANE VE LK RN ŞABLONU (FASONA Ş GNDERME)                              */}
            {/* ========================================================================================= */}
            {mainTab === 'modelhane' && (
                <div className="animate-fade-in card shadow-xl border-t-8 border-emerald-500 bg-white">
                    <div className="flex items-center gap-3 border-b pb-4 mb-6">
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg"><CheckSquare size={24} /></div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">LK RN HAZIRLAMA (FASONA ŞABLON IKARMA)</h2>
                            <p className="text-sm text-gray-500 font-bold mt-1">Teknik Grş alnan modelin işlemleri burada saniye saniye belirlenir. şği/Fason bu srann dşna ğkamaz.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sol Taraf: Model Seğimi ve Kant Videosu */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">1. Şablon karlacak Orijinal Modeli Seğ</label>
                            <select className="form-select w-full font-bold text-slate-700 mb-6 border-2 border-slate-300 h-12"
                                onChange={(e) => setSeciliModel(teknikFoyler.find(m => m.id === e.target.value) || null)}>
                                <option value="">--- Model Seğin ---</option>
                                {teknikFoyler.map(m => (
                                    <option key={m.id} value={m.id}>{m.model_name}</option>
                                ))}
                            </select>

                            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 relative">
                                <span className="absolute -top-3 left-4 bg-red-600 text-white text-[10px] px-2 py-1 font-black rounded uppercase tracking-wider">Mecburi şlem</span>
                                <h3 className="font-black text-slate-800 mb-2 flex items-center gap-2"><Video className="text-red-500" /> KEND MODELHANEMZDE LK DKM VDEOSU</h3>
                                <p className="text-xs text-gray-600 font-medium mb-4">"Byle anladm" yalann bitirmek iğin, ilk numune atlyemizde VDEO eşlişinde dikilir ve fasona izlemesi şart koşulur.</p>

                                <div className={`h-32 border-4 border-dashed rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${videoKayitAktif ? 'border-red-500 bg-red-50 shadow-inner' : 'border-slate-300 hover:border-slate-400 bg-white'}`}
                                    onClick={() => setVideoKayitAktif(!videoKayitAktif)}>
                                    {videoKayitAktif ? (
                                        <div className="flex flex-col items-center">
                                            <div className="flex animate-pulse items-center gap-2 mb-2">
                                                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                                <span className="font-black text-red-600">KAMERA KAYITTA... (TIKLA DURDUR)</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="font-black text-slate-500 flex items-center gap-2"><Camera /> KAMERAYI BAŞLATMAK N TIKLA</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Saş Taraf: Fasona gidecek iş sras */}
                        <div className="border-l-2 pl-8">
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">2. Dinamik şlemleri (Alt Grevleri) Belirle</label>
                            <p className="text-xs text-gray-500 font-medium mb-4">Seri retime/fasona gidecek şablon budur. Bu liste dş hiğbir iş yaplamaz veya iddia edilemez.</p>

                            <div className="flex gap-2 mb-4 bg-slate-100 p-2 rounded-lg">
                                <input maxLength={150} type="text" className="form-input flex-1 font-bold" placeholder="rn: Yaka likleme veya Bask" value={yeniAdim.islem_adi} onChange={e => setYeniAdim({ ...yeniAdim, islem_adi: e.target.value })} />
                                <input type="number" className="form-input w-24 text-center font-bold text-orange-600" placeholder="Tahmini Dk" value={yeniAdim.ideal_sure_dk} onChange={e => setYeniAdim({ ...yeniAdim, ideal_sure_dk: e.target.value })} />
                                <button onClick={adimEkle} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded font-black uppercase text-sm">Listeye Yaz</button>
                            </div>

                            <div className="h-48 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-2 mb-6">
                                {islemAdimlari.length === 0 && <p className="text-center text-gray-400 text-sm font-bold mt-10">Henz fasona verilecek bir işlem sras eklenmedi.</p>}
                                {islemAdimlari.map((a, i) => (
                                    <div key={a.id} className="flex justify-between items-center border border-slate-200 p-2 text-sm bg-white shadow-sm mb-2 rounded">
                                        <span className="font-bold text-slate-700"><span className="bg-slate-800 text-white px-2 py-1 rounded mr-2 text-[10px]">ADIM {i + 1}</span>{a.islem_adi}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-orange-600 font-black">{a.ideal_sure_dk} dk limit</span>
                                            <button onClick={() => adimSil(a.id)} className="text-red-400 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={uretimBandiVeyaFasonaFirlat} disabled={loading} className="w-full bg-slate-800 text-emerald-400 border-b-4 border-slate-950 font-black text-lg py-5 rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-3">
                                <PlaySquare size={24} /> ONAYLA VE SER RETME / FASONA YKLE!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================================= */}
            {/* 3. PENCERE: SER RETM, BANT / PERSONEL GRDLER (SAHA VE LYAKAT)                        */}
            {/* ========================================================================================= */}
            {mainTab === 'uretim' && (
                <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* SAHA KRONOMETRE PANELI */}
                    <div className="card shadow-xl border-t-8 border-orange-500 bg-white">
                        <div className="border-b pb-4 mb-4">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Activity className="text-orange-500" /> FASON / BANT ŞS SAHA EKRANI</h2>
                            <p className="text-xs text-gray-500 font-bold mt-1">şler buraya dşer. Usta saati başlatr, bitirince kantla kapatr. p koptuşunda "Arza" diyerek faturay dkkana ykar.</p>
                        </div>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {sahadakiIsler.length === 0 && <div className="p-8 text-center text-gray-400 font-bold border-2 border-dashed rounded-xl">Ustaya/Fasona atanmş bir retim sras yok.</div>}
                            {sahadakiIsler.map(is => (
                                <div key={is.id} className={`border-2 rounded-xl p-5 flex flex-col shadow-sm transition-all ${is.status === 'in_progress' ? 'border-orange-400 bg-orange-50/50' : 'border-slate-200 bg-white'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-black text-lg text-slate-800 uppercase">[KOD: {is.v2_production_orders?.order_code}]</h3>
                                            <p className="text-sm text-slate-600 font-bold mt-1">Sipariş: {is.v2_production_orders?.v2_models?.model_name || 'Gizli Model'}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded font-black border uppercase">{is.status}</span>
                                            <span className="text-xs font-bold text-gray-500">Miktar: {is.v2_production_orders?.quantity} Adet</span>
                                        </div>
                                    </div>

                                    {/* Operasyon Butonlar */}
                                    <div className="flex flex-col gap-2 mt-2">
                                        {is.status === 'assigned' && (
                                            <button onClick={() => sahadakiIsiBaslat(is.id)} className="w-full bg-slate-800 text-white py-4 rounded-xl font-black hover:bg-black flex items-center justify-center gap-2 shadow-md"><Clock /> ŞE VE KRONOMETREYE BAŞLA</button>
                                        )}
                                        {is.status === 'in_progress' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => sahadakiIsiBitir(is.id)} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black hover:bg-emerald-700 shadow-md text-sm"><CheckCircle2 className="inline mr-1" /> Ş BTT (KAPAT)</button>
                                                <button onClick={() => sahadakiArizayiBildir(is.id)} className="flex-1 border-2 border-red-500 text-red-600 py-4 rounded-xl font-black hover:bg-red-50 text-sm"><AlertTriangle className="inline mr-1" /> ARIZA BLDR (DUR)</button>
                                            </div>
                                        )}
                                        {is.status === 'blocked_machine' && (
                                            <div className="w-full bg-red-100 text-red-800 p-4 rounded-xl font-black text-center border-2 border-red-200 text-sm">
                                                ş ARIZA TESPT EDLD - SAYA DURDU - MDAHALE BEKLENYOR
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PERSONEL GRDS (LYAKAT VE VCDAN) PANELI */}
                    <div className="card shadow-xl border-t-8 border-indigo-500 bg-white">
                        <div className="border-b pb-4 mb-4">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Users className="text-indigo-500" /> PERSONEL GRDLER (VCDAN & HATA ORANI)</h2>
                            <p className="text-xs text-gray-500 font-bold mt-1">şğinin rettişi hatasz mal (FPY) skoru ve insan kaynaklar mdahalesi buradadr.</p>
                        </div>

                        <div className="overflow-x-auto border rounded-lg shadow-inner">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 border-b">
                                    <tr>
                                        <th className="p-3 font-bold text-xs uppercase text-slate-600">Sicil / Kullanc</th>
                                        <th className="p-3 font-bold text-xs uppercase text-slate-600 text-center">FPY (Kusursuzluk %'si)</th>
                                        <th className="p-3 font-bold text-xs uppercase text-slate-600 text-center">Sosyal Liyakat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {personeller.filter(p => !p.email.includes('admin')).map(p => (
                                        <tr key={p.id} className="border-b bg-white hover:bg-slate-50">
                                            <td className="p-3">
                                                <div className="font-black text-sm text-slate-800 truncate max-w-[150px]">{p.full_name || 'Usta'}</div>
                                                <div className="text-[10px] font-bold text-gray-400 mt-1">{p.role}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 font-black rounded text-sm ${p.fp_yield >= 1.0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>% {Number(p.fp_yield * 100).toFixed(0)}</span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="font-black text-indigo-600">{p.social_points || 0} Puan</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {personeller.length === 0 && <tr><td colSpan="3" className="p-4 text-center font-bold text-gray-400">Personel verisi yok.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================================= */}
            {/* 4. PENCERE: MALYET ANALZ VE MUHASEBE (FNAL ONAYI VE GŞES)                            */}
            {/* ========================================================================================= */}
            {mainTab === 'maliyet_muhasebe' && (
                <div className="animate-fade-in card shadow-xl border-t-8 border-purple-700 bg-slate-50">
                    <div className="flex items-center gap-4 border-b border-purple-200 pb-5 mb-6">
                        <div className="p-4 bg-purple-700 text-white rounded-xl shadow-lg"><Receipt size={32} /></div>
                        <div>
                            <h2 className="text-3xl font-black text-purple-900 tracking-tight">KAPANIŞ GŞES / MUHASEBE VE ANALZ RAPORU</h2>
                            <p className="text-sm text-purple-700 font-bold mt-1">retimden ğkan malzemenin harcadş dakikalar paraya ğevrilir. Hatalar kontrol edilir, son onay verilirse finans merkezine faturas yollanr.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {onayBekleyenIsler.length === 0 && <div className="p-12 text-center text-purple-400 bg-white rounded-xl border-2 border-dashed border-purple-200 font-black text-lg shadow-sm">Gişede onay ve maliyet hesab bekleyen seri retim işi yok.</div>}

                        {onayBekleyenIsler.map(is => (
                            <div key={is.id} className="bg-white border-2 border-purple-300 rounded-2xl p-6 shadow-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-yellow-400 text-slate-800 px-5 py-1 text-[10px] font-black rounded-bl-xl uppercase tracking-widest shadow-sm">Mfettiş Onay Bekliyor</div>

                                <div className="flex justify-between items-start mb-6 border-b pb-4">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 uppercase mb-1">{is.v2_production_orders?.v2_models?.model_name || 'Gizli Model'}</h3>
                                        <p className="text-sm font-bold text-gray-500 uppercase">SPARŞ KODU: {is.v2_production_orders?.order_code} | MKTAR: {is.v2_production_orders?.quantity} ADET</p>
                                    </div>
                                </div>

                                {/* Maliyet ve Analiz Raporu Tablosu */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Hesaplanan Kronometre</span>
                                        <div className="font-black text-2xl text-slate-800">42 <span className="text-sm text-gray-400">Dk / Adet</span></div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Maliyet Snr Delindi mi?</span>
                                        <div className="font-black text-2xl text-emerald-600">GVENL</div>
                                        <span className="text-[10px] font-bold text-emerald-500">Hedef: {is.v2_production_orders?.v2_models?.material_cost || 0}</span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Kalite Skoru (Hata)</span>
                                        <div className="font-black text-2xl text-slate-800">{is.rework_count === 0 ? 'KUSURSUZ' : `${is.rework_count} HATA`}</div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => hataliMalReddet(is)} className="flex-1 bg-white text-red-600 border-2 border-red-300 hover:border-red-600 hover:bg-red-50 py-5 font-black text-lg rounded-xl shadow-sm transition-all flex justify-center items-center gap-2">REDDET & ŞYE GER YOLLA</button>
                                    <button onClick={() => finaleOnayVerMuhasebeyeYaz(is)} className="flex-1 bg-purple-700 text-white hover:bg-purple-800 border-b-4 border-purple-900 py-5 font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 uppercase">Her Şey Doşru! Muhasebeye Fişi Kes</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}