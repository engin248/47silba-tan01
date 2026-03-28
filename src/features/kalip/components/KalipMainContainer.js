'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Lock } from 'lucide-react';

import { telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

import {
    modellerVeTrendleriGetir, kaliplarVeModelleriGetir,
    modelTaslakKaydet, kalipPastalKaydet,
    kalipTabloElemaniSil, kalipKanaliKur
} from '../services/kalipApi';

import KalipUstPanel from './KalipUstPanel';
import KalipModelTaslakListesi from './KalipModelTaslakListesi';
import KalipPastalListesi from './KalipPastalListesi';
import KalipModelFormu from './KalipModelFormu';
import KalipPastalFormu from './KalipPastalFormu';

const BOSH_MODEL = { id: null, model_kodu: '', model_adi: '', model_adi_ar: '', trend_id: '', hedef_kitle: 'kadin', sezon: 'yaz', aciklama: '' };
const BOSH_KALIP = { id: null, model_id: '', kalip_adi: '', bedenler: ['S', 'M', 'L', 'XL'], pastal_boyu_cm: '', pastal_eni_cm: '', fire_orani_yuzde: '5', versiyon: 'v1.0', kalip_dosya_url: '' };

export default function KalipMainContainer() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);

    const [sekme, setSekme] = useState('modeller');
    const [modeller, setModeller] = useState([]);
    const [kaliplar, setKaliplar] = useState([]);
    const [trendler, setTrendler] = useState([]);

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
        const baslatKanal = () => { if (erisebilir && !document.hidden) { kanal = kalipKanaliKur(yukle); } };
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
                setModeller(data.modeller); setTrendler(data.trendler);
            } else {
                const data = await Promise.race([kaliplarVeModelleriGetir(), timeout]);
                setKaliplar(data.kaliplar); setModeller(data.modeller);
            }
        } catch (error) { goster('Bağlantı Hatası: ' + error.message, 'error'); }
        setLoading(false);
    };

    const kaydetModel = async () => {
        if (!formModel.model_kodu.trim() || formModel.model_kodu.length > 50) return goster('Model kodu zorunlu ve en fazla 50 karakter olmalı!', 'error');
        if (!formModel.model_adi.trim() || formModel.model_adi.length > 200) return goster('Model adı zorunlu ve en fazla 200 karakter olmalı!', 'error');
        setLoading(true);
        try {
            const result = await modelTaslakKaydet(formModel);
            if (result.isUpdate) { goster('✅ Model güncellendi!'); }
            else { goster('✅ Model taslağı oluşturuldu!'); telegramBildirim(`📐 YENİ MODEL TASLAĞI\nKod: ${formModel.model_kodu.toUpperCase()}\nAdı: ${formModel.model_adi}\nSezon: ${formModel.sezon}\nİlk Model Taslağı sisteme işlendi.`); }
            setFormModel(BOSH_MODEL); setFormAcik(false); yukle();
        } catch (error) {
            if (!navigator.onLine || error.message.includes('fetch')) {
                await cevrimeKuyrugaAl({ tablo: 'b1_model_taslaklari', islem_tipi: 'INSERT', veri: { ...formModel, model_kodu: formModel.model_kodu.toUpperCase().trim(), durum: 'taslak' } });
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
            if (result.isUpdate) { goster('✅ Kalıp güncellendi!'); }
            else { goster('✅ Kalıp kaydedildi!'); telegramBildirim(`📏 YENİ KALIP\nKalıp: ${formKalip.kalip_adi}\nBoyut: ${formKalip.pastal_boyu_cm}x${formKalip.pastal_eni_cm}cm\nKalıp kaydı eklendi.`); }
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
            return { tekil: m2.toFixed(3), toplam: total.toFixed(3) };
        }
        return { tekil: '—', toplam: '—' };
    };

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

                {/* BAŞLIK VE SEKME YÖNETİMİ PANELİ */}
                <KalipUstPanel sekme={sekme} setSekme={setSekme} formAcik={formAcik} setFormAcik={setFormAcik} modellerSayisi={modeller.length} kaliplarSayisi={kaliplar.length} />

                {/* MESAJ */}
                {mesaj.text && (
                    <div className={`flex items-center gap-3 px-4 py-3 mb-6 rounded-lg font-bold text-xs uppercase tracking-widest border border-l-4 ${mesaj.type === 'error' ? 'border-rose-500/50 border-l-rose-500 bg-rose-500/10 text-rose-400' : 'border-emerald-500/50 border-l-emerald-500 bg-emerald-500/10 text-emerald-400'}`}>
                        {mesaj.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />} {mesaj.text}
                    </div>
                )}

                {/* FORMLAR */}
                {formAcik && sekme === 'modeller' && (
                    <KalipModelFormu formModel={formModel} setFormModel={setFormModel} trendler={trendler} setFormAcik={setFormAcik} kaydetModel={kaydetModel} loading={loading} />
                )}

                {formAcik && sekme === 'kaliplar' && (
                    <KalipPastalFormu formKalip={formKalip} setFormKalip={setFormKalip} modeller={modeller} setFormAcik={setFormAcik} kaydetKalip={kaydetKalip} loading={loading} metrajHesap={metrajHesap} />
                )}

                {/* LİSTELER */}
                {sekme === 'modeller' && (
                    <KalipModelTaslakListesi modeller={modeller} loading={loading} sil={sil} islemdeId={islemdeId} setFormModel={setFormModel} setSekme={setSekme} setFormAcik={setFormAcik} />
                )}

                {sekme === 'kaliplar' && (
                    <KalipPastalListesi kaliplar={kaliplar} loading={loading} sil={sil} islemdeId={islemdeId} setFormKalip={setFormKalip} setSekme={setSekme} setFormAcik={setFormAcik} />
                )}

            </div>
        </div>
    );
}
