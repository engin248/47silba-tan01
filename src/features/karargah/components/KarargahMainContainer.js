'use client';
import { Target, Shield, AlertTriangle, Camera, Crosshair } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useKarargah } from '../hooks/useKarargah';
import { useState, useEffect, useRef } from 'react';

// ████████████████████████████████████████████████████████████████████████
// [ NİZAM ] SİBER KARARGAH — V2.2 TACTICAL MILITARY GREEN
// ████████████████████████████████████████████████████████████████████████

const TACTICAL = {
    bg: "bg-[#040804]",
    panel: "bg-[#081008]",
    border: "border-[#4ade80]/40",
    text: "text-[#4ade80]",
    amber: "text-[#ffca28]",
    red: "text-[#ef5350]",
    cyan: "text-[#81d4fa]"
};

const MILITARY_NAV = [
    { name: 'AJANLAR', link: '/ajanlar' },
    { name: 'AR-GE', link: '/arge' },
    { name: 'DENETÇİ', link: '/denetmen' },
    { name: 'KAMERALAR', link: '/kameralar' },
    { name: 'HABERLEŞME', link: '/haberlesme' },
    { name: 'İSTİHBARAT', link: '/m1-istihbarat' },
    { name: 'AYARLAR', link: '/ayarlar' },
    { name: 'MODELHANE', link: '/modelhane' },
    { name: 'KALIP', link: '/kalip' },
    { name: 'KUMAŞ', link: '/kumas' },
    { name: 'KESİM', link: '/kesim' },
    { name: 'ÜRETİM', link: '/uretim' },
    { name: 'SİPARİŞLER', link: '/siparisler' },
    { name: 'MALİYET', link: '/maliyet' },
    { name: 'MUHASEBE', link: '/muhasebe' },
    { name: 'STOK', link: '/stok' }
];

// BAŞLIKLARI UZATILMIŞ AJANLAR (Lokasyon bazlı)
const TUM_AJANLAR = [
    { isim: "NİZAM BOT (ANA KOMUTA)", lokasyon: "SİSTEM MERKEZ", tip: 'komuta', aktif: true },
    { isim: "AR-GE ÇEKİRDEĞİ", lokasyon: "VERİTABANI", tip: 'sinyal', aktif: true },
    { isim: "YARGIÇ GEMİNİ - KÂR ANALİZ", lokasyon: "FİNANS AĞI", tip: 'analiz', aktif: true },
    { isim: "HERMES KAŞİF - TREND", lokasyon: "TİKTOK-AĞI", tip: 'istihbarat', aktif: true },
    { isim: "VISION OTONOM - PİYASA", lokasyon: "TRENDYOL-API", tip: 'gorus', aktif: true },
    { isim: "STOK ALARM & RİSK", lokasyon: "DEPO-SENSÖR", tip: 'hata', aktif: true },
    { isim: "KÜRESEL PAZAR AJANI", lokasyon: "AMAZON-USA", tip: 'veri', aktif: true },
    { isim: "M2 MALİYET HESAPLAYICI", lokasyon: "SİSTEM-M2", tip: 'analiz', aktif: true },
    { isim: "INSTAGRAM VERİ ÇEKİCİ", lokasyon: "INSTA-DM", tip: 'veri', aktif: true },
    { isim: "TİKTOK VİRAL ANALİZ", lokasyon: "TİKTOK-TR", tip: 'veri', aktif: true },
    { isim: "FACEBOOK REKLAM BOT", lokasyon: "FACEBOOK-ADS", tip: 'veri', aktif: true },
    { isim: "NİZAM TELSİZ BAĞLANTISI", lokasyon: "HABERLEŞME", tip: 'baglanti', aktif: true }
];

