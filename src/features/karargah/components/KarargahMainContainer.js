'use client';
import { Target, Activity, Shield, Crosshair, AlertTriangle, AlertCircle, Database, Network, Camera, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useKarargah } from '../hooks/useKarargah';
import { useState, useEffect, useRef } from 'react';

// ████████████████████████████████████████████████████████████████████████
// [ NİZAM ] SİBER KARARGAH — V2 CANLI HAREKAT MERKEZİ (MILITARY GRADE)
// Konsept: Terminal Konsolu, Radar Nişangahı, Askeri Bloklar, Veri Akışı
// ████████████████████████████████████████████████████████████████████████

// ASKERİ MENÜ HÜCRELERİ
const MILITARY_NAV = [
    { name: 'AJANLAR', link: '/ajanlar' },
    { name: 'AR-GE', link: '/arge' },
    { name: 'DENETMEN', link: '/denetmen' },
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

// --- Radar Nişangah Animasyon Modülü ---
const RadarDisplay = ({ ajanlar }) => {
    return (
        <div className="relative w-full aspect-square border border-[#33ff33]/40 bg-[#020a02] flex items-center justify-center p-4 shadow-[inset_0_0_30px_rgba(0,255,0,0.15)] overflow-hidden">
            {/* Arka Plan Izgarası */}
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(51,255,51,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(51,255,51,0.1) 1px, transparent 1px)', backgroundSize: '10% 10%' }} />

            {/* Radar Halkaları */}
            <div className="absolute inset-2 border border-[#33ff33]/30 rounded-full" />
            <div className="absolute inset-10 border border-[#33ff33]/20 rounded-full" />
            <div className="absolute inset-16 border border-[#33ff33]/20 rounded-full" />

            {/* Eksen Çizgileri */}
            <div className="absolute w-full h-[1px] bg-[#33ff33]/50" />
            <div className="absolute h-full w-[1px] bg-[#33ff33]/50" />

            {/* Hedef Kilit İbresi (Ortada Atan Kalp) */}
            <div className="absolute flex items-center justify-center">
                <Target size={24} className="text-[#ff0033] animate-ping opacity-70" />
                <Target size={16} className="text-[#ff0033] absolute" />
            </div>

            {/* Dönen Tarayıcı (Sweep) */}
            <div className="absolute inset-0 rounded-full origin-center animate-[spin_3s_linear_infinite] mix-blend-screen"
                style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(51, 255, 51, 0.6) 100%)' }} />

            {/* İzlenen Ajan Sinyalleri (Rastgele dağılım + yanıp sönme) */}
            {ajanlar && ajanlar.map((a, i) => (
                <div key={i} className="absolute w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                    style={{
                        backgroundColor: a.tur === 'hata' ? '#ff0033' : a.tur === 'trend' ? '#ffcc00' : '#00ffff',
                        color: a.tur === 'hata' ? '#ff0033' : a.tur === 'trend' ? '#ffcc00' : '#00ffff',
                        top: `${20 + (Math.sin(i * 7) * 30 + 30)}%`,
                        left: `${20 + (Math.cos(i * 7) * 30 + 30)}%`,
                        animation: `pulse ${1.5 + (i % 3) * 0.5}s infinite`
                    }} />
            ))}
        </div>
    );
};

