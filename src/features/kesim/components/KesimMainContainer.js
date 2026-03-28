'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

import { telegramBildirim, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import SilBastanModal from '@/components/ui/SilBastanModal';
import FizikselQRBarkod from '@/lib/components/barkod/FizikselQRBarkod';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

import {
    kesimVerileriniGetir, kesimKaydet, uretimIsEmriOlustur,
    kesimDurumunuGuncelleVeStokDus, kesimSilVeArsivle, kesimKanaliKur
} from '../services/kesimApi';

import KesimUstPanel from './KesimUstPanel';
import KesimFormu from './KesimFormu';
import KesimListesi from './KesimListesi';

const BOSH_KESIM = {
    model_taslak_id: '', pastal_kat_sayisi: '', kesilen_net_adet: '',
    fire_orani: '5', durum: 'kesimde',
    kesimci_adi: '', kesim_tarihi: '', beden_dagilimi: '{}', notlar: '', kumas_topu_no: '', kullanilan_kumas_mt: ''
};

export default function KesimMainContainer() {
    const { kullanici: rawKullanici } = useAuth();
    const kullanici = rawKullanici;
    const { lang } = useLang();
    const isAR = lang === 'ar';

    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [kesimler, setKesimler] = useState([]);
    const [modeller, setModeller] = useState([]);
    const [kumaslar, setKumaslar] = useState([]);

    const [formAcik, setFormAcik] = useState(false);
    const [form, setForm] = useState(BOSH_KESIM);
    const [arama, setArama] = useState('');
    const [filtreDurum, setFiltreDurum] = useState('hepsi');

    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });

    const [barkodAcik, setBarkodAcik] = useState(false);
    const [seciliKesim, setSeciliKesim] = useState(null);
    const [duzenleId, setDuzenleId] = useState(null);
    const [islemdeId, setIslemdeId] = useState(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        let kanal;
        if (erisebilir) kanal = kesimKanaliKur(yukle);
        yukle();
        return () => { if (kanal) kanal.unsubscribe(); };
    }, [kullanici?.id, kullanici?.grup]);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 6000); };
    const timeoutPromise = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 sn)')), 10000));

    const yukle = async () => {
        setLoading(true);
        try {
            const data = await Promise.race([kesimVerileriniGetir(), timeoutPromise()]);
            setKesimler(data.kesimler); setModeller(data.modeller); setKumaslar(data.kumaslar);
        } catch (error) { goster('Bağlantı/Zaman aşımı hatası: ' + error.message, 'error'); }
        setLoading(false);
    };

    const kaydetKesim = async () => {
        if (!form.model_taslak_id) return goster('Model seçmek zorunludur!', 'error');
        if (!form.pastal_kat_sayisi || form.pastal_kat_sayisi <= 0) return goster('Pastal kat sayısı hatalı!', 'error');
        setLoading(true);

        const payload = {
            model_taslak_id: form.model_taslak_id,
            pastal_kat_sayisi: parseInt(form.pastal_kat_sayisi) || 0,
            kesilen_net_adet: parseInt(form.kesilen_net_adet) || 0,
            fire_orani: parseFloat(form.fire_orani) || 0,
            durum: form.durum,
            kesimci_adi: form.kesimci_adi.trim() || null,
            kesim_tarihi: form.kesim_tarihi || null,
            beden_dagilimi: typeof form.beden_dagilimi === 'object' ? JSON.stringify(form.beden_dagilimi) : form.beden_dagilimi,
            notlar: form.notlar.trim() || null,
            kumas_topu_no: form.kumas_topu_no.trim() || null,
        };

        if (!navigator.onLine) {
            cevrimeKuyrugaAl('b1_kesim_operasyonlari', duzenleId ? 'UPDATE' : 'INSERT', { ...payload, id: duzenleId });
            goster('⚠️ İnternet Yok: Kesimhane kayıtları kuyruğa alındı. Wifi gelince merkeze yollanacak.', 'success');
            setForm(BOSH_KESIM); setFormAcik(false); setDuzenleId(null);
            setLoading(false); return;
        }

        try {
            const result = await kesimKaydet(payload, duzenleId);
            if (result.isUpdate) { goster('✅ Kesim güncellendi!'); }
            else {
                const seciliModel = modeller.find(m => m.id === form.model_taslak_id);
                goster('✅ Kesim operasyonu kaydedildi!');
                telegramBildirim(`✂️ YENİ KESİM OPERASYONU\nModel: ${seciliModel?.model_kodu}\nKesimci: ${form.kesimci_adi || '—'}\nPastal: ${form.pastal_kat_sayisi} kat\nNet Adet: ${form.kesilen_net_adet}\nBeden: ${form.beden_dagilimi || '—'}`);
            }
            setForm(BOSH_KESIM); setFormAcik(false); setDuzenleId(null);
            yukle();
        } catch (error) { goster('Hata oluştu: ' + error.message, 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, yeniDurum, model_kodu) => {
        if (islemdeId) return goster('Lütfen önceki işlemin bitmesini bekleyin.', 'error');
        if (!navigator.onLine) return goster('İnternet Yok: Durum güncellemesi sadece online iken yapılabilir!', 'error');
        setIslemdeId('durum_' + id);
        try {
            const sonuc = await kesimDurumunuGuncelleVeStokDus(id, yeniDurum);
            yukle();
            if (yeniDurum === 'tamamlandi') {
                telegramBildirim(`✂️ KESİM TAMAMLANDI\nModel: ${model_kodu} için kesim işlemi tamamlandı. Üretim Bandına (M6) sevke hazır.`);
                if (sonuc.stokDusuldu) telegramBildirim(`📉 M5 KESİM STOK DÜŞÜMÜ\nKumaş Kodu: ${sonuc.kumasKodu}\nDüşülen: ${sonuc.dusulecek} mt\nKalan Stok: ${sonuc.yeniStok} mt`);
            }
        } catch (error) { goster('Durum güncellenemedi!', 'error'); }
        finally { setIslemdeId(null); }
    };

    const isEmriOlustur = async (k) => {
        if (islemdeId) return goster('Lütfen önceki işlemin bitmesini bekleyin.', 'error');
        if (k.durum !== 'tamamlandi') return goster('Sadece tamamlanan kesimler Üretim Bandına (M6) aktarılabilir!', 'error');
        if (!confirm(`"${k.b1_model_taslaklari?.model_kodu}" için Üretim İş Emri oluşturulsun mu?\nAdet: ${k.kesilen_net_adet}`)) return;

        setLoading(true); setIslemdeId('emr_' + k.id);
        try {
            await uretimIsEmriOlustur(k);
            goster(`✅ M6 Üretim İş Emri oluşturuldu! ${k.b1_model_taslaklari?.model_kodu} — ${k.kesilen_net_adet} adet`);
            telegramBildirim(`🔗 M5→M6 KÖPRÜ\nKesimden Üretime: ${k.b1_model_taslaklari?.model_kodu}\nAdet: ${k.kesilen_net_adet}\nİş emri "Bekliyor" olarak açıldı.`);
        } catch (error) { goster('İş emri hatası: ' + error.message, 'error'); }
        setLoading(false); setIslemdeId(null);
    };

    const sil = async (id, m_kodu) => {
        if (islemdeId) return goster('Lütfen önceki işlemin bitmesini bekleyin.', 'error');
        setIslemdeId('sil_' + id);
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici);
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Yetkisiz işlem.', 'error'); }
        if (!confirm('Bu kesim kaydını fiziksel silmek yerine arşive (iptal) kaldırmak istediğinize emin misiniz?')) { setIslemdeId(null); return; }
        try {
            await kesimSilVeArsivle(id, m_kodu, 'Saha Yetkilisi M5');
            yukle(); goster('Kayıt arşive (iptal durumuna) alındı.');
            telegramBildirim(`🗑️ KESİM İPTAL EDİLDİ\n${m_kodu} modeline ait kesim kaydı yönetici onayıyla arşive kaldırıldı.`);
        } catch (error) { goster('Silme/Arşivleme hatası: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const duzenleKesim = (k) => {
        setForm({
            model_taslak_id: k.model_taslak_id || '', pastal_kat_sayisi: String(k.pastal_kat_sayisi || ''),
            kesilen_net_adet: String(k.kesilen_net_adet || ''), fire_orani: String(k.fire_orani || '0'),
            durum: k.durum || 'kesimde', kesimci_adi: k.kesimci_adi || '',
            kesim_tarihi: k.kesim_tarihi || '', beden_dagilimi: k.beden_dagilimi || '{}',
            notlar: k.notlar || '', kumas_topu_no: k.kumas_topu_no || '', kullanilan_kumas_mt: k.kullanilan_kumas_mt || ''
        });
        setDuzenleId(k.id); setFormAcik(true); window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filtrelenmis = kesimler
        .filter(k => k.durum !== 'iptal' || filtreDurum === 'iptal')
        .filter(k => filtreDurum === 'hepsi' ? k.durum !== 'iptal' : k.durum === filtreDurum)
        .filter(k => k.b1_model_taslaklari?.model_kodu?.toLowerCase().includes(arama.toLowerCase()) ||
            k.b1_model_taslaklari?.model_adi?.toLowerCase().includes(arama.toLowerCase()) ||
            k.kesimci_adi?.toLowerCase().includes(arama.toLowerCase()));

    const istatistik = {
        toplam: kesimler.length, kesimde: kesimler.filter(k => k.durum === 'kesimde').length,
        tamamlandi: kesimler.filter(k => k.durum === 'tamamlandi').length,
        toplamAdet: kesimler.reduce((s, k) => s + (parseInt(k.kesilen_net_adet) || 0), 0),
    };

    if (!mounted) return null;

    if (!yetkiliMi) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase' }}>{isAR ? 'تم حظر الدخول غير المصرح به' : 'YETKİSİZ GİRİŞ ENGELLENDİ (M5)'}</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 12 }}>Kesimhane verileri gizlidir. Üretim PİN kodu girmeniz gerekmektedir.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }} dir={isAR ? 'rtl' : 'ltr'}>

                <KesimUstPanel isAR={isAR} formAcik={formAcik} setFormAcik={setFormAcik} istatistik={istatistik}
                    arama={arama} setArama={setArama} filtreDurum={filtreDurum} setFiltreDurum={setFiltreDurum} filtrelenmisLength={filtrelenmis.length} />

                {mesaj.text && (
                    <div className={`flex items-center gap-2 p-3 mb-6 rounded-lg font-bold text-sm border-2 ${mesaj.type === 'error' ? 'border-rose-500/50 bg-rose-500/10 text-rose-400' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'}`}>
                        {mesaj.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />} {mesaj.text}
                    </div>
                )}

                {formAcik && (
                    <KesimFormu form={form} setForm={setForm} isAR={isAR} duzenleId={duzenleId} modeller={modeller} kumaslar={kumaslar}
                        BOSH_KESIM={BOSH_KESIM} setFormAcik={setFormAcik} setDuzenleId={setDuzenleId} kaydetKesim={kaydetKesim} loading={loading} />
                )}

                <KesimListesi loading={loading} filtrelenmis={filtrelenmis} setSeciliKesim={setSeciliKesim} setBarkodAcik={setBarkodAcik}
                    duzenleKesim={duzenleKesim} sil={sil} islemdeId={islemdeId} durumGuncelle={durumGuncelle} isEmriOlustur={isEmriOlustur} />

                <SilBastanModal acik={barkodAcik} onClose={() => setBarkodAcik(false)} title="🖨️ Kesim Topu Etiketi Çıkart">
                    {seciliKesim && (
                        <div className="flex flex-col items-center gap-6 bg-[#0d1117] p-8 rounded-xl border border-[#21262d]">
                            <FizikselQRBarkod
                                veriKodu={`KSM-${seciliKesim.id}`} baslik={`Kesim: ${seciliKesim.b1_model_taslaklari?.model_kodu}`}
                                aciklama={`${seciliKesim.kesilen_net_adet} Adet • Pastal: ${seciliKesim.pastal_kat_sayisi}${seciliKesim.kesimci_adi ? ' • ' + seciliKesim.kesimci_adi : ''}`}
                            />
                            <p className="m-0 text-xs text-[#8b949e] text-center font-bold">
                                Bu barkod, kesim paketlerinin (meto) üzerine yapıştırılıp Üretim Bandına (M6) yollanır.<br />
                                Bant şefi kameraya okuttuğunda otomatik olarak üretime başlar.
                            </p>
                        </div>
                    )}
                </SilBastanModal>
            </div>
        </div>
    );
}
