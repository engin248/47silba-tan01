'use client';
import { useState } from 'react';
import {
    Shirt, Plus, Search, AlertTriangle, CheckCircle2, Factory, Scissors,
    Trash2, Eye, Lock, QrCode, ClipboardList, Zap, ShieldAlert,
    Clock, Gauge, ChevronRight, Layers, FileText
} from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/lib/auth';
import { useModelhane } from '@/features/modelhane/hooks/useModelhane';

export default function ModelhaneMainContainer() {
    const { kullanici } = useAuth();
    const { yetkiliMi, loading, m3Talepleri, teknikAnalizVerileri, numuneDikimiBitir, durumGuncelle } = useModelhane(kullanici);

    const [sekmeler] = useState(['Provalar & Teknik Analiz (Numunesi Çıkanlar)', 'Onaylanan Modeller', 'İptal Edilenler']);
    const [aktifSekme, setAktifSekme] = useState(0);

    if (loading) return <div className="p-12 text-center text-purple-400 font-bold tracking-widest animate-pulse">SUPABASE M4 YÜKLENİYOR...</div>;

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 shadow-2xl rounded-2xl m-8 border-2 border-rose-900/50">
                <Lock size={48} className="mx-auto mb-4 text-rose-500" />
                <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">YETKİSİZ GİRİŞ (M4)</h2>
                <p className="text-rose-300 font-bold mt-2">Bu modül Teknik İnceleme ve Modelhane personeline özeldir.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>

                {/* 1. BAŞLIK VE HEDEF GÖSTERİCİ */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[#21262d] pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-900 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 border border-purple-500/30">
                            <Shirt size={24} className="text-purple-50" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight m-0 uppercase flex items-center gap-3">
                                M4: Modelhane ve Teknik Analiz
                            </h1>
                            <p className="text-xs font-bold text-purple-300 mt-1 uppercase tracking-wider flex items-center gap-2">
                                <ShieldAlert size={14} /> Aşama 4 Teknik Kurallar: (Zor Model + Özel Makine = RİSK)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2">
                            <Plus size={16} /> NUMUNE DİKİM FORMU Aç
                        </button>
                    </div>
                </div>

                {/* 2. TEKNİK ANALİZ (5 SORU) KPI'LARI */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    {[
                        { label: 'Şu Anki Numune Yükü', val: '12', desc: 'Dikilen Numuneler', color: 'text-purple-400', icon: Shirt },
                        { label: 'M3 Kalıp Bekleyen', val: '4', desc: 'Onay Bekliyor', color: 'text-blue-400', icon: FileText },
                        { label: 'Ort. İşçilik Süresi', val: '42 dk', desc: 'Tüm Modeller Ortalaması', color: 'text-emerald-400', icon: Clock },
                        { label: 'Özel Makine İhtiyacı', val: '2', desc: 'Kritik Darboğaz Riski', color: 'text-amber-400', icon: Factory },
                        { label: 'İmalat Hatası Öngörüsü', val: '%8.4', desc: 'Karargah Risk Ortalaması', color: 'text-rose-400', icon: AlertTriangle }
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={i} className="bg-[#161b22] border border-[#21262d] flex flex-col justify-between rounded-xl p-4 shadow-md">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${s.color}`}>{s.label}</span>
                                    <Icon size={14} className={s.color} />
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-white mt-1 border-b border-[#30363d] pb-1">{s.val}</div>
                                    <div className="text-[10px] text-[#8b949e] font-semibold mt-2">{s.desc}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* 3. İKİLİ PANE (SOL: M3 KALIP ONAYLARI, SAĞ: TEKNİK BİLGİ/ANALİZ LİSTESİ) */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">

                    {/* SOL PANEL (M3'TEN GELEN TALEPLER - NUMUNE İÇİN) */}
                    <div className="xl:col-span-1 bg-[#161b22] border border-[#21262d] rounded-xl flex flex-col h-[600px]">
                        <div className="p-4 border-b border-[#21262d]">
                            <h2 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                <Scissors size={14} /> M3 Kalıphane Çıktıları
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {m3Talepleri.length === 0 && <p className="text-[#8b949e] text-[10px] text-center mt-4">Şu an M3 Kalıphane'den gelen bir onay yok.</p>}
                            {m3Talepleri.map(talep => (
                                <div key={talep.id} className="bg-[#0d1117] border border-blue-500/30 p-3 rounded-lg flex flex-col gap-2 shadow-lg">
                                    <div className="text-[10px] text-blue-400 font-bold uppercase flex justify-between">
                                        <span>NUMUNE DİKİM EMRİ</span>
                                        <span className="bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded text-[9px]">M3 ONAYLI</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-white">{talep.b1_model_taslaklari?.model_adi || 'Bilinmiyor'}</h3>
                                    <div className="text-[11px] text-[#8b949e] bg-[#21262d] p-1.5 rounded flex justify-between items-center">
                                        <span>Kod: <span className="text-white font-bold">{talep.b1_model_taslaklari?.model_kodu || '-'}</span></span>
                                        <span className="text-purple-400 font-bold py-0.5 px-2 bg-purple-500/10 border border-purple-500/20 rounded">Kalıp: {talep.kalip_adi}</span>
                                    </div>
                                    <p className="text-[10px] text-[#8b949e] mb-1">Bedenler: <span className="text-emerald-400 font-mono tracking-wider">{(talep.bedenler || []).join(', ')}</span></p>
                                    <button
                                        onClick={async () => {
                                            const Swal = (await import('sweetalert2')).default;

                                            // Başlama Pop-up
                                            const { isConfirmed } = await Swal.fire({
                                                title: 'Dikim Kronometresi Başlatılsın mı?',
                                                html: `<b>${talep.b1_model_taslaklari?.model_kodu}</b> kodlu kalıp için işçilik süresi hesaplaması başlatılacak.`,
                                                icon: 'info',
                                                showCancelButton: true,
                                                confirmButtonText: '► BAŞLAT',
                                                cancelButtonText: 'İptal',
                                                background: '#0d1117',
                                                color: '#c9d1d9',
                                                confirmButtonColor: '#9333ea',
                                            });

                                            if (isConfirmed) {
                                                const baslamaZamani = Date.now();

                                                // Simüle edilmiş canlı sayaç
                                                Swal.fire({
                                                    title: 'NUMUNE DİKİLİYOR...',
                                                    html: `
                                                        <div style="font-size: 24px; font-weight: bold; font-family: monospace; color: #34d399; margin: 20px 0;">
                                                            <span id="swal-timer">00:00</span>
                                                        </div>
                                                        <p style="font-size:12px; color:#8b949e">Bitirdiğinizde yandaki butona tıklayın.</p>
                                                    `,
                                                    showConfirmButton: true,
                                                    confirmButtonText: '◼ BİTİR VE PROVAYA GÖNDER',
                                                    confirmButtonColor: '#ef4444', // Red button
                                                    background: '#0d1117',
                                                    color: '#f8fafc',
                                                    allowOutsideClick: false,
                                                    didOpen: () => {
                                                        const timerEl = document.getElementById('swal-timer');
                                                        let saniye = 0;
                                                        const interval = setInterval(() => {
                                                            saniye += 1;// Gerçekte normal saniye, test için x10 yapabiliriz ama normal olsun
                                                            const m = String(Math.floor(saniye / 60)).padStart(2, '0');
                                                            const s = String(saniye % 60).padStart(2, '0');
                                                            if (timerEl) timerEl.innerText = `${m}:${s}`;
                                                        }, 1000);
                                                        // Temizleme işlemi Swal kapandığında yapılır
                                                        Swal.getPopup().setAttribute('data-interval', String(interval));
                                                    },
                                                    willClose: () => {
                                                        const timerId = Swal.getPopup().getAttribute('data-interval');
                                                        if (timerId) clearInterval(Number(timerId));
                                                    }
                                                }).then(async (result) => {
                                                    if (result.isConfirmed) {
                                                        const bitisZamani = Date.now();
                                                        const sureSn = Math.floor((bitisZamani - baslamaZamani) / 1000);

                                                        // M4 Dikim İşlemi Bitişi -> Numune dikildi durumuna geçer ve listeye düşer.
                                                        await numuneDikimiBitir(talep.b1_model_taslaklari?.model_kodu, sureSn);

                                                        Swal.fire({
                                                            title: 'Dikim Tamamlandı!',
                                                            html: `Geçen Süre: <b>${sureSn} Saniye</b><br>Ürün şimdi <b>Teknik Analiz ve Prova Onay</b> listesine aktarıldı.`,
                                                            icon: 'success',
                                                            confirmButtonText: 'Tamam',
                                                            background: '#0d1117',
                                                            color: '#34d399',
                                                        });
                                                    }
                                                });
                                            }

                                        }}
                                        className="w-full text-[10px] font-bold py-2 bg-purple-600 hover:bg-purple-500 transition-colors border border-purple-400/50 hover:border-purple-300 rounded-lg text-white shadow-[0_0_10px_rgba(147,51,234,0.3)] hover:shadow-purple-500/50 active:scale-[0.98]">
                                        DİKİME BAŞLA (SAYAÇ)
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SAĞ PANEL (TEKNİK ANALİZ VE 5 SORU RAPORLARI) */}
                    <div className="xl:col-span-3 flex flex-col">
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {sekmeler.map((s, i) => (
                                <button key={i} onClick={() => setAktifSekme(i)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${aktifSekme === i ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' : 'bg-[#161b22] text-[#8b949e] border border-[#21262d] hover:text-white'
                                    }`}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl flex-1 p-4 overflow-y-auto">
                            <div className="relative mb-4 w-full max-w-md">
                                <Search className="absolute left-3 top-2.5 text-[#8b949e]" size={14} />
                                <input type="text" placeholder="Model Kodu veya Adı..." className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-purple-500 outline-none transition-colors" />
                            </div>

                            <div className="space-y-3">
                                {teknikAnalizVerileri.length === 0 && <p className="text-[#8b949e] text-xs text-center py-10">Gösterilecek numune bulgu kaydı yok.</p>}
                                {teknikAnalizVerileri.map((k, idx) => {
                                    const ozelMakineRef = k.aciklama?.toLowerCase().includes('özel makine') || false;
                                    const iscilikSuresiText = k.aciklama?.match(/Numune (\d+) saniyede dikildi/)?.[1] ? `${k.aciklama.match(/Numune (\d+) saniyede dikildi/)[1]} Saniye` : 'Bilinmiyor';
                                    const isRiskli = k.durum === 'iptal_riskli';

                                    return (
                                        <div key={idx} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between gap-4 transition-colors ${isRiskli ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[#0d1117] border-[#30363d] hover:bg-[#0b121a]'}`}>

                                            {/* Model Kimliği */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] font-black uppercase bg-[#21262d] text-white px-2 py-0.5 rounded border border-[#30363d]">{k.model_kodu}</span>
                                                    {isRiskli && <span className="text-[9px] font-black uppercase bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse">RAPOR: KRİTİK RİSK (REDDEDİLDİ)</span>}
                                                </div>
                                                <h3 className="text-sm font-bold text-white tracking-wide">{k.model_adi}</h3>
                                                <p className="text-[11px] text-[#8b949e] mt-2 mb-1 font-mono">{k.aciklama}</p>
                                            </div>

                                            {/* Analiz Matrixi (AŞAMA 4: Teknik 5 Soru) */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 border-l border-[#21262d] pl-4 shrink-0">
                                                <div className="flex flex-col gap-1 justify-center bg-[#0d1117] px-2 rounded">
                                                    <span className="text-[9px] text-[#8b949e] font-bold uppercase tracking-wider">İşçilik Süresi (Bant Başına)</span>
                                                    <span className="text-[15px] font-mono font-bold text-white flex items-center gap-1">
                                                        <Clock size={12} className="text-purple-400" /> {iscilikSuresiText}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1 justify-center">
                                                    <span className="text-[9px] text-[#8b949e] font-bold uppercase tracking-wider">Özel Makine</span>
                                                    <span className={`text-[12px] font-mono font-bold ${ozelMakineRef ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {ozelMakineRef ? 'Evet (Risk)' : 'Gerekmez'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Aksiyon Barı */}
                                            <div className="flex flex-col justify-center items-end gap-2 shrink-0 border-l border-[#21262d] pl-4 flex-1 md:flex-none">
                                                {isRiskli ? (
                                                    <button onClick={() => durumGuncelle(k.id, 'taslak')} className="text-[10px] w-full md:w-auto font-bold text-center text-white bg-rose-600/80 hover:bg-rose-500 border border-rose-500/50 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-md shadow-rose-500/20">
                                                        M1 BEYİNE GERİ GÖNDER (İPTAL)
                                                    </button>
                                                ) : (
                                                    <button onClick={() => durumGuncelle(k.id, 'uretime_hazir')} className="text-[10px] font-bold text-center text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-lg transition-colors border border-emerald-500/20 border-b-emerald-500/50 flex items-center justify-center gap-1 w-full md:w-auto">
                                                        M5 KESİM SÜRECİNİ BAŞLAT <ChevronRight size={14} />
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