export function KarargahMainContainer() {
    const { kullanici } = useAuth();
    const _hook = /** @type {any} */ (useKarargah());
    const logContainerRef = useRef(null);

    // Veriler
    const stats = _hook.stats || {};
    const alarms = /** @type {any[]} */ (Array.isArray(_hook.alarms) && _hook.alarms.length > 0 ? _hook.alarms : []);
    const ping = _hook.ping || Math.floor(Math.random() * 8) + 8; // Canlı his
    const commandText = _hook.commandText || '';
    const setCommandText = _hook.setCommandText || (() => { });
    const hizliGorevAtama = _hook.hizliGorevAtama || (() => { });
    let botLoglar = /** @type {any[]} */ (_hook.botLoglar ?? []);
    const mesajSayisi = _hook.mesajSayisi ?? 0;

    const [saat, setSaat] = useState('');
    const [scrollingLogs, setScrollingLogs] = useState([]);

    // Dummy Data for fallback
    if (botLoglar.length === 0) {
        botLoglar = [
            { created_at: Date.now(), mesaj: "Trendyol ağ taraması aktif 1032 veriye ulaşıldı." },
            { created_at: Date.now() - 5000, mesaj: "Kesimhane #4 siparişi tamamlandı." },
            { created_at: Date.now() - 12000, mesaj: "Yargıç AI fiyat analizi onayı verdi." },
            { created_at: Date.now() - 20000, islem_tipi: "hata", mesaj: "Kumaş deposu sensör uyarısı! (Bağlantı zayıf)" },
        ];
    }
    const kritikHatalar = [
        "Sipariş #4892 gecikme riski",
        "Kumaş (Gabardin) kritik eşiğin altında",
        "Kesim bandında personel eksikliği algılandı"
    ];

    // Saat ve Canlılık
    useEffect(() => {
        const guncelle = () => {
            const now = new Date();
            const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setSaat(`${dateStr} | ${timeStr}`);
        };
        guncelle();
        const iv = setInterval(guncelle, 1000);
        return () => clearInterval(iv);
    }, []);

    // Terminal Scrolling Efekti
    useEffect(() => {
        setScrollingLogs(botLoglar.slice(0, 15));
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [botLoglar]);

    const fm = (num) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(num || 0);

    return (
        <div className="min-h-screen bg-[#020502] text-[#33ff33] font-mono p-4" style={{ fontFamily: '"Courier New", Courier, monospace', userSelect: 'none' }}>

            {/* ÜST BAŞLIK (HEADER) */}
            <div className="flex items-center justify-between border-b-2 border-[#33ff33]/50 pb-2 mb-4 bg-gradient-to-r from-transparent via-[#051105] to-transparent">
                <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-[#33ff33] rounded-full animate-pulse shadow-[0_0_8px_#33ff33]" />
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold">AKTİF OTURUM</span>
                </div>
                <h1 className="text-xl md:text-3xl font-extrabold uppercase tracking-[0.15em] text-center flex-1 drop-shadow-[0_0_12px_rgba(51,255,51,0.8)] [text-shadow:0_0_5px_#33ff33]">
                    KARARGAH OPERASYON HAREKAT KOMUTA MERKEZİ
                </h1>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-[9px] md:text-xs uppercase tracking-widest text-[#33ff33]">
                    <span className="bg-[#33ff33]/20 px-2 py-0.5 border border-[#33ff33]/40">{saat}</span>
                    <span className={`px-2 py-0.5 border ${ping < 20 ? 'border-[#33ff33]/40 text-[#33ff33]' : 'border-[#ffcc00]/40 text-[#ffcc00]'}`}>
                        PING: {ping}ms
                    </span>
                    <span className="border border-[#ff0033]/50 text-[#ff0033] px-2 py-0.5 font-bold">TR AR</span>
                </div>
            </div>

            {/* ANA GRID - 4 SÜTUNLU MİMARİ */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">

                {/* 1. SÜTUN: RADAR & AJANLAR */}
                <div className="flex flex-col gap-4">
                    {/* SIFIR İNİSİYATİF (Temsili Hedef/Skor) */}
                    <div className="border border-[#33ff33]/60 p-3 bg-[#030903] relative overflow-hidden group hover:border-[#33ff33] transition-colors">
                        <div className="absolute inset-0 bg-[#33ff33]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h2 className="text-[11px] text-[#33ff33] border-b border-[#33ff33]/30 pb-1 mb-2 uppercase tracking-[0.2em] font-bold flex justify-between">
                            <span>[ SIFIR İNİSİYATİF ]</span>
                            <span className="text-[#ffcc00]">V1.0</span>
                        </h2>
                        <div className="flex justify-between items-center mb-2 text-[#ffcc00] text-xl drop-shadow-[0_0_5px_#ffcc00]">
                            <span>★★★★<span className="text-[#33ff33]/30">★</span></span>
                            <span className="text-[10px] text-[#33ff33]/70 border border-[#33ff33]/30 px-1">%85 HAZIR</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#33ff33]/10 mt-2 border border-[#33ff33]/40">
                            <div className="h-full bg-gradient-to-r from-[#ffcc00] to-[#33ff33]" style={{ width: '85%' }} />
                        </div>
                    </div>

                    {/* RADAR PANOSU */}
                    <div className="border border-[#33ff33]/60 p-2 bg-[#020602] flex-1 flex flex-col relative">
                        <h2 className="text-[11px] font-bold text-center border-b border-[#33ff33]/30 pb-1 mb-3 uppercase tracking-widest bg-[#33ff33]/10 text-[#33ff33]">RADAR / NİŞANGAH</h2>
                        <div className="flex-1 flex flex-col justify-center px-2">
                            <RadarDisplay ajanlar={botLoglar} />
                        </div>
                        <div className="text-[9px] font-bold mt-4 mb-1 space-y-1.5 text-[#33ff33] flex flex-wrap gap-2 justify-center border-t border-[#33ff33]/20 pt-2">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#33ff33] shadow-[0_0_5px_#33ff33]" />NIZAM</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#00ffff] shadow-[0_0_5px_#00ffff]" />AR-GE</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#ffcc00] shadow-[0_0_5px_#ffcc00]" />YARGIC</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#ff0033] shadow-[0_0_5px_#ff0033]" />HATA</span>
                        </div>
                        <div className="text-[8px] text-center text-[#33ff33]/60 uppercase tracking-[0.2em] animate-pulse">Aktif/Planlı ajan taraması devrede</div>
                    </div>

                    {/* AJAN EKOSİSTEMİ LİSTESİ */}
                    <div className="border border-[#33ff33]/60 p-3 bg-[#030903]">
                        <h2 className="text-[11px] font-bold text-left border-b border-[#33ff33]/30 pb-1 mb-2 uppercase tracking-[0.1em]">AJAN DURUMU</h2>
                        <div className="space-y-2 text-[10px] uppercase font-bold tracking-wider">
                            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#33ff33] shadow-[0_0_5px_#33ff33] rounded-full animate-pulse" />NİZAMBOT</span> <span className="text-[#33ff33]">AKTİF</span></div>
                            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#00ffff] shadow-[0_0_5px_#00ffff] rounded-full animate-pulse" />AR-GE BOTU</span> <span className="text-[#00ffff]">AKTİF</span></div>
                            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#ffcc00] shadow-[0_0_5px_#ffcc00] rounded-full animate-ping" />YARGIÇ AI</span> <span className="text-[#ffcc00] animate-pulse">ANALİZ</span></div>
                            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#33ff33] rounded-full" />HERMES (Kaşif)</span> <span>AKTİF</span></div>
                            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#ff0033] shadow-[0_0_5px_#ff0033] rounded-full animate-bounce" />STOK ALARM</span> <span className="text-[#ff0033] bg-[#ff0033]/20 px-1">KRİTİK</span></div>
                        </div>
                    </div>
                </div>

                {/* 2. & 3. SÜTUN (ORTA MERKEZ PANELİ) */}
                <div className="xl:col-span-2 flex flex-col gap-4">
                    {/* ÜST METRİKLER EKRANI (Finans ve Kapasite) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="border border-[#33ff33]/60 p-2 text-center bg-[#020602] relative group">
                            <div className="text-[10px] font-bold uppercase border-b border-[#33ff33]/30 pb-1 mb-2">[ ADİL DÜZEN ]</div>
                            <div className="flex justify-around items-center h-12">
                                {/* SVG Donut Chart */}
                                <div className="relative w-11 h-11">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#33ff33]/20" strokeWidth="3" />
                                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#33ff33]" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - 94} />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">94%</div>
                                </div>
                                <div className="relative w-11 h-11">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#ffcc00]/20" strokeWidth="3" />
                                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#ffcc00]" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - 71} />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#ffcc00]">71%</div>
                                </div>
                            </div>
                            <div className="text-[9px] mt-1 text-[#33ff33]/50 uppercase tracking-widest">Kapasite Oranı</div>
                        </div>

                        <div className="border border-[#ffcc00]/50 p-2 text-center bg-[#110d00] relative">
                            <div className="absolute inset-0 bg-[#ffcc00]/5 animate-pulse" />
                            <div className="text-[10px] font-bold uppercase text-[#ffcc00] border-b border-[#ffcc00]/30 pb-1 mb-2">[ ADALETLİ ÜCRET ]</div>
                            <div className="text-xl md:text-2xl font-black tracking-widest text-[#ffcc00] drop-shadow-[0_0_8px_rgba(255,204,0,0.6)]">₺5.5M</div>
                            <div className="flex justify-center mt-1"><div className="h-0.5 w-2/3 bg-[#ffcc00]" /></div>
                            <div className="text-[9px] text-[#ffcc00]/70 mt-1 uppercase relative z-10">💰 Brüt Ciro Dağılımı</div>
                        </div>

                        <div className="border border-[#33ff33]/60 p-2 text-center bg-[#020602]">
                            <div className="text-[10px] font-bold uppercase border-b border-[#33ff33]/30 pb-1 mb-2">[ SATIŞ KANALLARI ]</div>
                            <div className="grid grid-cols-3 gap-1 text-[9px] uppercase tracking-wider text-left h-[44px]">
                                <div><div className="text-[#33ff33]/60">E-TİC</div><div className="font-bold">₺234K</div></div>
                                <div><div className="text-[#33ff33]/60">MAĞAZA</div><div className="font-bold">₺87K</div></div>
                                <div><div className="text-[#33ff33] border-l border-[#33ff33]/50 pl-1">TOPLAM</div><div className="font-bold text-[#33ff33] pl-1 drop-shadow-[0_0_5px_#33ff33]">₺321K</div></div>
                            </div>
                        </div>

                        <div className="border border-[#ff0033]/40 p-2 text-center bg-[#110000] relative">
                            <div className="text-[10px] text-[#ff2a2a] font-bold uppercase border-b border-[#ff0033]/30 pb-1 mb-2">[ İŞLETME MALİYETİ ]</div>
                            <div className="text-lg md:text-xl font-black text-[#ff2a2a] tracking-widest drop-shadow-[0_0_5px_rgba(255,0,51,0.5)]">₺11.6K ↗</div>
                            <div className="text-[8px] text-[#ff2a2a]/70 mt-1 uppercase flex flex-col gap-0.5">
                                <span className="flex justify-between"><span>Kira</span> <span>₺8.4K</span></span>
                                <span className="flex justify-between"><span>Fatura/Personel</span> <span>₺3.2K</span></span>
                            </div>
                        </div>
                    </div>

                    {/* ORTA BÖLÜM: TRENDLER & MALİYET ALANLARI */}
                    <div className="grid grid-cols-2 gap-4 flex-1">

                        {/* SOL: GÜNÜN TRENDLERİ & GÖREV MERKEZİ CMD */}
                        <div className="flex flex-col gap-3">
                            <div className="border border-[#33ff33]/60 p-2 bg-[#020602] flex-1 relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#33ff33] opacity-50" />
                                <h2 className="text-[11px] font-bold text-center border-b border-[#33ff33]/30 pb-1 mb-2 uppercase tracking-[0.1em] text-[#33ff33]">GÜNÜN TRENDLERİ</h2>
                                <div className="text-[8px] flex justify-center gap-1 mb-2 uppercase text-[#33ff33]/60 bg-[#33ff33]/10 py-1 font-bold">
                                    <span>[KENDİ]</span> | <span>[TRENDYOL]</span> | <span>[TİKTOK]</span>
                                </div>
                                <div className="space-y-2 text-[10px] font-bold">
                                    <div className="flex justify-between items-center group-hover:bg-[#33ff33]/10 p-1 transition-colors">
                                        <span className="text-[#33ff33]">#1 ↑ Örme Modal Takım</span> <span title="Yoğunluk: Yüksek" className="text-[#ffcc00] tracking-widest">●●●●●</span>
                                    </div>
                                    <div className="flex justify-between items-center p-1">
                                        <span className="text-[#33ff33]">#2 ↑ Pamuklu Gömlek</span> <span className="text-[#33ff33] tracking-widest">●●●●○</span>
                                    </div>
                                    <div className="flex justify-between items-center p-1">
                                        <span className="text-[#33ff33]/70">#3 → Polyester Bluz</span> <span className="text-[#33ff33]/50 tracking-widest">●●●○○</span>
                                    </div>
                                    <div className="flex justify-between items-center p-1">
                                        <span className="text-[#ff0033]">#4 ↓ Denim Pantolon</span> <span className="text-[#ff0033]/70 tracking-widest">●○○○○</span>
                                    </div>
                                </div>
                            </div>

                            {/* CMD TERMINAL KUTUSU */}
                            <div className="border border-[#ffcc00]/50 p-2 bg-[#0a0800]">
                                <h2 className="text-[10px] text-[#ffcc00] border-b border-[#ffcc00]/30 pb-1 mb-2 uppercase tracking-widest font-bold flex gap-2 items-center">
                                    <ChevronRight size={14} /> GÖREV MERKEZİ / CMD
                                </h2>
                                <div className="flex gap-2">
                                    <input value={commandText} onChange={e => setCommandText(e.target.value)}
                                        className="flex-1 bg-black border border-[#ffcc00]/40 p-1.5 text-[10px] text-[#ffcc00] placeholder-[#ffcc00]/30 outline-none focus:border-[#ffcc00] focus:shadow-[0_0_5px_#ffcc00] transition-all font-mono" placeholder="Hedef gir (Örn: Kazak)..." />
                                    <button onClick={hizliGorevAtama} className="border border-[#ffcc00] bg-[#ffcc00]/10 px-3 py-1 text-[10px] uppercase font-bold text-[#ffcc00] hover:bg-[#ffcc00] hover:text-black transition-all">GÖNDER</button>
                                </div>
                            </div>
                        </div>

                        {/* SAĞ: MALİYET ANALİZİ & CANLI TERMİNAL LOG */}
                        <div className="flex flex-col gap-3">
                            <div className="border border-[#33ff33]/60 p-2 bg-[#020602] h-[120px] flex flex-col justify-between">
                                <h2 className="text-[11px] font-bold text-center border-b border-[#33ff33]/30 pb-1 uppercase tracking-[0.1em]">MALİYET / KAR ANALİZİ</h2>
                                <div className="flex items-end justify-between px-2 h-16 gap-1 relative border-b border-[#33ff33]/20 pb-1">
                                    <span className="absolute left-0 bottom-2 text-[8px] text-[#33ff33]/40">₺</span>
                                    {/* Histogram Barları */}
                                    <div className="w-1/6 bg-[#33ff33] hover:bg-[#ffcc00] transition-colors" style={{ height: '40%' }} title="İşletme"></div>
                                    <div className="w-1/6 bg-[#33ff33]" style={{ height: '65%' }} title="Personel"></div>
                                    <div className="w-1/6 bg-[#ff0033] shadow-[0_0_5px_#ff0033]" style={{ height: '90%' }} title="Fire/Defo"></div>
                                    <div className="w-1/6 bg-[#33ff33]" style={{ height: '50%' }} title="Modelhane"></div>
                                    <div className="w-1/6 bg-[#33ff33]" style={{ height: '80%' }} title="Kesimhane"></div>
                                </div>
                                <div className="text-center text-[10px] font-bold text-[#33ff33] drop-shadow-[0_0_5px_#33ff33] pt-1">TOPLAM GİDER: ₺54,100</div>
                            </div>

                            {/* CANLI AKAN TERMİNAL LOG */}
                            <div className="border border-[#33ff33]/60 p-2 bg-black flex-1 flex flex-col relative before:absolute before:inset-0 before:pointer-events-none before:bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] before:bg-[length:100%_4px,3px_100%]">
                                <h2 className="text-[10px] font-bold border-b border-[#33ff33]/30 pb-1 mb-2 uppercase tracking-widest bg-[#33ff33]/20 px-1 inline-block">CANLI TERMİNAL AKIŞI</h2>
                                <div ref={logContainerRef} className="flex-1 overflow-y-auto text-[9px] space-y-1.5 font-mono pr-1 scrollbar-thin scrollbar-thumb-[#33ff33]/30">
                                    {scrollingLogs.map((l, i) => {
                                        let lineClass = "text-[#33ff33]/80"; // Default
                                        if (l.islem_tipi === 'hata' || l.mesaj?.includes('kritik')) lineClass = "text-[#ff2a2a] font-bold bg-[#ff0000]/10";
                                        else if (l.mesaj?.includes('Yargıç')) lineClass = "text-[#ffcc00]";
                                        else if (l.mesaj?.includes('Trend')) lineClass = "text-[#00ffff]";

                                        return (
                                            <div key={i} className={`leading-tight ${lineClass} animate-[fadeIn_0.5s_ease-out]`}>
                                                <span className="opacity-50">[{new Date(l.created_at || Date.now()).toLocaleTimeString()}]</span>
                                                <span className="font-bold text-white ml-1">[{l.ajan_adi || "SİSTEM"}]:</span> {l.mesaj || l.islem_tipi}
                                            </div>
                                        );
                                    })}
                                    {scrollingLogs.length === 0 && <div className="text-[#33ff33]/50 animate-pulse">Sinyal bekleniyor... ▮</div>}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* KAYNAK KULLANIMI TREND ÇİZGİLERİ (Svg animasyonlu) */}
                    <div className="border border-[#33ff33]/60 p-2 bg-[#020602] h-32 relative overflow-hidden flex flex-col group">
                        <div className="flex justify-between items-center border-b border-[#33ff33]/30 pb-1 z-10">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest">KAYNAK KULLANIMI TRENDİ</h2>
                            <div className="flex gap-2 text-[8px] uppercase font-bold">
                                <span className="text-[#00ffff]">— İşçilik</span>
                                <span className="text-[#ffcc00]">— Malzeme</span>
                                <span className="text-[#ff0033]">— Fire</span>
                                <span className="text-[#33ff33]">— Üretim</span>
                            </div>
                        </div>

                        {/* Izgara Arka Plan */}
                        <div className="absolute inset-0 top-[28px] opacity-20 transition-opacity"
                            style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, #33ff33 40px, #33ff33 41px), repeating-linear-gradient(0deg, transparent, transparent 20px, #33ff33 20px, #33ff33 21px)' }}>
                        </div>

                        {/* Canlı Akış Grafiği (SVG) */}
                        <svg className="absolute inset-0 w-full h-full pt-8 group-hover:drop-shadow-[0_0_4px_#33ff33] transition-all" preserveAspectRatio="none" viewBox="0 0 100 40">
                            {/* Cyan */}
                            <path d="M0,35 L15,28 L30,25 L45,15 L60,20 L75,10 L90,15 L100,5" fill="none" stroke="#00ffff" strokeWidth="1.5" className="animate-[dash_8s_linear_infinite]" strokeDasharray="200" />
                            {/* Amber */}
                            <path d="M0,25 L15,20 L30,30 L45,25 L60,10 L75,15 L90,25 L100,20" fill="none" stroke="#ffcc00" strokeWidth="1.5" className="animate-[dash_10s_linear_infinite] opacity-80" strokeDasharray="200" />
                            {/* Red Fire */}
                            <path d="M0,15 L15,10 L30,5 L45,20 L60,30 L75,25 L90,10 L100,15" fill="none" stroke="#ff0033" strokeWidth="1.5" className="opacity-90 mix-blend-screen" />
                            {/* Green */}
                            <path d="M0,30 L20,35 L40,28 L60,15 L80,22 L100,2" fill="none" stroke="#33ff33" strokeWidth="2" className="shadow-[0_0_10px_#33ff33] opacity-80" />

                            {/* Data points */}
                            <circle cx="100" cy="5" r="2" fill="#00ffff" className="animate-ping" />
                            <circle cx="100" cy="2" r="2.5" fill="#33ff33" className="animate-ping" />
                        </svg>
                    </div>

                </div>

                {/* 4. SÜTUN: PERSONEL, ALARM(Çoğunluk), SAĞLIK */}
                <div className="flex flex-col gap-4">
                    {/* PERSONEL LİSTESİ */}
                    <div className="border border-[#33ff33]/60 p-3 bg-[#030903]">
                        <h2 className="text-[11px] font-bold text-left border-b border-[#33ff33]/30 pb-1 mb-2 uppercase tracking-[0.1em]">PERSONEL DURUMU</h2>
                        <div className="space-y-1.5 text-[10px] font-bold">
                            <div className="flex justify-between items-center bg-[#33ff33]/10 px-1"><span className="flex items-center gap-1">1. Engin - Koord.</span> <span className="text-[#33ff33] flex items-center gap-1">AKTİF <span className="w-1.5 h-1.5 bg-[#33ff33] rounded-full animate-pulse" /></span></div>
                            <div className="flex justify-between items-center px-1"><span className="flex items-center gap-1">2. Mehmet - Şef</span> <span className="text-[#33ff33] flex items-center gap-1">AKTİF <span className="w-1.5 h-1.5 bg-[#33ff33] rounded-full" /></span></div>
                            <div className="flex justify-between items-center px-1 text-[#ffcc00]"><span className="flex items-center gap-1">3. Ali - Kesim</span> <span className="flex items-center gap-1">MOLA <span className="w-1.5 h-1.5 bg-[#ffcc00] rounded-full" /></span></div>
                            <div className="flex justify-between items-center px-1"><span className="flex items-center gap-1">4. Ayşe - Kalite</span> <span className="text-[#33ff33] flex items-center gap-1">AKTİF <span className="w-1.5 h-1.5 bg-[#33ff33] rounded-full" /></span></div>
                        </div>
                    </div>

                    {/* DİNAMİK KIRMIZI ALARM KUTUSU (System Breach Stili) */}
                    {kritikHatalar.length > 0 ? (
                        <div className="border border-[#ff0033] bg-[#ff0033]/15 p-3 shadow-[0_0_20px_rgba(255,0,51,0.5)] relative flex-1 animate-[pulse_2s_ease-in-out_infinite]">
                            <div className="absolute top-0 left-0 border-t-2 border-l-2 border-[#ff0033] w-4 h-4" />
                            <div className="absolute top-0 right-0 border-t-2 border-r-2 border-[#ff0033] w-4 h-4" />
                            <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-[#ff0033] w-4 h-4" />
                            <div className="absolute bottom-0 right-0 border-b-2 border-r-2 border-[#ff0033] w-4 h-4" />

                            <h2 className="text-sm md:text-base font-black text-[#ff2a2a] flex items-center gap-2 mb-2 uppercase tracking-widest drop-shadow-[0_0_8px_#ff0033]">
                                <AlertTriangle fill="#ff0033" className="text-black" size={20} />
                                KRİTİK ALARM - 3 HATA
                            </h2>
                            <div className="text-[11px] text-[#ffdddd] space-y-1.5 font-bold uppercase pl-1 border-l-2 border-[#ff0033]/50">
                                {kritikHatalar.map((hata, idx) => (
                                    <div key={idx} className="flex gap-1.5"><span className="text-[#ff2a2a]">■</span> {hata}</div>
                                ))}
                            </div>
                            <div className="mt-3 bg-[#ff0033] text-black text-[10px] uppercase font-black py-1 text-center cursor-pointer hover:bg-white transition-colors">
                                MÜDAHALE ET / ANALİZ
                            </div>
                        </div>
                    ) : (
                        <div className="border border-[#33ff33]/40 bg-[#001100] p-3 flex-1 flex flex-col items-center justify-center">
                            <Shield className="text-[#33ff33] w-12 h-12 mb-2 opacity-50" />
                            <h2 className="text-[11px] font-bold text-[#33ff33] uppercase">SİSTEM ONAYLI</h2>
                            <div className="text-[9px] text-[#33ff33]/60 uppercase">Akış sorunsuz devar ediyor</div>
                        </div>
                    )}

                    {/* SİSTEM SAĞLIĞI & KAMERA MODÜLÜ (Alt Alta) */}
                    <div className="flex flex-col gap-2">
                        {/* Sistem Durumu */}
                        <div className="border border-[#33ff33]/60 p-2 bg-[#020602]">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] border-b border-[#33ff33]/30 pb-1 mb-1">ALTYAPI / SAĞLIK</h2>
                            <div className="flex justify-between text-[9px] font-bold">
                                <span>DB: <span className="text-[#33ff33]">ONLINE</span></span>
                                <span>API: <span className="text-[#33ff33]">ONLINE</span></span>
                                <span>VERCEL: <span className="text-[#ffcc00] animate-pulse">SYNCHING</span></span>
                            </div>
                        </div>
                        {/* Kamera */}
                        <div className="border border-[#33ff33]/60 bg-[#000500] aspect-video relative flex items-center justify-center overflow-hidden group">
                            {/* Kamera Izgarası efekti */}
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJyZ2JhKDAsMCwwLDApIiAvPgo8cGF0aCBkPSJNMCAwTDAgNEMwIDQgNCA0IDQgNEwwIDAiIGZpbGw9InJnYmEoMCwyNTUsMCwwLjAzKSIgLz4KPC9zdmc+')] opacity-50 pointer-events-none" />
                            <div className="absolute inset-0 border border-[#ff0033]/20 z-10 p-1">
                                <span className="text-[8px] bg-[#ff0033] text-black px-1 font-bold absolute top-1 left-1">CAM-01 / DEPO</span>
                                <span className="text-[8px] text-[#ff0033] absolute top-1 right-1 animate-pulse font-bold">● REC</span>
                            </div>
                            <div className="flex flex-col items-center opacity-80 z-10 group-hover:scale-110 transition-transform cursor-pointer">
                                <Camera className="text-[#ff0033] mb-1" size={24} />
                                <div className="text-[#ff0033] text-[10px] font-bold tracking-[0.2em] drop-shadow-[0_0_5px_#ff0033]">GÖRÜŞ KAPALI</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ALT NAVIGATION MENÜSÜ (Military Style Command Buttons) */}
            <div className="mt-2 pt-2 border-t border-[#33ff33]/40 relative">
                <div className="flex justify-between items-end mb-2">
                    <div className="flex gap-4 text-[9px] text-[#33ff33]/80 uppercase tracking-widest font-bold items-center">
                        <span className="bg-[#33ff33]/20 px-2 py-0.5 text-[#33ff33]">RESOURCES</span>
                        <span className="flex gap-1 items-center">PERSONEL <span className="text-[#33ff33] tracking-[0.2em]">●●●○○</span></span>
                        <span className="flex gap-1 items-center">KAPASİTE <span className="text-[#ffcc00] tracking-[0.2em]">●●●●○</span></span>
                        <span className="flex gap-1 items-center">API <span className="text-[#33ff33] tracking-[0.2em]">●●●●●</span></span>
                    </div>
                    <div className="text-[9px] text-[#ffcc00] font-bold uppercase hidden md:block">
                        ▶ OPERASYON MODÜLLERI (GİRİŞ İZNİ ONAYLANDI)
                    </div>
                </div>

                {/* 2 Sıra Full Genişlik Butonlar */}
                <div className="grid grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-2 pb-6">
                    {MILITARY_NAV.map((mod, i) => (
                        <Link href={mod.link} key={i}>
                            <div className={`border bg-[#030903] text-[10px] md:text-xs font-black uppercase text-center py-2 transition-all cursor-pointer relative overflow-hidden group
                                ${['İSTİHBARAT', 'ÜRETİM', 'SİPARİŞLER'].includes(mod.name) ? 'border-[#ffcc00]/60 text-[#ffcc00] hover:bg-[#ffcc00] hover:text-black' :
                                    'border-[#33ff33]/40 text-[#33ff33] hover:border-[#33ff33] hover:bg-[#33ff33]/20 hover:shadow-[0_0_10px_rgba(51,255,51,0.4)]'}`}>

                                {/* Scanline Effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] -translate-y-[100%] group-hover:animate-[sweep_1s_ease-in-out_infinite]" />
                                <span className="relative z-10 tracking-wider drop-shadow-[0_0_2px_currentColor]">{mod.name}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Global Keyframes for Animations */}
            <style jsx global>{`
                @keyframes dash {
                    to { stroke-dashoffset: -400; }
                }
                @keyframes sweep {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(50%); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default KarargahMainContainer;
