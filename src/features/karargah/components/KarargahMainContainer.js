'use client';
import { Target, Shield, AlertTriangle, Camera, Crosshair, Cpu } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useKarargah } from '../hooks/useKarargah';
import { useState, useEffect, useRef } from 'react';

// ████████████████████████████████████████████████████████████████████████
// [ NİZAM ] SİBER KARARGAH — V2.3 GERÇEK ASKERİ (OLIVE DRAB & SAGE GREEN)
// ████████████████████████████████████████████████████████████████████████

// GÖZ YORMAYAN, UZUN SÜRELİ İZLEMEYE UYGUN GERÇEK ASKERİ RENKLER
const MILITARY = {
    bg: "bg-[#0B100B]",                    // Zemin: Çok koyu, griye çalan zeytin siyahı
    panel: "bg-[#111A13] border-[#2E4031]",// Paneller: Kamuflaj yeşili koyu ton
    text: "text-[#9EB5A2]",                // Genel Yazı: Göz yormayan Adaçayı Yeşili (Sage Green)
    header: "text-[#69F0AE] font-semibold tracking-widest drop-shadow-[0_0_2px_#69F0AE]", // Başlıklar
    accent: "text-[#81C784]",              // Vurgu Yeşili
    amber: "text-[#FFD54F]",               // Telsiz/Analiz/Para Rengi
    red: "text-[#E57373]",                 // Alarm (Çok parlak olmayan operasyonel kırmızı)
    cyan: "text-[#81D4FA]"                 // Veri İşleme
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
        <div className={`relative w-full aspect-square border ${MILITARY.panel} flex items-center justify-center p-3 shadow-[inset_0_0_30px_rgba(46,64,49,0.5)] overflow-hidden`}>
            {/* Arka Plan Radar Ağı (Daha yumuşak) */}
            <div className={`absolute inset-0 opacity-10`} style={{ backgroundImage: 'radial-gradient(circle at center, #9EB5A2 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            {/* Halkalar (Olive Drab) */}
            <div className={`absolute inset-[10%] border border-[#2E4031] rounded-full`} />
            <div className={`absolute inset-[30%] border border-[#2E4031] rounded-full`} />
            <div className={`absolute inset-[50%] border border-[#2E4031] rounded-full`} />
            <div className={`absolute inset-[70%] border border-[#2E4031] rounded-full`} />

            <div className={`absolute w-full h-[1px] bg-[#2E4031]`} />
            <div className={`absolute h-full w-[1px] bg-[#2E4031]`} />

            <div className="absolute flex items-center justify-center">
                <Target size={18} className="text-[#81C784] opacity-40" />
            </div>

            {/* Sweep */}
            <div className="absolute inset-0 rounded-full origin-center animate-[spin_5s_linear_infinite] mix-blend-screen"
                style={{ background: 'conic-gradient(from 0deg, transparent 60%, rgba(129, 199, 132, 0.25) 100%)' }} />

            {TUM_AJANLAR.map((a, i) => {
                const angle = (i * 36 + 15) * (Math.PI / 180);
                const radius = 20 + (i % 5) * 8;
                const top = 50 + radius * Math.sin(angle);
                const left = 50 + radius * Math.cos(angle);

                let colorClass = "#81C784";
                if (a.tip === 'hata') colorClass = "#E57373";
                if (a.tip === 'analiz' || a.tip === 'finans') colorClass = "#FFD54F";

                return (
                    <div key={i} className={`absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 z-10`}
                        style={{ top: `${top}%`, left: `${left}%` }}>
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] ${a.aktif ? 'animate-[pulse_2s_infinite]' : 'opacity-40'}`} style={{ backgroundColor: colorClass, color: colorClass }} />
                        <span className="absolute left-3 whitespace-nowrap text-[7px] font-medium tracking-wide drop-shadow-[0_1px_1px_black]" style={{ color: colorClass }}>
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
        <div className={`min-h-screen ${MILITARY.bg} font-mono p-4 flex flex-col`} style={{ userSelect: 'none' }}>

            {/* ÜST BAŞLIK (Daha sofistike askeri yeşil) */}
            <div className={`flex items-center justify-between border-b-2 border-[#2E4031] pb-2 mb-4 bg-gradient-to-r from-[#0B100B] via-[#152319] to-[#0B100B]`}>
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 bg-[#81C784] rounded-full animate-pulse shadow-[0_0_8px_rgba(129,199,132,0.6)]`} />
                    <span className={`text-xs ${MILITARY.text} tracking-widest font-semibold`}>OTURUM AKTİF</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold uppercase tracking-[0.2em] text-[#A3C293] text-center flex-1 drop-shadow-[0_1px_2px_#000]">
                    KARARGAH OPERASYON HAREKAT MERKEZİ
                </h1>
                <div className={`flex items-center gap-3 text-xs tracking-widest ${MILITARY.text}`}>
                    <span className={`px-2 py-0.5 border border-[#2E4031] bg-[#111A13]`}>{saat}</span>
                    <span className={`px-2 py-0.5 border border-[#2E4031] bg-[#111A13]`}>PING {ping}ms</span>
                    <span className="text-[#81C784] font-semibold border border-[#2E4031] px-2 py-0.5">TR-AR</span>
                </div>
            </div>

            {/* İLK METRİK SATIRI (Daha okunabilir) */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                <div className={`border ${MILITARY.panel} p-2 flex flex-col justify-between`}>
                    <div className={`text-[11px] ${MILITARY.header} border-b border-[#2E4031] pb-1 mb-2 uppercase`}>[ SIFIR İNİSİYATİF ]</div>
                    <div className="flex justify-between items-center text-[#FFD54F] px-1">
                        <span className="text-lg tracking-widest drop-shadow-[0_1px_2px_black]">★★★★<span className="opacity-30">★</span></span>
                        <span className="text-[10px] text-[#9EB5A2]">HAZIRLIK</span>
                    </div>
                    <div className="h-1 w-full bg-[#1A261D] mt-1"><div className="h-full bg-[#81C784]" style={{ width: '85%' }}></div></div>
                </div>

                <div className={`border ${MILITARY.panel} p-2 text-center`}>
                    <div className={`text-[11px] ${MILITARY.header} border-b border-[#2E4031] pb-1 mb-2 uppercase`}>[ ADİL DÜZEN ]</div>
                    <div className="flex justify-around items-center h-8">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#81C784]" /><span className="text-[#9EB5A2] text-sm font-semibold">%94 (Uyum)</span></div>
                        <div className="w-[1px] h-full bg-[#2E4031]" />
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FFD54F]" /><span className="text-[#FFD54F] text-sm font-semibold">%71 (Kapasite)</span></div>
                    </div>
                </div>

                <div className={`border border-[#4A644E] bg-[#152319] p-2 text-center relative`}>
                    <div className={`text-[12px] font-bold text-[#A3C293] border-b border-[#2E4031] pb-1 mb-1 tracking-widest uppercase`}>[ SATIŞ KANALLARI ]</div>
                    <div className="grid grid-cols-4 text-left mt-2 px-1">
                        <div className="border-r border-[#2E4031] pr-1">
                            <div className="text-[8px] uppercase text-[#7C9882]">E-TİCARET</div>
                            <div className="text-[12px] font-semibold text-[#FFD54F]">₺234K</div>
                        </div>
                        <div className="border-r border-[#2E4031] px-1">
                            <div className="text-[8px] uppercase text-[#7C9882]">MAĞAZA</div>
                            <div className="text-[12px] font-semibold text-[#81C784]">₺87K</div>
                        </div>
                        <div className="border-r border-[#2E4031] px-1">
                            <div className="text-[8px] uppercase text-[#7C9882]">TOPTAN</div>
                            <div className="text-[12px] font-semibold text-[#81D4FA]">₺112K</div>
                        </div>
                        <div className="pl-1">
                            <div className="text-[8px] uppercase text-[#7C9882]">CİRO</div>
                            <div className="text-[13px] font-bold text-[#69F0AE] drop-shadow-[0_1px_2px_black]">₺433K</div>
                        </div>
                    </div>
                </div>

                <div className={`border ${MILITARY.panel} p-2 flex flex-col`}>
                    <div className={`text-[11px] ${MILITARY.header} border-b border-[#2E4031] pb-1 mb-2 flex justify-between uppercase`}>
                        <span>[ İŞLETME MALİYETİ ]</span> <span className="text-[#FFD54F] font-bold">₺16.6K</span>
                    </div>
                    {/* Okunabilir (Bar Çubuklu) Maliyet Analizi */}
                    <div className="space-y-1.5 flex-1 pr-1 h-[45px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2E4031]">
                        {maliyetDagilimi.map((m, i) => (
                            <div key={i} className="flex flex-col gap-0.5">
                                <div className="flex justify-between text-[9px] text-[#9EB5A2] font-medium"><span>{m.alan}</span><span className={m.yuzde > 25 ? "text-[#E57373]" : "text-[#9EB5A2]"}>₺{m.gider}</span></div>
                                <div className="h-[2px] w-full bg-[#1A261D] rounded"><div className="h-full rounded bg-[#4A644E]" style={{ width: `${m.yuzde}%` }} /></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ANA GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 mb-2">

                {/* 1. SÜTUN: RADAR */}
                <div className="flex flex-col gap-3">
                    <div className={`border ${MILITARY.panel} p-2 flex-1 flex flex-col`}>
                        <h2 className={`text-[12px] ${MILITARY.header} text-center border-b border-[#2E4031] pb-1 mb-3 uppercase bg-[#2E4031]/30`}>RADAR / NİŞANGAH</h2>
                        <RadarDisplay ajanlar={TUM_AJANLAR} />

                        <div className="mt-3 text-[9px] font-medium space-y-1 pr-1 h-[190px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2E4031]">
                            <div className="sticky top-0 bg-[#111A13] border-b border-[#2E4031] pb-1 mb-1 text-[#7C9882] uppercase text-center font-semibold">SİSTEM BİLEŞENLERİ ({TUM_AJANLAR.length})</div>
                            {TUM_AJANLAR.map((a, i) => (
                                <div key={i} className={`flex justify-between items-center bg-[#0B100B] px-1.5 py-1 mb-1 border-l-2 ${a.aktif ? 'border-[#4A644E]' : 'border-[#2E4031]'} text-[#9EB5A2]`}>
                                    <span className="flex items-center gap-1.5 uppercase"><span className={`w-1 h-1 rounded flex-shrink-0 ${a.aktif ? 'bg-[#81C784]' : 'bg-[#526054]'}`} /> {a.isim}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. SÜTUN: İSTİHBARAT & TREND */}
                <div className="flex flex-col gap-3">
                    <div className={`border ${MILITARY.panel} p-2`}>
                        <h2 className={`text-[11px] ${MILITARY.header} text-center border-b border-[#2E4031] pb-1 mb-2 uppercase`}>GÜNÜN TRENDLERİ (TOP 10)</h2>
                        <div className="text-[10px] font-medium pl-1 space-y-1.5 mt-2">
                            {trendler.map((t, idx) => (
                                <div key={idx} className={`flex justify-between items-center border-b border-[#2E4031]/50 pb-1 cursor-default ${idx < 3 ? 'text-[#A3C293] font-semibold' : 'text-[#7C9882]'}`}>
                                    <span>{t.id} {t.up ? '↑' : '↓'} {t.isim}</span>
                                    <span className="text-[#FFD54F]/70 text-[10px] tracking-widest">{"■".repeat(t.level)}{"□".repeat(5 - t.level)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`border ${MILITARY.panel} p-2 h-44 relative flex flex-col group`}>
                        <div className="flex justify-between items-center border-b border-[#2E4031] pb-1 z-10 bg-[#111A13]">
                            <h2 className={`text-[10px] ${MILITARY.header}`}>KAYNAK TRENDİ CANLI</h2>
                            <div className="flex gap-2 text-[8px] font-medium">
                                <span className={MILITARY.cyan}>— İŞÇİLİK</span>
                                <span className={MILITARY.amber}>— MALZM</span>
                                <span className={MILITARY.red}>— FİRE</span>
                            </div>
                        </div>

                        <div className="absolute left-1 top-8 bottom-4 w-5 flex flex-col justify-between text-[7px] text-[#7C9882] font-semibold z-10">
                            <span>15K</span><span>10K</span><span>5K</span><span>0</span>
                        </div>
                        <div className="absolute bottom-1 left-7 right-2 flex justify-between text-[7px] text-[#7C9882] font-semibold z-10 border-t border-[#2E4031] pt-1">
                            <span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>CANLI</span>
                        </div>

                        <div className="absolute inset-0 left-7 bottom-5 top-8 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 30px, #7C9882 30px, #7C9882 31px), repeating-linear-gradient(0deg, transparent, transparent 15px, #7C9882 15px, #7C9882 16px)' }} />

                        <svg className="absolute inset-0 left-7 bottom-5 top-8 w-[calc(100%-2rem)] h-[calc(100%-3rem)] transition-all" preserveAspectRatio="none" viewBox="0 0 100 40">
                            {/* Çok yumuşak akış (SAGE GREEN THEME) */}
                            <path d="M0,25 C15,20 30,35 45,25 C60,15 75,35 90,25 C100,20 100,20 100,20" fill="none" stroke="#81d4fa" strokeWidth="1" className="animate-[dash_8s_linear_infinite]" strokeDasharray="300" />
                            <path d="M0,15 C20,30 35,10 50,20 C65,30 80,10 100,25" fill="none" stroke="#FFD54F" strokeWidth="1" className="animate-[dash_12s_linear_infinite] opacity-80" strokeDasharray="300" />
                            <path d="M0,35 C20,20 40,40 60,15 C80,-5 90,30 100,10" fill="none" stroke="#E57373" strokeWidth="1" className="opacity-60" />
                        </svg>
                    </div>
                </div>

                {/* 3. SÜTUN: ÜRETİM (GERİ DÖNEN HERMES KUTUSU), KAMERA VE TELSİZ */}
                <div className="flex flex-col gap-3">

                    {/* ÜRETİM PANELİ & HERMES GEMİNİ KUTUSU (GERİ GELDİ!) */}
                    <div className={`border ${MILITARY.panel} p-2 flex flex-col`}>
                        <div className="flex justify-between items-end border-b border-[#2E4031] pb-1 mb-2">
                            <h2 className={`text-[12px] ${MILITARY.header} text-[#FFD54F]`}>ÜRETİM PANELİ</h2>
                            <span className="text-[9px] text-[#A3C293]">Doluluk: %85</span>
                        </div>
                        <div className="text-[10px] font-medium space-y-1 mb-2 text-[#9EB5A2]">
                            <div className="flex justify-between bg-[#1A261D] px-1 py-0.5"><span className="uppercase">Üretimde:</span> <span className="text-[#81C784] font-semibold">847 Adet</span></div>
                            <div className="flex justify-between bg-[#1A261D] px-1 py-0.5"><span className="uppercase">Hazır:</span> <span className="text-[#FFD54F] font-semibold">312 Adet</span></div>
                        </div>
                        {/* HERMES + GEMINI ONAY KUTUSU (Göz Yormayan Askeri Gri-Sarı tonu) */}
                        <div className="border border-[#4A5D23] bg-[#1E2615] p-2 mt-1">
                            <div className="flex items-center gap-1 text-[9px] text-[#DCE775] font-bold border-b border-[#4A5D23] pb-1 mb-1 uppercase tracking-widest"><Cpu size={12} /> HERMES+GEMİNİ KARAR MERKEZİ</div>
                            <div className="text-[8px] text-[#9EB5A2] leading-tight mb-2 uppercase">
                                "Örme Modal Takım Elbise" | Yargıç: Onaylandı <br />
                                <span className="text-[#E57373]">Neden: Sosyal Medya Yüksek</span> | Risk: Tedarik Orta
                            </div>
                            <div className="flex gap-2">
                                <div className="bg-[#558B2F] flex-1 text-center text-[9px] text-white font-bold py-1 uppercase opacity-90 cursor-default">[ ÜRETİME AL ]</div>
                                <div className="bg-[#424242] flex-1 text-center text-[9px] text-[#BDBDBD] font-bold py-1 uppercase cursor-default border border-[#616161]">[ BEKLET ]</div>
                            </div>
                        </div>
                    </div>

                    {/* MERKEZ KAMERA MATRİKSİ */}
                    <div className={`border border-[#2E4031] bg-[#020302] aspect-video relative flex items-center justify-center overflow-hidden`}>
                        <div className="absolute inset-0 bg-[#4A644E]/5 mix-blend-color-burn" />
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyIiBoZWlnaHQ9IjIiPgo8cmVjdCB3aWR0aD0iMiIgaGVpZ2h0PSIyIiBmaWxsPSJyZ2JhKDAsMCwwLDApIiAvPgo8cGF0aCBkPSJNMCAwTDAgMkMwIDIgMiAyIDIgMkwwIDAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiIC8+Cjwvc3ZnPg==')] pointer-events-none opacity-50" />
                        <div className="grid grid-cols-2 grid-rows-2 w-full h-full p-0.5 gap-0.5">
                            <div className="border border-[#2E4031]/50 bg-[#0B100B] flex items-start p-1"><span className="text-[7px] text-[#7C9882] font-semibold bg-black/50 px-1">CAM-01 [DEPO]</span></div>
                            <div className="border border-[#2E4031]/50 bg-[#0B100B] flex items-start p-1 relative"><span className="text-[7px] text-[#7C9882] font-semibold bg-black/50 px-1">CAM-02 [KESİM]</span><div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#E57373] rounded-full animate-pulse blur-[1px]" /></div>
                            <div className="border border-[#2E4031]/50 bg-[#0B100B] flex items-start p-1"><span className="text-[7px] text-[#7C9882] font-semibold bg-black/50 px-1">CAM-03 [ÜRETİM]</span></div>
                            <div className="border border-[#2E4031]/50 bg-[#0B100B] flex items-start p-1"><span className="text-[7px] text-[#7C9882] font-semibold bg-black/50 px-1">CAM-04 [DIŞ]</span></div>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"><Crosshair size={40} className="text-[#81C784]" /></div>
                    </div>

                    {/* ACİL UYARI BANDI (Okunabilir, abartısız) */}
                    <div className="border border-[#EF5350]/40 bg-[#EF5350]/5 p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-[#E57373]" />
                            <span className="text-[10px] font-bold text-[#E57373] uppercase tracking-widest">Kritik Alarm:</span>
                            <span className="text-[10px] text-[#E57373]/80 font-medium">Sipariş 4892 gecikmesi</span>
                        </div>
                    </div>

                </div>

                {/* 4. SÜTUN: PERSONEL, TERMİNAL VE ADALETLİ ÜCRET DİBİ */}
                <div className="flex flex-col gap-3">

                    {/* PERSONEL LİSTESİ (Çifte Başlıklı - Yumuşatılmış) */}
                    <div className={`border ${MILITARY.panel} bg-[#0D140D] flex-1 flex flex-col p-2`}>
                        <div className="flex-1 mb-1">
                            <h2 className={`text-[11px] font-semibold text-center uppercase tracking-widest bg-[#1A261D] mb-2 py-0.5 text-[#A3C293]`}>🏆 GÜNÜN İLK 10 PERSONELİ</h2>
                            <div className="space-y-1 text-[9px] font-medium pb-1 pr-1">
                                {gununPersonelleri10.slice(0, 8).map((p, i) => ( // Ekrana sığması için 8 yaptık
                                    <div key={i} className="flex justify-between border-b border-[#2E4031]/50 pb-0.5">
                                        <span className={i < 3 ? "text-[#81C784] font-semibold" : "text-[#7C9882]"}>{i + 1}. {p.n}</span>
                                        <span className="flex gap-2"><span className="text-[#526054]">[{p.birim}]</span> <span className={MILITARY.cyan}>{p.s}P</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 border-t border-[#2E4031] pt-2">
                            <h2 className={`text-[11px] font-semibold text-center uppercase tracking-widest bg-[#1A261D] mb-2 py-0.5 text-[#FFD54F]/90`}>🌟 HAFTANIN İLK 10 PERSONELİ</h2>
                            <div className="space-y-1 text-[9px] font-medium pr-1">
                                {haftaninPersonelleri10.slice(0, 8).map((p, i) => (
                                    <div key={i} className="flex justify-between border-b border-[#2E4031]/50 pb-0.5">
                                        <span className={i < 3 ? "text-[#FFD54F] font-semibold" : "text-[#7C9882]"}>{i + 1}. {p.n}</span>
                                        <span className="flex gap-2"><span className="text-[#526054]">[{p.birim}]</span> <span className={MILITARY.amber}>{p.s}P</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* OKUNABİLİR VE NOSTALJİK NİZAM TELSİZ LOG (TERMINAL) */}
                    <div className="border border-[#2E4031] bg-[#000000] p-2 relative h-28 flex flex-col">
                        <div className="text-[9px] text-[#526054] font-semibold uppercase border-b border-[#2E4031] pb-1 mb-1 tracking-widest flex justify-between">
                            <span>NİZAM TELSİZ</span> <span>[LOG]</span>
                        </div>
                        <div className="text-[9px] font-mono leading-relaxed overflow-y-auto scrollbar-none text-[#7C9882]">
                            {terminalLoglar.map((l, i) => {
                                const isAlert = l.includes('KAMERA') || l.includes('YARGIÇ');
                                return (
                                    <div key={i} className={`truncate ${isAlert ? 'text-[#FFD54F]' : ''}`}>
                                        <span className="opacity-50 inline-block w-12">{l.split(' ')[0]}</span>
                                        {l.substring(l.indexOf(' ') + 1)}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* ADALETLİ ÜCRET TAM SAĞ DİPTE (Göz yormayan sarı tonu) */}
                    <div className={`border border-[#4A5D23] p-2 text-center bg-[#1A180E]`}>
                        <div className="text-[11px] font-semibold uppercase text-[#FFD54F] border-b border-[#4A5D23]/50 pb-1 mb-1 tracking-widest">[ ADALETLİ ÜCRET ]</div>
                        <div className="text-[9px] text-[#A1A28A] uppercase tracking-widest mt-1">Sistemsel Aylık Hak Ediş</div>
                        <div className="text-xl md:text-2xl font-bold text-[#FFD54F] mt-1 drop-shadow-[0_1px_1px_black]">₺1.2M</div>
                    </div>
                </div>
            </div>

            {/* ALT YÖNETİM BUTONLARI (Daha oturaklı ve okunaklı) */}
            <div className={`mt-2 pt-2 border-t border-[#2E4031]`}>
                <div className="grid grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-2 pb-4">
                    {MILITARY_NAV.map((mod, i) => (
                        <Link href={mod.link} key={i}>
                            <div className={`border bg-[#0B100B] text-[10px] md:text-xs font-semibold uppercase text-center py-2 transition-all cursor-pointer relative
                                ${['İSTİHBARAT', 'ÜRETİM', 'SİPARİŞLER'].includes(mod.name) ? 'border-[#4A5D23] text-[#FFD54F] hover:bg-[#1A180E]' :
                                    'border-[#2E4031] text-[#9EB5A2] hover:bg-[#111A13] hover:border-[#4A644E] hover:text-[#A3C293]'}`}>
                                <span className={MILITARY.header.includes('drop') ? '' : 'drop-shadow-[0_1px_1px_#000]'}>{mod.name}</span>
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
