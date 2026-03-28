'use client';
import { Target, Shield, AlertTriangle, Camera, ChevronRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useKarargah } from '../hooks/useKarargah';
import { useState, useEffect, useRef } from 'react';

// ████████████████████████████████████████████████████████████████████████
// [ NİZAM ] SİBER KARARGAH — V2.1 TACTICAL GREEN (Gelişmiş Organizasyon)
// ████████████████████████████████████████████████████████████████████████

// MILITARY COLORS THEME (Saf Askeri Tonlar)
const TACTICAL = {
    bg: "bg-[#050905]",        // Zemin Koyu Askeri
    panel: "bg-[#091109]",     // Panel İçi
    border: "border-[#4ade80]/40", // Taktiksel Yeşil Çerçeve
    text: "text-[#4ade80]",    // Ana Fosforlu Yazı
    textDim: "text-[#4ade80]/60",
    amber: "text-[#ffca28]",   // Uyarı / Para Rengi (Sıcak)
    red: "text-[#ef5350]",     // Alarm
    cyan: "text-[#81d4fa]"     // Su Mavisi (Özel Veriler)
};

const MILITARY_NAV = [
    { name: 'AJANLAR', link: '/ajanlar' },
    { name: 'AR-GE', link: '/arge' },
    { name: 'DENETÇİ', link: '/denetmen' }, // Modified name
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

// Tüm Ajanların ve Sistemlerin Listesi (20 Asker/Ajan)
const TUM_AJANLAR = [
    { isim: "NİZAMBOT", tip: 'komuta', aktif: true },
    { isim: "AR-GE BOTU", tip: 'sinyal', aktif: true },
    { isim: "YARGIÇ", tip: 'analiz', aktif: true },
    { isim: "KAŞİF (Hermes)", tip: 'istihbarat', aktif: true },
    { isim: "KÖPRÜ", tip: 'baglanti', aktif: true },
    { isim: "VİSİON", tip: 'gorus', aktif: true },
    { isim: "STOK ALARM", tip: 'hata', aktif: true },
    { isim: "MALİYET AJAN", tip: 'analiz', aktif: true },
    { isim: "GECİKME", tip: 'sinyal', aktif: false },
    { isim: "BİNGO BOTU", tip: 'bekleme', aktif: false },
    { isim: "KAMERA SAYAÇ", tip: 'bekleme', aktif: false },
    { isim: "TRENDYOL_S", tip: 'veri', aktif: true },
    { isim: "INSTA_SP", tip: 'veri', aktif: true },
    { isim: "TİKTOK_S", tip: 'veri', aktif: true },
    { isim: "S-ÖDENEK", tip: 'finans', aktif: true }
];

// Su gibi akan yumuşak dalga çizgileri (Path)
const smoothPath1 = "M0,25 C15,20 30,35 45,25 C60,15 75,35 90,25 C100,20 100,20 100,20";
const smoothPath2 = "M0,15 C20,30 35,10 50,20 C65,30 80,10 100,25";
const smoothPath3 = "M0,35 C20,20 40,40 60,15 C80,-5 90,30 100,10";
const smoothPath4 = "M0,20 C25,5 50,45 75,10 C85,-5 95,20 100,20";


const RadarDisplay = ({ ajanlar }) => {
    return (
        <div className={`relative w-full aspect-square border ${TACTICAL.border} ${TACTICAL.bg} flex items-center justify-center p-3 shadow-[inset_0_0_40px_rgba(74,222,128,0.1)] overflow-hidden`}>
            {/* Arka Plan Radar Ağı */}
            <div className={`absolute inset-0 opacity-20`} style={{ backgroundImage: 'radial-gradient(circle at center, #4ade80 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

            {/* Halkalar */}
            <div className={`absolute inset-[5%] border border-[#4ade80]/40 rounded-full`} />
            <div className={`absolute inset-[25%] border border-[#4ade80]/30 rounded-full`} />
            <div className={`absolute inset-[45%] border border-[#4ade80]/20 rounded-full`} />
            <div className={`absolute inset-[65%] border border-[#4ade80]/15 rounded-full`} />

            {/* Eksenler */}
            <div className={`absolute w-full h-[1px] bg-[#4ade80]/40`} />
            <div className={`absolute h-full w-[1px] bg-[#4ade80]/40`} />

            <div className="absolute flex items-center justify-center">
                <Target size={18} className="text-[#4ade80] opacity-50" />
            </div>

            {/* Sweep */}
            <div className="absolute inset-0 rounded-full origin-center animate-[spin_4s_linear_infinite] mix-blend-screen"
                style={{ background: 'conic-gradient(from 0deg, transparent 60%, rgba(74, 222, 128, 0.4) 100%)' }} />

            {/* 15 Farklı Ajan Sinyali (Askeri Radar Konumu) */}
            {TUM_AJANLAR.map((a, i) => {
                const angle = (i * 24) * (Math.PI / 180);
                const radius = 25 + (i % 5) * 10; // Daha dengeli dağılım %25 ile %65 arası
                const top = 50 + radius * Math.sin(angle);
                const left = 50 + radius * Math.cos(angle);

                let colorClass = "#4ade80"; // Yeşil (Aktif/Genel)
                if (a.tip === 'hata') colorClass = "#ef5350";
                if (a.tip === 'analiz' || a.tip === 'finans') colorClass = "#ffca28";
                if (a.tip === 'veri' || a.tip === 'istihbarat') colorClass = "#81d4fa";
                if (a.tip === 'bekleme') colorClass = "gray";

                return (
                    <div key={i} className={`absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000`}
                        style={{ top: `${top}%`, left: `${left}%` }}>
                        <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor] ${a.aktif ? 'animate-[pulse_1.5s_infinite]' : 'opacity-40'}`} style={{ backgroundColor: colorClass, color: colorClass }} />
                    </div>
                );
            })}
        </div>
    );
};

export function KarargahMainContainer() {
    const { kullanici } = useAuth();
    const [saat, setSaat] = useState('');
    const ping = Math.floor(Math.random() * 8) + 8;

    // Saat
    useEffect(() => {
        const iv = setInterval(() => {
            const now = new Date();
            setSaat(`${now.toLocaleDateString('tr-TR')} | ${now.toLocaleTimeString('tr-TR')}`);
        }, 1000);
        return () => clearInterval(iv);
    }, []);

    // GÜNÜN TRENDLERİ KOMPLEKS LİSTE (Top 10)
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

    // PERSONEL LİSTELERİ
    const gununPersonelleri = [
        { n: "Ali Rıza (Üretim)", s: 98 }, { n: "Mehmet (Kesim)", s: 95 }, { n: "Ayşe (Kalite)", s: 91 },
        { n: "Fatma (Lojistik)", s: 89 }, { n: "Hasan (Depo)", s: 88 }
    ];
    const haftaninPersonelleri = [
        { n: "Büşra (Modelhane)", s: 480 }, { n: "Engin (Merkez)", s: 450 }, { n: "Zeynep (Finans)", s: 420 },
        { n: "Burak (Teknik)", s: 405 }, { n: "Kemal (Üretim)", s: 390 }
    ];

    return (
        <div className={`min-h-screen ${TACTICAL.bg} ${TACTICAL.text} font-mono p-4`} style={{ fontFamily: '"Courier New", Courier, monospace', userSelect: 'none' }}>

            {/* ÜST BAŞLIK (HEADER) */}
            <div className={`flex items-center justify-between border-b-2 ${TACTICAL.border} pb-2 mb-4 bg-gradient-to-r from-transparent via-[#091509] to-transparent`}>
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

            {/* İLK METRİK SATIRI (Üst 4 Ana Tepe) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {/* 1. SIFIR İNİSİYATİF */}
                <div className={`border ${TACTICAL.border} p-2 ${TACTICAL.panel} shadow-[0_4px_15px_rgba(0,0,0,0.5)]`}>
                    <div className="text-[10px] font-bold uppercase border-b border-[#4ade80]/30 pb-1 mb-2 tracking-[0.2em]">[ SIFIR İNİSİYATİF ]</div>
                    <div className="flex justify-between text-[#ffca28] text-xl drop-shadow-[0_0_5px_currentColor]"><span>★★★★☆</span><span className="text-[10px] text-[#4ade80] self-center">HAZIRLIK SKORU</span></div>
                    <div className="h-1 w-full bg-[#1b5e20] mt-2"><div className="h-full bg-gradient-to-r from-[#81c784] to-[#4ade80]" style={{ width: '85%' }}></div></div>
                </div>

                {/* 2. ADİL DÜZEN */}
                <div className={`border ${TACTICAL.border} p-2 text-center ${TACTICAL.panel}`}>
                    <div className="text-[10px] font-bold uppercase border-b border-[#4ade80]/30 pb-1 mb-2 tracking-[0.2em]">[ ADİL DÜZEN ]</div>
                    <div className="flex justify-around items-center h-10">
                        <div className="relative w-10 h-10"><svg className="w-full h-full -rotate-90"><circle cx="18" cy="18" r="16" fill="none" stroke="#2e7d32" strokeWidth="3" /><circle cx="18" cy="18" r="16" fill="none" stroke="#4ade80" strokeWidth="3" strokeDasharray="100" strokeDashoffset={6} /></svg><div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">94%</div></div>
                        <div className="relative w-10 h-10"><svg className="w-full h-full -rotate-90"><circle cx="18" cy="18" r="16" fill="none" stroke="#689f38" strokeWidth="3" /><circle cx="18" cy="18" r="16" fill="none" stroke="#ffca28" strokeWidth="3" strokeDasharray="100" strokeDashoffset={29} /></svg><div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#ffca28]">71%</div></div>
                    </div>
                </div>

                {/* 3. BÜYÜTÜLMÜŞ SATIŞ KANALLARI (Para buradan geldiği için yoğun/büyük) */}
                <div className={`border border-[#81c784]/60 p-2 text-center bg-[#102010] relative overflow-hidden group`}>
                    <div className="absolute inset-0 bg-[#4ade80]/5 group-hover:bg-[#4ade80]/10 transition-colors" />
                    <div className="text-[11px] font-black uppercase border-b border-[#81c784]/40 pb-1 mb-1 tracking-widest text-[#81c784] drop-shadow-[0_0_3px_#81c784]">[ SATIŞ KANALLARI ]</div>
                    <div className="grid grid-cols-3 text-left mt-2">
                        <div className="border-r border-[#4ade80]/20 pl-1">
                            <div className="text-[8px] uppercase text-[#4ade80]/60">E-TİCARET</div>
                            <div className="text-[12px] font-black text-[#ffca28]">₺234K</div>
                        </div>
                        <div className="border-r border-[#4ade80]/20 pl-2">
                            <div className="text-[8px] uppercase text-[#4ade80]/60">MAĞAZA</div>
                            <div className="text-[12px] font-black text-[#4ade80]">₺87K</div>
                        </div>
                        <div className="pl-2">
                            <div className="text-[8px] uppercase text-[#4ade80]/60">TOPLAM CİRO</div>
                            <div className="text-[14px] font-black text-[#69f0ae] drop-shadow-[0_0_5px_currentColor]">₺321K</div>
                        </div>
                    </div>
                </div>

                {/* 4. İŞLETME MALİYETİ (Bölüm Bölüm Ayrı) */}
                <div className={`border ${TACTICAL.border} p-2 ${TACTICAL.panel} text-[9px] uppercase tracking-wider`}>
                    <div className={`text-[10px] font-bold border-b border-[#4ade80]/30 pb-1 mb-2 tracking-[0.2em] flex justify-between`}>
                        <span>[ İŞLETME MALİYETİ ]</span> <span className="text-[#ffca28]">GENEL: ₺11.6K</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <div className="flex justify-between border-b border-[#4ade80]/10"><span>ÜRETİM:</span><span className="text-[#ef5350]">₺3.2K</span></div>
                        <div className="flex justify-between border-b border-[#4ade80]/10"><span>KESİM:</span><span className="text-[#4ade80]">₺1.4K</span></div>
                        <div className="flex justify-between border-b border-[#4ade80]/10"><span>MODELHANE:</span><span className="text-[#4ade80]">₺2.1K</span></div>
                        <div className="flex justify-between border-b border-[#4ade80]/10"><span>MAĞAZA:</span><span className="text-[#ffca28]">₺4.9K</span></div>
                    </div>
                </div>
            </div>

            {/* ANA ALT GRID (4 SÜTUN) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">

                {/* === SÜTUN 1: İZLEME VE RADAR === */}
                <div className="flex flex-col gap-3">
                    <div className={`border ${TACTICAL.border} p-2 ${TACTICAL.panel} flex-1 flex flex-col`}>
                        <h2 className={`text-[11px] font-black text-center border-b border-[#4ade80]/30 pb-1 mb-3 uppercase tracking-widest bg-[#4ade80]/10 ${TACTICAL.text}`}>RADAR / NİŞANGAH</h2>
                        <RadarDisplay ajanlar={TUM_AJANLAR} />

                        <div className="mt-3 text-[9px] uppercase font-bold tracking-wider space-y-1 pr-1 h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2e7d32]">
                            <div className="sticky top-0 bg-[#091109] border-b border-[#2e7d32] pb-1 mb-1 text-center text-[#4ade80]/70">AKTİF AJAN LİSTESİ ({TUM_AJANLAR.length})</div>
                            {TUM_AJANLAR.map((a, i) => (
                                <div key={i} className="flex justify-between items-center bg-[#000000]/30 px-1 py-0.5 mb-1 hover:bg-[#4ade80]/20 transition-colors">
                                    <span className="flex items-center gap-1.5"><span className={`w-1 h-1 rounded flex-shrink-0 ${a.aktif ? 'bg-[#4ade80] animate-pulse' : 'bg-gray-600'}`} /> {a.isim}</span>
                                    <span className="text-[8px] opacity-70">[{a.tip}]</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* === SÜTUN 2: İSTİHBARAT & TRENDLER === */}
                <div className="flex flex-col gap-3">
                    <div className={`border ${TACTICAL.border} p-2 ${TACTICAL.panel}`}>
                        <h2 className="text-[11px] font-bold text-center border-b border-[#4ade80]/30 pb-1 mb-2 uppercase tracking-[0.1em]">GÜNÜN TRENDLERİ (TOP 10)</h2>
                        <div className="text-[8px] flex justify-center gap-1 mb-2 bg-[#4ade80]/10 py-1 font-bold opacity-70">
                            [KENDİ] | [TRENDYOL] | [INSTAGRAM] | [TİKTOK] | [AMAZON]
                        </div>
                        <div className="space-y-1.5 text-[9px] font-bold tracking-widest pl-1">
                            {trendler.map((t, idx) => (
                                <div key={idx} className={`flex justify-between items-center border-l-2 pl-1 border-[#4ade80]/20 hover:border-[#4ade80] hover:bg-[#4ade80]/5 cursor-default transition-all ${idx < 3 ? 'text-[#69f0ae] drop-shadow-[0_0_2px_#69f0ae]' : 'text-[#4ade80]/80'}`}>
                                    <span>{t.id} {t.up ? '↑' : '↓'} {t.isim}</span>
                                    <span className="text-[#ffca28]/80 text-[10px]">{"●".repeat(t.level)}{"○".repeat(5 - t.level)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* YUMUŞATILMIŞ / SU GİBİ AKAN SVG TREND GRAFİĞİ */}
                    <div className={`border ${TACTICAL.border} p-2 ${TACTICAL.panel} h-36 relative overflow-hidden flex flex-col group`}>
                        <div className="flex justify-between items-center border-b border-[#4ade80]/30 pb-1 z-10 bg-[#091109] drop-shadow">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest">KAYNAK TRENDİ (CANLI)</h2>
                            <div className="flex gap-2 text-[7px] font-bold">
                                <span className={TACTICAL.cyan}>— İŞÇİLİK</span>
                                <span className={TACTICAL.amber}>— MALZEME</span>
                                <span className={TACTICAL.red}>— FİRE</span>
                            </div>
                        </div>

                        <div className="absolute inset-0 top-6 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, #4ade80 20px, #4ade80 21px)' }} />

                        {/* Smooth Paths (Su gibi curve'ler) */}
                        <svg className="absolute inset-0 w-full h-full pt-6 group-hover:drop-shadow-[0_0_4px_#4ade80] transition-all" preserveAspectRatio="none" viewBox="0 0 100 40">
                            {/* Cyan (İşçilik) */}
                            <path d={smoothPath1} fill="none" stroke="#81d4fa" strokeWidth="1.5" className="animate-[dash_6s_linear_infinite]" strokeDasharray="300" strokeLinecap="round" />
                            {/* Amber (Malzeme) */}
                            <path d={smoothPath2} fill="none" stroke="#ffca28" strokeWidth="1.5" className="animate-[dash_10s_linear_infinite] opacity-80" strokeDasharray="300" strokeLinecap="round" />
                            {/* Red (Fire) */}
                            <path d={smoothPath3} fill="none" stroke="#ef5350" strokeWidth="1.5" className="opacity-70 animate-pulse" strokeLinecap="round" />
                            {/* Green Base (Kapasite) */}
                            <path d={smoothPath4} fill="none" stroke="#4ade80" strokeWidth="2" className="shadow-[0_0_10px_#4ade80] opacity-50" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                {/* === SÜTUN 3: MERKEZE ALINAN KAMERA & ÜRETİM === */}
                <div className="flex flex-col gap-3">
                    {/* MERKEZ KAMERA SİSTEMİ */}
                    <div className={`border border-[#4ade80]/60 bg-black aspect-video relative flex items-center justify-center overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.8)]`}>
                        <div className="absolute inset-0 bg-[#4ade80]/10 mix-blend-color-burn" />
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJyZ2JhKDAsMCwwLDApIiAvPgo8cGF0aCBkPSJNMCAwTDAgNEMwIDQgNCA0IDQgNEwwIDAiIGZpbGw9InJnYmEoMCwyNTUsMCwwLjAzKSIgLz4KPC9zdmc+')] opacity-50 pointer-events-none" />

                        {/* Kamera Gridleri (Güvenlik Odası) */}
                        <div className="grid grid-cols-2 grid-rows-2 w-full h-full p-1 gap-1">
                            <div className="border border-[#4ade80]/20 flex flex-col justify-end p-1 pb-0 bg-[#051105]">
                                <span className="text-[6px] text-[#4ade80]">CAM-01 [DEPO]</span>
                            </div>
                            <div className="border border-[#4ade80]/20 flex flex-col justify-end p-1 pb-0 bg-[#051105] relative">
                                <span className="text-[6px] text-[#4ade80]">CAM-02 [KESİM]</span>
                                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#ef5350] rounded-full animate-pulse" /> {/* Kayıt/Alarm işareti */}
                            </div>
                            <div className="border border-[#4ade80]/20 flex flex-col justify-end p-1 pb-0 bg-[#051105]">
                                <span className="text-[6px] text-[#4ade80]">CAM-03 [ÜRETİM]</span>
                            </div>
                            <div className="border border-[#4ade80]/20 flex flex-col justify-end p-1 pb-0 bg-[#051105]">
                                <span className="text-[6px] text-[#4ade80]">CAM-04 [DIŞ]</span>
                            </div>
                        </div>

                        {/* Central Target Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="border border-[#ef5350]/30 w-16 h-16 rounded-full flex items-center justify-center">
                                <Crosshair className="text-[#ef5350]/50" size={30} strokeWidth={1} />
                            </div>
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 px-2 py-0.5 border border-[#4ade80]/50 whitespace-nowrap">
                            <span className="text-[10px] text-[#4ade80] font-bold tracking-[0.2em] animate-pulse uppercase drop-shadow-[0_0_5px_#4ade80]">Sistem Çevrimiçi</span>
                        </div>
                    </div>

                    {/* KÜÇÜLTÜLMÜŞ, DAHA DAR KRİTİK ALARM */}
                    <div className="border border-[#ef5350]/70 bg-[#ef5350]/10 p-2 shadow-[0_0_10px_rgba(239,83,80,0.2)]">
                        <div className="flex items-center gap-1 border-b border-[#ef5350]/40 pb-1 mb-1">
                            <AlertTriangle size={14} className="text-[#ef5350] animate-ping absolute" />
                            <AlertTriangle size={14} className="text-[#ef5350] relative" />
                            <h2 className="text-[10px] font-black text-[#ef5350] uppercase tracking-widest ml-1">ACİL - 3 HATA</h2>
                        </div>
                        <div className="text-[8px] text-[#ef5350] space-y-1 font-bold pl-1 pt-1">
                            <div className="truncate">■ SİP#4892 gecikme</div>
                            <div className="truncate">■ Gabardin Kumaş Yetersiz</div>
                            <div className="truncate">■ Kesim-Bant uyuşmazlığı</div>
                        </div>
                    </div>

                    {/* ÜRETİM İSTATİSTİKLERİ & MALİYET */}
                    <div className={`border ${TACTICAL.border} p-2 ${TACTICAL.panel} flex-1`}>
                        <h2 className="text-[10px] font-bold border-b border-[#4ade80]/30 pb-1 mb-1 uppercase text-center">ÜRETİM PANELİ</h2>
                        <div className="flex justify-between text-[9px] uppercase tracking-wider mb-2 bg-[#1b5e20]/40 px-1">
                            <span>Üretilen: 847</span> <span className="text-[#ffca28]">Hedef: 312</span> <span className="text-[#ef5350]">Fark: 535</span>
                        </div>
                        {/* Mini bar chart */}
                        <div className="flex items-end justify-between px-2 h-10 gap-1 mt-3">
                            <div className="w-1/4 bg-[#4ade80]" style={{ height: '70%' }}></div>
                            <div className="w-1/4 bg-[#81c784]" style={{ height: '40%' }}></div>
                            <div className="w-1/4 bg-[#ffca28]" style={{ height: '60%' }}></div>
                            <div className="w-1/4 bg-[#4ade80]" style={{ height: '90%' }}></div>
                        </div>
                        <div className="text-center text-[7px] text-[#4ade80]/60 uppercase mt-1">Son 4 Gün (Lot Bazlı)</div>
                    </div>
                </div>

                {/* === SÜTUN 4: YENİ PERSONEL ALANI & DİP VURGULAR === */}
                <div className="flex flex-col gap-3">

                    {/* PERSONEL LİSTESİ (Çifte Başlıklı) */}
                    <div className={`border ${TACTICAL.border} p-0 ${TACTICAL.panel} flex-1 flex flex-col`}>
                        {/* GÜNÜN PERSONELİ */}
                        <div className="flex-1 border-b border-[#4ade80]/30 p-2">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-center bg-[#4ade80]/15 mb-2 py-0.5">🏆 GÜNÜN EN İYİ 5 PERSONELİ</h2>
                            <div className="space-y-1.5 text-[9px] font-bold">
                                {gununPersonelleri.map((p, i) => (
                                    <div key={i} className="flex justify-between border-l-2 border-[#4ade80] pl-1">
                                        <span className="text-[#81c784]">{i + 1}. {p.n}</span>
                                        <span className={TACTICAL.cyan}>{p.s} PUAN</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* HAFTALIK / AYLIK PERSONEL */}
                        <div className="flex-1 p-2">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-center bg-[#102010] border border-[#2e7d32] mb-2 py-0.5">🌟 HAFTALIK/AYLIK TOP 5</h2>
                            <div className="space-y-1.5 text-[9px] font-bold">
                                {haftaninPersonelleri.map((p, i) => (
                                    <div key={i} className="flex justify-between border-l-2 border-[#ffca28] pl-1">
                                        <span className="text-[#4ade80]/80">{i + 1}. {p.n}</span>
                                        <span className={TACTICAL.amber}>{p.s} P</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SIKIŞTIRILMIŞ CANLI TERMİNAL LOG (Sadece 3-4 satır akar) */}
                    <div className="border border-[#2e7d32] bg-[#000000] p-1.5 relative overflow-hidden h-20">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none" />
                        <div className="text-[7px] text-[#4ade80]/60 uppercase border-b border-[#2e7d32] pb-0.5 mb-1 text-right">Terminal Log (Akış)</div>
                        <div className="text-[8px] space-y-0.5 font-mono animate-[fadeIn_1s] text-[#4ade80]">
                            <div><span className="opacity-50">[06:42:11]</span> SYSTEM_OPT: Ağ protokolü onaylandı.</div>
                            <div className="text-[#ffca28]"><span className="opacity-50">[06:42:12]</span> WARN: Modelhane yoğunluğu artıyor.</div>
                            <div><span className="opacity-50">[06:42:15]</span> INF: Tüm ajanlar izlemede, siber çevre temiz.</div>
                        </div>
                    </div>

                    {/* ADALETLİ ÜCRET (Sağ alt dip noktasında, net bir kutu) */}
                    <div className={`border border-[#ffca28]/60 p-2 text-center bg-[#151205] relative group`}>
                        <div className="absolute inset-0 bg-[#ffca28]/5 animate-pulse" />
                        <div className="text-[11px] font-black uppercase text-[#ffca28] border-b border-[#ffca28]/30 pb-1 mb-1 tracking-[0.2em]">[ ADALETLİ ÜCRET ]</div>
                        <div className="text-[10px] text-[#ffca28]/70 uppercase tracking-widest mt-1">Aylık Net Maaş Ödemesi</div>
                        <div className="text-xl md:text-2xl font-black text-[#ffca28] mt-1 drop-shadow-[0_0_8px_#ffca28]">₺1.2M</div>
                        <div className="h-0.5 w-full bg-[#ffca28]/50 mt-2" />
                    </div>

                </div>
            </div>

            {/* ALT NAVIGATION MENÜSÜ (Askeri Butonlar - Yumuşak Glow) */}
            <div className={`mt-2 pt-2 border-t ${TACTICAL.border} relative`}>
                {/* Alt Metrik Barı (Kaynaklar ve Kapasite) */}
                <div className="flex justify-between items-end mb-2">
                    <div className="flex gap-4 text-[9px] text-[#4ade80]/80 uppercase tracking-widest font-bold items-center">
                        <span className="bg-[#4ade80]/20 px-2 py-0.5 text-[#4ade80] border border-[#2e7d32]">RESOURCES</span>
                        <span className="flex gap-1 items-center">PERSONEL <span className="text-[#4ade80] tracking-[0.2em]">●●●○○</span></span>
                        <span className="flex gap-1 items-center">KAPASİTE <span className="text-[#ffca28] tracking-[0.2em] drop-shadow-[0_0_2px_currentColor]">●●●●○</span></span>
                        <span className="flex gap-1 items-center">API <span className="text-[#4ade80] tracking-[0.2em]">●●●●●</span></span>
                    </div>
                    <div className="text-[8px] text-[#4ade80]/50 uppercase hidden md:block">
                        ▶ HAREKAT YETKİLERİ AÇIK
                    </div>
                </div>

                {/* 2 Sıra Full Genişlik Butonlar */}
                <div className="grid grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-1.5 pb-6">
                    {MILITARY_NAV.map((mod, i) => (
                        <Link href={mod.link} key={i}>
                            <div className={`border bg-[#050B05] text-[10px] md:text-xs font-black uppercase text-center py-2 transition-all cursor-pointer relative overflow-hidden group
                                ${['İSTİHBARAT', 'ÜRETİM', 'SİPARİŞLER'].includes(mod.name) ? 'border-[#ffca28]/60 text-[#ffca28] hover:bg-[#ffca28] hover:text-[#000]' :
                                    'border-[#2e7d32] text-[#4ade80] hover:border-[#4ade80] hover:bg-[#4ade80]/20 hover:shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:text-white'}`}>

                                <span className="relative z-10 tracking-wider font-mono">{mod.name}</span>
                            </div>
                        </Link>
                    ))}

                    {/* Özel Aksiyon Butonları (Sağ Alta Doğru) */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-1.5">
                        <div className="border border-[#81c784] bg-[#1b5e20] text-[#fff] text-[10px] font-black uppercase text-center py-2 cursor-pointer hover:bg-[#2e7d32] transition-colors">ÜRETİME AL</div>
                        <div className="border border-[#ffca28] bg-[#ffd54f] text-[#000] text-[10px] font-black uppercase text-center py-2 cursor-pointer hover:bg-white transition-colors">BEKLET</div>
                    </div>
                </div>
            </div>

            {/* Global Keyframes for Custom Animations */}
            <style jsx global>{`
                @keyframes dash {
                    to { stroke-dashoffset: -600; }
                }
            `}</style>
        </div>
    );
}

export default KarargahMainContainer;
