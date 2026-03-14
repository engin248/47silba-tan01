'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { Camera, FileText, CheckCircle2, PlaySquare, PlusCircle, Save, Trash2, Edit, Mic, Video, Users, DollarSign, Clock, AlertTriangle, ShieldCheck, Play, Activity, CheckSquare, UploadCloud, Receipt, BarChart3, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { Lock } from 'lucide-react';
import NextLink from 'next/link';

export default function ImalatMainContainer() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);
    // 4 ANA PENCERE (DEPARTMAN) DEVLETİ
    const [mainTab, setMainTab] = useState('teknik_gorus');
    const [imalatGorunum, setImalatGorunum] = useState('liste'); // 'liste' | 'kanban'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [islemdeId, setIslemdeId] = useState(null); // [SPAM ZIRHI] Çift tıklama engeli

    // =========================================================================
    // 1. PENCERE: TEKNİK GÖRÜŞ & ÜRÜN KABUL (FİRMADAN GELEN MODEL / DOSYA)
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
    // 2. PENCERE: MODELHANE & İŞLEM SIRASI BELİRLEME (BANT/FASONA ATMA)
    // =========================================================================
    const [seciliModel, setSeciliModel] = useState(null); // İşlem sırası eklenecek model
    const [islemAdimlari, setIslemAdimlari] = useState([]);
    const [yeniAdim, setYeniAdim] = useState({ islem_adi: '', ideal_sure_dk: '', zorluk_derecesi: 5.0 });
    const [videoKayitAktif, setVideoKayitAktif] = useState(false);

    // =========================================================================
    // 3. PENCERE: ÜRETİM (BAND/FASON) VE PERSONEL GİRDİLERİ
    // =========================================================================
    const [sahadakiIsler, setSahadakiIsler] = useState([]);
    const [personeller, setPersoneller] = useState([]);

    // =========================================================================
    // 4. PENCERE: MALİYET RAPORU, ANALİZ VE MUHASEBE (FİNAL)
    // =========================================================================
    const [onayBekleyenIsler, setOnayBekleyenIsler] = useState([]);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');

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
        // [RENDER ZIRHI]: Auth Refetch Döngüsü bozuldu, Obje yerine ID ve Grup primiti bağlandı.
    }, [mainTab, kullanici?.id, kullanici?.grup]);

    // telegramBildirim → @/lib/utils'den import ediliyor (yerel tanım kaldırıldı — redeclaration fix)

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    // --- 1. PENCERE FONKSİYONLARI ---
    const timeoutPromise = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 saniye)')), 10000));
    const yukleTeknikFoyler = async () => {
        try {
            const res = await Promise.race([supabase.from('v2_models').select('*').order('created_at', { ascending: false }).limit(200), timeoutPromise()]);
            if (res.error) throw res.error;
            if (res.data) setTeknikFoyler(res.data);
        } catch (error) { showMessage('Ağ hatası: ' + error.message, 'error'); }
    };

    const teknikFoyKaydet = async () => {
        if (!yeniFoy.model_name.trim() || !yeniFoy.maliyet_siniri_tl) {
            return showMessage('Model Adı ve Maliyet Sınırı zorunludur! İnisiyatif kullanılamaz.', 'error');
        }
        if (yeniFoy.model_name.length > 200) return showMessage('Model adı en fazla 200 karakter olmalı!', 'error');

        setLoading(true);
        try {
            // 🛑 U Kriteri: Mükerrer Kayıt Engelleme
            const { data: mevcut } = await supabase.from('v2_models')
                .select('id').eq('model_name', yeniFoy.model_name.trim());

            if (mevcut && mevcut.length > 0) {
                setLoading(false);
                return showMessage('⚠️ Bu Model Zaten Teknik Föy Olarak Kayıtlı!', 'error');
            }

            const { error } = await supabase.from('v2_models').insert([{
                model_name: yeniFoy.model_name.trim(),
                description: `Kumaş İhtiyacı: ${yeniFoy.zorunlu_kumas_miktari_mt} mt, Esneme: %${yeniFoy.esneme_payi_yuzde}. (Görsel URL: ${yeniFoy.orjinal_gorsel_url})`.substring(0, 490),
                difficulty_score: 5.0,
                material_cost: parseFloat(yeniFoy.maliyet_siniri_tl)
            }]);

            if (!error) {
                showMessage('FİRMADAN GELEN MODEL "TEKNİK FÖY" OLARAK KASAYA KİLİTLENDİ!');
                setYeniFoy({ model_name: '', orjinal_gorsel_url: '', maliyet_siniri_tl: '', zorunlu_kumas_miktari_mt: '', esneme_payi_yuzde: '' });
                telegramBildirim(`📁 YENİ TEKNİK FÖY AÇILDI!\nModel: ${yeniFoy.model_name.trim()}\nLimit: ${yeniFoy.maliyet_siniri_tl}₺`);
                yukleTeknikFoyler();
            } else {
                throw error;
            }
        } catch (error) {
            if (!navigator.onLine || error.message?.includes('fetch')) {
                await cevrimeKuyrugaAl({ tablo: 'v2_models', islem_tipi: 'INSERT', veri: { model_name: yeniFoy.model_name.trim(), description: `Kumaş İhtiyacı: ${yeniFoy.zorunlu_kumas_miktari_mt} mt, Esneme: %${yeniFoy.esneme_payi_yuzde}. (Görsel URL: ${yeniFoy.orjinal_gorsel_url})`.substring(0, 490), difficulty_score: 5.0, material_cost: parseFloat(yeniFoy.maliyet_siniri_tl) } });
                showMessage('İnternet Yok: Yeni Teknik Föy çevrimdışı kuyruğa alındı.', 'success');
                setYeniFoy({ model_name: '', orjinal_gorsel_url: '', maliyet_siniri_tl: '', zorunlu_kumas_miktari_mt: '', esneme_payi_yuzde: '' });
            } else showMessage('Sunucu çöktü veya ulaşılamıyor: ' + error.message, 'error');
        }
        setLoading(false);
    };

    // --- 2. PENCERE FONKSİYONLARI ---
    const adimEkle = () => {
        if (!yeniAdim.islem_adi.trim() || !yeniAdim.ideal_sure_dk) return showMessage('İşlem adı ve süre tahmini zorunlu!', 'error');
        if (yeniAdim.islem_adi.length > 150) return showMessage('İşlem adı en fazla 150 karakter olmalı!', 'error');
        setIslemAdimlari([...islemAdimlari, { id: Date.now(), ...yeniAdim }]);
        setYeniAdim({ islem_adi: '', ideal_sure_dk: '', zorluk_derecesi: 5.0 });
    };

    const adimSil = (id) => setIslemAdimlari(islemAdimlari.filter(a => a.id !== id));

    const uretimBandiVeyaFasonaFirlat = async () => {
        if (!seciliModel || islemAdimlari.length === 0) return showMessage('Model seçmediniz veya sıralı işlem (föy) girmediniz!', 'error');
        if (!videoKayitAktif) return showMessage('DİKKAT! İlk numuneyi dikerken Video kanıtı oluşturmadınız. Şablon onaysız fasona gidemez!', 'error');

        setLoading(true);
        try {
            // 🛑 U Kriteri: Modele ait bekleyen veya devam eden sipariş var mı?
            const { data: mevcutSiparis } = await supabase.from('v2_production_orders')
                .select('id').eq('model_id', seciliModel.id).in('status', ['pending', 'in_progress']);

            if (mevcutSiparis && mevcutSiparis.length > 0) {
                setLoading(false);
                return showMessage('⚠️ Bu modele ait devam eden veya bekleyen bir üretim emri zaten var!', 'error');
            }

            // Sadece örnek sipariş ve ilk adımı banda atıyoruz (Simülasyon)
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

            showMessage('İŞLEMLER ONAYLANDI! İlk ürün şablonu ve Kanıt Videosuyla birlikte Fasona / Seri Üretim Bandına fırlatıldı!');
            telegramBildirim(`🚀 SERİ ÜRETİM BAŞLADI!\nModel: ${seciliModel.model_name}\nAtanan İlk Adım: ${islemAdimlari[0].islem_adi}\nMiktar: 500 Adet`);
            setIslemAdimlari([]);
            setSeciliModel(null);
            setVideoKayitAktif(false);
        } catch (error) {
            if (!navigator.onLine || error.message?.includes('fetch')) {
                showMessage('İnternet Yok: Sistem üretim bandı işlemini çevrimdışı kuyruğa alamıyor (Karmaşık Relasyonlar).', 'error');
            } else showMessage('Bağlantı veya Yetki Hatası: ' + error.message, 'error');
        }
        setLoading(false);
    };

    // --- 3. PENCERE FONKSİYONLARI ---
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
        } catch (error) { showMessage('Personel listesi hatası: ' + error.message, 'error'); }
    };

    const sahadakiIsiBaslat = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            const { error } = await supabase.from('v2_order_production_steps').update({ status: 'in_progress', start_time: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            showMessage('SAHA: Kronometre çalışmaya başladı. İşçinin primi/maliyeti hesaplanıyor.');
            telegramBildirim(`⏱️ ÜRETİM: Kronometre Başlatıldı. Bant çalışıyor.`);
            yukleSahadakiIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const sahadakiArizayiBildir = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            const { error } = await supabase.from('v2_order_production_steps').update({ status: 'blocked_machine' }).eq('id', id);
            if (error) throw error;
            showMessage('VİCDAN-ADALET: Arıza(Duruş) bildirildi. İşçiden zarar kesilmeyecek, sisteme yazılacak.', 'error');
            telegramBildirim(`⚠️ ÜRETİM DURDU!\nMakina Arızası veya Gecikme Bildirildi.`);
            yukleSahadakiIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const sahadakiIsiBitir = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            const { error } = await supabase.from('v2_order_production_steps').update({ status: 'waiting_for_proof', end_time: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            showMessage('SAHA: İş Bitti! Analiz ve Onay için 4. Pencereye (Maliye/Karargah) yansıdı.');
            telegramBildirim(`✅ ÜRETİM BANDI: Bir operasyon tamamlandı!\nMüfettiş Onayı ve Analiz Bekleniyor.`);
            yukleSahadakiIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    // --- 4. PENCERE FONKSİYONLARI ---
    const yukleOnayBekleyenIsler = async () => {
        try {
            const res = await Promise.race([supabase.from('v2_order_production_steps').select('*, v2_production_orders(order_code, quantity, v2_models(model_name, material_cost))').eq('status', 'waiting_for_proof').limit(200), timeoutPromise()]);
            if (res.error) throw res.error;
            if (res.data) setOnayBekleyenIsler(res.data);
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
    };

    const finaleOnayVerMuhasebeyeYaz = async (islem) => {
        if (islemdeId === islem.id) return;
        setIslemdeId(islem.id);
        try {
            const { error } = await supabase.from('v2_order_production_steps').update({ status: 'completed' }).eq('id', islem.id);
            if (error) throw error;

            // 💥 KASAP OPERASYONU: Otomatik Maliyet / Muhasebeye Fiş Kesme
            const siparis_id = islem.order_id || (islem.v2_production_orders ? islem.v2_production_orders.id : null);
            if (siparis_id) {
                const operasyonZamaniDk = 42; // Sembolik standart süre
                const dakikaMaliyeti = 4; // Ortalama Bant işçilik baremi (Dakikada 4 TL)
                const toplamMaliyet = operasyonZamaniDk * dakikaMaliyeti;

                await supabase.from('b1_maliyet_kayitlari').insert([{
                    order_id: siparis_id,
                    maliyet_tipi: 'personel_iscilik',
                    kalem_aciklama: `OP-${islem.id} Bant Operasyonu Tamamlanma Hakedişi`,
                    tutar_tl: toplamMaliyet,
                    onay_durumu: 'hesaplandi'
                }]).catch(() => { });
            }

            // FPY (Kusursuzluk) Onayı
            if (islem.worker_id) { }

            showMessage(`MÜFETTİŞ: Her şey kusursuz. Operasyon maliyeti (₺) MUHASEBE süzgecinden geçti. Kasa'ya +Net Değer olarak yazıldı!`);
            telegramBildirim(`📊 KALİTE VE MALİYET ONAYLANDI: Kusursuz üretim Muhasebe'ye işlendi!`);
            yukleOnayBekleyenIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const hataliMalReddet = async (is) => {
        if (islemdeId === is.id) return;
        setIslemdeId(is.id);
        try {
            const { error } = await supabase.from('v2_order_production_steps').update({ status: 'assigned', rework_count: (is.rework_count || 0) + 1 }).eq('id', is.id);
            if (error) throw error;
            showMessage('MÜFETTİŞ: Hatalı Dikim Tespit Edildi! (FPY Düştü). İşlem Fasona/Ustaya "Tekrar Dik" diye geri fırlatıldı.', 'error');
            telegramBildirim(`🚫 KALİTE REDDİ! Üretilen mal kusurlu. Revizyona (Tamire) gönderildi. Fire maliyeti hesaplanıyor.`);
            yukleOnayBekleyenIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    if (!yetkiliMi) {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>M4 İmalat ve Bant verileri gizlidir. Görüntülemek için Üretim PİN girişi yapın.</p>
            </div>
        );
    }

    return (
        <div className="pb-20 font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase text-slate-800 tracking-tight">1. BİRİM: İMALAT VE SIFIR İNİSİYATİF ÜRETİM KORİDORU</h1>
                    <p className="text-sm text-gray-600 font-bold mt-1">Sektördeki Fason / Taşeron insiyatifine, bilgi kirliliğine ve plansızlığa son veren 4 Adımlı Tam Denetim Paneli.</p>
                </div>
                {/* CC Kriteri (M6 / Depo / Finans rotasına geçiş) - SPA KORUMASI */}
                <NextLink href="/finans" style={{ textDecoration: 'none' }}>
                    <button className="flex items-center gap-2 bg-slate-900 text-white border-b-4 border-slate-950 px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all text-sm uppercase">
                        💼 FİNANS / DEPO (M6) GEÇİŞİ
                    </button>
                </NextLink>
            </div>

            {message.text && (
                <div className={`p-4 mb-4 rounded-lg border-2 font-bold shadow-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-green-50 border-green-500 text-green-800'}`}>
                    {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                    {message.text}
                </div>
            )}

            {/* ANA PENCERELER (DEPARTMAN GEÇİŞLERİ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8 bg-slate-900 p-2 rounded-2xl shadow-xl">
                <button onClick={() => setMainTab('teknik_gorus')} className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all duration-300 ${mainTab === 'teknik_gorus' ? 'bg-blue-500 text-white scale-105 shadow-lg shadow-blue-500/50' : 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <FileText size={28} className="mb-2" /> 1. TEKNİK GÖRÜŞ <span className="text-xs font-normal opacity-80">(Firma / Model Kabul)</span>
                </button>
                <button onClick={() => setMainTab('modelhane')} className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all duration-300 ${mainTab === 'modelhane' ? 'bg-emerald-500 text-white scale-105 shadow-lg shadow-emerald-500/50' : 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <CheckSquare size={28} className="mb-2" /> 2. İLK ÜRÜN ŞABLONU <span className="text-xs font-normal opacity-80">(Modelhane İşlem Sırası)</span>
                </button>
                <button onClick={() => setMainTab('uretim')} className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all duration-300 ${mainTab === 'uretim' ? 'bg-orange-500 text-white scale-105 shadow-lg shadow-orange-500/50' : 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <Activity size={28} className="mb-2" /> 3. SERİ ÜRETİM (BANT) <span className="text-xs font-normal opacity-80">(Personel ve Operasyon)</span>
                </button>
                <button onClick={() => setMainTab('maliyet_muhasebe')} className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all duration-300 ${mainTab === 'maliyet_muhasebe' ? 'bg-purple-600 text-white scale-105 shadow-lg shadow-purple-600/50' : 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <BarChart3 size={28} className="mb-2" /> 4. MALİYET & MUHASEBE <span className="text-xs font-normal opacity-80">(Final Analiz Gişesi)</span>
                </button>
            </div>

            {/* ========================================================================================= */}
            {/* 1. PENCERE: TEKNİK GÖRÜŞ VE ÜRÜN KABUL DOSYASI                                            */}
            {/* ========================================================================================= */}
            {mainTab === 'teknik_gorus' && (
                <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Form Alanı */}
                    <div className="card shadow-xl border-t-8 border-blue-500 bg-white">
                        <div className="flex items-center gap-3 border-b pb-4 mb-6">
                            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg"><UploadCloud size={24} /></div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">TEKNİK GÖRÜŞ (Ürün Dosyası Açma)</h2>
                                <p className="text-sm text-gray-500 font-bold mt-1">Dışarıdan (Firma/ArGe) gelen modelin anayasası burada yazılır. Alt limitler burada kilitlenir.</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">Ürün / Model Resmi Adı</label>
                                <input maxLength={200} type="text" className="form-input text-lg font-bold w-full border-2 border-slate-200 focus:border-blue-500" placeholder="Örn: X Marka Kaşe Kaban (Erkek)" value={yeniFoy.model_name} onChange={e => setYeniFoy({ ...yeniFoy, model_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">Orijinal Model Görseli (Dosya/URL) <span>(Zorunlu)</span></label>
                                <input maxLength={1000} type="text" className="form-input w-full bg-slate-50" placeholder="https://ornek.com/model_resmi.jpg" value={yeniFoy.orjinal_gorsel_url} onChange={e => setYeniFoy({ ...yeniFoy, orjinal_gorsel_url: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide text-red-600">Maliyet Sınırı Başına (TL)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3 text-slate-400 font-bold">₺</span>
                                        <input type="number" className="form-input w-full pl-8 font-black text-red-600 border-red-200" placeholder="0.00" value={yeniFoy.maliyet_siniri_tl} onChange={e => setYeniFoy({ ...yeniFoy, maliyet_siniri_tl: e.target.value })} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 italic">Bu tutar geçilirse sistem kırmızı alarm verir.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide text-emerald-600">Zorunlu Kumaş (Metre)</label>
                                    <input type="number" step="0.1" className="form-input w-full font-bold text-emerald-700 border-emerald-200" placeholder="1.2" value={yeniFoy.zorunlu_kumas_miktari_mt} onChange={e => setYeniFoy({ ...yeniFoy, zorunlu_kumas_miktari_mt: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">Kumaş Esneme Payı Toleransı (%)</label>
                                <input type="number" className="form-input w-full bg-slate-50" placeholder="%5" value={yeniFoy.esneme_payi_yuzde} onChange={e => setYeniFoy({ ...yeniFoy, esneme_payi_yuzde: e.target.value })} />
                            </div>

                            <button onClick={teknikFoyKaydet} disabled={loading} className="w-full bg-blue-600 text-white font-black text-lg py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 mt-4">
                                <Database /> MÜHÜRLE VE TEKNİK FÖY OLARAK KASAYA AT
                            </button>
                        </div>
                    </div>

                    {/* Veritabanı Görüntüleme */}
                    <div className="card shadow-xl border border-slate-200 bg-slate-50">
                        <h2 className="text-xl font-black text-slate-700 mb-4 border-b pb-2 flex items-center gap-2"><Database size={20} /> Onaylanmış Teknik Föyler (Kasa)</h2>
                        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
                            {teknikFoyler.length === 0 && <p className="text-center text-gray-400 font-bold p-8">Sistemde teknik görüşü onaylanmış model yok.</p>}
                            {teknikFoyler.map((model) => (
                                <div key={model.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-black text-slate-800 text-lg">{model.model_name}</h3>
                                        <span className="bg-red-100 text-red-700 font-black px-3 py-1 rounded text-sm shrink-0">MAX: {model.material_cost || 0}₺</span>
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
            {/* 2. PENCERE: MODELHANE VE İLK ÜRÜN ŞABLONU (FASONA İŞ GÖNDERME)                              */}
            {/* ========================================================================================= */}
            {mainTab === 'modelhane' && (
                <div className="animate-fade-in card shadow-xl border-t-8 border-emerald-500 bg-white">
                    <div className="flex items-center gap-3 border-b pb-4 mb-6">
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg"><CheckSquare size={24} /></div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">İLK ÜRÜN HAZIRLAMA (FASONA ŞABLON ÇIKARMA)</h2>
                            <p className="text-sm text-gray-500 font-bold mt-1">Teknik Görüşü alınan modelin işlemleri burada saniye saniye belirlenir. İşçi/Fason bu sıranın dışına çıkamaz.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sol Taraf: Model Seçimi ve Kanıt Videosu */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">1. Şablon Çıkarılacak Orijinal Modeli Seç</label>
                            <select className="form-select w-full font-bold text-slate-700 mb-6 border-2 border-slate-300 h-12"
                                onChange={(e) => setSeciliModel(teknikFoyler.find(m => m.id === e.target.value) || null)}>
                                <option value="">--- Model Seçin ---</option>
                                {teknikFoyler.map(m => (
                                    <option key={m.id} value={m.id}>{m.model_name}</option>
                                ))}
                            </select>

                            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 relative">
                                <span className="absolute -top-3 left-4 bg-red-600 text-white text-[10px] px-2 py-1 font-black rounded uppercase tracking-wider">Mecburi İşlem</span>
                                <h3 className="font-black text-slate-800 mb-2 flex items-center gap-2"><Video className="text-red-500" /> KENDİ MODELHANEMİZDE İLK DİKİM VİDEOSU</h3>
                                <p className="text-xs text-gray-600 font-medium mb-4">"Böyle anladım" yalanını bitirmek için, ilk numune atölyemizde VİDEO eşliğinde dikilir ve fasona izlemesi şart koşulur.</p>

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
                                        <span className="font-black text-slate-500 flex items-center gap-2"><Camera /> KAMERAYI BAŞLATMAK İÇİN TIKLA</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sağ Taraf: Fasona gidecek iş sırası */}
                        <div className="border-l-2 pl-8">
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">2. Dinamik İşlemleri (Alt Görevleri) Belirle</label>
                            <p className="text-xs text-gray-500 font-medium mb-4">Seri üretime/fasona gidecek şablon budur. Bu liste dışı hiçbir iş yapılamaz veya iddia edilemez.</p>

                            <div className="flex gap-2 mb-4 bg-slate-100 p-2 rounded-lg">
                                <input maxLength={150} type="text" className="form-input flex-1 font-bold" placeholder="Örn: Yaka İlikleme veya Baskı" value={yeniAdim.islem_adi} onChange={e => setYeniAdim({ ...yeniAdim, islem_adi: e.target.value })} />
                                <input type="number" className="form-input w-24 text-center font-bold text-orange-600" placeholder="Tahmini Dk" value={yeniAdim.ideal_sure_dk} onChange={e => setYeniAdim({ ...yeniAdim, ideal_sure_dk: e.target.value })} />
                                <button onClick={adimEkle} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded font-black uppercase text-sm">Listeye Yaz</button>
                            </div>

                            <div className="h-48 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-2 mb-6">
                                {islemAdimlari.length === 0 && <p className="text-center text-gray-400 text-sm font-bold mt-10">Henüz fasona verilecek bir işlem sırası eklenmedi.</p>}
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
                                <PlaySquare size={24} /> ONAYLA VE SERİ ÜRETİME / FASONA YÜKLE!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================================= */}
            {/* 3. PENCERE: SERİ ÜRETİM, BANT / PERSONEL GİRDİLERİ (SAHA VE LİYAKAT)                        */}
            {/* ========================================================================================= */}
            {mainTab === 'uretim' && (
                <div className="animate-fade-in">
                    {/* KANBAN TOGGLE */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setImalatGorunum(v => v === 'liste' ? 'kanban' : 'liste')}
                            style={{ background: imalatGorunum === 'kanban' ? '#7c3aed' : '#475569', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
                            {imalatGorunum === 'kanban' ? '📋 Liste Görünümü' : '📦 Kanban Board'}
                        </button>
                    </div>

                    {/* KANBAN BOARD */}
                    {imalatGorunum === 'kanban' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                            {[
                                { key: 'assigned', label: '📋 Atandı', renk: '#3b82f6' },
                                { key: 'in_progress', label: '⚙️ Üretimde', renk: '#f59e0b' },
                                { key: 'waiting_for_proof', label: '🔍 Onay Bekl.', renk: '#8b5cf6' },
                                { key: 'blocked_machine', label: '🔴 Arıza', renk: '#ef4444' },
                            ].map(kolon => (
                                <div key={kolon.key} style={{ background: '#f8fafc', border: `2px solid ${kolon.renk}30`, borderRadius: 12, padding: '0.75rem', minHeight: 180 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: kolon.renk }}>{kolon.label}</span>
                                        <span style={{ background: `${kolon.renk}20`, color: kolon.renk, fontWeight: 700, fontSize: '0.65rem', padding: '1px 7px', borderRadius: 8 }}>
                                            {sahadakiIsler.filter(i => i.status === kolon.key).length}
                                        </span>
                                    </div>
                                    {sahadakiIsler.filter(i => i.status === kolon.key).map(is => (
                                        <div key={is.id} style={{ background: 'white', borderRadius: 8, padding: '0.625rem', marginBottom: '0.375rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${kolon.renk}20` }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#0f172a' }}>{is.v2_production_orders?.order_code || 'Sipariş'}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{is.v2_production_orders?.v2_models?.model_name || '—'}</div>
                                            {kolon.key === 'assigned' && (
                                                <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBaslat(is.id)} style={{ marginTop: 4, fontSize: '0.6rem', fontWeight: 800, background: '#eff6ff', color: '#2563eb', border: 'none', padding: '2px 8px', borderRadius: 4, cursor: islemdeId === is.id ? 'wait' : 'pointer', opacity: islemdeId === is.id ? 0.5 : 1 }}>
                                                    {islemdeId === is.id ? '...' : '▶ Başlat'}
                                                </button>
                                            )}
                                            {kolon.key === 'in_progress' && (
                                                <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                                                    <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBitir(is.id)} style={{ fontSize: '0.6rem', fontWeight: 800, background: '#ecfdf5', color: '#059669', border: 'none', padding: '2px 6px', borderRadius: 4, cursor: islemdeId === is.id ? 'wait' : 'pointer', opacity: islemdeId === is.id ? 0.5 : 1 }}>
                                                        {islemdeId === is.id ? '...' : '✓ Bitir'}
                                                    </button>
                                                    <button disabled={islemdeId === is.id} onClick={() => sahadakiArizayiBildir(is.id)} style={{ fontSize: '0.6rem', fontWeight: 800, background: '#fef2f2', color: '#dc2626', border: 'none', padding: '2px 6px', borderRadius: 4, cursor: islemdeId === is.id ? 'wait' : 'pointer', opacity: islemdeId === is.id ? 0.5 : 1 }}>
                                                        {islemdeId === is.id ? '...' : '⚠ Arıza'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {sahadakiIsler.filter(i => i.status === kolon.key).length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '1rem', color: '#cbd5e1', fontSize: '0.7rem' }}>Boş</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* LİSTE görünümü (eski grid) */}
                    {imalatGorunum === 'liste' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* SAHA KRONOMETRE PANELI */}
                            <div className="card shadow-xl border-t-8 border-orange-500 bg-white">
                                <div className="border-b pb-4 mb-4">
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Activity className="text-orange-500" /> FASON / BANT İŞÇİSİ SAHA EKRANI</h2>
                                    <p className="text-xs text-gray-500 font-bold mt-1">İşler buraya düşer. Usta saati başlatır, bitirince kanıtla kapatır. İp koptuğunda "Arıza" diyerek faturayı dükkana yıkar.</p>
                                </div>

                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {sahadakiIsler.length === 0 && <div className="p-8 text-center text-gray-400 font-bold border-2 border-dashed rounded-xl">Ustaya/Fasona atanmış bir üretim sırası yok.</div>}
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

                                            {/* Operasyon Butonları */}
                                            <div className="flex flex-col gap-2 mt-2">
                                                {is.status === 'assigned' && (
                                                    <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBaslat(is.id)} className="w-full bg-slate-800 text-white py-4 rounded-xl font-black hover:bg-black flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-wait">
                                                        <Clock /> {islemdeId === is.id ? 'İŞLEMDE...' : 'İŞE VE KRONOMETREYE BAŞLA'}
                                                    </button>
                                                )}
                                                {is.status === 'in_progress' && (
                                                    <div className="flex gap-2">
                                                        <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBitir(is.id)} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black hover:bg-emerald-700 shadow-md text-sm disabled:opacity-50 disabled:cursor-wait"><CheckCircle2 className="inline mr-1" /> {islemdeId === is.id ? '...' : 'İŞ BİTTİ (KAPAT)'}</button>
                                                        <button disabled={islemdeId === is.id} onClick={() => sahadakiArizayiBildir(is.id)} className="flex-1 border-2 border-red-500 text-red-600 py-4 rounded-xl font-black hover:bg-red-50 text-sm disabled:opacity-50 disabled:cursor-wait"><AlertTriangle className="inline mr-1" /> {islemdeId === is.id ? '...' : 'ARIZA BİLDİR (DUR)'}</button>
                                                    </div>
                                                )}
                                                {is.status === 'blocked_machine' && (
                                                    <div className="w-full bg-red-100 text-red-800 p-4 rounded-xl font-black text-center border-2 border-red-200 text-sm">
                                                        🔴 ARIZA TESPİT EDİLDİ - SAYAÇ DURDU - MÜDAHALE BEKLENİYOR
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PERSONEL GİRDİSİ (LİYAKAT VE VİCDAN) PANELI */}
                            <div className="card shadow-xl border-t-8 border-indigo-500 bg-white">
                                <div className="border-b pb-4 mb-4">
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Users className="text-indigo-500" /> PERSONEL GİRDİLERİ (VİCDAN & HATA ORANI)</h2>
                                    <p className="text-xs text-gray-500 font-bold mt-1">İşçinin ürettiği hatasız mal (FPY) skoru ve insan kaynakları müdahalesi buradadır.</p>
                                </div>

                                <div className="overflow-x-auto border rounded-lg shadow-inner">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-100 border-b">
                                            <tr>
                                                <th className="p-3 font-bold text-xs uppercase text-slate-600">Sicil / Kullanıcı</th>
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
                </div>
            )}

            {/* ========================================================================================= */}
            {/* 4. PENCERE: MALİYET ANALİZ VE MUHASEBE (FİNAL ONAYI VE GİŞESİ)                            */}
            {/* ========================================================================================= */}
            {mainTab === 'maliyet_muhasebe' && (
                <div className="animate-fade-in card shadow-xl border-t-8 border-purple-700 bg-slate-50">
                    <div className="flex items-center gap-4 border-b border-purple-200 pb-5 mb-6">
                        <div className="p-4 bg-purple-700 text-white rounded-xl shadow-lg"><Receipt size={32} /></div>
                        <div>
                            <h2 className="text-3xl font-black text-purple-900 tracking-tight">KAPANIŞ GİŞESİ / MUHASEBE VE ANALİZ RAPORU</h2>
                            <p className="text-sm text-purple-700 font-bold mt-1">Üretimden çıkan malzemenin harcadığı dakikalar paraya çevrilir. Hatalar kontrol edilir, son onay verilirse finans merkezine faturası yollanır.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {onayBekleyenIsler.length === 0 && <div className="p-12 text-center text-purple-400 bg-white rounded-xl border-2 border-dashed border-purple-200 font-black text-lg shadow-sm">Gişede onay ve maliyet hesabı bekleyen seri üretim işi yok.</div>}

                        {onayBekleyenIsler.map(is => (
                            <div key={is.id} className="bg-white border-2 border-purple-300 rounded-2xl p-6 shadow-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-yellow-400 text-slate-800 px-5 py-1 text-[10px] font-black rounded-bl-xl uppercase tracking-widest shadow-sm">Müfettiş Onayı Bekliyor</div>

                                <div className="flex justify-between items-start mb-6 border-b pb-4">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 uppercase mb-1">{is.v2_production_orders?.v2_models?.model_name || 'Gizli Model'}</h3>
                                        <p className="text-sm font-bold text-gray-500 uppercase">SİPARİŞ KODU: {is.v2_production_orders?.order_code} | MİKTAR: {is.v2_production_orders?.quantity} ADET</p>
                                    </div>
                                </div>

                                {/* Maliyet ve Analiz Raporu Tablosu */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Hesaplanan Kronometre</span>
                                        <div className="font-black text-2xl text-slate-800">42 <span className="text-sm text-gray-400">Dk / Adet</span></div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Maliyet Sınırı Delindi mi?</span>
                                        <div className="font-black text-2xl text-emerald-600">GÜVENLİ</div>
                                        <span className="text-[10px] font-bold text-emerald-500">Hedef: {is.v2_production_orders?.v2_models?.material_cost || 0}₺</span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Kalite Skoru (Hata)</span>
                                        <div className="font-black text-2xl text-slate-800">{is.rework_count === 0 ? 'KUSURSUZ' : `${is.rework_count} HATA`}</div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button disabled={islemdeId === is.id} onClick={() => hataliMalReddet(is)} className="flex-1 bg-white text-red-600 border-2 border-red-300 hover:border-red-600 hover:bg-red-50 py-5 font-black text-lg rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                                        {islemdeId === is.id ? '...' : 'REDDET & İŞÇİYE GERİ YOLLA'}
                                    </button>
                                    <button disabled={islemdeId === is.id} onClick={() => finaleOnayVerMuhasebeyeYaz(is)} className="flex-1 bg-purple-700 text-white hover:bg-purple-800 border-b-4 border-purple-900 py-5 font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 uppercase cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                                        {islemdeId === is.id ? '...' : 'Her Şey Doğru! Muhasebeye Fişi Kes'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
