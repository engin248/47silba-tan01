'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import { Boxes, Plus, AlertTriangle, ShieldAlert } from 'lucide-react';
import MesajBanner from '@/components/shared/MesajBanner';
import Link from 'next/link';

// Zırhlı Servis Bağlantısı (IDB + Supabase)
import { stokVeriGetir, stokHareketiKaydet as apiStokHareketiKaydet, stokHareketSil, BOSH_HAREKET } from '../services/stokApi';

// Alt Bileşenler (Tabs)
import StokGridTab from './tabs/StokGridTab';
import StokHareketLoglari from './tabs/StokHareketLoglari';
import StokFormHareket from './tabs/StokFormHareket';

export default function StokMainContainer() {
    const { kullanici, sayfaErisim } = useAuth();
    const erisim = typeof sayfaErisim === 'function' ? sayfaErisim('/stok') : 'full';
    const [mounted, setMounted] = useState(false);
    const { lang } = useLang();

    // Tablo (Envanter) ve Log (Hareket)
    const [stokEnvanteri, setStokEnvanteri] = useState([]);
    const [hareketler, setHareketler] = useState([]);

    // UI State
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [yeniHareket, setYeniHareket] = useState(BOSH_HAREKET);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [arama, setArama] = useState('');
    const [islemdeId, setIslemdeId] = useState(null);

    const showMessage = createGoster(setMesaj);

    useEffect(() => {
        setMounted(true);
        let isMounted = true;
        let kanal = null;

        if (erisim !== 'yok') {
            kanal = supabase.channel('stok-gercek-zamanli')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_stok_hareketleri' }, () => {
                    if (isMounted) yukle();
                }).subscribe();
            yukle();
        }
        return () => { isMounted = false; if (kanal) supabase.removeChannel(kanal); };
    }, [erisim]);

    const yukle = async () => {
        setLoading(true);
        try {
            const data = await stokVeriGetir();
            if (data.stokEnvanteri) setStokEnvanteri(data.stokEnvanteri);
            if (data.hareketler) setHareketler(data.hareketler);
        } catch (error) { showMessage('Ağ Hatası (IDB Fallback Çalışıyor): ' + error.message, 'error'); }
        setLoading(false);
    };

    const stokHareketiKaydet = async () => {
        if (islemdeId === 'kayit') return;
        setIslemdeId('kayit');
        if (!yeniHareket.urun_id) { setIslemdeId(null); return showMessage('Lütfen hedef ürünü seçin!', 'error'); }
        if (!yeniHareket.adet || yeniHareket.adet <= 0) { setIslemdeId(null); return showMessage('Geçerli bir adet giriniz!', 'error'); }

        setLoading(true);
        const payload = {
            urun_id: yeniHareket.urun_id, hareket_tipi: yeniHareket.hareket_tipi,
            adet: parseInt(yeniHareket.adet, 10), aciklama: yeniHareket.aciklama.trim() || 'Merkez'
        };

        try {
            const r = await apiStokHareketiKaydet(payload);
            if (r.offline) showMessage('⚡ İNTERNET YOK: Stok hareketi kuyruğa alındı (Zırh Tarafından Korunuyor).', 'success');
            else { showMessage('✅ Depo işlemi güvenli mühürlendi!'); yukle(); }

            setYeniHareket(BOSH_HAREKET); setFormAcik(false);
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        setLoading(false); setIslemdeId(null);
    };

    const hareketSilB0Log = async (id, urun_kodu) => {
        if (islemdeId === 'sil_' + id) return;
        setIslemdeId('sil_' + id);

        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici);
        if (!yetkili) { setIslemdeId(null); return showMessage(yetkiMesaj || 'Yetkisiz erişim.', 'error'); }
        if (!confirm('DİKKAT! Bu kayıt fiziki olarak silinecek ve Kara Kutuya yazılacaktır.')) { setIslemdeId(null); return; }

        try {
            await stokHareketSil(id, urun_kodu, kullanici?.label || 'M11 Yöneticisi');
            showMessage('🗑️ Kayıt imha edildi, Zırh Logları (B0) mühürlendi.'); yukle();
        } catch (error) { showMessage('Hata: ' + error.message, 'error'); }
        setIslemdeId(null);
    };

    if (!mounted) return null;
    const isAR = lang === 'ar';

    if (erisim === 'yok') return (
        <div className="p-16 text-center bg-rose-950/20 border-2 border-rose-900/50 rounded-2xl m-8 relative overflow-hidden group">
            <ShieldAlert size={64} className="mx-auto mb-6 text-rose-600 animate-pulse drop-shadow-[0_0_15px_#dc2626]" />
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-[0.2em] mb-4">SİBER KAPI İHLALİ M11</h2>
            <p className="text-rose-300 font-bold m-0 max-w-lg mx-auto leading-relaxed">Stok verileri en üst düzey "Tam Erişim" iznine tabidir. KarargAH ağında izniniz doğrulanamadı.</p>
        </div>
    );

    const netKritikSayisi = stokEnvanteri.filter(s => (s.net_stok || 0) <= (s.min_stok || 10)).length;

    return (
        <div className="p-4 md:p-8" dir={isAR ? 'rtl' : 'ltr'}>

            {netKritikSayisi > 0 && (
                <div className="flex items-center justify-between flex-wrap gap-4 bg-gradient-to-r from-red-600 to-red-900 text-white p-4 rounded-xl mb-6 animate-pulse shadow-[0_4px_15px_rgba(220,38,38,0.4)]">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={24} />
                        <div>
                            <div className="font-black text-sm uppercase tracking-wider mb-0.5">🚨 {netKritikSayisi} ADET ÜRÜN KRİTİK SEVİYENİN ALTINA İNDİ!</div>
                            <div className="text-xs font-bold text-red-200">En riskli gruplar tedarik bekliyor.</div>
                        </div>
                    </div>
                    <button className="bg-white/20 hover:bg-white/30 border border-white/50 text-white px-4 py-2 rounded-lg font-black text-xs cursor-pointer uppercase transition-colors">
                        📱 TELEGRAM ALARMI GÖNDER
                    </button>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 overflow-hidden relative">
                <div className="absolute -left-20 -top-20 w-40 h-40 bg-emerald-600/10 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[16px] flex items-center justify-center shadow-[0_0_20px_rgba(4,120,87,0.4)] border border-emerald-500/30">
                        <Boxes size={28} className="text-emerald-50" />
                    </div>
                    <div>
                        <h1 className="text-2.5xl font-black text-white m-0 tracking-tight uppercase">Stok İkmal Karargahı (M11)</h1>
                        <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mt-1.5 opacity-90 border-l-[3px] border-emerald-500 pl-2">Kayıpsız Zero-Latency Otonom Depo Ağı</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 z-10">
                    <Link href="/siparisler" className="no-underline">
                        <button className="bg-amber-600 hover:bg-amber-500 text-white border-0 px-6 py-3 rounded-xl font-black text-sm tracking-widest cursor-pointer shadow-[0_4px_15px_rgba(217,119,6,0.3)] transition-colors uppercase flex items-center gap-2">
                            SİPARİŞLER M8 ➞
                        </button>
                    </Link>
                    {erisim === 'full' && (
                        <button onClick={() => { setFormAcik(!formAcik); setYeniHareket(BOSH_HAREKET); }}
                            className="bg-emerald-600 hover:bg-emerald-500 border-0 border-b-4 border-emerald-800 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest cursor-pointer shadow-[0_4px_15px_rgba(4,120,87,0.4)] flex items-center gap-2 transition-all active:translate-y-1 active:border-b-0">
                            <Plus size={18} /> TRANSFER EMRİ
                        </button>
                    )}
                </div>
            </div>

            <MesajBanner mesaj={mesaj} />

            {/* FORM ÇEKMECESİ */}
            <StokFormHareket
                formAcik={formAcik} setFormAcik={setFormAcik} setYeniHareket={setYeniHareket}
                BOSH_HAREKET={BOSH_HAREKET} isAR={isAR} yeniHareket={yeniHareket}
                stokEnvanteri={stokEnvanteri} stokHareketiKaydet={stokHareketiKaydet} loading={loading}
            />

            {/* STOK TABLOLARI / LOKASYON */}
            <div className="relative">
                {loading && !stokEnvanteri.length && (
                    <div className="absolute inset-x-0 top-10 flex flex-col items-center justify-center z-50">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                        <div className="text-emerald-400 font-black text-sm uppercase tracking-widest mt-4 animate-pulse">KRİTİK VERİ ÇEKİLİYOR...</div>
                    </div>
                )}

                <StokGridTab
                    stokEnvanteri={stokEnvanteri} arama={arama} setArama={setArama}
                    setYeniHareket={setYeniHareket} setFormAcik={setFormAcik}
                    showMessage={showMessage} BOSH_HAREKET={BOSH_HAREKET} erisim={erisim} isAR={isAR}
                />
            </div>

            <StokHareketLoglari
                hareketler={hareketler} erisim={erisim} islemdeId={islemdeId}
                hareketSilB0Log={hareketSilB0Log} isAR={isAR}
            />
        </div>
    );
}
