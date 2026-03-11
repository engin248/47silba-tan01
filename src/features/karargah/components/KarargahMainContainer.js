'use client';
/**
 * features/karargah/components/KarargahMainContainer.js
 * THE ORDER / NIZAM - GLOBAL COMMAND CENTER (WAR ROOM)
 * Responsive: Desktop(4 cols) -> Tablet(2 cols) -> Mobile(1 col)
 * Theme: Dark Mode (Night Ops) #0f172a
 */
import {
    Activity, ShieldCheck, Database, PlusSquare,
    Settings, Zap, AlertCircle, TrendingUp, Users, Scissors,
    Bot, Camera
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// MODÜLLER (Hızlı Erişim Katmanı - 12 Sabit Widget Kuralı)
const MODULLER = [
    { name: 'Ar-Ge', link: '/arge', renk: 'bg-emerald-800' },
    { name: 'Kumaş', link: '/kumas', renk: 'bg-slate-800' },
    { name: 'Kalıp', link: '/kalip', renk: 'bg-slate-800' },
    { name: 'Modelhane', link: '/modelhane', renk: 'bg-slate-800' },
    { name: 'Kesim', link: '/kesim', renk: 'bg-indigo-800' },
    { name: 'Üretim', link: '/uretim', renk: 'bg-indigo-800' },
    { name: 'Maliyet', link: '/maliyet', renk: 'bg-rose-800' },
    { name: 'Rapor', link: '/raporlar', renk: 'bg-orange-800' },
    { name: 'Ürün', link: '/katalog', renk: 'bg-slate-800' },
    { name: 'Sipariş', link: '/siparisler', renk: 'bg-blue-800' },
    { name: 'Sevkiyat', link: '/stok', renk: 'bg-slate-800' },
    { name: 'Güvenlik', link: '/guvenlik', renk: 'bg-slate-800' }
];

export default function KarargahSayfasi() {
    const { kullanici } = useAuth();

    // Yükleme Süresi ve Veri Setleri
    const [stats, setStats] = useState({ ciro: 0, maliyet: 0, personel: 0, fire: 0, yukleniyor: true });
    const [alarms, setAlarms] = useState([]);
    const [commandText, setCommandText] = useState('');
    const [aiSorgu, setAiSorgu] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        // [Optimizasyon] 1.5 Saniyede Tüm Veriyi Yükleme Kuralı
        const veriCek = async () => {
            try {
                // Burada mevcut mimarideki veriler (Promise.allSettled) çekilir. Simulasyon Hizi:
                setTimeout(() => {
                    setStats({ ciro: 1250000, maliyet: 840000, personel: 120000, fire: 2.4, yukleniyor: false });
                    setAlarms([{ id: 1, text: 'Modelhane onay gecikmesi', tip: 'sari' }, { id: 2, text: 'Kesim makinesi bakım uyarısı', tip: 'kirmizi' }]);
                }, 800); // 0.8 saniyede UI açılır
            } catch (err) { }
        };
        veriCek();
    }, []);

    const fm = (num) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(num);

    return (
        <div className="bg-[#0f172a] min-h-screen p-4 text-white font-sans selection:bg-emerald-500 selection:text-white" style={{ fontFamily: 'Arial, sans-serif' }}>

            {/* GRID CONTAINER - 3 Katmanlı Mimari */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 xl:gap-6 min-h-[90vh]">

                {/* SOL / ANA BÖLÜM (%75 MASAÜSTÜ GENİŞLİĞİ) */}
                <div className="lg:col-span-3 flex flex-col gap-5">

                    {/* KATMAN 1: DURUM RADARI (4 Sütun) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/raporlar" passHref>
                            <div className="bg-[#16a34a] p-4 rounded-xl flex flex-col justify-between shadow-lg h-28 transform transition-transform hover:scale-[1.02] cursor-pointer cursor-pointer border border-[#16a34a] hover:border-white/20">
                                <span className="text-sm font-bold opacity-90 uppercase truncate">Günlük Ciro</span>
                                <span className="text-2xl font-black truncate">₺ {stats.yukleniyor ? '...' : fm(stats.ciro)}</span>
                            </div>
                        </Link>
                        <Link href="/maliyet" passHref>
                            <div className="bg-[#2563eb] p-4 rounded-xl flex flex-col justify-between shadow-lg h-28 transform transition-transform hover:scale-[1.02] cursor-pointer cursor-pointer border border-[#2563eb] hover:border-white/20">
                                <span className="text-sm font-bold opacity-90 uppercase truncate">Toplam Maliyet</span>
                                <span className="text-2xl font-black truncate">₺ {stats.yukleniyor ? '...' : fm(stats.maliyet)}</span>
                            </div>
                        </Link>
                        <Link href="/personel" passHref>
                            <div className="bg-[#7c3aed] p-4 rounded-xl flex flex-col justify-between shadow-lg h-28 transform transition-transform hover:scale-[1.02] cursor-pointer cursor-pointer border border-[#7c3aed] hover:border-white/20">
                                <span className="text-sm font-bold opacity-90 uppercase truncate">Personel Gider</span>
                                <span className="text-2xl font-black truncate">₺ {stats.yukleniyor ? '...' : fm(stats.personel)}</span>
                            </div>
                        </Link>
                        <Link href="/maliyet" passHref>
                            <div className="bg-[#dc2626] p-4 rounded-xl flex flex-col justify-between shadow-lg h-28 transform transition-transform hover:scale-[1.02] cursor-pointer cursor-pointer border border-[#dc2626] hover:border-white/20">
                                <span className="text-sm font-bold opacity-90 uppercase truncate">Fire / Zayiat</span>
                                <span className="text-2xl font-black truncate">%{stats.yukleniyor ? '...' : stats.fire}</span>
                            </div>
                        </Link>
                    </div>

                    {/* KATMAN 2: OPERASYON KOMUTA VE YAPAY ZEKA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Hızlı Görev Atama */}
                        <div className="bg-[#1e293b] p-5 rounded-2xl shadow-lg border border-slate-700/50 flex flex-col gap-3">
                            <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2 mb-1 tracking-wider"><Zap size={14} /> Hızlı Görev Atama</h3>
                            <div className="flex gap-2">
                                <input
                                    value={commandText}
                                    onChange={(e) => setCommandText(e.target.value)}
                                    placeholder="Örn: 100 adet pantolon kesim başlat"
                                    className="flex-1 bg-[#0f172a] text-white px-4 py-2 rounded-xl border border-slate-600 focus:outline-none focus:border-blue-500 transition-colors text-sm font-semibold placeholder-slate-500"
                                />
                                <button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2 rounded-xl font-bold transition-colors shadow-lg text-sm tracking-wide">
                                    BAŞLAT
                                </button>
                            </div>
                        </div>

                        {/* AI / Ar-Ge Komuta */}
                        <div className="bg-[#1e293b] p-5 rounded-2xl shadow-lg border border-slate-700/50 flex flex-col gap-3">
                            <h3 className="text-xs font-bold uppercase text-emerald-500 flex items-center gap-2 mb-1 tracking-wider"><Bot size={14} /> AI / Ar-Ge Komuta Merkezi</h3>
                            <div className="flex gap-2">
                                <input
                                    value={aiSorgu}
                                    onChange={(e) => setAiSorgu(e.target.value)}
                                    placeholder="Örn: 2026 İlkbahar Keten Trendi"
                                    className="flex-1 bg-[#0f172a] text-white px-4 py-2 rounded-xl border border-emerald-900 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-semibold placeholder-slate-500"
                                />
                                <Link href="/arge">
                                    <button
                                        onClick={() => { setIsAiLoading(true); setTimeout(() => setIsAiLoading(false), 2000); }}
                                        className="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-2 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap text-sm tracking-wide"
                                    >
                                        {isAiLoading ? 'Analiz...' : 'ANALİZ ET'}
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* KATMAN 2.2: ANA SİSTEM MODÜLLERİ (12 Widget Kuralı) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {MODULLER.map((mod, i) => (
                            <Link href={mod.link} key={i}>
                                <div className={`${mod.renk} hover:opacity-80 transition-all p-4 rounded-xl text-center shadow-md flex items-center justify-center border border-white/5 h-20`}>
                                    <span className="font-bold text-sm tracking-wide">{mod.name}</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>

                {/* SAĞ BÖLÜM: GÖZLEM VE KONTROL WIDGETLARI (%25 MASAÜSTÜ GENİŞLİĞİ) */}
                <div className="flex flex-col gap-4">

                    {/* WIDGET 1: Aktif Alarmlar & Kriz Paneli */}
                    <div className="bg-[#1e293b] p-5 rounded-2xl shadow-lg border border-slate-700/50">
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-3 flex items-center gap-2"><ShieldCheck size={14} /> Güvenlik & Kriz Paneli</h3>

                        {/* Edge AI Kamera Uyarı Kesiti */}
                        <Link href="/kameralar" passHref>
                            <div className="mb-4 bg-slate-800 p-3 rounded-xl border border-rose-900/50 flex gap-3 items-center cursor-pointer hover:bg-slate-700 transition-colors">
                                <div className="w-16 h-12 bg-black rounded flex items-center justify-center text-rose-500 relative overflow-hidden shrink-0 border border-slate-700">
                                    <Camera size={18} className="absolute z-10" />
                                    <div className="absolute inset-0 bg-rose-500/20 animate-pulse"></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1"><Bot size={10} /> Edge AI Tetikte</span>
                                    <span className="text-[11px] text-slate-300 font-semibold leading-tight mt-0.5">Kameralar dinleniyor. Kriz anında bildirim düşecektir.</span>
                                </div>
                            </div>
                        </Link>

                        {alarms.length === 0 ? (
                            <div className="text-emerald-400 font-bold text-sm bg-emerald-900/40 p-3 rounded-lg border border-emerald-800">✅ Alarm yok, sistem temiz.</div>
                        ) : (
                            <div className="space-y-2">
                                {alarms.map(al => (
                                    <div key={al.id} className="text-xs font-bold text-slate-300 bg-slate-800 p-3 rounded-lg border-l-4 border-red-500">{al.text}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* WIDGET 2: Sistem Sağlığı */}
                    <div className="bg-[#1e293b] p-5 rounded-2xl shadow-lg border border-slate-700/50">
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-3 flex items-center gap-2"><Activity size={14} /> Sistem Sağlığı</h3>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs font-bold"><span>CPU</span> <span className="text-emerald-400">%18</span></div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '18%' }}></div></div>
                            <div className="flex justify-between items-center text-xs font-bold mt-2"><span>DB Response</span> <span className="text-emerald-400">42ms</span></div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '8%' }}></div></div>
                        </div>
                    </div>

                    {/* WIDGET 3: Son Aktiviteler */}
                    <div className="bg-[#1e293b] p-5 rounded-2xl shadow-lg border border-slate-700/50 flex-1">
                        <h3 className="text-xs font-black uppercase text-slate-400 mb-3 flex items-center gap-2"><Zap size={14} /> Son Aktiviteler</h3>
                        <div className="space-y-3">
                            <div className="text-xs text-slate-300 font-semibold"><span className="text-emerald-400 font-black">1dk önce</span> - Sipariş onaylandı</div>
                            <div className="text-xs text-slate-300 font-semibold"><span className="text-emerald-400 font-black">5dk önce</span> - Üretim bandı durdu</div>
                            <div className="text-xs text-slate-300 font-semibold"><span className="text-emerald-400 font-black">12dk önce</span> - Yeni model eklendi</div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
