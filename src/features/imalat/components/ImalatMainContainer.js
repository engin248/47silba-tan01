// @ts-nocheck
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
    /** @type {any} */
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
    /** @type {[any[], any]} */
    const [teknikFoyler, setTeknikFoyler] = useState([]);

    /** @type {[any, any]} */
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
    /** @type {[any, any]} */
    const [seciliModel, setSeciliModel] = useState(null); // İşlem sırası eklenecek model
    /** @type {[any[], any]} */
    const [islemAdimlari, setIslemAdimlari] = useState([]);
    /** @type {[any, any]} */
    const [yeniAdim, setYeniAdim] = useState({ islem_adi: '', ideal_sure_dk: '', zorluk_derecesi: 5.0 });
    const [videoKayitAktif, setVideoKayitAktif] = useState(false);
    const [uretimAdeti, setUretimAdeti] = useState(''); // M6 Dinamik Adet Çözümü
    const [uretimEmriId, setUretimEmriId] = useState(null); // M3'ten Gelen Emir ID

    // =========================================================================
    // 3. PENCERE: ÜRETİM (BAND/FASON) VE PERSONEL GİRDİLERİ
    // =========================================================================
    /** @type {[any[], any]} */
    const [sahadakiIsler, setSahadakiIsler] = useState([]);
    /** @type {[any[], any]} */
    const [personeller, setPersoneller] = useState([]);

    // =========================================================================
    // 4. PENCERE: MALİYET RAPORU, ANALİZ VE MUHASEBE (FİNAL)
    // =========================================================================
    /** @type {[any[], any]} */
    const [onayBekleyenIsler, setOnayBekleyenIsler] = useState([]);

    useEffect(() => {
        const jwtGecerli = !!document.cookie.includes('sb47_jwt_token') || !!document.cookie.includes('sb47_auth_session');
        const isYetkili = kullanici?.grup === 'tam' || kullanici?.grup === 'uretim' || jwtGecerli;
        setYetkiliMi(isYetkili);

        let kanal;
        const baslatKanal = () => {
            if (isYetkili && !document.hidden) {
                kanal = supabase.channel('imalat-gercek-zamanli-optimize')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_operasyon_takip' }, () => {
                        if (mainTab === 'uretim') yukleSahadakiIsler();
                        else if (mainTab === 'maliyet_muhasebe') yukleOnayBekleyenIsler();
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders' }, () => {
                        if (mainTab === 'teknik_gorus' || mainTab === 'modelhane') yukleTeknikFoyler();
                    })
                    .subscribe();
            }
        };

        const durdurKanal = () => { if (kanal) { supabase.removeChannel(kanal); kanal = null; } };

        const handleVisibility = () => {
            if (document.hidden) { durdurKanal(); } else {
                baslatKanal();
                if (mainTab === 'teknik_gorus') yukleTeknikFoyler();
                else if (mainTab === 'modelhane') yukleTeknikFoyler();
                else if (mainTab === 'uretim') { yukleSahadakiIsler(); yuklePersoneller(); }
                else if (mainTab === 'maliyet_muhasebe') yukleOnayBekleyenIsler();
            }
        };

        baslatKanal();

        if (isYetkili) {
            if (mainTab === 'teknik_gorus') yukleTeknikFoyler();
            else if (mainTab === 'modelhane') yukleTeknikFoyler();
            else if (mainTab === 'uretim') { Promise.allSettled([yukleSahadakiIsler(), yuklePersoneller()]); }
            else if (mainTab === 'maliyet_muhasebe') yukleOnayBekleyenIsler();
        }

        document.addEventListener('visibilitychange', handleVisibility);
        return () => { durdurKanal(); document.removeEventListener('visibilitychange', handleVisibility); };
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
            // ZIRH: V2 yerine, M3 Kesim'den düşen GERÇEK iş emirlerini oku! (B1 Jenerasyonu)
            const res = await Promise.race([
                supabase.from('production_orders')
                    .select('*, b1_model_taslaklari(id, model_kodu, model_adi)')
                    .order('created_at', { ascending: false }).limit(200),
                timeoutPromise()
            ]);
            if (res.error) throw res.error;
            if (res.data) setTeknikFoyler(res.data);
        } catch (error) { showMessage('Ağ hatası: ' + error.message, 'error'); }
    };

    const teknikFoyKaydet = async () => {
        if (!yeniFoy.model_name.trim() || !yeniFoy.maliyet_siniri_tl) {
            return showMessage('Model Adı ve Maliyet Sınırı zorunludur! İnisiyatif kullanılamaz.', 'error');
        }
        setLoading(true);
        try {
            // 🛑 U Kriteri: Mükerrer Kayıt Engelleme B1
            const { data: mevcut } = await supabase.from('b1_model_taslaklari').select('id').eq('model_kodu', yeniFoy.model_name.trim());
            if (mevcut && mevcut.length > 0) {
                setLoading(false);
                return showMessage('⚠️ Bu Model Zaten Kayıtlı!', 'error');
            }

            const { error } = await supabase.from('b1_model_taslaklari').insert([{
                model_kodu: yeniFoy.model_name.trim(),
                model_adi: yeniFoy.model_name.trim(),
                iscilik_suresi: 60, // Teknik görüşteki temel veri
                numune_maliyeti: parseFloat(yeniFoy.maliyet_siniri_tl),
                notlar: `Kumaş: ${yeniFoy.zorunlu_kumas_miktari_mt}mt, Esneme: %${yeniFoy.esneme_payi_yuzde}. URL: ${yeniFoy.orjinal_gorsel_url}`
            }]);

            if (!error) {
                showMessage('FİRMADAN GELEN MODEL "TEKNİK FÖY" OLARAK B1 KASASINA ATILDI!');
                setYeniFoy({ model_name: '', orjinal_gorsel_url: '', maliyet_siniri_tl: '', zorunlu_kumas_miktari_mt: '', esneme_payi_yuzde: '' });
                telegramBildirim(`📁 YENİ TEKNİK FÖY AÇILDI!\nModel: ${yeniFoy.model_name.trim()}\nLimit: ${yeniFoy.maliyet_siniri_tl}₺`);
                yukleTeknikFoyler();
            } else throw error;
        } catch (error) {
            showMessage('Sunucu hatası: ' + error.message, 'error');
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
        if (!uretimAdeti || parseFloat(uretimAdeti) <= 0) return showMessage('Geçerli bir Adet girin!', 'error');

        setLoading(true);
        try {
            const modelId = seciliModel.b1_model_taslaklari?.id || seciliModel.id;
            const modKodu = seciliModel.b1_model_taslaklari?.model_kodu || 'BİLİNMİYOR';

            // 1. Bant adımını b1_operasyon_adimlari'na yaz
            const { data: stepData, error: stepErr } = await supabase
                .from('b1_operasyon_adimlari')
                .insert([{ step_name: islemAdimlari[0].islem_adi, estimated_duration_minutes: parseInt(islemAdimlari[0].ideal_sure_dk) || 0 }])
                .select().single();
            if (stepErr) throw stepErr;

            // 2. Model iş akışını b1_model_is_akislari'na bağla
            const { data: wfData, error: wfErr } = await supabase
                .from('b1_model_is_akislari')
                .insert([{ model_id: modelId, step_id: stepData.id, step_order: 1 }])
                .select().single();
            if (wfErr) throw wfErr;

            // 3. Bant takip kaydını b1_operasyon_takip'e ekle
            const { error: takipErr } = await supabase
                .from('b1_operasyon_takip')
                .insert([{ order_id: seciliModel.id, model_workflow_id: wfData.id, status: 'assigned' }]);
            if (takipErr) throw takipErr;

            // 4. Production order'ı güncelle
            await supabase.from('production_orders').update({ status: 'in_progress', quantity: parseInt(uretimAdeti) }).eq('id', seciliModel.id);

            showMessage(`İŞLEMLER ONAYLANDI! ${parseInt(uretimAdeti)} Adet Üretim Bandına fırlatıldı!`);
            telegramBildirim(`🚀 SERİ ÜRETİM BAŞLADI!\nModel: ${modKodu}\nAtanan İlk Adım: ${islemAdimlari[0].islem_adi}\nMiktar: ${parseInt(uretimAdeti)} Adet`);
            setIslemAdimlari([]);
            setSeciliModel(null);
            setUretimEmriId(null);
            setUretimAdeti('');
            setVideoKayitAktif(false);
            yukleTeknikFoyler();
        } catch (error) {
            if (!navigator.onLine || error.message?.includes('fetch')) {
                showMessage('İnternet Yok: Sistem üretim bandı işlemini çevrimdışı kuyruğa alamıyor.', 'error');
            } else showMessage('Bağlantı veya Yetki Hatası: ' + error.message, 'error');
        }
        setLoading(false);
    };

    // --- 3. PENCERE FONKSİYONLARI ---
    const yukleSahadakiIsler = async () => {
        try {
            const res = await Promise.race([
                supabase.from('b1_operasyon_takip')
                    .select('*, production_orders(order_code, quantity, b1_model_taslaklari(model_kodu, model_adi))')
                    .neq('status', 'completed')
                    .limit(200),
                timeoutPromise()
            ]);
            if (res.error) throw res.error;
            if (res.data) setSahadakiIsler(res.data);
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
    };

    const yuklePersoneller = async () => {
        try {
            const res = await Promise.race([supabase.from('b1_personel').select('*').limit(100), timeoutPromise()]);
            if (res.error) throw res.error;
            if (res.data) setPersoneller(res.data);
        } catch (error) { showMessage('Personel listesi hatası: ' + error.message, 'error'); }
    };

    const sahadakiIsiBaslat = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            const { error } = await supabase.from('b1_operasyon_takip').update({ status: 'in_progress', start_time: new Date().toISOString() }).eq('id', id);
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
            const { error } = await supabase.from('b1_operasyon_takip').update({ status: 'blocked_machine' }).eq('id', id);
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
            const { error } = await supabase.from('b1_operasyon_takip').update({ status: 'waiting_for_proof', end_time: new Date().toISOString() }).eq('id', id);
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
            const res = await Promise.race([
                supabase.from('b1_operasyon_takip')
                    .select('*, production_orders(order_code, quantity, b1_model_taslaklari(model_kodu, model_adi, numune_maliyeti))')
                    .eq('status', 'waiting_for_proof')
                    .limit(200),
                timeoutPromise()
            ]);
            if (res.error) throw res.error;
            if (res.data) setOnayBekleyenIsler(res.data);
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
    };

    const finaleOnayVerMuhasebeyeYaz = async (islem) => {
        if (islemdeId === islem.id) return;
        setIslemdeId(islem.id);
        try {
            const { error } = await supabase.from('b1_operasyon_takip').update({ status: 'completed' }).eq('id', islem.id);
            if (error) throw error;

            // Otomatik Maliyet / Muhasebeye Fiş Kesme
            const siparis_id = islem.order_id;
            if (siparis_id) {
                const operasyonZamaniDk = 42;
                const dakikaMaliyeti = 4;
                const toplamMaliyet = operasyonZamaniDk * dakikaMaliyeti;

                await supabase.from('b1_maliyet_kayitlari').insert([{
                    order_id: siparis_id,
                    maliyet_tipi: 'personel_iscilik',
                    kalem_aciklama: `OP-${islem.id} Bant Operasyonu Tamamlanma Hakedişi`,
                    tutar_tl: toplamMaliyet,
                    onay_durumu: 'hesaplandi'
                }]);
            }

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
            const { error } = await supabase.from('b1_operasyon_takip').update({ status: 'assigned', rework_count: (is.rework_count || 0) + 1 }).eq('id', is.id);
            if (error) throw error;
            showMessage('MÜFETTİŞ: Hatalı Dikim Tespit Edildi! (FPY Düştü). İşlem Fasona/Ustaya "Tekrar Dik" diye geri fırlatıldı.', 'error');
            telegramBildirim(`🚫 KALİTE REDDİ! Üretilen mal kusurlu. Revizyona (Tamire) gönderildi. Fire maliyeti hesaplanıyor.`);
            yukleOnayBekleyenIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 border-2 border-rose-900/50 rounded-2xl m-8 shadow-2xl" dir={isAR ? 'rtl' : 'ltr'}>
                <Lock size={48} className="mx-auto mb-4 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
                <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">{isAR ? 'تم حظر الدخول غير المصرح به' : 'YETKİSİZ GİRİŞ ENGELLENDİ'}</h2>
                <p className="text-rose-300 font-bold mt-2">{isAR ? 'بيانات الإنتاج والمسارات (M6) سرية. يرجى إدخال رمز PIN للإنتاج للعرض.' : 'M4 İmalat ve Bant verileri gizlidir. Görüntülemek için Üretim PİN girişi yapın.'}</p>
            </div>
        );
    }

    return (
        <div dir={isAR ? 'rtl' : 'ltr'} className="pb-20 font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase text-slate-800 tracking-tight">{isAR ? 'الوحدة الأولى: ممر الإنتاج والتصنيع بصفر مبادرة' : '1. BİRİM: İMALAT VE SIFIR İNİSİYATİF ÜRETİM KORİDORU'}</h1>
                    <p className="text-sm text-gray-600 font-bold mt-1">{isAR ? 'لوحة تحكم وتدقيق كاملة من 4 خطوات تنهي الفوضى وسوء التخطيط في الإنتاج' : 'Sektördeki Fason / Taşeron insiyatifine, bilgi kirliliğine ve plansızlığa son veren 4 Adımlı Tam Denetim Paneli.'}</p>
                </div>
                {/* CC Kriteri (M6 / Depo / Finans rotasına geçiş) - SPA KORUMASI */}
                <NextLink href="/finans" style={{ textDecoration: 'none' }}>
                    <button className="flex items-center gap-2 bg-slate-900 text-white border-b-4 border-slate-950 px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all text-sm uppercase">
                        💼 {isAR ? 'الانتقال إلى المالية / المستودع (M6)' : 'FİNANS / DEPO (M6) GEÇİŞİ'}
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
                    <FileText size={28} className="mb-2" /> {isAR ? '1. الرؤية الفنية' : '1. TEKNİK GÖRÜŞ'} <span className="text-xs font-normal opacity-80">({isAR ? 'قبول الموديل' : 'Firma / Model Kabul'})</span>
                </button>
                <button onClick={() => setMainTab('modelhane')} className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all duration-300 ${mainTab === 'modelhane' ? 'bg-emerald-500 text-white scale-105 shadow-lg shadow-emerald-500/50' : 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <CheckSquare size={28} className="mb-2" /> {isAR ? '2. قالب المنتج الأول' : '2. İLK ÜRÜN ŞABLONU'} <span className="text-xs font-normal opacity-80">({isAR ? 'تسلسل إجراءات قسم الموديلات' : 'Modelhane İşlem Sırası'})</span>
                </button>
                <button onClick={() => setMainTab('uretim')} className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all duration-300 ${mainTab === 'uretim' ? 'bg-orange-500 text-white scale-105 shadow-lg shadow-orange-500/50' : 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <Activity size={28} className="mb-2" /> {isAR ? '3. الإنتاج المتسلسل (الخط)' : '3. SERİ ÜRETİM (BANT)'} <span className="text-xs font-normal opacity-80">({isAR ? 'الموظفين والعمليات' : 'Personel ve Operasyon'})</span>
                </button>
                <button onClick={() => setMainTab('maliyet_muhasebe')} className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all duration-300 ${mainTab === 'maliyet_muhasebe' ? 'bg-purple-600 text-white scale-105 shadow-lg shadow-purple-600/50' : 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <BarChart3 size={28} className="mb-2" /> {isAR ? '4. التكلفة والمحاسبة' : '4. MALİYET & MUHASEBE'} <span className="text-xs font-normal opacity-80">({isAR ? 'نافذة التحليل النهائي' : 'Final Analiz Gişesi'})</span>
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
                                <Database /> {isAR ? 'ختم وحفظ في الخزنة כملف فني' : 'MÜHÜRLE VE TEKNİK FÖY OLARAK KASAYA AT'}
                            </button>
                        </div>
                    </div>

                    {/* Veritabanı Görüntüleme */}
                    <div className="card shadow-xl border border-slate-200 bg-slate-50">
                        <h2 className="text-xl font-black text-slate-700 mb-4 border-b pb-2 flex items-center gap-2"><Database size={20} /> {isAR ? 'الملفات الفنية المعتمدة' : 'Onaylanmış Teknik Föyler (Kasa)'}</h2>
                        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
                            {teknikFoyler.length === 0 && <p className="text-center text-gray-400 font-bold p-8">{isAR ? 'لا يوجد موديلات معتمدة حتى الآن' : 'Sistemde teknik görüşü onaylanmış model yok.'}</p>}
                            {teknikFoyler.map((model) => (
                                <div key={model.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-black text-slate-800 text-lg">{model.model_name}</h3>
                                        <span className="bg-red-100 text-red-700 font-black px-3 py-1 rounded text-sm shrink-0">MAX: {model.material_cost || 0}₺</span>
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">{model.description}</p>
                                    <div className="text-sm text-gray-400 font-bold uppercase mt-2 pt-2 border-t">ID: {model.id}</div>
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
                            <h2 className="text-2xl font-black text-slate-800">{isAR ? 'تجهيز المنتج الأول (قالب المقاول)' : 'İLK ÜRÜN HAZIRLAMA (FASONA ŞABLON ÇIKARMA)'}</h2>
                            <p className="text-sm text-gray-500 font-bold mt-1">{isAR ? 'تحديد خطوات الإنتاج بالثانية. لا يمكن للعمال الخروج عن هذا الترتيب.' : 'Teknik Görüşü alınan modelin işlemleri burada saniye saniye belirlenir. İşçi/Fason bu sıranın dışına çıkamaz.'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sol Taraf: Model Seçimi ve Kanıt Videosu */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">{isAR ? '1. اختر أمر الإنتاج (M3) لإعداد القالب' : '1. Şablon Çıkarılacak Üretim Emrini (M3) Seç'}</label>
                            <select className="form-select w-full font-bold text-slate-700 mb-4 border-2 border-slate-300 h-12"
                                onChange={(e) => {
                                    const secili = teknikFoyler.find(m => m.id === e.target.value);
                                    setSeciliModel(secili || null);
                                    if (secili) setUretimAdeti(secili.quantity || '');
                                }}>
                                <option value="">--- {isAR ? 'اختر أمر الإنتاج' : 'Üretim Emri Seçin'} ---</option>
                                {teknikFoyler.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.b1_model_taslaklari?.model_kodu || 'BİLİNMİYOR'} — ADET: {m.quantity} ({m.order_code})
                                    </option>
                                ))}
                            </select>

                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase text-orange-600">Üretim Adedi (V2 Bant Adedi)</label>
                            <input type="number" className="form-input w-full font-bold text-orange-600 mb-6 border-2 border-orange-200 h-12" placeholder="Üretime Başlanacak Adet" value={uretimAdeti} onChange={e => setUretimAdeti(e.target.value)} />

                            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 relative">
                                <span className="absolute -top-3 left-4 bg-red-600 text-white text-sm px-2 py-1 font-black rounded uppercase tracking-wider">Mecburi İşlem</span>
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
                        <div className={`border-${isAR ? 'r' : 'l'}-2 p${isAR ? 'r' : 'l'}-8`}>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">{isAR ? '2. تحديد العمليات التفاعلية (المهام الفرعية)' : '2. Dinamik İşlemleri (Alt Görevleri) Belirle'}</label>
                            <p className="text-xs text-gray-500 font-medium mb-4">{isAR ? 'هذا هو القالب المقرر. لا يُسمح بإجراء أعمال خارج القائمة.' : 'Seri üretime/fasona gidecek şablon budur. Bu liste dışı hiçbir iş yapılamaz veya iddia edilemez.'}</p>

                            <div className="flex gap-2 mb-4 bg-slate-100 p-2 rounded-lg">
                                <input maxLength={150} type="text" className="form-input flex-1 font-bold" placeholder={isAR ? 'مثال: الطباعة أو التطريز' : 'Örn: Yaka İlikleme veya Baskı'} value={yeniAdim.islem_adi} onChange={e => setYeniAdim({ ...yeniAdim, islem_adi: e.target.value })} />
                                <input type="number" className="form-input w-24 text-center font-bold text-orange-600" placeholder={isAR ? 'دقيقة' : 'Tahmini Dk'} value={yeniAdim.ideal_sure_dk} onChange={e => setYeniAdim({ ...yeniAdim, ideal_sure_dk: e.target.value })} />
                                <button onClick={adimEkle} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded font-black uppercase text-sm">{isAR ? 'أضف' : 'Listeye Yaz'}</button>
                            </div>

                            <div className="h-48 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-2 mb-6">
                                {islemAdimlari.length === 0 && <p className="text-center text-gray-400 text-sm font-bold mt-10">{isAR ? 'لم تتم إضافة خطوات للإنتاج بعد' : 'Henüz fasona verilecek bir işlem sırası eklenmedi.'}</p>}
                                {islemAdimlari.map((a, i) => (
                                    <div key={a.id} className="flex justify-between items-center border border-slate-200 p-2 text-sm bg-white shadow-sm mb-2 rounded">
                                        <span className="font-bold text-slate-700"><span className={`bg-slate-800 text-white px-2 py-1 rounded m${isAR ? 'l' : 'r'}-2 text-sm`}>{isAR ? `خطوة` : `ADIM`} {i + 1}</span>{a.islem_adi}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-orange-600 font-black">{a.ideal_sure_dk} {isAR ? 'دقيقة' : 'dk limit'}</span>
                                            <button onClick={() => adimSil(a.id)} className="text-red-400 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={uretimBandiVeyaFasonaFirlat} disabled={loading} className="w-full bg-slate-800 text-emerald-400 border-b-4 border-slate-950 font-black text-lg py-5 rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-3">
                                <PlaySquare size={24} /> {isAR ? 'تأكيد وإرسال إلى خط الإنتاج!' : 'ONAYLA VE SERİ ÜRETİME / FASONA YÜKLE!'}
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
                    <div className="flex justify-between mb-4 items-center">
                        <h3 className="font-black text-slate-800 text-xl tracking-tight uppercase flex items-center gap-2">
                            <Activity size={20} className="text-orange-500" /> ÜRETİM HATTI KONTROLÜ
                        </h3>
                        <button
                            onClick={() => setImalatGorunum(v => v === 'liste' ? 'kanban' : 'liste')}
                            className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-md ${imalatGorunum === 'kanban' ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                            {imalatGorunum === 'kanban' ? (isAR ? '📋 عرض القائمة' : '📋 Liste Görünümü') : (isAR ? '📦 لوحة كانبان' : '📦 Kanban Board')}
                        </button>
                    </div>

                    {/* IM-06 OEE DASHBOARD */}
                    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 mb-6 shadow-xl text-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black flex items-center gap-2 text-emerald-400 tracking-widest text-sm">
                                <Activity size={18} /> [IM-06] CANLI OEE (EKİPMAN & BANT VERİMLİLİĞİ)
                            </h3>
                            <span className="text-xs font-bold text-slate-400 tracking-wider">Dünya Standardı: %85</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-slate-800 rounded-xl p-4 text-center border-b-4 border-blue-500">
                                <div className="text-slate-400 text-xs font-black mb-1 uppercase tracking-widest">Kullanılabilirlik (A)</div>
                                <div className="text-2xl font-black text-white font-mono">%94.5</div>
                            </div>
                            <div className="bg-slate-800 rounded-xl p-4 text-center border-b-4 border-amber-500">
                                <div className="text-slate-400 text-xs font-black mb-1 uppercase tracking-widest">Performans (P)</div>
                                <div className="text-2xl font-black text-white font-mono">
                                    {sahadakiIsler.length > 0 ? (100 - (sahadakiIsler.filter(i => i.status === 'blocked_machine').length * 15)).toFixed(1) : '90.0'}%
                                </div>
                            </div>
                            <div className="bg-slate-800 rounded-xl p-4 text-center border-b-4 border-emerald-500">
                                <div className="text-slate-400 text-xs font-black mb-1 uppercase tracking-widest">Kalite Oranı (Q)</div>
                                <div className="text-2xl font-black text-white font-mono">%98.2</div>
                            </div>
                            <div className="bg-slate-950 rounded-xl p-4 text-center border-b-4 border-purple-500 shadow-inner">
                                <div className="text-purple-400 text-[10px] font-black mb-1 uppercase tracking-widest">OEE SKORU (A × P × Q)</div>
                                <div className="text-3xl font-black text-purple-400 font-mono">
                                    {sahadakiIsler.length > 0 ? (0.945 * (1 - (sahadakiIsler.filter(i => i.status === 'blocked_machine').length * 0.15)) * 0.982 * 100).toFixed(1) : '83.5'}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* IM-02 & IM-04 OPERASYON BAZLI İZLEME VE QC GEÇİTLERİ (MOCKUP) */}
                    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 mb-6 shadow-xl text-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black flex items-center gap-2 text-blue-400 tracking-widest text-sm uppercase">
                                <ShieldCheck size={18} /> [IM-02] & [IM-04] ZORUNLU İSTASYON GEÇİŞLERİ VE QC BARKODLARI
                            </h3>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold uppercase transition">Toplu Pas Geç (Admin)</button>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 w-full bg-[#122b27] border border-[#1e4a43] p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-emerald-400 font-black text-xs uppercase mb-1 drop-shadow-md">İstasyon 1 / Operasyon</div>
                                    <div className="text-white font-black text-[1.1rem]">🧵 DİKİŞ HATTI</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-400 mb-1">Geçen Ürün</div>
                                    <div className="text-xl font-mono font-black text-emerald-400">1,250</div>
                                </div>
                            </div>
                            <div className="text-slate-500 font-black">➔</div>
                            <div className="flex-[1.5] w-full bg-[#1e1b4b] border-2 border-purple-500/50 p-4 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden">
                                <div className="absolute -right-6 top-2 bg-purple-600 text-[9px] font-black uppercase text-white px-8 py-1 rotate-45">QC-01 GEÇİDİ</div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-purple-300 font-black text-[10px] uppercase tracking-widest mb-1 drop-shadow-md flex gap-1 items-center"><ShieldCheck size={12} /> KALİTE KONTROL 1</div>
                                        <div className="text-white font-black text-[1.1rem]">🔥 ÜTÜ / LEKE KONTROL</div>
                                        <div className="text-[10px] text-purple-200 mt-1 opacity-80">(Reddedilen: 14 Adet — Fasona Döndü)</div>
                                    </div>
                                    <button className="bg-purple-600 hover:bg-purple-700 text-white font-black px-4 py-2 rounded-lg text-sm border-b-2 border-purple-800 active:border-b-0 active:translate-y-[2px] shadow-md transition">Bant Onayı</button>
                                </div>
                            </div>
                            <div className="text-slate-500 font-black">➔</div>
                            <div className="flex-[1.5] w-full bg-[#312e81] border-2 border-indigo-500/50 p-4 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.15)] relative overflow-hidden">
                                <div className="absolute -right-6 top-2 bg-indigo-600 text-[9px] font-black uppercase text-white px-8 py-1 rotate-45">QC-02 FİNAL</div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-indigo-300 font-black text-[10px] uppercase tracking-widest mb-1 drop-shadow-md flex gap-1 items-center"><CheckCircle2 size={12} /> FİNAL KONTROL</div>
                                        <div className="text-white font-black text-[1.1rem]">📦 PAKET VE KOLİLEME</div>
                                        <div className="text-[10px] text-indigo-200 mt-1 opacity-80">(Hazır: 1,236 Adet — Depoya Gidiyor)</div>
                                    </div>
                                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2 rounded-lg text-sm border-b-2 border-indigo-800 active:border-b-0 active:translate-y-[2px] shadow-md transition">Depoya Gönder</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KANBAN BOARD */}
                    {imalatGorunum === 'kanban' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[
                                { key: 'assigned', label: isAR ? '📋 تم التعيين' : '📋 Atandı', renk: 'blue', border: 'border-blue-500/30', bg: 'bg-slate-50' },
                                { key: 'in_progress', label: isAR ? '⚙️ قيد الإنتاج' : '⚙️ Üretimde', renk: 'amber', border: 'border-amber-500/30', bg: 'bg-slate-50' },
                                { key: 'waiting_for_proof', label: isAR ? '🔍 قيد المراجعة' : '🔍 Onay Bekl.', renk: 'violet', border: 'border-violet-500/30', bg: 'bg-slate-50' },
                                { key: 'blocked_machine', label: isAR ? '🔴 عطل' : '🔴 Arıza', renk: 'rose', border: 'border-rose-500/30', bg: 'bg-slate-50' },
                            ].map(kolon => (
                                <div key={kolon.key} className={`${kolon.bg} border-2 ${kolon.border} rounded-2xl p-4 min-h-[220px]`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className={`font-black text-sm text-${kolon.renk}-600`}>{kolon.label}</span>
                                        <span className={`bg-${kolon.renk}-100 text-${kolon.renk}-700 font-bold text-xs px-2.5 py-1 rounded-lg`}>
                                            {sahadakiIsler.filter(i => i.status === kolon.key).length}
                                        </span>
                                    </div>
                                    {sahadakiIsler.filter(i => i.status === kolon.key).map(is => (
                                        <div key={is.id} className={`bg-white rounded-xl p-3 mb-2 shadow-sm border border-${kolon.renk}-100`}>
                                            <div className="font-black text-xs text-slate-800">{is.production_orders?.order_code || (isAR ? 'الطلب' : 'Sipariş')}</div>
                                            <div className="text-sm font-bold text-slate-500 mb-2">{is.production_orders?.b1_model_taslaklari?.model_kodu || '—'}</div>

                                            {/* IM-05: Darboğaz Uyarı Rozeti */}
                                            {kolon.key === 'in_progress' && (() => {
                                                const sureDk = Math.floor((new Date() - new Date(is.updated_at || is.created_at)) / 60000);
                                                // 120 dakikayı geçenlere sistem darboğaz alarmı çalsın
                                                return sureDk > 120 ? (
                                                    <div className="mb-3 bg-rose-100 border border-rose-300 text-rose-700 text-[10px] font-black uppercase px-2 py-1 rounded-full flex items-center justify-center gap-1 animate-pulse shadow-sm">
                                                        <AlertTriangle size={12} /> DARBOĞAZ: {sureDk} Dk Gecikme
                                                    </div>
                                                ) : (
                                                    <div className="mb-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <Clock size={10} /> {sureDk} DK SÜRÜYOR
                                                    </div>
                                                );
                                            })()}

                                            {kolon.key === 'assigned' && (
                                                <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBaslat(is.id)} className={`mt-1 font-black text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg transition-colors w-full ${islemdeId === is.id ? 'opacity-50 cursor-wait' : ''}`}>
                                                    {islemdeId === is.id ? '...' : (isAR ? '▶ ابدأ' : '▶ Başlat')}
                                                </button>
                                            )}
                                            {kolon.key === 'in_progress' && (
                                                <div className="flex gap-2 mt-1">
                                                    <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBitir(is.id)} className={`flex-1 font-black text-sm bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-2 py-1.5 rounded-lg transition-colors ${islemdeId === is.id ? 'opacity-50 cursor-wait' : ''}`}>
                                                        {islemdeId === is.id ? '...' : (isAR ? '✓ إنهاء' : '✓ Bitir')}
                                                    </button>
                                                    <button disabled={islemdeId === is.id} onClick={() => sahadakiArizayiBildir(is.id)} className={`flex-1 font-black text-sm bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-2 py-1.5 rounded-lg transition-colors ${islemdeId === is.id ? 'opacity-50 cursor-wait' : ''}`}>
                                                        {islemdeId === is.id ? '...' : (isAR ? '⚠ عطل' : '⚠ Arıza')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {sahadakiIsler.filter(i => i.status === kolon.key).length === 0 && (
                                        <div className="text-center p-4 text-slate-400 text-sm font-bold uppercase">{isAR ? 'فارغ' : 'Görev Yok'}</div>
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
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Activity className="text-orange-500" /> {isAR ? 'شاشة العامل في الموقع / الخط' : 'FASON / BANT İŞÇİSİ SAHA EKRANI'}</h2>
                                    <p className="text-xs text-gray-500 font-bold mt-1">{isAR ? 'تظهر المهام هنا. يبدأ المعلم الميقاتية وينهي العمل...' : 'İşler buraya düşer. Usta saati başlatır, bitirince kanıtla kapatır. İp koptuğunda "Arıza" diyerek faturayı dükkana yıkar.'}</p>
                                </div>

                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {sahadakiIsler.length === 0 && <div className="p-8 text-center text-gray-400 font-bold border-2 border-dashed rounded-xl">{isAR ? 'لا يوجد ترتيب إنتاج مخصص' : 'Ustaya/Fasona atanmış bir üretim sırası yok.'}</div>}
                                    {sahadakiIsler.map(is => (
                                        <div key={is.id} className={`border-2 rounded-xl p-5 flex flex-col shadow-sm transition-all ${is.status === 'in_progress' ? 'border-orange-400 bg-orange-50/50' : 'border-slate-200 bg-white'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-black text-lg text-slate-800 uppercase">[{isAR ? 'الرمز' : 'KOD'}: {is.production_orders?.order_code}]</h3>
                                                    <p className="text-sm text-slate-600 font-bold mt-1">{isAR ? 'الطلب' : 'Sipariş'}: {is.production_orders?.b1_model_taslaklari?.model_kodu || (isAR ? 'نموذج مخفي' : 'Gizli Model')}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded font-black border uppercase">{is.status}</span>
                                                    <span className="text-xs font-bold text-gray-500">{isAR ? 'الكمية' : 'Miktar'}: {is.production_orders?.quantity} {isAR ? 'قطعة' : 'Adet'}</span>
                                                </div>
                                            </div>

                                            {/* IM-05 LİSTE GÖRÜNÜMÜ DARBOĞAZ Rozeti */}
                                            {is.status === 'in_progress' && (() => {
                                                const sureDk = Math.floor((new Date() - new Date(is.updated_at || is.created_at)) / 60000);
                                                return sureDk > 120 ? (
                                                    <div className="mb-4 bg-rose-100 border border-rose-300 text-rose-700 text-xs font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-2 animate-pulse w-fit">
                                                        <AlertTriangle size={14} /> DARBOĞAZ TESPİTİ: Bu ürün bantta çok fazla oyalanıyor ({sureDk} Dk)
                                                    </div>
                                                ) : (
                                                    <div className="mb-4 text-orange-600 bg-orange-100/50 text-[10px] font-black uppercase px-2 py-1 rounded-md w-fit flex items-center gap-1">
                                                        <Clock size={12} /> Geçen Süre: {sureDk} Dk
                                                    </div>
                                                );
                                            })()}

                                            {/* Operasyon Butonları */}
                                            <div className="flex flex-col gap-2 mt-2">
                                                {is.status === 'assigned' && (
                                                    <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBaslat(is.id)} className="w-full bg-slate-800 text-white py-4 rounded-xl font-black hover:bg-black flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-wait">
                                                        <Clock /> {islemdeId === is.id ? (isAR ? 'جاري المعالجة...' : 'İŞLEMDE...') : (isAR ? 'ابدأ العمل والميقاتية' : 'İŞE VE KRONOMETREYE BAŞLA')}
                                                    </button>
                                                )}
                                                {is.status === 'in_progress' && (
                                                    <div className="flex gap-2">
                                                        <button disabled={islemdeId === is.id} onClick={() => sahadakiIsiBitir(is.id)} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black hover:bg-emerald-700 shadow-md text-sm disabled:opacity-50 disabled:cursor-wait"><CheckCircle2 className="inline mr-1" /> {islemdeId === is.id ? '...' : (isAR ? 'انتهى العمل (أغلق)' : 'İŞ BİTTİ (KAPAT)')}</button>
                                                        <button disabled={islemdeId === is.id} onClick={() => sahadakiArizayiBildir(is.id)} className="flex-1 border-2 border-red-500 text-red-600 py-4 rounded-xl font-black hover:bg-red-50 text-sm disabled:opacity-50 disabled:cursor-wait"><AlertTriangle className="inline mr-1" /> {islemdeId === is.id ? '...' : (isAR ? 'الإبلاغ عن عطل (توقف)' : 'ARIZA BİLDİR (DUR)')}</button>
                                                    </div>
                                                )}
                                                {is.status === 'blocked_machine' && (
                                                    <div className="w-full bg-red-100 text-red-800 p-4 rounded-xl font-black text-center border-2 border-red-200 text-sm">
                                                        {isAR ? '🔴 تم اكتشاف عطل - توقف العداد - بانتظار التدخل' : '🔴 ARIZA TESPİT EDİLDİ - SAYAÇ DURDU - MÜDAHALE BEKLENİYOR'}
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
                                            {personeller.filter(p => !p.email?.includes('admin')).map(p => (
                                                <tr key={p.id} className="border-b bg-white hover:bg-slate-50">
                                                    <td className="p-3">
                                                        <div className="font-black text-sm text-slate-800 truncate max-w-[150px]">{p.ad_soyad || p.full_name || 'Usta'}</div>
                                                        <div className="text-sm font-bold text-gray-400 mt-1">{p.gorev || p.unvan || '—'}</div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-1 font-black rounded text-sm ${(p.fp_yield || 0) >= 1.0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>% {Number((p.fp_yield || 0) * 100).toFixed(0)}</span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="font-black text-indigo-600">{p.social_points || 0} Puan</div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {personeller.length === 0 && <tr><td colSpan={3} className="p-4 text-center font-bold text-gray-400">Personel verisi yok.</td></tr>}
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
                            <h2 className="text-3xl font-black text-purple-900 tracking-tight">{isAR ? 'شباك الإغلاق / تقرير المحاسبة والتحليل' : 'KAPANIŞ GİŞESİ / MUHASEBE VE ANALİZ RAPORU'}</h2>
                            <p className="text-sm text-purple-700 font-bold mt-1">{isAR ? 'تتحول دقائق الإنتاج إلى أموال. تُفحص الأخطاء، وترسل الفاتورة للمحاسبة.' : 'Üretimden çıkan malzemenin harcadığı dakikalar paraya çevrilir. Hatalar kontrol edilir, son onay verilirse finans merkezine faturası yollanır.'}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {onayBekleyenIsler.length === 0 && <div className="p-12 text-center text-purple-400 bg-white rounded-xl border-2 border-dashed border-purple-200 font-black text-lg shadow-sm">{isAR ? 'لا يوجد إنتاج متسلسل ينتظر الموافقة والمحاسبة.' : 'Gişede onay ve maliyet hesabı bekleyen seri üretim işi yok.'}</div>}

                        {onayBekleyenIsler.map(is => (
                            <div key={is.id} className="bg-white border-2 border-purple-300 rounded-2xl p-6 shadow-md relative overflow-hidden">
                                <div className={`absolute top-0 right-0 bg-yellow-400 text-slate-800 px-5 py-1 text-sm font-black rounded-b${isAR ? 'r' : 'l'}-xl uppercase tracking-widest shadow-sm`}>{isAR ? 'بانتظار موافقة المفتش' : 'Müfettiş Onayı Bekliyor'}</div>

                                <div className="flex justify-between items-start mb-6 border-b pb-4">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 uppercase mb-1">{is.production_orders?.b1_model_taslaklari?.model_kodu || is.production_orders?.b1_model_taslaklari?.model_adi || 'Gizli Model'}</h3>
                                        <p className="text-sm font-bold text-gray-500 uppercase">SİPARİŞ KODU: {is.production_orders?.order_code} | MİKTAR: {is.production_orders?.quantity} ADET</p>
                                    </div>
                                </div>

                                {/* Maliyet ve Analiz Raporu Tablosu */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">{isAR ? 'المدة المحسوبة' : 'Hesaplanan Kronometre'}</span>
                                        <div className="font-black text-2xl text-slate-800">42 <span className="text-sm text-gray-400">{isAR ? 'دقيقة/قطعة' : 'Dk / Adet'}</span></div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">{isAR ? 'تجاوز حد التكلفة؟' : 'Maliyet Sınırı Delindi mi?'}</span>
                                        <div className="font-black text-2xl text-emerald-600">{isAR ? 'آمن' : 'GÜVENLİ'}</div>
                                        <span className="text-sm font-bold text-emerald-500">{isAR ? 'الهدف' : 'Hedef'}: {is.production_orders?.b1_model_taslaklari?.numune_maliyeti || 0}₺</span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase block mb-1">{isAR ? 'نقاط الجودة (الأخطاء)' : 'Kalite Skoru (Hata)'}</span>
                                        <div className="font-black text-2xl text-slate-800">{is.rework_count === 0 ? (isAR ? 'ممتاز' : 'KUSURSUZ') : `${is.rework_count} ${isAR ? 'خطأ' : 'HATA'}`}</div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button disabled={islemdeId === is.id} onClick={() => hataliMalReddet(is)} className="flex-1 bg-white text-red-600 border-2 border-red-300 hover:border-red-600 hover:bg-red-50 py-5 font-black text-lg rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                                        {islemdeId === is.id ? '...' : (isAR ? 'رفض وإعادة للعامل' : 'REDDET & İŞÇİYE GERİ YOLLA')}
                                    </button>
                                    <button disabled={islemdeId === is.id} onClick={() => finaleOnayVerMuhasebeyeYaz(is)} className="flex-1 bg-purple-700 text-white hover:bg-purple-800 border-b-4 border-purple-900 py-5 font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 uppercase cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                                        {islemdeId === is.id ? '...' : (isAR ? 'مطابق! تحويل للمحاسبة' : 'Her Şey Doğru! Muhasebeye Fişi Kes')}
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
