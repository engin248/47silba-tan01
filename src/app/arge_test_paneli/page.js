'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, TrendingUp, AlertTriangle, Calculator, Factory, CheckCircle2, Radar, Cpu, Zap, Activity } from 'lucide-react';

// MOCK VERİ (Veritabanı boşken tasarımın görünmesi için Geçici Simülasyon)
const MOCK_STRATEGY = [
    {
        id: 'mock-1',
        product_name: 'Premium Modal Fitilli İspanyol Paça Tayt',
        platform: 'Trendyol / Zara Viral',
        opportunity_score: 88,
        risk_level: 'Düşük',
        supply_risk: 'Kumaş tedarik zinciri stabil (%0 İthalat Sorunu).',
        time_risk: 'Dikimi kolay, seri üretime uygun (5 Gün)',
        estimated_profit: 450000,
        outsource_cost: 38000,
        boss_approved: false,
        agent_note: 'Son 24 saatte arama hacmi %400 arttı. Rakiplerde stoklar tükeniyor. M2 Kalıphanesine gönderilmeli.'
    },
    {
        id: 'mock-2',
        product_name: 'Zümrüt Yeşili Paraşüt Kargo Eşofman',
        platform: 'Instagram / TikTok',
        opportunity_score: 76,
        risk_level: 'Orta',
        supply_risk: 'Paraşüt kumaş stoğu piyasada azalıyor. Hızlı opsiyon şart.',
        time_risk: 'Lastik detayları fason dikimi yavaşlatabilir (12 Gün)',
        estimated_profit: 280000,
        outsource_cost: 55000,
        boss_approved: false,
        agent_note: 'Trend ömrü 60 gün. Kâr marjı çok yüksek ancak işçilik süresi riskli. Karar Boss aittir.'
    }
];

