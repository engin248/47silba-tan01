'use client';
import { useState, useEffect } from 'react';
import {
    TrendingUp, Plus, CheckCircle2, XCircle, Clock, AlertTriangle,
    Bot, Search, BarChart3, Tag, Layers, Zap, Activity, Network, ShieldAlert, PieChart as PieChartIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';

export default function ArgeMainContainer() {
    const { kullanici, yukleniyor } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);

    // Tab List
    const [sekmeler] = useState(['Canlı Akış (Ajan Taraması)', 'Karar Bekleyenler', 'Üretim Onaylı (M2)', 'İptal Edilenler']);
    const [aktifSekme, setAktifSekme] = useState(1); // Default Karar Bekleyenler

    // Datas
    /** @type {[any[], import('react').Dispatch<import('react').SetStateAction<any[]>>]} */
    const [products, setProducts] = useState([]);
    /** @type {[any[], import('react').Dispatch<import('react').SetStateAction<any[]>>]} */
    const [agentLoglari, setAgentLoglari] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const erisebilir = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(erisebilir);

        if (!erisebilir) {
            setLoading(false);
            return;
        }

        const verileriCek = async () => {
            setLoading(true);
            try {
                // b1_arge_products tablosundan tüm sinyalleri çek
                const { data: prodData, error: prodHata } = await supabase
                    .from('b1_arge_products')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);
                if (!prodHata && prodData) setProducts(prodData);

                // Ajan Logları
                const { data: logData, error: logHata } = await supabase
                    .from('b1_agent_loglari')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);
                if (!logHata && logData) setAgentLoglari(logData);

            } catch (err) {
                console.error("M1 Veri çekme hatası:", err);
            }
            setLoading(false);
        };

        verileriCek();

        const kanalProd = supabase.channel('m1-arge-products-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_arge_products' }, payload => {
                if (payload.eventType === 'INSERT') setProducts(p => [payload.new, ...p]);
                else if (payload.eventType === 'UPDATE') setProducts(p => p.map(t => t.id === payload.new.id ? payload.new : t));
                else if (payload.eventType === 'DELETE') setProducts(p => p.filter(t => t.id !== payload.old.id));
            }).subscribe();
        return () => {
            supabase.removeChannel(kanalProd);
        };
    }, [kullanici]);

    // Karar Mekanizması
    const kararVer = async (id, yeniDurum) => {
        try {
            const { error } = await supabase
                .from('b1_arge_products')
                .update({ status: yeniDurum })
                .eq('id', id);

            if (!error && (yeniDurum === 'uretim_onay' || yeniDurum === 'red')) {
                const islem = yeniDurum === 'uretim_onay' ? 'KARAR: ÜRETİME ALINDI' : 'KARAR: İPTAL (%30 MARJ/RİSK)';
                await supabase.from('b1_agent_loglari').insert([{
                    ajan_adi: 'M1 Karar Motoru (Manuel)',
                    islem_tipi: islem,
                    mesaj: `Koordinatör kararı uygulandı. Ürün referans ID: ${id}`,
                    sonuc: yeniDurum === 'uretim_onay' ? 'basarili' : 'uyari'
                }]);

                // [AR-04] Modelhane otomatik yönlendirme
                if (yeniDurum === 'uretim_onay') {
                    const p = products.find(prd => prd.id === id);
                    if (p) {
                        try {
                            await supabase.from('b1_model_taslaklari').insert([{
                                model_kodu: p.model_kodu || ('MDL-' + id.substring(0, 5).toUpperCase()),
                                model_adi: p.isim_orjinal || p.isim || 'ARGE Taslak',
                                durum: 'taslak',
                            }]);
                        } catch (e) {
                            console.error('Modelhane aktarım hatası:', e);
                        }
                    }
                }
            }
        } catch (err) { console.error(err); }
    };

    if (yukleniyor || loading) return <div className="p-12 text-center text-indigo-400 font-bold tracking-widest animate-pulse">İSTİHBARAT AĞINA BAĞLANILIYOR...</div>;
    if (!yetkiliMi) return (
        <div className="p-12 text-center bg-rose-950/20 rounded-2xl m-8 shadow-2xl">
            <ShieldAlert size={48} className="mx-auto mb-4 text-rose-500" />
            <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">GİZLİ KARARGAH VERİSİ</h2>
        </div>
    );

    // Listeleme Filtreleri
    const gosterilenProducts = products.filter(p => {
        if (aktifSekme === 0) return true; // Canlı akış (hepsi)
        if (aktifSekme === 1) return p.status === 'inceleniyor' || !p.status;
        if (aktifSekme === 2) return p.status === 'uretim_onay';
        if (aktifSekme === 3) return p.status === 'red' || p.status === 'iptal';
        return true;
    });

    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>

                {/* HEAD: CANLI TREND AKIŞI */}
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

                    {/* SOL BÖLGE: ŞEF LOG VE CANLI RADAR (A & H BLOKLARI) */}
                    <div className="xl:col-span-1 space-y-6">
                        {/* A BLOK: KPI & Son 24 Saat Yükselenler [AR-01] */}
                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
                            <h3 className="text-sm font-black text-[#8b949e] tracking-widest uppercase mb-4 flex items-center gap-2">
                                <Activity size={16} className="text-emerald-500" /> Ajan Saha Özeti
                            </h3>
                            <div className="space-y-4 mb-5">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-500">Son 24h Taranan</div>
                                    <div className="text-xl font-black text-white">{products.length}</div>
                                </div>
                                <div className="h-px bg-[#21262d]"></div>
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-500">M1 Zırhından Geçen</div>
                                    <div className="text-xl font-black text-emerald-400">{products.filter(p => p.satar_satmaz_skoru >= 85).length}</div>
                                </div>
                            </div>

                            <h4 className="text-xs font-bold text-[#8b949e] uppercase mb-3 border-t border-[#21262d] pt-4 flex items-center gap-1">
                                <TrendingUp size={14} className="text-blue-500" /> [AR-01] Top Yükselenler
                            </h4>
                            <div className="space-y-3">
                                {products.filter(p => p.satar_satmaz_skoru >= 85).slice(0, 3).map((tp, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d]">
                                        <div className="truncate text-[0.7rem] font-bold text-gray-300 w-2/3 uppercase">{tp.isim_orjinal || tp.isim || 'Ürün'}</div>
                                        <div className="text-[0.7rem] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">%{tp.satar_satmaz_skoru}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* B BLOK: TREND RADAR GRAFİK [AR-02] */}
                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
                            <h3 className="text-sm font-black text-[#8b949e] tracking-widest uppercase mb-2 flex items-center gap-2">
                                <Zap size={16} className="text-amber-500" /> [AR-02] Trend Radar
                            </h3>
                            <div className="h-[220px] w-full">
                                {products.length > 0 ? (() => {
                                    const cats = {};
                                    products.forEach(p => {
                                        const k = p.kategori || 'DİĞER';
                                        if (!cats[k]) cats[k] = { kat: k, toplam: 0, adet: 0 };
                                        cats[k].toplam += (p.satar_satmaz_skoru || 50);
                                        cats[k].adet++;
                                    });
                                    const radarData = Object.values(cats).map(c => ({
                                        subject: c.kat.substring(0, 10),
                                        A: Math.round(c.toplam / c.adet),
                                        fullMark: 100
                                    })).slice(0, 6);

                                    return (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                                <PolarGrid stroke="#30363d" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 10 }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar name="Skor" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    );
                                })() : <div className="text-xs text-gray-500 text-center pt-10">Veri bekleniyor...</div>}
                            </div>
                        </div>

                        {/* F BLOK: KATEGORİ HARİTASI [AR-03] */}
                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
                            <h3 className="text-sm font-black text-[#8b949e] tracking-widest uppercase mb-2 flex items-center gap-2">
                                <PieChartIcon size={16} className="text-purple-500" /> [AR-03] Kategori Haritası
                            </h3>
                            <div className="h-[200px] w-full">
                                {products.length > 0 ? (() => {
                                    const cats = {};
                                    products.forEach(p => {
                                        const k = p.kategori || 'DİĞER';
                                        cats[k] = (cats[k] || 0) + 1;
                                    });
                                    const pieData = Object.keys(cats).map(k => ({ name: k, value: cats[k] }));
                                    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

                                    return (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value">
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    );
                                })() : <div className="text-xs text-gray-500 text-center pt-10">Veri bekleniyor...</div>}
                            </div>
                        </div>


                        {/* H BLOK: AJAN LOG */}
                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl flex flex-col h-[400px]">
                            <div className="p-4 border-b border-[#21262d]">
                                <h2 className="text-sm font-black tracking-widest text-[#c9d1d9] uppercase flex items-center gap-2">
                                    <Network size={14} className="text-blue-500" /> M1 MOTOR LOGLARI
                                </h2>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 styled-scroll">
                                {agentLoglari.map((log) => (
                                    <div key={log.id} className="text-sm bg-[#0d1117] border border-[#30363d] p-3 rounded-lg text-[#8b949e]">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-blue-400 font-mono font-bold">[{log.islem_tipi}]</span>
                                            <span className="text-xs opacity-70">{new Date(log.created_at).toLocaleTimeString('tr-TR')}</span>
                                        </div>
                                        <div className="text-white">{log.mesaj}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SAĞ BÖLGE: KARAR PANELİ (D, E, F, G BLOKLARI) */}
                    <div className="xl:col-span-3">
                        {/* Sekmeler */}
                        <div className="flex gap-2 mb-4">
                            {sekmeler.map((s, i) => (
                                <button key={i} onClick={() => setAktifSekme(i)} className={`px-5 py-2.5 rounded-lg text-xs font-black tracking-wider transition-colors uppercase ${aktifSekme === i ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50' : 'bg-[#161b22] text-[#8b949e] border border-[#21262d] hover:text-white'
                                    }`}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* ANALİZ LİSTESİ */}
                        <div className="space-y-4">
                            {gosterilenProducts.length === 0 && (
                                <div className="text-center py-20 text-[#8b949e]">Bu radar filtrelemesinde ürün bulunamadı.</div>
                            )}

                            {gosterilenProducts.map(p => {
                                const skor = p.satar_satmaz_skoru || 0;
                                let riskRenk = 'emerald';
                                let tavsiye = 'ÜRETİME GİR (BİNGO)';
                                if (skor < 50) { riskRenk = 'rose'; tavsiye = 'İPTAL / ÇÖP'; }
                                else if (skor < 70) { riskRenk = 'amber'; tavsiye = 'RİSKLİ / BEKLE'; }
                                else if (skor < 85) { riskRenk = 'blue'; tavsiye = 'POTANSİYEL (TAKİP)'; }

                                return (
                                    <div key={p.id} className={`bg-[#161b22] border-l-4 border-[#30363d] rounded-r-xl p-5 hover:bg-[#1a2029] transition-all
                                        ${skor >= 85 ? 'border-l-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.05)]' :
                                            skor < 50 ? 'border-l-rose-500' : 'border-l-blue-500'}`}>

                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                {/* E BLOK: ERKEN TESPİT ETİKETİ */}
                                                {(p.viral_izlenme_hizi > 50000 && p.satici_sayisi < 5) && (
                                                    <span className="inline-block bg-purple-500/20 text-purple-400 border border-purple-500/50 px-2 py-0.5 rounded text-xs font-black tracking-widest uppercase mb-2">
                                                        ⚡ ERKEN TREND TESPİTİ (REKABET DÜŞÜK)
                                                    </span>
                                                )}
                                                <h3 className="text-lg font-bold text-white mb-1">{p.title || 'İsimsiz Sinyal'}</h3>
                                                <a href={p.product_url} target="_blank" className="text-xs text-blue-400 hover:underline">Kaynak Linkine Git ↗</a>
                                            </div>

                                            {/* D BLOK: OTOMATİK SKOR PANELİ */}
                                            <div className="text-right">
                                                <div className="text-sm text-[#8b949e] font-bold uppercase tracking-widest mb-1">M1 Karar Skoru</div>
                                                <div className={`text-3xl font-black text-${riskRenk}-400`}>
                                                    %{skor}
                                                </div>
                                                <div className={`text-xs font-black tracking-widest uppercase text-${riskRenk}-400 mt-1`}>
                                                    {tavsiye}
                                                </div>
                                            </div>
                                        </div>

                                        {/* C BLOK: SOSYAL + PAZAR YERİ EŞLEŞME METRİKLERİ */}
                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 font-bold uppercase">Sepet Deltası (Talep)</span>
                                                <span className="text-sm font-mono text-emerald-400 font-bold">+{p.sepet_deltasi || 0}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 font-bold uppercase">Yorum İvmesi</span>
                                                <span className="text-sm font-mono text-blue-400 font-bold">+{p.yorum_deltasi || 0}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 font-bold uppercase">Viral Kopma Hızı</span>
                                                <span className="text-sm font-mono text-purple-400 font-bold">{p.viral_izlenme_hizi || 0} /G</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 font-bold uppercase">Rakip Satıcı</span>
                                                <span className="text-sm font-mono text-amber-400 font-bold">{p.satici_sayisi || 0} Kişi</span>
                                            </div>
                                            <div className="flex flex-col border-l border-[#30363d] pl-3">
                                                <span className="text-xs text-gray-500 font-bold uppercase">Yorum Zehri / Risk</span>
                                                <span className={`text-xs font-black uppercase mt-0.5 ${p.iade_risk_sinyali?.includes('YÜKSEK') ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {p.iade_risk_sinyali || 'TEMİZ'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* G BLOK: KARAR PANELİ (ÖLÜMCÜL NOKTA) */}
                                        <div className="mt-4 flex flex-col md:flex-row justify-between items-center bg-[#161b22] border-t border-[#30363d] pt-4">
                                            <div className="text-sm text-gray-500 mb-3 md:mb-0">
                                                Ajan Raporu Düştü: {new Date(p.created_at).toLocaleString('tr-TR')}
                                            </div>

                                            <div className="flex gap-2 w-full md:w-auto">
                                                {/* İPTAL ET */}
                                                <button onClick={() => kararVer(p.id, 'iptal')} className="flex-1 md:flex-none px-4 py-2 rounded border border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-black tracking-widest uppercase transition-all">
                                                    ÇÖPE AT (İPTAL)
                                                </button>

                                                {/* BEKLET */}
                                                <button onClick={() => kararVer(p.id, 'inceleniyor')} className="flex-1 md:flex-none px-4 py-2 rounded border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-black tracking-widest uppercase transition-all">
                                                    RADARDA BEKLET
                                                </button>

                                                {/* ÜRETİME SOK */}
                                                <button onClick={() => kararVer(p.id, 'uretim_onay')} className="flex-1 md:flex-none px-6 py-2 rounded border border-emerald-500 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2">
                                                    <CheckCircle2 size={14} /> ÜRETİME SEVK ET (M2)
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

