// @ts-nocheck
'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { FileText, CheckSquare, Activity, BarChart3, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { telegramBildirim } from '@/lib/utils';
import {
    imalatMainTeknikFoyleriGetir,
    imalatMainTeknikFoyKaydet,
    imalatMainUretimeFirlat,
    imalatMainSahadakiIslerGetir,
    imalatMainPersonelGetir,
    imalatMainIsBaslat,
    imalatMainArizaBildir,
    imalatMainIsBitir,
    imalatMainOnayBekleyenGetir,
    imalatMainFinaleOnayVer,
    imalatMainHataliReddet,
    imalatMainKanalKur,
    imalatMainKanalIptal
} from '../services/imalatMainApi';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import NextLink from 'next/link';

// Alt Sekmeler
import TeknikGorusTab from './tabs/TeknikGorusTab';
import ModelhaneTab from './tabs/ModelhaneTab';
import UretimHattiTab from './tabs/UretimHattiTab';
import MaliyetMuhasebeTab from './tabs/MaliyetMuhasebeTab';

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
    const [islemdeId, setIslemdeId] = useState(null); // [SPAM ZIRHI]

    // =========================================================================
    // 1. PENCERE: TEKNİK GÖRÜŞ & ÜRÜN KABUL
    /** @type {[any[], any]} */
    const [teknikFoyler, setTeknikFoyler] = useState([]);
    /** @type {[any, any]} */
    const [yeniFoy, setYeniFoy] = useState({ model_name: '', orjinal_gorsel_url: '', maliyet_siniri_tl: '', zorunlu_kumas_miktari_mt: '', esneme_payi_yuzde: '' });

    // =========================================================================
    // 2. PENCERE: MODELHANE & İŞLEM SIRASI
    /** @type {[any, any]} */
    const [seciliModel, setSeciliModel] = useState(null);
    /** @type {[any[], any]} */
    const [islemAdimlari, setIslemAdimlari] = useState([]);
    /** @type {[any, any]} */
    const [yeniAdim, setYeniAdim] = useState({ islem_adi: '', ideal_sure_dk: '', zorluk_derecesi: 5.0 });
    const [videoKayitAktif, setVideoKayitAktif] = useState(false);
    const [uretimAdeti, setUretimAdeti] = useState('');

    // =========================================================================
    // 3. PENCERE: ÜRETİM (BAND/FASON) VE PERSONEL GİRDİLERİ
    /** @type {[any[], any]} */
    const [sahadakiIsler, setSahadakiIsler] = useState([]);
    /** @type {[any[], any]} */
    const [personeller, setPersoneller] = useState([]);

    // =========================================================================
    // 4. PENCERE: MALİYET RAPORU, ANALİZ VE MUHASEBE
    /** @type {[any[], any]} */
    const [onayBekleyenIsler, setOnayBekleyenIsler] = useState([]);

    useEffect(() => {
        const jwtGecerli = !!document.cookie.includes('sb47_jwt_token') || !!document.cookie.includes('sb47_auth_session');
        const isYetkili = kullanici?.grup === 'tam' || kullanici?.grup === 'uretim' || jwtGecerli;
        setYetkiliMi(isYetkili);

        let kanalGenel;
        const baslatKanal = () => {
            if (isYetkili && !document.hidden) {
                kanalGenel = imalatMainKanalKur(
                    () => { if (mainTab === 'uretim') yukleSahadakiIsler(); else if (mainTab === 'maliyet_muhasebe') yukleOnayBekleyenIsler(); },
                    () => { if (mainTab === 'teknik_gorus' || mainTab === 'modelhane') yukleTeknikFoyler(); }
                );
            }
        };

        const durdurKanal = () => { imalatMainKanalIptal(kanalGenel); kanalGenel = null; };

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
            if (mainTab === 'teknik_gorus' || mainTab === 'modelhane') yukleTeknikFoyler();
            else if (mainTab === 'uretim') { Promise.allSettled([yukleSahadakiIsler(), yuklePersoneller()]); }
            else if (mainTab === 'maliyet_muhasebe') yukleOnayBekleyenIsler();
        }

        document.addEventListener('visibilitychange', handleVisibility);
        return () => { durdurKanal(); document.removeEventListener('visibilitychange', handleVisibility); };
    }, [mainTab, kullanici?.id, kullanici?.grup]);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    // --- 1. PENCERE FONKSİYONLARI ---
    const timeoutPromise = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 saniye)')), 10000));
    const yukleTeknikFoyler = async () => {
        try {
            const res = await imalatMainTeknikFoyleriGetir(timeoutPromise);
            if (res.error) throw res.error;
            if (res.data) setTeknikFoyler(res.data);
        } catch (error) {
            if (error.message?.includes('fetch') || !navigator.onLine) showMessage('İnternet Yok: Sistem çevrimdışı önbellekten okuyabiliyor.', 'error');
            else showMessage('Ağ hatası: ' + error.message, 'error');
        }
    };

    const teknikFoyKaydet = async () => {
        if (!yeniFoy.model_name.trim() || !yeniFoy.maliyet_siniri_tl) return showMessage('Model Adı ve Maliyet Sınırı zorunludur! İnisiyatif kullanılamaz.', 'error');
        setLoading(true);
        try {
            const { offline } = await imalatMainTeknikFoyKaydet(yeniFoy);
            showMessage(offline ? '⚡ ÇEVRİMDIŞI: TEKNİK FÖY KAYIT İŞLEMİ KUYRUĞA ALINDI!' : 'FİRMADAN GELEN MODEL "TEKNİK FÖY" OLARAK B1 KASASINA ATILDI!');
            setYeniFoy({ model_name: '', orjinal_gorsel_url: '', maliyet_siniri_tl: '', zorunlu_kumas_miktari_mt: '', esneme_payi_yuzde: '' });
            telegramBildirim(`📁 YENİ TEKNİK FÖY AÇILDI!\nModel: ${yeniFoy.model_name.trim()}\nLimit: ${yeniFoy.maliyet_siniri_tl}₺`);
            if (!offline) yukleTeknikFoyler();
        } catch (error) { showMessage(error.message, 'error'); }
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
            const modKodu = seciliModel.b1_model_taslaklari?.model_kodu || 'BİLİNMİYOR';
            await imalatMainUretimeFirlat(seciliModel, islemAdimlari, uretimAdeti);
            showMessage(`İŞLEMLER ONAYLANDI! ${parseInt(uretimAdeti)} Adet Üretim Bandına fırlatıldı!`);
            telegramBildirim(`🚀 SERİ ÜRETİM BAŞLADI!\nModel: ${modKodu}\nAtanan İlk Adım: ${islemAdimlari[0].islem_adi}\nMiktar: ${parseInt(uretimAdeti)} Adet`);
            setIslemAdimlari([]); setSeciliModel(null); setUretimAdeti(''); setVideoKayitAktif(false);
            yukleTeknikFoyler();
        } catch (error) {
            if (!navigator.onLine || error.message?.includes('fetch')) showMessage('İnternet Yok: Sistem üretim bandı işlemini çevrimdışı kuyruğa alamıyor.', 'error');
            else showMessage('Bağlantı veya Yetki Hatası: ' + error.message, 'error');
        }
        setLoading(false);
    };

    // --- 3. PENCERE FONKSİYONLARI ---
    const yukleSahadakiIsler = async () => {
        try {
            const res = await imalatMainSahadakiIslerGetir(timeoutPromise);
            if (res.error) throw res.error;
            if (res.data) setSahadakiIsler(res.data);
        } catch (error) {
            if (error.message?.includes('fetch') || !navigator.onLine) showMessage('Çevrimdışı Mod.', 'error');
            else showMessage('Hata: ' + error.message, 'error');
        }
    };

    const yuklePersoneller = async () => {
        try {
            const res = await imalatMainPersonelGetir(timeoutPromise);
            if (res.error) throw res.error;
            if (res.data) setPersoneller(res.data);
        } catch (error) { showMessage('Personel listesi hatası: ' + error.message, 'error'); }
    };

    const sahadakiIsiBaslat = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            const { offline } = await imalatMainIsBaslat(id);
            showMessage(offline ? '⚡ ÇEVRİMDIŞI: İş başlatma sıraya alındı.' : 'SAHA: Kronometre çalışmaya başladı. İşçinin primi/maliyeti hesaplanıyor.');
            if (!offline) telegramBildirim(`⏱️ ÜRETİM: Kronometre Başlatıldı. Bant çalışıyor.`);
            if (!offline) yukleSahadakiIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const sahadakiArizayiBildir = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            const { offline } = await imalatMainArizaBildir(id);
            showMessage(offline ? '⚡ ÇEVRİMDIŞI: Arıza bildirimi sıraya alındı.' : 'VİCDAN-ADALET: Arıza(Duruş) bildirildi. İşçiden zarar kesilmeyecek, sisteme yazılacak.', 'error');
            if (!offline) telegramBildirim(`⚠️ ÜRETİM DURDU!\nMakina Arızası veya Gecikme Bildirildi.`);
            if (!offline) yukleSahadakiIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const sahadakiIsiBitir = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            const { offline } = await imalatMainIsBitir(id);
            showMessage(offline ? '⚡ ÇEVRİMDIŞI: İş bitirme sıraya alındı.' : 'SAHA: İş Bitti! Analiz ve Onay için 4. Pencereye (Maliye/Karargah) yansıdı.');
            if (!offline) telegramBildirim(`✅ ÜRETİM BANDI: Bir operasyon tamamlandı!\nMüfettiş Onayı ve Analiz Bekleniyor.`);
            if (!offline) yukleSahadakiIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    // --- 4. PENCERE FONKSİYONLARI ---
    const yukleOnayBekleyenIsler = async () => {
        try {
            const res = await imalatMainOnayBekleyenGetir(timeoutPromise);
            if (res.error) throw res.error;
            if (res.data) setOnayBekleyenIsler(res.data);
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
    };

    const finaleOnayVerMuhasebeyeYaz = async (islem) => {
        if (islemdeId === islem.id) return;
        setIslemdeId(islem.id);
        try {
            const { offline } = await imalatMainFinaleOnayVer(islem);
            showMessage(offline ? '⚡ ÇEVRİMDIŞI: Nihai onay Kuyruğa alındı. İnternet gelince malzemenin maliyeti hesaplanacaktır.' : `MÜFETTİŞ: Her şey kusursuz. Operasyon maliyeti (₺) MUHASEBE süzgecinden geçti. Kasa'ya +Net Değer olarak yazıldı!`);
            if (!offline) telegramBildirim(`📊 KALİTE VE MALİYET ONAYLANDI: Kusursuz üretim Muhasebe'ye işlendi!`);
            if (!offline) yukleOnayBekleyenIsler();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const hataliMalReddet = async (is) => {
        if (islemdeId === is.id) return;
        setIslemdeId(is.id);
        try {
            const { offline } = await imalatMainHataliReddet(is);
            showMessage(offline ? '⚡ ÇEVRİMDIŞI: Ret kararı kuyruğa alındı' : 'MÜFETTİŞ: Hatalı Dikim Tespit Edildi! (FPY Düştü). İşlem Fasona/Ustaya "Tekrar Dik" diye geri fırlatıldı.', 'error');
            if (!offline) telegramBildirim(`🚫 KALİTE REDDİ! Üretilen mal kusurlu. Revizyona (Tamire) gönderildi. Fire maliyeti hesaplanıyor.`);
            if (!offline) yukleOnayBekleyenIsler();
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
                    {message.type === 'error' ? <span className="text-red-500 text-xl font-black">X</span> : <span className="text-green-500 text-xl font-black">✓</span>}
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

            <div className="transition-all">
                {mainTab === 'teknik_gorus' && (
                    <TeknikGorusTab isAR={isAR} yeniFoy={yeniFoy} setYeniFoy={setYeniFoy} teknikFoyKaydet={teknikFoyKaydet} loading={loading} teknikFoyler={teknikFoyler} />
                )}
                {mainTab === 'modelhane' && (
                    <ModelhaneTab
                        isAR={isAR} seciliModel={seciliModel} setSeciliModel={setSeciliModel} teknikFoyler={teknikFoyler}
                        uretimAdeti={uretimAdeti} setUretimAdeti={setUretimAdeti} videoKayitAktif={videoKayitAktif} setVideoKayitAktif={setVideoKayitAktif}
                        yeniAdim={yeniAdim} setYeniAdim={setYeniAdim} islemAdimlari={islemAdimlari} adimEkle={adimEkle} adimSil={adimSil}
                        uretimBandiVeyaFasonaFirlat={uretimBandiVeyaFasonaFirlat} loading={loading}
                    />
                )}
                {mainTab === 'uretim' && (
                    <UretimHattiTab
                        isAR={isAR} imalatGorunum={imalatGorunum} setImalatGorunum={setImalatGorunum} sahadakiIsler={sahadakiIsler}
                        personeller={personeller} islemdeId={islemdeId} sahadakiIsiBaslat={sahadakiIsiBaslat}
                        sahadakiArizayiBildir={sahadakiArizayiBildir} sahadakiIsiBitir={sahadakiIsiBitir}
                    />
                )}
                {mainTab === 'maliyet_muhasebe' && (
                    <MaliyetMuhasebeTab
                        isAR={isAR} onayBekleyenIsler={onayBekleyenIsler} islemdeId={islemdeId}
                        finaleOnayVerMuhasebeyeYaz={finaleOnayVerMuhasebeyeYaz} hataliMalReddet={hataliMalReddet}
                    />
                )}
            </div>
        </div>
    );
}