export default function ArgeTestPaneli() {
    const [strategyData, setStrategyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [onaylananId, setOnaylananId] = useState(null);
    const [yeniVeriGeldi, setYeniVeriGeldi] = useState(false); // Yeşil Flash Animasyonu İçin

    const veriCekRef = useRef(null);

    const verileriGetir = async () => {
        setLoading(true);
        try {
            // Mizanet KURALI: Sadece okuma yap, 70 puan üstü Altın Madenlerini getir.
            const { data, error } = await supabase
                .from('b1_arge_strategy')
                .select('*')
                .gte('opportunity_score', 70)
                .order('opportunity_score', { ascending: false });

            if (error || !data || data.length === 0) {
                setStrategyData(MOCK_STRATEGY); // Db boşsa Mock veri göster
            } else {
                setStrategyData(data);
            }
        } catch (error) {
            setStrategyData(MOCK_STRATEGY);
        }
        setLoading(false);
    };

    veriCekRef.current = verileriGetir;

    useEffect(() => {
        veriCekRef.current();

        // Mizanet KURALI: Canlı Akış (Realtime) Bağlantısı - F5 İhtiyacı Yok
        const kanal = supabase.channel('boss-karargah-arge')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_arge_strategy' }, (payload) => {
                // Yeni kayıt geldiğinde ekranı flaş yap (Animasyon)
                if (payload.new.opportunity_score >= 70) {
                    setYeniVeriGeldi(true);
                    setTimeout(() => setYeniVeriGeldi(false), 2000); // 2 sn sonra flaşı kapat
                    veriCekRef.current();
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'b1_arge_strategy' }, () => {
                veriCekRef.current();
            })
            .subscribe();

        return () => supabase.removeChannel(kanal);
    }, []);

    // SUPER POWER: TEST ÜRETİMİNİ ONAYLA
    const patronOnayla = async (id) => {
        setOnaylananId(id);

        if (id.startsWith('mock-')) {
            setStrategyData(prev => prev.map(item => item.id === id ? { ...item, boss_approved: true } : item));
            setTimeout(() => setOnaylananId(null), 1000);
            return;
        }

        const { error } = await supabase
            .from('b1_arge_strategy')
            .update({ boss_approved: true, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            setStrategyData(prev => prev.map(item => item.id === id ? { ...item, boss_approved: true } : item));
        }
        setOnaylananId(null);
    };

    const fnFormat = (num) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(num || 0);

    return (
        <div className={`min-h-screen transition-colors duration-700 ${yeniVeriGeldi ? 'bg-[#047857]/20' : 'bg-[#050505]'} text-slate-200 p-4 md:p-8 font-sans`}>

            {/* ÜST RADAR (HEADER) */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between border-b border-[#047857]/30 pb-4 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#047857] to-[#B8860B] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(4,120,87,0.5)] relative">
                            <Radar size={28} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#B8860B] tracking-widest uppercase mb-1">
                                M1 AR-GE <span className="text-white">İSTİHBARAT PANELİ</span>
                            </h1>
                            <p className="text-xs text-[#047857] font-bold uppercase tracking-widest flex items-center gap-2">
                                <Cpu size={12} /> The Order - Single Pane of Glass
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 border border-[#1D4ED8]/30 rounded-xl bg-[#0f172a]/20">
                        <Activity size={40} className="text-[#1D4ED8] animate-spin mb-3" />
                        <span className="text-[#1D4ED8] font-bold tracking-widest uppercase">Karargah Ağ Bağlantısı Kuruluyor...</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {strategyData.map((item) => (
                            <div key={item.id} className={`relative overflow-hidden transition-all duration-500 rounded-2xl border ${item.boss_approved ? 'border-[#047857] bg-[#022c22] opacity-70' : 'border-[#1D4ED8]/40 bg-[#0A0A0A] hover:border-[#B8860B]/60 shadow-[0_0_30px_rgba(29,78,216,0.1)]'}`}>

                                {/* 4 ANA PANEL (SINGLE PANE OF GLASS VİZYONU) */}
                                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                                    {/* 1. PANEL: GÜNÜN TRENDLERİ & ÜRÜN BİLGİSİ */}
                                    <div className="lg:col-span-3 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-[#1D4ED8]/20 text-[#1D4ED8] border border-[#1D4ED8]/50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                                                {item.platform || 'Genel Ağ'}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-black text-white leading-tight mb-2">
                                            {item.product_name}
                                        </h2>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                            {item.agent_note || 'Sistem tarafından saptanan büyüme trendi.'}
                                        </p>
                                    </div>

                                    {/* 2. PANEL: TEST ÜRETİMİ FIRSATLARI (SKOR) */}
                                    <div className="lg:col-span-2 flex flex-col justify-center items-center border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0">
                                        <span className="text-[10px] text-[#B8860B] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <TrendingUp size={12} /> Altın Fırsat Skoru
                                        </span>
                                        <div className="text-5xl font-black text-[#B8860B] drop-shadow-[0_0_10px_rgba(184,134,11,0.5)]">
                                            {item.opportunity_score}
                                        </div>
                                    </div>

                                    {/* 3. PANEL: RİSK UYARILARI */}
                                    <div className="lg:col-span-4 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:px-6">
                                        <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                            <AlertTriangle size={12} className={item.risk_level === 'Yüksek' ? 'text-red-500' : 'text-amber-500'} />
                                            Risk Uyarıları ({item.risk_level})
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="bg-black/50 border border-slate-800 rounded p-2">
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">Tedarik Kırmızı Bayrak</div>
                                                <div className="text-xs text-slate-300">{item.supply_risk || 'Risk Saptanmadı'}</div>
                                            </div>
                                            <div className="bg-black/50 border border-slate-800 rounded p-2">
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">Zaman/Üretim Kırmızı Bayrak</div>
                                                <div className="text-xs text-slate-300">{item.time_risk || 'Hesaplanıyor...'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. PANEL: KÂR TAHMİNLERİ VE SÜPER GÜÇ BUTONU */}
                                    <div className="lg:col-span-3 flex flex-col justify-between pl-0 lg:pl-6">
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <div className="bg-[#047857]/10 border border-[#047857]/30 p-2 rounded-lg">
                                                <div className="text-[9px] text-[#047857] font-bold uppercase mb-1 flex items-center gap-1">
                                                    <Calculator size={10} /> Tahmini Kâr
                                                </div>
                                                <div className="text-sm font-black text-emerald-400">₺ {fnFormat(item.estimated_profit)}</div>
                                            </div>
                                            <div className="bg-rose-900/10 border border-rose-900/30 p-2 rounded-lg">
                                                <div className="text-[9px] text-rose-500 font-bold uppercase mb-1 flex items-center gap-1">
                                                    <Factory size={10} /> Fason Maliyet
                                                </div>
                                                <div className="text-sm font-black text-rose-400">₺ {fnFormat(item.outsource_cost)}</div>
                                            </div>
                                        </div>

                                        {/* ETKİLEŞİM VE AKSİYON BUTONU (SUPER POWER) */}
                                        {item.boss_approved ? (
                                            <div className="w-full bg-[#047857] text-white py-3 rounded-lg flex items-center justify-center gap-2 font-black text-xs tracking-widest uppercase border border-emerald-400/50 shadow-[0_0_15px_rgba(4,120,87,0.6)]">
                                                <CheckCircle2 size={16} /> ONAYLANDI (M2'DE)
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => patronOnayla(item.id)}
                                                disabled={onaylananId === item.id}
                                                className="w-full relative overflow-hidden group bg-gradient-to-r from-[#047857] to-[#065f46] hover:from-[#B8860B] hover:to-[#8B6508] border border-[#047857] hover:border-[#B8860B] text-white py-3 rounded-lg flex items-center justify-center gap-2 font-black text-[11px] tracking-widest uppercase transition-all shadow-lg"
                                            >
                                                {onaylananId === item.id ? (
                                                    <Activity className="animate-spin text-white" size={16} />
                                                ) : (
                                                    <><Zap size={16} /> TEST ÜRETİMİNİ ONAYLA</>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
