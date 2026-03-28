'use client';
// @ts-nocheck
import { useState, useEffect } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

import ArgeOzetKart from './ArgeOzetKart';
import ArgeTrendRadar from './ArgeTrendRadar';
import ArgeKategoriHaritasi from './ArgeKategoriHaritasi';
import ArgeMotorLoglari from './ArgeMotorLoglari';
import ArgeUrunKarti from './ArgeUrunKarti';
import { argeVerileriniGetir, argeKararVer, argeGercekZamanliKur } from '../services/argeApi';

export default function ArgeMainContainer() {
    const { kullanici, yukleniyor } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);

    const [sekmeler] = useState(['Canlı Akış (Ajan Taraması)', 'Karar Bekleyenler', 'Üretim Onaylı (M2)', 'İptal Edilenler']);
    const [aktifSekme, setAktifSekme] = useState(1);

    const [products, setProducts] = useState([]);
    const [agentLoglari, setAgentLoglari] = useState([]);
    const [loading, setLoading] = useState(true);

    const verileriCek = async () => {
        setLoading(true);
        try {
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000));
            const { data } = await argeVerileriniGetir(timeout);
            if (data?.products) setProducts(data.products);
            if (data?.agentLoglari) setAgentLoglari(data.agentLoglari);
        } catch (err) { console.error("M1 Veri zırhı hatası:", err); }
        setLoading(false);
    };

    useEffect(() => {
        let uretimPin = false;
        try { uretimPin = !!sessionStorage.getItem('sb47_uretim_token'); } catch { uretimPin = false; }

        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (!erisebilir) { setLoading(false); return; }

        verileriCek();

        let kanalProd;
        if (erisebilir) kanalProd = argeGercekZamanliKur(() => verileriCek());

        return () => { if (kanalProd) supabase.removeChannel(kanalProd); };
    }, [kullanici]);

    const kararVer = async (id, yeniDurum) => {
        try {
            const p = products.find(prd => prd.id === id);
            await argeKararVer(id, yeniDurum, p);
            verileriCek();
        } catch (err) { console.error(err); }
    };

    if (yukleniyor || loading) return <div className="p-12 text-center text-indigo-400 font-bold tracking-widest animate-pulse">İSTİHBARAT AĞINA BAĞLANILIYOR...</div>;
    if (!yetkiliMi) return (
        <div className="p-12 text-center bg-rose-950/20 rounded-2xl m-8 shadow-2xl">
            <ShieldAlert size={48} className="mx-auto mb-4 text-rose-500" />
            <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">GİZLİ KARARGAH VERİSİ</h2>
        </div>
    );

    const gosterilenProducts = products.filter(p => {
        if (aktifSekme === 0) return true;
        if (aktifSekme === 1) return p.status === 'inceleniyor' || !p.status;
        if (aktifSekme === 2) return p.status === 'uretim_onay';
        if (aktifSekme === 3) return p.status === 'red' || p.status === 'iptal';
        return true;
    });

    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 py-6 animate-fade-in">

                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-[#21262d] pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-900 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            <Activity size={24} className="text-emerald-50" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                                M1: GÖLGE İSTİHBARAT VE KARAR CENDERESİ
                            </h1>
                            <p className="text-sm font-mono text-emerald-400 mt-1 uppercase tracking-widest">
                                93 Kriterlik Radar Aktif. Sosyal Sinyaller Dinleniyor.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                    {/* SOL BÖLGE: ŞEF LOG VE CANLI RADAR */}
                    <div className="xl:col-span-1 space-y-6">
                        <ArgeOzetKart products={products} />
                        <ArgeTrendRadar products={products} />
                        <ArgeKategoriHaritasi products={products} />
                        <ArgeMotorLoglari agentLoglari={agentLoglari} />
                    </div>

                    {/* SAĞ BÖLGE: KARAR PANELİ */}
                    <div className="xl:col-span-3">
                        {/* Sekmeler */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {sekmeler.map((s, i) => (
                                <button key={i} onClick={() => setAktifSekme(i)} className={`px-5 py-2.5 rounded-lg text-xs font-black tracking-wider transition-colors uppercase cursor-pointer ${aktifSekme === i ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50' : 'bg-[#161b22] text-[#8b949e] border border-[#21262d] hover:text-white'
                                    }`}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* ANALİZ LİSTESİ */}
                        <div className="space-y-4">
                            {gosterilenProducts.length === 0 && (
                                <div className="text-center py-20 text-[#8b949e] border border-[#30363d] border-dashed rounded-xl">Bu radar filtrelemesinde ürün bulunamadı.</div>
                            )}

                            {gosterilenProducts.map(p => (
                                <ArgeUrunKarti key={p.id} p={p} kararVer={kararVer} />
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
