'use client';
import { Target, Shield, AlertTriangle, Camera, Crosshair, Cpu } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useKarargah } from '../hooks/useKarargah';
import { useState, useEffect, useRef } from 'react';

// ████████████████████████████████████████████████████████████████████████
// [ NİZAM ] SİBER KARARGAH — V2.6 PHOSPHOR CRT GREEN (BİREBİR GÖRSEL RENGİ)
// ████████████████████████████████████████████████████████████████████████

// TAM GÖRSELDEKİ "SARIYA ÇALAN ASKERİ YEŞİL" (PHOSPHOR MIX)
const COLORS = {
    bg: "bg-[#0A0D08]",                      // Orijinal Askeri Koyu Haki (Olive Black)
    panel: "bg-[#12160E] border-[#38422A]",  // Mat Askeri Panel
    borderStrong: "border-[#4A5D33]",        // Taktikal Ordu Yeşili Kenarlık
    borderDim: "border-[#202919]",           // Gölgeli Haki

    textTitle: "text-[#B5CE75] drop-shadow-[0_0_8px_rgba(181,206,117,0.3)]", // Orijinal Askeri HUD Yeşili
    textMain: "text-[#9EB56B]",              // Tok ve Net Asker Yeşili
    textDim: "text-[#6A7848]",               // Sönük Haki

    red: "text-[#CC3333]",                   // Uyarı Kırmızısı
    redBg: "bg-[#CC3333]",
    amber: "text-[#E6B800]",                 // Uyarı Sarısı
    amberBg: "bg-[#E6B800]",
    cyan: "text-[#5C9E8A]"                   // Askeri Mavimsi Taktikal Hat
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

const TUM_AJANLAR = [
    { isim: "NİZAM BOT (ANA KOMUTA)", lokasyon: "SİSTEM", tip: 'komuta', aktif: true },
    { isim: "AR-GE ÇEKİRDEĞİ", lokasyon: "VERİTABANI", tip: 'sinyal', aktif: true },
    { isim: "YARGIÇ - KÂR ANALİZ", lokasyon: "FİNANS", tip: 'analiz', aktif: true },
    { isim: "HERMES - TREND", lokasyon: "TİKTOK", tip: 'istihbarat', aktif: true },
    { isim: "VISION OTONOM - PİYASA", lokasyon: "TRENDYOL", tip: 'gorus', aktif: true },
    { isim: "KÜRESEL PAZAR AJANI", lokasyon: "AMAZON", tip: 'veri', aktif: true },
    { isim: "M2 MALİYET HESAPLAYICI", lokasyon: "SİSTEM-M2", tip: 'analiz', aktif: true },
    { isim: "INSTAGRAM VERİ ÇEKİCİ", lokasyon: "INSTA-DM", tip: 'veri', aktif: true },
    { isim: "STOK ALARM & RİSK", lokasyon: "DEPO-SENSÖR", tip: 'hata', aktif: true },
    { isim: "NİZAM TELSİZ BAĞLANTISI", lokasyon: "HABERLEŞME", tip: 'baglanti', aktif: true }
];

const RadarDisplay = ({ ajanlar }) => {
    return (
        <div className={`relative w-full aspect-square border ${COLORS.borderStrong} ${COLORS.bg} flex items-center justify-center p-3 overflow-hidden`}>
            <div className={`absolute inset-0 opacity-10`} style={{ backgroundImage: 'radial-gradient(circle at center, #9CBF48 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className={`absolute inset-[10%] border ${COLORS.borderDim} rounded-full`} />
            <div className={`absolute inset-[30%] border ${COLORS.borderDim} rounded-full`} />
            <div className={`absolute inset-[50%] border ${COLORS.borderDim} rounded-full`} />
            <div className={`absolute inset-[70%] border ${COLORS.borderDim} rounded-full`} />

            <div className={`absolute w-full h-[1px] bg-[#3A5018]`} />
            <div className={`absolute h-full w-[1px] bg-[#3A5018]`} />

            <div className="absolute flex items-center justify-center">
                <Target size={18} className="text-[#8CAE36] opacity-40" />
            </div>

            <div className="absolute inset-0 rounded-full origin-center animate-[spin_5s_linear_infinite] mix-blend-screen"
                style={{ background: 'conic-gradient(from 0deg, transparent 60%, rgba(156, 191, 72, 0.25) 100%)' }} />

            {TUM_AJANLAR.map((a, i) => {
                const angle = (i * 36 + 15) * (Math.PI / 180);
                const radius = 20 + (i % 5) * 8;
                const top = 50 + radius * Math.sin(angle);
                const left = 50 + radius * Math.cos(angle);

                let colorHex = "#9CBF48";
                if (a.tip === 'hata') colorHex = "#E84C3D";
                if (a.tip === 'analiz' || a.tip === 'finans') colorHex = "#F1C40F";

                return (
                    <div key={i} className={`absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 z-10`}
                        style={{ top: `${top}%`, left: `${left}%` }}>
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] ${a.aktif ? 'animate-[pulse_2s_infinite]' : 'opacity-40'}`} style={{ backgroundColor: colorHex, color: colorHex }} />
                        <span className="absolute left-3 whitespace-nowrap text-[7px] font-medium tracking-wide drop-shadow-[0_1px_1px_black]" style={{ color: colorHex }}>
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
        "SİSTEM: Ağ protokolü onaylandı.",
        "YARGIÇ: Fiyat analizi bitirildi.",
        "TELSİZ: İletişim kararlılığı %98",
        "KAMERA-02: Hareket sensörü aktif (Kesim).",
        "TİKTOK-BOT: Yeni trend uyarısı geldi.",
        "HERMES: Piyasa stok çekimi tamamlandı.",
        "NİZAM: Operasyonel metrikler güncellendi."
    ];

    const maliyetDagilimi = [
        { alan: "Mağaza & Ofis", gider: 4900, yuzde: 29 },
        { alan: "Üretim Bandı", gider: 4200, yuzde: 25 },
        { alan: "İmalat & Fason", gider: 4000, yuzde: 24 },
        { alan: "Modelhane", gider: 2100, yuzde: 13 },
        { alan: "Kesim", gider: 1400, yuzde: 9 },
    ];

    return (
        <div className={`min-h-screen ${COLORS.bg} font-mono p-4 flex flex-col`} style={{ userSelect: 'none' }}>

            {/* ÜST BAŞLIK (Phosphor Yellow-Green) */}
            <div className={`flex items-center justify-between border-b border-[#3A5018] pb-2 mb-4 bg-gradient-to-r from-[#070A06] via-[#12180C] to-[#070A06]`}>
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 bg-[#D1EF53] rounded-full animate-pulse shadow-[0_0_8px_rgba(209,239,83,0.6)]`} />
                    <span className={`text-[10px] ${COLORS.textTitle} tracking-[0.2em] font-bold`}>AKTİF OTURUM</span>
                </div>
                <h1 className={`text-xl md:text-3xl font-black uppercase tracking-[0.1em] text-center flex-1 ${COLORS.textTitle}`}>
                    KARARGAH OPERASYON HAREKAT KOMUTA MERKEZİ
                </h1>
                <div className={`flex items-center gap-3 text-xs tracking-widest ${COLORS.textMain} font-bold`}>
                    <span className={`px-2 py-0.5 border border-[#3A5018] bg-[#0F140A]`}>{saat}</span>
                    <span className={`px-2 py-0.5 border border-[#3A5018] bg-[#0F140A]`}>PING:{ping}ms</span>
                    <span className="text-[#D1EF53] border border-[#3A5018] px-2 py-0.5">TR AR</span>
                </div>
            </div>

            {/* İLK METRİK SATIRI (Visual Colors) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className={`border ${COLORS.borderStrong} p-2 flex flex-col justify-between ${COLORS.bg}`}>
                    <div className={`text-[12px] ${COLORS.textMain} font-bold border-b ${COLORS.borderDim} pb-1 mb-2 uppercase`}>[ SIFIR İNİSİYATİF ]</div>
                    <div className="flex justify-between items-center text-[#9CBF48] px-1 text-lg tracking-widest">
                        ★★★★<span className="opacity-30">★</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1A2612] mt-1"><div className="h-full bg-[#E84C3D]" style={{ width: '85%' }}></div></div>
                    <div className={`text-[10px] text-center mt-2 font-bold ${COLORS.textDim}`}>Hazırlık skoru</div>
                </div>

                <div className={`border ${COLORS.borderStrong} p-2 text-center ${COLORS.bg}`}>
                    <div className={`text-[12px] ${COLORS.textMain} font-bold border-b ${COLORS.borderDim} pb-1 mb-2 uppercase`}>[ ADİL DÜZEN ]</div>
                    <div className="flex justify-around items-center h-10">
                        <div className="relative w-10 h-10"><svg className="w-full h-full -rotate-[135deg]"><circle cx="18" cy="18" r="16" fill="none" stroke="#253A15" strokeWidth="4" /><circle cx="18" cy="18" r="16" fill="none" stroke="#9CBF48" strokeWidth="4" strokeDasharray="100" strokeDashoffset={6} /></svg><div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#9CBF48]">94%</div></div>
                        <div className="w-[1px] h-full bg-[#3A5018]" />
                        <div className="relative w-10 h-10"><svg className="w-full h-full -rotate-[135deg]"><circle cx="18" cy="18" r="16" fill="none" stroke="#253A15" strokeWidth="4" /><circle cx="18" cy="18" r="16" fill="none" stroke="#F1C40F" strokeWidth="4" strokeDasharray="100" strokeDashoffset={29} /></svg><div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#F1C40F]">71%</div></div>
                    </div>
                    <div className={`text-[10px] text-center mt-1 font-bold ${COLORS.textDim}`}>Kapasite oranı</div>
                </div>

                <div className={`border ${COLORS.borderStrong} p-2 text-center ${COLORS.bg}`}>
                    <div className={`flex justify-between items-center border-b ${COLORS.borderDim} pb-1 mb-2`}>
                        <div className={`text-[12px] font-bold ${COLORS.textTitle} uppercase`}>[ ADALETLİ ÜCRET ]</div>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-[#D1EF53] drop-shadow-[0_1px_2px_black] mt-3">₺5.5M <span className="text-[#9CBF48]">| ₺1.2M</span></div>
                    <div className={`text-[10px] text-center mt-2 font-bold ${COLORS.textDim}`}>Maaş ödenek</div>
                </div>

                <div className={`border ${COLORS.borderStrong} p-2 text-center ${COLORS.bg} flex flex-col justify-between`}>
                    <div className={`text-[12px] font-bold ${COLORS.textMain} border-b ${COLORS.borderDim} pb-1 mb-1 uppercase`}>[ SATIŞ KANALLARI ]</div>
                    <div className="grid grid-cols-3 text-left mt-1 px-1">
                        <div className="border-r border-[#3A5018] pr-1">
                            <div className={`text-[8px] uppercase ${COLORS.textDim}`}>E-TİCARET</div>
                            <div className="text-[11px] font-semibold text-[#D1EF53]">₺234K</div>
                        </div>
                        <div className="border-r border-[#3A5018] px-1">
                            <div className={`text-[8px] uppercase ${COLORS.textDim}`}>MAĞAZA</div>
                            <div className="text-[11px] font-semibold text-[#9CBF48]">₺87K</div>
                        </div>
                        <div className="pl-1">
                            <div className={`text-[8px] uppercase ${COLORS.textDim}`}>TOPLAM</div>
                            <div className="text-[12px] font-bold text-[#D1EF53]">₺321K</div>
                        </div>
                    </div>
                    <div className="text-[7px] text-[#D1EF53] font-bold mt-2 text-center tracking-widest">[KENDİ] | [TRENDYOL] | [INSTAGRAM]</div>
                    <div className={`text-[10px] text-center mt-1 font-bold ${COLORS.textDim}`}>Kanal bazlı satış</div>
                </div>
            </div>

            {/* ANA GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 mb-2">

                {/* 1. SÜTUN: RADAR */}
                <div className="flex flex-col gap-3">
                    <div className={`border ${COLORS.borderStrong} p-2 flex-1 flex flex-col ${COLORS.panel}`}>
                        <h2 className={`text-[12px] ${COLORS.textMain} font-bold text-center border-b ${COLORS.borderDim} pb-1 mb-3 uppercase`}>RADAR / NİŞANGAH</h2>
                        <RadarDisplay ajanlar={TUM_AJANLAR} />

                        <div className="mt-3 text-[10px] space-y-1.5 pr-1 h-[190px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#38422A]">
                            <div className={`sticky top-0 ${COLORS.panel} border-b ${COLORS.borderDim} pb-1 mb-1 ${COLORS.textMain} uppercase text-center font-bold tracking-widest`}>AJAN LOG LOKASYONLARI</div>
                            {TUM_AJANLAR.map((a, i) => (
                                <div key={i} className={`flex justify-between items-center px-2 py-1 mb-1 border-l-2 ${a.aktif ? COLORS.borderStrong : COLORS.borderDim} ${COLORS.textMain} font-semibold text-[9px]`}>
                                    <div className="flex items-center gap-1.5 uppercase tracking-wide">
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.aktif ? 'bg-[#B5CE75]' : 'bg-[#4A5D33]'}`} />
                                        <div className="flex flex-col leading-tight">
                                            <span>{a.isim}</span>
                                            <span className={`text-[8px] ${COLORS.textDim}`}>» BÖLGE: {a.lokasyon}</span>
                                        </div>
                                    </div>
                                    <span className={a.aktif ? 'text-[#B5CE75] font-bold text-[8px]' : `text-[8px] ${COLORS.textDim}`}>AKTİF</span>
                                </div>
                            ))}
                        </div>
                        <div className={`text-[10px] text-center mt-2 font-bold ${COLORS.textDim}`}>Aktif/Planlı ajan izleme</div>
                    </div>
                </div>

                {/* 2. SÜTUN: TRENDLER VE GRAFİK */}
                <div className="flex flex-col gap-3">
                    <div className={`border ${COLORS.borderStrong} p-2 ${COLORS.bg}`}>
                        <h2 className={`text-[11px] ${COLORS.textMain} font-bold text-center border-b ${COLORS.borderDim} pb-1 mb-2 uppercase`}>GÜNÜN TRENDLERİ</h2>
                        <div className="text-[10px] font-bold pl-1 space-y-1 mt-2">
                            {trendler.map((t, idx) => (
                                <div key={idx} className={`flex justify-between items-center border-b border-[#3A5018] pb-1 cursor-default ${idx < 3 ? 'text-[#D1EF53]' : 'text-[#9CBF48]'}`}>
                                    <span>{t.id} {t.up ? '↑' : '↓'} {t.isim}</span>
                                    <span className="text-[#9CBF48] text-[10px] tracking-widest">{"●".repeat(t.level)}{"⃝".repeat(5 - t.level)}</span>
                                </div>
                            ))}
                        </div>
                        <div className={`text-[10px] text-center mt-2 font-bold ${COLORS.textDim}`}>Günlük platform trendi</div>
                    </div>

                    <div className={`border ${COLORS.borderStrong} p-2 h-44 relative flex flex-col group ${COLORS.bg}`}>
                        <div className={`flex justify-center items-center border-b ${COLORS.borderDim} pb-1 z-10 bg-[#070A06]`}>
                            <h2 className={`text-[11px] ${COLORS.textMain} font-bold uppercase`}>KAYNAK KULLANIMI</h2>
                        </div>
                        <div className="flex justify-center gap-2 text-[8px] font-bold mt-1 z-10 text-[#9CBF48]">
                            <span>— İşçilik</span>
                            <span className="text-[#4DB6AC]">— Malzeme</span>
                            <span className="text-[#E84C3D]">— Fire</span>
                        </div>

                        <div className="absolute inset-0 left-7 bottom-5 top-12 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 30px, #9CBF48 30px, #9CBF48 31px), repeating-linear-gradient(0deg, transparent, transparent 15px, #9CBF48 15px, #9CBF48 16px)' }} />

                        <svg className="absolute inset-0 left-7 bottom-5 top-12 w-[calc(100%-2rem)] h-[calc(100%-3rem)] transition-all z-20" preserveAspectRatio="none" viewBox="0 0 100 40">
                            <path d="M0,25 C15,20 30,35 45,25 C60,15 75,35 90,25 C100,20 100,20 100,20" fill="none" stroke="#D1EF53" strokeWidth="1.5" className="animate-[dash_8s_linear_infinite]" strokeDasharray="300" />
                            <path d="M0,15 C20,30 35,10 50,20 C65,30 80,10 100,25" fill="none" stroke="#4DB6AC" strokeWidth="1.5" className="animate-[dash_12s_linear_infinite] opacity-80" strokeDasharray="300" />
                            <path d="M0,35 C20,20 40,40 60,15 C80,-5 90,30 100,10" fill="none" stroke="#E84C3D" strokeWidth="1.5" className="opacity-80" />
                        </svg>

                        <div className={`absolute bottom-2 left-0 right-0 text-[10px] text-center font-bold ${COLORS.textDim}`}>Her kalem ayrı kaynak trendi</div>
                    </div>
                </div>

                {/* 3. SÜTUN: MALİYET VE ÜRETİM VE KAMERA */}
                <div className="flex flex-col gap-3">

                    {/* Birebir görseldeki gibi Bar tipli MALİYET ANALİZİ */}
                    <div className={`border ${COLORS.borderStrong} p-2 flex flex-col ${COLORS.bg}`}>
                        <div className={`text-[11px] ${COLORS.textMain} font-bold text-center border-b ${COLORS.borderDim} pb-1 mb-1 uppercase`}>MALİYET ANALİZİ</div>
                        <div className="text-center text-[8px] font-bold text-[#9CBF48] mb-2">[İŞLETME][PERSONEL][MAĞAZA][MODELHANE]</div>
                        {/* Bar grafikleri simülasyonu */}
                        <div className="flex items-end justify-between px-2 h-14 gap-1 border-b border-[#3A5018] pb-1">
                            <div className="w-1/6 bg-[#9CBF48]" style={{ height: '50%' }}></div>
                            <div className="w-1/6 bg-[#9CBF48]" style={{ height: '30%' }}></div>
                            <div className="w-1/6 bg-[#9CBF48]" style={{ height: '80%' }}></div>
                            <div className="w-1/6 bg-[#9CBF48]" style={{ height: '40%' }}></div>
                            <div className="w-1/6 bg-[#9CBF48]" style={{ height: '90%' }}></div>
                            <div className="w-1/6 bg-[#9CBF48]" style={{ height: '20%' }}></div>
                        </div>
                        <div className="text-center text-[#D1EF53] font-bold text-[12px] mt-1">TOPLAM ₺65.700</div>
                        <div className={`text-[10px] text-center mt-1 font-bold ${COLORS.textDim}`}>Bölüm ve dönem bazlı maliyet</div>
                    </div>

                    {/* ÜRETİM VE HERMES BİREBİR GÖRSEL */}
                    <div className={`border ${COLORS.borderStrong} p-2 flex flex-col ${COLORS.bg}`}>
                        <h2 className={`text-[11px] ${COLORS.textMain} font-bold text-center border-b ${COLORS.borderDim} pb-1 mb-1 uppercase`}>ÜRETİM PANELİ</h2>
                        <div className="text-center text-[9px] font-bold text-[#D1EF53] mb-1">[GÜNLÜK][HAFTALIK][AYLIK]</div>
                        <div className="text-center text-xl font-bold text-[#D1EF53] tracking-widest">847 | 312 | 535</div>
                        <div className="relative w-full h-1.5 bg-[#1F2E14] border border-[#3A5018] mt-1">
                            <div className="absolute top-0 left-0 h-full bg-[#D1EF53]" style={{ width: '63%' }}></div>
                        </div>
                        <div className={`text-[10px] text-center mt-2 font-bold ${COLORS.textDim} mb-2`}>Üretim istatistikleri</div>

                        {/* HERMES + GEMINI ONAY KUTUSU (Görsel birebir zeytin sarısı) */}
                        <div className="border border-[#B3A030] bg-[#1C1808] p-2">
                            <div className="text-[10px] text-[#F1C40F] font-bold border-b border-[#B3A030] pb-1 mb-1 text-center">HERMES+GEMİNİ KARAR MERKEZİ</div>
                            <div className="text-[8px] text-[#9CBF48] leading-relaxed mb-2 uppercase text-center font-bold">
                                "Örme Modal Takım Elbise" | Yargıç: <span className="text-[#D1EF53]">ÜRETİM √</span> | GEMİNİ: 87/100<br />
                                <span className="text-[#9CBF48]">NEDEN: Sosyal Medya yüksek | RİSK: Tedarik Orta</span>
                            </div>
                            <div className="flex justify-center gap-2">
                                <div className="bg-[#9CBF48] px-3 py-1 text-[10px] text-[#0A0D08] font-bold uppercase rounded-sm">[ ÜRETİME AL ]</div>
                                <div className="bg-[#F1C40F] px-3 py-1 text-[10px] text-[#0A0D08] font-bold uppercase rounded-sm border border-[#0A0D08]">[ BEKLET ]</div>
                            </div>
                        </div>
                    </div>

                    {/* KRİTİK ALARM BİREBİR */}
                    <div className="border border-[#E84C3D] bg-[#220D0D] p-2 mt-auto">
                        <div className="flex items-center justify-center gap-1 border-b border-[#E84C3D]/50 pb-1 mb-1">
                            <AlertTriangle size={12} className="text-[#E84C3D] animate-ping absolute" />
                            <AlertTriangle size={12} className="text-[#E84C3D] relative" />
                            <span className="text-[12px] font-bold text-[#E84C3D] uppercase tracking-widest pl-1">KRİTİK ALARM</span>
                        </div>
                        <div className="text-[10px] font-bold text-[#E84C3D] pl-2 uppercase">
                            <div>• 3 HATA</div>
                            <div>• 3 HATA</div>
                            <div>• 3 HATA</div>
                        </div>
                    </div>

                </div>

                {/* 4. SÜTUN: PERSONEL & TERMİNAL LOG (Görsel Dağılım) */}
                <div className="flex flex-col gap-3">

                    <div className={`border ${COLORS.borderStrong} bg-[#0A0D08] flex-1 flex flex-col p-2`}>
                        <h2 className={`text-[11px] font-bold text-center uppercase tracking-widest border-b ${COLORS.borderDim} mb-2 pb-1 ${COLORS.textMain}`}>PERSONEL LİSTESİ</h2>
                        <div className="space-y-1.5 text-[10px] font-bold pb-1 text-[#9CBF48]">
                            {gununPersonelleri10.slice(0, 7).map((p, i) => (
                                <div key={i} className="flex justify-between items-center px-1">
                                    <span>{i + 1}.</span>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[#E84C3D]" />
                                        <div className="w-2 h-2 rounded-full bg-[#F1C40F]" />
                                        <div className="w-2 h-2 rounded-full bg-[#9CBF48]" />
                                    </div>
                                    <span className="opacity-80">adet ↺</span>
                                </div>
                            ))}
                        </div>
                        <div className={`text-[10px] text-center mt-auto font-bold ${COLORS.textDim}`}>Personel ve üretim adetleri</div>
                    </div>

                    {/* TERMINAL LOG GÖRSEL RENK */}
                    <div className={`border ${COLORS.borderStrong} bg-[#0A0D08] p-2 relative flex-1 flex flex-col max-h-56`}>
                        <h2 className={`text-[11px] font-bold uppercase tracking-widest text-[#9CBF48] border-b ${COLORS.borderDim} pb-1 mb-2 text-center`}>TERMİNAL LOG</h2>
                        <div className="text-[9px] font-mono leading-tight overflow-y-auto scrollbar-none text-[#6E8F3D]">
                            {[...Array(15)].map((_, i) => (
                                <div key={i} className={`flex gap-1`}>
                                    <span>[02:21]</span>
                                    <span className={i % 3 === 0 ? 'text-[#E84C3D]' : 'text-[#8CAE36]'}>Critical</span>
                                    <span className={i % 3 === 0 ? 'text-[#E84C3D]' : ''}>{i % 3 === 0 ? 'critical' : ''}</span>
                                </div>
                            ))}
                        </div>
                        <div className={`text-[10px] text-center mt-auto pt-2 font-bold ${COLORS.textDim}`}>Canlı sistem akışı</div>
                    </div>
                </div>
            </div>

            {/* ALT YÖNETİM BUTONLARI (Orijinal GÖRSELE GÖRE BİREBİR) */}
            <div className={`mt-2 pb-4`}>
                {/* Visual has 2 columns of blocky buttons and some smaller ones */}
                <div className="flex flex-wrap justify-between gap-1 mb-2">
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-1`}>AJANLAR</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-1`}>AR-GE</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-1`}>DENETÇİ</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-1`}>KAMERALAR</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-1`}>HABERLEŞME</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-1`}>İSTİHBARAT</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-1`}>AYARLAR</div>
                </div>
                <div className="flex flex-wrap justify-between gap-1">
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-[0.8]`}>MODELHANE</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-[0.8]`}>KALIP</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-[0.8]`}>KUMAŞ</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-[0.8]`}>KESİM</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-[0.8]`}>ÜRETİM</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-1`}>SİPARİŞLER</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-[0.8]`}>MALİYET</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-1`}>MUHASEBE</div>
                    <div className={`border border-[#8CAE36] px-4 py-1.5 text-[11px] font-bold text-[#8CAE36] bg-[#0F140A] text-center flex-[0.8]`}>STOK</div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes dash { to { stroke-dashoffset: -600; } }
            `}</style>
        </div>
    );
}

export default KarargahMainContainer;
