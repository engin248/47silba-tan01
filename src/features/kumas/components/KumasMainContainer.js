'use client';
import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useKumas } from '@/features/kumas/hooks/useKumas';

import KumasUstPanel from './KumasUstPanel';
import KumasTaleplerPaneli from './KumasTaleplerPaneli';
import KumasEnvanterRadari from './KumasEnvanterRadari';
import KumasFizibiliteModal from './KumasFizibiliteModal';

export default function KumasMainContainer() {
    const { kullanici } = useAuth();
    const {
        yetkiliMi, sekme, setSekme, kumaslar, m1Talepleri, firsatlar,
        loading, m3eAktar
    } = useKumas(kullanici);

    const [fizibiliteModalAcik, setFizibiliteModalAcik] = useState(false);
    const [seciliTalep, setSeciliTalep] = useState(null);
    const [maliyetForm, setMaliyetForm] = useState({
        kumasFiyat: '',
        kumasMiktar: '',
        iscilik: '',
        rakipSatis: '499.90'
    });

    const toplamMaliyet = (parseFloat(maliyetForm.kumasFiyat || 0) * parseFloat(maliyetForm.kumasMiktar || 0)) + parseFloat(maliyetForm.iscilik || 0);
    const karMarjiTutar = parseFloat(maliyetForm.rakipSatis || 0) - toplamMaliyet;
    const karMarjiYuzde = parseFloat(maliyetForm.rakipSatis || 0) > 0 ? ((karMarjiTutar / parseFloat(maliyetForm.rakipSatis)) * 100).toFixed(1) : 0;
    const karlilikUygun = karMarjiYuzde >= 40;

    const sekmeler = ['kumas', 'aksesuar', 'firsat', 'm1', 'risk'];
    const sekmeIsimleri = ['Kumaş Arşivi', 'Aksesuar Deposu', 'Ölü Stok Radarı (AI)', "M1'den Gelen Talepler", 'Tedarik Risk Analizi'];
    const setAktifSekme = (ind) => setSekme(sekmeler[ind]);
    const aktifSekme = sekmeler.indexOf(sekme) !== -1 ? sekmeler.indexOf(sekme) : 0;

    const kumasRaporu = kumaslar.map(k => ({
        id: k.id, kodu: k.kumas_kodu, ad: k.kumas_adi, kompozisyon: k.kompozisyon,
        stok: parseFloat(k.stok_mt) || 0, minStok: parseFloat(k.min_stok_mt) || 0, birimFiyat: k.birim_maliyet_tl,
        tedarikci: k.tedarikci_adi || 'Bilinmiyor', riskSuresi: 'Bilinmiyor', alternatifVar: true,
        durum: parseFloat(k.stok_mt) < parseFloat(k.min_stok_mt) ? 'riskli' : 'guvenli',
        kalip_dosya_url: k.kalip_dosya_url
    }));

    if (loading) return <div className="p-12 text-center text-emerald-400 font-bold tracking-widest animate-pulse">SUPABASE M2 BAĞLANTISI KURULUYOR...</div>;

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 shadow-2xl rounded-2xl m-8">
                <Lock size={48} className="mx-auto mb-4 text-rose-500" />
                <h2 className="text-xl font-black text-rose-500 uppercase">YETKİSİZ GİRİŞ (M2)</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>

                {/* 1. BAŞLIK VE KPI */}
                <KumasUstPanel kumasRaporu={kumasRaporu} />

                {/* 2. ANA PANEL (İKİLİ LAYOUT) */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">

                    {/* SOL PANEL */}
                    <KumasTaleplerPaneli
                        m1Talepleri={m1Talepleri}
                        setSeciliTalep={setSeciliTalep}
                        setFizibiliteModalAcik={setFizibiliteModalAcik}
                    />

                    {/* SAĞ PANEL */}
                    <KumasEnvanterRadari
                        sekme={sekme}
                        sekmeIsimleri={sekmeIsimleri}
                        aktifSekme={aktifSekme}
                        setAktifSekme={setAktifSekme}
                        firsatlar={firsatlar}
                        kumasRaporu={kumasRaporu}
                    />
                </div>
            </div>

            {/* FİZİBİLİTE MODALI */}
            {fizibiliteModalAcik && seciliTalep && (
                <KumasFizibiliteModal
                    seciliTalep={seciliTalep}
                    setFizibiliteModalAcik={setFizibiliteModalAcik}
                    maliyetForm={maliyetForm}
                    setMaliyetForm={setMaliyetForm}
                    toplamMaliyet={toplamMaliyet}
                    karMarjiTutar={karMarjiTutar}
                    karMarjiYuzde={karMarjiYuzde}
                    karlilikUygun={karlilikUygun}
                    m3eAktar={m3eAktar}
                />
            )}
        </div>
    );
}