const RadarDisplay = ({ ajanlar }) => {
    return (
        <div className={`relative w-full aspect-square border ${TACTICAL.border} ${TACTICAL.bg} flex items-center justify-center p-3 shadow-[inset_0_0_40px_rgba(74,222,128,0.1)] overflow-hidden`}>
            {/* Arka Plan Radar Ağı */}
            <div className={`absolute inset-0 opacity-20`} style={{ backgroundImage: 'radial-gradient(circle at center, #4ade80 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            {/* Halkalar */}
            <div className={`absolute inset-[10%] border border-[#4ade80]/40 rounded-full`} />
            <div className={`absolute inset-[30%] border border-[#4ade80]/30 rounded-full`} />
            <div className={`absolute inset-[50%] border border-[#4ade80]/20 rounded-full`} />
            <div className={`absolute inset-[70%] border border-[#4ade80]/15 rounded-full`} />

            {/* Eksenler */}
            <div className={`absolute w-full h-[1px] bg-[#4ade80]/40`} />
            <div className={`absolute h-full w-[1px] bg-[#4ade80]/40`} />

            <div className="absolute flex items-center justify-center">
                <Target size={18} className="text-[#4ade80] opacity-50" />
            </div>

            {/* Sweep */}
            <div className="absolute inset-0 rounded-full origin-center animate-[spin_4s_linear_infinite] mix-blend-screen"
                style={{ background: 'conic-gradient(from 0deg, transparent 60%, rgba(74, 222, 128, 0.4) 100%)' }} />

            {/* Radyo Sinyalleri & İsimleri */}
            {TUM_AJANLAR.map((a, i) => {
                const angle = (i * 30 + 15) * (Math.PI / 180);
                const radius = 20 + (i % 6) * 7;
                const top = 50 + radius * Math.sin(angle);
                const left = 50 + radius * Math.cos(angle);

                let colorClass = "#4ade80";
                if (a.tip === 'hata') colorClass = "#ef5350";
                if (a.tip === 'analiz' || a.tip === 'finans') colorClass = "#ffca28";
                if (a.tip === 'veri' || a.tip === 'istihbarat') colorClass = "#81d4fa";

                return (
                    <div key={i} className={`absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 z-10`}
                        style={{ top: `${top}%`, left: `${left}%` }}>
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${a.aktif ? 'animate-[pulse_1.5s_infinite]' : 'opacity-40'}`} style={{ backgroundColor: colorClass, color: colorClass }} />
                        <span className="absolute left-3 whitespace-nowrap text-[6px] md:text-[7px] font-bold tracking-widest drop-shadow-[0_0_3px_black]" style={{ color: colorClass }}>
                            [{a.lokasyon}]
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export function KarargahMainContainer() {
    const { kullanici } = useAuth();
    const [saat, setSaat] = useState('');
    const logContainerRef = useRef(null);
    const ping = Math.floor(Math.random() * 8) + 8;

    useEffect(() => {
        const iv = setInterval(() => {
            const now = new Date();
            setSaat(`${now.toLocaleDateString('tr-TR')} | ${now.toLocaleTimeString('tr-TR')}`);
        }, 1000);
        return () => clearInterval(iv);
    }, []);

    const trendler = [
        { isim: "Örme Modal Takım", id: "#1", level: 5, up: true },
        { isim: "Pamuklu Gömlek", id: "#2", level: 4, up: true },
        { isim: "Polyester Bluz", id: "#3", level: 3, up: false },
        { isim: "Denim Pantolon", id: "#4", level: 2, up: false },
        { isim: "Viskon Elbise", id: "#5", level: 4, up: true },
        { isim: "Keten Ceket", id: "#6", level: 3, up: true },
        { isim: "Triko Kazak", id: "#7", level: 2, up: false },
        { isim: "Oversize T-Shirt", id: "#8", level: 5, up: true },
        { isim: "Paraşüt Etek", id: "#9", level: 4, up: true },
        { isim: "Kaşe Kaban", id: "#10", level: 1, up: false },
    ];

    const gununPersonelleri10 = Array.from({ length: 10 }, (_, i) => ({ n: `Personel G-${i + 1}`, s: 98 - (i * 2), birim: i % 2 === 0 ? 'Üretim' : 'Kesim' }));
    const haftaninPersonelleri10 = Array.from({ length: 10 }, (_, i) => ({ n: `Personel H-${i + 1}`, s: 480 - (i * 15), birim: i % 3 === 0 ? 'Mlzm' : 'Mağaza' }));

    const terminalLoglar = [
        "[06:42:11] SİSTEM: Ağ protokolü onaylandı.",
        "[06:42:12] YARGIÇ: Fiyat analizi bitirildi.",
        "[06:42:15] TELSİZ BAĞLANTISI: İletişim kararlı durumu %98",
        "[06:43:00] KAMERA-02: Hareket sensörü aktif.",
        "[06:43:45] TİKTOK-BOT: Yeni trend uyarısı (Modal Örme).",
        "[06:44:11] HERMES: Piyasa stok çekimi 10k tamamlandı."
    ];

    return (
        <div className={`min-h-screen ${TACTICAL.bg} ${TACTICAL.text} font-mono p-4`} style={{ fontFamily: '"Courier New", Courier, monospace', userSelect: 'none' }}>

            {/* ÜST BAŞLIK */}
            <div className={`flex items-center justify-between border-b-2 ${TACTICAL.border} pb-2 mb-4 bg-gradient-to-r from-transparent via-[#081808] to-transparent`}>
                <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 bg-[#4ade80] rounded-full animate-pulse shadow-[0_0_10px_#4ade80]`} />
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold">AKTİF OTURUM</span>
                </div>
                <h1 className="text-xl md:text-3xl font-extrabold uppercase tracking-[0.15em] text-center flex-1 drop-shadow-[0_0_12px_rgba(74,222,128,0.7)]">
                    KARARGAH OPERASYON HAREKAT KOMUTA MERKEZİ
                </h1>
                <div className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-[9px] md:text-xs uppercase tracking-widest ${TACTICAL.text}`}>
                    <span className={`bg-[#4ade80]/10 px-2 py-0.5 border ${TACTICAL.border}`}>{saat}</span>
                    <span className={`px-2 py-0.5 border ${TACTICAL.border}`}>PING: {ping}ms</span>
                    <span className="border border-[#7cb342] text-[#7cb342] px-2 py-0.5 font-bold">TR AR</span>
                </div>
            </div>

            {/* İLK METRİK SATIRI */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                <div className={`border ${TACTICAL.border} p-2 ${TACTICAL.panel} shadow-[0_4px_15px_rgba(0,0,0,0.5)]`}>
                    <div className="text-[11px] font-bold text-center border-b border-[#4ade80]/30 pb-1 mb-2 tracking-[0.2em]">[ SIFIR İNİSİYATİF ]</div>
                    <div className="flex justify-between text-[#ffca28] text-xl px-2"><span>★★★★☆</span><span className="text-[10px] text-[#4ade80] self-center">HAZIRLIK SKORU</span></div>
                    <div className="h-1.5 w-full bg-[#1b5e20] mt-2"><div className="h-full bg-[#4ade80]" style={{ width: '85%' }}></div></div>
                </div>

                <div className={`border ${TACTICAL.border} p-2 text-center ${TACTICAL.panel}`}>
                    <div className="text-[11px] font-bold border-b border-[#4ade80]/30 pb-1 mb-2 tracking-[0.2em]">[ ADİL DÜZEN ]</div>
                    <div className="flex justify-around items-center h-10">
                        <div className="relative w-10 h-10"><svg className="w-full h-full -rotate-[135deg]"><circle cx="18" cy="18" r="16" fill="none" stroke="#2e7d32" strokeWidth="4" /><circle cx="18" cy="18" r="16" fill="none" stroke="#4ade80" strokeWidth="4" strokeDasharray="100" strokeDashoffset={6} /></svg><div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">94%</div></div>
                        <div className="relative w-10 h-10"><svg className="w-full h-full -rotate-[135deg]"><circle cx="18" cy="18" r="16" fill="none" stroke="#689f38" strokeWidth="4" /><circle cx="18" cy="18" r="16" fill="none" stroke="#ffca28" strokeWidth="4" strokeDasharray="100" strokeDashoffset={29} /></svg><div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#ffca28]">71%</div></div>
                    </div>
                </div>

                <div className={`border border-[#81c784]/60 p-2 text-center bg-[#102010] relative`}>
                    <div className="text-[12px] font-black uppercase border-b border-[#81c784]/40 pb-1 mb-1 tracking-widest text-[#81c784]">[ SATIŞ KANALLARI ]</div>
                    <div className="grid grid-cols-4 text-left mt-2 pl-2">
                        <div className="border-r border-[#4ade80]/20">
                            <div className="text-[8px] uppercase text-[#4ade80]/60">E-TİCARET</div>
                            <div className="text-[10px] font-black text-[#ffca28]">₺234K</div>
                        </div>
                        <div className="border-r border-[#4ade80]/20 pl-1">
                            <div className="text-[8px] uppercase text-[#4ade80]/60">MAĞAZA</div>
                            <div className="text-[10px] font-black text-[#4ade80]">₺87K</div>
                        </div>
                        <div className="border-r border-[#4ade80]/20 pl-1">
                            <div className="text-[8px] uppercase text-[#4ade80]/60">TOPTAN</div>
                            <div className="text-[10px] font-black text-[#81d4fa]">₺112K</div>
                        </div>
                        <div className="pl-1">
                            <div className="text-[8px] uppercase text-[#4ade80]/60">CİRO</div>
                            <div className="text-[12px] font-black text-[#69f0ae] drop-shadow-[0_0_5px_currentColor]">₺433K</div>
                        </div>
                    </div>
                </div>

                <div className={`border ${TACTICAL.border} p-2 ${TACTICAL.panel} text-[9px] uppercase tracking-wider`}>
                    <div className={`text-[11px] font-bold border-b border-[#4ade80]/30 pb-1 mb-1 tracking-[0.2em] flex justify-between`}>
                        <span>[ İŞLETME MALİYETİ ]</span> <span className="text-[#ffca28]">GENEL: ₺16.6K</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        <div className="flex justify-between border-b border-[#4ade80]/10"><span>ÜRETİM:</span><span className="text-[#ef5350]">₺4.2K</span></div>
                        <div className="flex justify-between border-b border-[#4ade80]/10"><span>KESİM:</span><span className="text-[#4ade80]">₺1.4K</span></div>
                        <div className="flex justify-between border-b border-[#4ade80]/10"><span>MODELHANE:</span><span className="text-[#4ade80]">₺2.1K</span></div>
                        <div className="flex justify-between border-b border-[#4ade80]/10"><span>İMALAT:</span><span className="text-[#ffca28]">₺4.0K</span></div>
                        <div className="flex justify-between col-span-2 border-b border-[#4ade80]/10"><span>MAĞAZA & OFİS:</span><span className="text-[#4ade80]">₺4.9K</span></div>
                    </div>
                </div>
            </div>

            {/* ANA GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">

                {/* 1. SÜTUN: İZLEME VE RADAR */}
                <div className="flex flex-col gap-3">
                    <div className={`border ${TACTICAL.border} p-2 ${TACTICAL.panel} flex-1 flex flex-col`}>
                        <h2 className={`text-[12px] font-black text-center border-b border-[#4ade80]/30 pb-1 mb-3 uppercase tracking-widest bg-[#4ade80]/10 ${TACTICAL.text}`}>RADAR / NİŞANGAH</h2>
                        <RadarDisplay ajanlar={TUM_AJANLAR} />

                        <div className="mt-3 text-[9px] uppercase font-bold tracking-wider space-y-1 pr-1 h-[210px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e7d32]">
                            <div className="sticky top-0 bg-[#081008] border-b border-[#2e7d32] pb-1 mb-1 text-center text-[#4ade80]/70">AJAN PROTOKOLÜ ({TUM_AJANLAR.length})</div>
                            {TUM_AJANLAR.map((a, i) => (
                                <div key={i} className="flex justify-between items-center bg-black/40 px-1 py-1 mb-1 border-l-2 border-[#4ade80]/40 hover:bg-[#4ade80]/20 transition-colors">
                                    <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 flex-shrink-0 ${a.aktif ? 'bg-[#4ade80] animate-pulse' : 'bg-gray-600'}`} /> {a.isim}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. SÜTUN: İSTİHBARAT & TREND */}
                <div className="flex flex-col gap-3">
                    <div className={`border ${TACTICAL.border} p-2 ${TACTICAL.panel}`}>
                        <h2 className="text-[12px] font-black text-center border-b border-[#4ade80]/30 pb-1 mb-2 uppercase tracking-[0.1em]">GÜNÜN TRENDLERİ (TOP 10)</h2>
                        <div className="text-[10px] font-bold tracking-widest pl-1 space-y-2 mt-3">
                            {trendler.map((t, idx) => (
                                <div key={idx} className={`flex justify-between items-center border-b border-[#4ade80]/10 pb-1 cursor-default transition-all ${idx < 3 ? 'text-[#69f0ae] drop-shadow-[0_0_2px_#69f0ae]' : 'text-[#4ade80]/80'}`}>
                                    <span>{t.id} {t.up ? '↑' : '↓'} {t.isim}</span>
                                    <span className="text-[#ffca28]/80 text-[11px]">{"●".repeat(t.level)}{"○".repeat(5 - t.level)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`border ${TACTICAL.border} p-2 ${TACTICAL.panel} h-40 relative flex flex-col group`}>
                        <div className="flex justify-between items-center border-b border-[#4ade80]/30 pb-1 z-10 bg-[#081008]">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest">KAYNAK TRENDİ CANLI</h2>
                            <div className="flex gap-2 text-[7px] font-bold">
                                <span className={TACTICAL.cyan}>— İŞÇİLİK</span>
                                <span className={TACTICAL.amber}>— MALZEME</span>
                                <span className={TACTICAL.red}>— FİRE</span>
                            </div>
                        </div>

                        {/* Veri Ölçekleri (Eksenler) */}
                        <div className="absolute left-1 top-8 bottom-4 w-4 flex flex-col justify-between text-[6px] text-[#4ade80]/50 font-bold z-10">
                            <span>15K</span><span>10K</span><span>5K</span><span>0</span>
                        </div>
                        <div className="absolute bottom-1 left-6 right-2 flex justify-between text-[6px] text-[#4ade80]/50 font-bold z-10 border-t border-[#4ade80]/20 pt-1">
                            <span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>CANLI</span>
                        </div>

                        <div className="absolute inset-0 left-6 bottom-4 top-8 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 30px, #4ade80 30px, #4ade80 31px), repeating-linear-gradient(0deg, transparent, transparent 15px, #4ade80 15px, #4ade80 16px)' }} />

                        <svg className="absolute inset-0 left-6 bottom-4 top-8 w-[calc(100%-1.5rem)] h-[calc(100%-3rem)] group-hover:drop-shadow-[0_0_4px_#4ade80] transition-all" preserveAspectRatio="none" viewBox="0 0 100 40">
                            <path d="M0,25 C15,20 30,35 45,25 C60,15 75,35 90,25 C100,20 100,20 100,20" fill="none" stroke="#81d4fa" strokeWidth="1.5" className="animate-[dash_8s_linear_infinite]" strokeDasharray="300" />
                            <path d="M0,15 C20,30 35,10 50,20 C65,30 80,10 100,25" fill="none" stroke="#ffca28" strokeWidth="1.5" className="animate-[dash_12s_linear_infinite] opacity-80" strokeDasharray="300" />
                            <path d="M0,35 C20,20 40,40 60,15 C80,-5 90,30 100,10" fill="none" stroke="#ef5350" strokeWidth="1.5" className="opacity-70 animate-pulse" />
                        </svg>
                    </div>
                </div>

                {/* 3. SÜTUN: MERKEZ KAMERA, ÜRETİM PANELİ, TERMİNAL KISMİ */}
                <div className="flex flex-col gap-3">
                    <div className={`border ${TACTICAL.border} ${TACTICAL.panel} p-2 flex flex-col`}>
                        <h2 className="text-[12px] font-black text-center border-b border-[#4ade80]/30 pb-1 mb-2 uppercase tracking-widest text-[#ffca28]">ÜRETİM PANELİ</h2>
                        <div className="text-[10px] font-bold space-y-1 mb-2">
                            <div className="flex justify-between border-b border-[#4ade80]/20 pb-0.5"><span>Üretimde Olanlar:</span> <span className="text-[#69f0ae]">847 Adet</span></div>
                            <div className="flex justify-between border-b border-[#4ade80]/20 pb-0.5"><span>Teslimata Hazır:</span> <span className="text-[#ffca28]">312 Adet</span></div>
                            <div className="flex justify-between pb-0.5"><span>Hata/Fire Oranı:</span> <span className="text-[#4ade80]">%2.4</span></div>
                        </div>
                        <div className="relative w-full h-3 bg-[#112211] border border-[#4ade80]/40 mt-1">
                            <div className="absolute top-0 left-0 h-full bg-[#4ade80]" style={{ width: '78%' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-[7px] text-black font-black mix-blend-difference">KAPASİTE DOLULUK %78</div>
                        </div>
                    </div>

                    <div className={`border border-[#4ade80]/60 bg-black aspect-video relative flex items-center justify-center overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.8)]`}>
                        <div className="absolute inset-0 bg-[#4ade80]/10 mix-blend-color-burn" />
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJyZ2JhKDAsMCwwLDApIiAvPgo8cGF0aCBkPSJNMCAwTDAgNEMwIDQgNCA0IDQgNEwwIDAiIGZpbGw9InJnYmEoMCwyNTUsMCwwLjAzKSIgLz4KPC9zdmc+')] opacity-50 pointer-events-none" />
                        <div className="grid grid-cols-2 grid-rows-2 w-full h-full p-1 gap-1">
                            <div className="border border-[#4ade80]/20 bg-[#051105] flex items-end p-1"><span className="text-[6px] text-[#4ade80]">CAM-01 [DEPO]</span></div>
                            <div className="border border-[#4ade80]/20 bg-[#051105] flex items-end p-1 relative"><span className="text-[6px] text-[#4ade80]">CAM-02 [KESİM]</span><div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#ef5350] rounded-full animate-pulse" /></div>
                            <div className="border border-[#4ade80]/20 bg-[#051105] flex items-end p-1"><span className="text-[6px] text-[#4ade80]">CAM-03 [ÜRETİM]</span></div>
                            <div className="border border-[#4ade80]/20 bg-[#051105] flex items-end p-1"><span className="text-[6px] text-[#4ade80]">CAM-04 [DIŞ]</span></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="border border-[#ef5350]/30 w-16 h-16 rounded-full flex items-center justify-center"><Crosshair className="text-[#ef5350]/50" size={30} strokeWidth={1} /></div></div>
                    </div>

                    <div className="border border-[#ef5350]/70 bg-[#ef5350]/10 p-2 shadow-[0_0_10px_rgba(239,83,80,0.2)]">
                        <div className="flex items-center gap-1 border-b border-[#ef5350]/40 pb-1 mb-1">
                            <AlertTriangle size={14} className="text-[#ef5350] animate-ping absolute" />
                            <AlertTriangle size={14} className="text-[#ef5350] relative" />
                            <h2 className="text-[10px] font-black text-[#ef5350] uppercase tracking-widest ml-1">KÜÇÜLTÜLMÜŞ RİSK ALANI</h2>
                        </div>
                        <div className="text-[9px] text-[#ef5350] font-bold pl-1 truncate">■ SİP#4892 gecikmesi tespit edildi.</div>
                    </div>

                    {/* V2 DEKİ GÜZEL TERMİNALİ BURAYA KÜÇÜK VE ETKİLİ FORMATTA GERİ GETİRDİK */}
                    <div className="border border-[#4ade80]/40 bg-black p-2 flex-1 relative h-32 flex flex-col">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#81c784] border-b border-[#4ade80]/30 pb-1 mb-1">NİZAM TELSİZ / TERMİNAL LOG</h2>
                        <div className="overflow-y-auto space-y-1 text-[8px] flex-1 scrollbar-thin scrollbar-thumb-[#2e7d32]">
                            {terminalLoglar.map((l, i) => (
                                <div key={i} className={`flex gap-1 ${l.includes('YARGIÇ') || l.includes('KAMERA') ? 'text-[#ffca28]' : 'text-[#4ade80]'}`}>
                                    <span className="opacity-60">{l.split(' ')[0]}</span>
                                    <span>{l.substring(l.indexOf(' ') + 1)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* 4. SÜTUN: PERSONEL İMPARATORLUĞU (GÜNLÜK 10 / HAFTALIK 10) VE ADALETLİ ÜCRET DİBİ */}
                <div className="flex flex-col gap-3">
                    <div className={`border ${TACTICAL.border} bg-[#061006] flex-1 flex flex-col p-2`}>
                        <div className="flex-1 mb-[2px]">
                            <h2 className="text-[11px] font-black uppercase text-center bg-[#4ade80]/15 py-1 mb-2 border-b border-[#4ade80]/30 drop-shadow-[0_0_2px_#4ade80]">GÜNÜN EN İYİ 10 PERSONELİ</h2>
                            <div className="space-y-1 text-[9px] font-bold pb-2">
                                {gununPersonelleri10.map((p, i) => (
                                    <div key={i} className="flex justify-between border-b border-[#4ade80]/10 pb-0.5">
                                        <span className={i < 3 ? "text-[#69f0ae]" : "text-[#4ade80]/80"}>{i + 1}. {p.n}</span>
                                        <span className="flex gap-2"><span className="text-[#4ade80]/50">[{p.birim}]</span> <span className={TACTICAL.cyan}>{p.s}P</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 border-t-2 border-dashed border-[#4ade80]/30 pt-2">
                            <h2 className="text-[11px] font-black uppercase text-center bg-[#102010] py-1 mb-2 border border-[#2e7d32] text-[#ffca28]">HAFTALIK TOP 10 PERSONEL</h2>
                            <div className="space-y-1 text-[9px] font-bold">
                                {haftaninPersonelleri10.map((p, i) => (
                                    <div key={i} className="flex justify-between border-b border-[#ffca28]/10 pb-0.5">
                                        <span className={i < 3 ? "text-[#ffd54f]" : "text-[#ffca28]/80"}>{i + 1}. {p.n}</span>
                                        <span className="flex gap-2"><span className="text-[#ffca28]/50">[{p.birim}]</span> <span className={TACTICAL.amber}>{p.s}P</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ADALETLİ ÜCRET TAM SAĞ DİPTE */}
                    <div className={`border border-[#ffca28]/60 p-2 text-center bg-[#151205] relative shadow-[0_-5px_15px_rgba(255,202,40,0.1)]`}>
                        <div className="text-[12px] font-black uppercase text-[#ffca28] border-b border-[#ffca28]/30 pb-1 mb-1 tracking-[0.2em]">[ ADALETLİ ÜCRET ]</div>
                        <div className="text-[10px] text-[#ffca28]/70 uppercase tracking-widest mt-1">Sistemsel Aylık Hak Ediş</div>
                        <div className="text-xl md:text-2xl font-black text-[#ffca28] mt-1 drop-shadow-[0_0_8px_#ffca28]">₺1.2M</div>
                        <div className="h-0.5 w-full bg-[#ffca28]/50 mt-1" />
                    </div>
                </div>
            </div>

            {/* ALT YÖNETİM BUTONLARI */}
            <div className={`mt-2 pt-2 border-t ${TACTICAL.border}`}>
                <div className="grid grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-1.5 pb-6">
                    {MILITARY_NAV.map((mod, i) => (
                        <Link href={mod.link} key={i}>
                            <div className={`border bg-[#050B05] text-[10px] md:text-xl font-black uppercase text-center py-2 transition-all cursor-pointer relative overflow-hidden group
                                ${['İSTİHBARAT', 'ÜRETİM', 'SİPARİŞLER'].includes(mod.name) ? 'border-[#ffca28]/60 text-[#ffca28] hover:bg-[#ffca28] hover:text-[#000]' :
                                    'border-[#2e7d32] text-[#4ade80] hover:border-[#4ade80] hover:bg-[#4ade80]/20 hover:shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:text-white'}`}>
                                <span className="relative z-10 tracking-wider font-mono drop-shadow-[0_0_2px_currentColor]">{mod.name}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @keyframes dash { to { stroke-dashoffset: -600; } }
            `}</style>
        </div>
    );
}

export default KarargahMainContainer;
