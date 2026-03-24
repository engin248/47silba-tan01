'use client';
import { useState } from 'react';
import {
    Layers, Plus, Search, AlertTriangle, CheckCircle2, Package, Scissors,
    Trash2, Eye, Lock, QrCode, Tag, ExternalLink, ChevronRight, Scale
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useKumas } from '@/features/kumas/hooks/useKumas';

export default function KumasMainContainer() {
    const { kullanici } = useAuth();
    const {
        yetkiliMi, sekme, setSekme, kumaslar, m1Talepleri, firsatlar,
        loading, m3eAktar
    } = useKumas(kullanici);

    // YENİ: Çevik Üretim Fizibilite Modal State'leri
    const [fizibiliteModalAcik, setFizibiliteModalAcik] = useState(false);
    const [seciliTalep, setSeciliTalep] = useState(null);
    const [maliyetForm, setMaliyetForm] = useState({
        kumasFiyat: '',
        kumasMiktar: '',
        iscilik: '',
        rakipSatis: '499.90' // Otomatik veya Manuel Rakip Satış Fiyatı
    });

    const toplamMaliyet = (parseFloat(maliyetForm.kumasFiyat || 0) * parseFloat(maliyetForm.kumasMiktar || 0)) + parseFloat(maliyetForm.iscilik || 0);
    const karMarjiTutar = parseFloat(maliyetForm.rakipSatis || 0) - toplamMaliyet;
    const karMarjiYuzde = parseFloat(maliyetForm.rakipSatis || 0) > 0 ? ((karMarjiTutar / parseFloat(maliyetForm.rakipSatis)) * 100).toFixed(1) : 0;
    const karlilikUygun = karMarjiYuzde >= 40; // Patron %40 altı kârlılığı reddeder

    const sekmeler = ['kumas', 'aksesuar', 'firsat', 'm1', 'risk'];
    const sekmeIsimleri = ['Kumaş Arşivi', 'Aksesuar Deposu', 'Ölü Stok Radarı (AI)', "M1'den Gelen Talepler", 'Tedarik Risk Analizi'];

    const setAktifSekme = (ind) => setSekme(sekmeler[ind]);
    const aktifSekme = sekmeler.indexOf(sekme) !== -1 ? sekmeler.indexOf(sekme) : 0;

    const kumasRaporu = kumaslar.map(k => ({
        id: k.id, kodu: k.kumas_kodu, ad: k.kumas_adi, kompozisyon: k.kompozisyon,
        stok: parseFloat(k.stok_mt) || 0, minStok: parseFloat(k.min_stok_mt) || 0, birimFiyat: k.birim_maliyet_tl,
        tedarikci: k.tedarikci_adi || 'Bilinmiyor', riskSuresi: 'Bilinmiyor', alternatifVar: true,
        durum: parseFloat(k.stok_mt) < parseFloat(k.min_stok_mt) ? 'riskli' : 'guvenli'
    }));

    if (loading) {
        return <div className="p-12 text-center text-emerald-400 font-bold tracking-widest animate-pulse">SUPABASE M2 BAĞLANTISI KURULUYOR...</div>;
    }

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 shadow-2xl rounded-2xl m-8">
                <Lock size={48} className="mx-auto mb-4 text-rose-500" />
                <h2 className="text-xl font-black text-rose-500 uppercase">YETKİSİZ GİRİŞ (M2)</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>

                {/* 1. BAŞLIK VE HEDEF GÖSTERİCİ */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[#21262d] pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                            <Layers size={24} className="text-emerald-50" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight m-0 uppercase flex items-center gap-3">
                                M2: Malzeme & Kumaş Kütüphanesi
                            </h1>
                            <p className="text-xs font-bold text-emerald-300 mt-1 uppercase tracking-wider">
                                Aşama 2: Tedarik Riski & Maliyet Filtresi (Kural: Tek Tedarikçi = RİSK)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2">
                            <Plus size={16} /> YENİ MATERYAL GİRİŞİ
                        </button>
                    </div>
                </div>

                {/* 2. TEDARİK RİSK (4 NOKTA) KPI'LARI */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Aktif Kod Sayısı', val: '412', desc: 'Sisteme Kayıtlı Materyal', color: 'text-emerald-400' },
                        { label: 'Tek Tedarikçi (RİSK)', val: '14', desc: 'Alternatifi Yok (Ted. Riski)', color: 'text-rose-400' },
                        { label: 'Sürekli Kumaş', val: '158', desc: 'Kesintisiz Tedarik Devamı', color: 'text-blue-400' },
                        { label: 'Yüksek MOQ', val: '5', desc: 'Minimum Sipariş Riski', color: 'text-amber-400' }
                    ].map((s, i) => (
                        <div key={i} className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col justify-between shadow-md">
                            <span className={`text-sm font-bold uppercase tracking-wider ${s.color}`}>{s.label}</span>
                            <div className="text-2xl font-black text-white mt-2 border-b border-[#30363d] pb-2">{s.val}</div>
                            <div className="text-sm text-[#8b949e] font-semibold mt-2">{s.desc}</div>
                        </div>
                    ))}
                </div>

                {/* 3. İKİLİ PANE (SOL: M1'DEN GELEN TALEPLER, SAĞ: ENVANTER / DİJİTAL KÜTÜPHANE) */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">

                    {/* SOL PANEL (M1 ONAY BEKLEYENLER) */}
                    <div className="xl:col-span-1 bg-[#161b22] border border-[#21262d] rounded-xl flex flex-col h-[600px]">
                        <div className="p-4 border-b border-[#21262d]">
                            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle size={14} /> M1'den Bekleyenler
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {m1Talepleri.length === 0 && <p className="text-[#8b949e] text-sm text-center mt-4">Henüz onaylanmış yeni bir M1 Karar talebi yok.</p>}
                            {m1Talepleri.map(talep => (
                                <div key={talep.id} className="bg-[#0d1117] border border-amber-500/30 p-3 rounded-lg flex flex-col gap-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-amber-400 font-bold uppercase">YENİ MODEL (AŞAMA 2)</span>
                                        <span className="text-sm text-emerald-400 font-bold border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10">M1 ONAYLI</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-white">{talep.baslik}</h3>
                                    {talep.aciklama && (
                                        <div className="text-sm text-[#8b949e] border-l-2 border-amber-500/50 pl-2 bg-[#21262d] p-2 rounded italic">
                                            {talep.aciklama.substring(0, 100)}...
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            setSeciliTalep(talep);
                                            setFizibiliteModalAcik(true);
                                        }}
                                        className="w-full text-sm font-bold text-center py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded mt-2 text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                                    >
                                        <Scale size={12} /> BİZ KAÇA MAL EDERİZ? (FİZİBİLİTE)
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SAĞ PANEL (KÜTÜPHANE / RİSK ANALİZ LİSTESİ) */}
                    <div className="xl:col-span-3 flex flex-col">
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {sekmeIsimleri.map((s, i) => (
                                <button key={i} onClick={() => setAktifSekme(i)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${aktifSekme === i ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50' : 'bg-[#161b22] text-[#8b949e] border border-[#21262d] hover:text-white'
                                    }`}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="bg-[#161b22] border border-[#21262d] rounded-xl flex-1 p-4 overflow-y-auto">
                            <div className="relative mb-4 w-full max-w-md">
                                <Search className="absolute left-3 top-2.5 text-[#8b949e]" size={14} />
                                <input type="text" placeholder="Kumaş Kodu, Adı veya Kompozisyon (Örn: Polyamid)..." className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-emerald-500 outline-none transition-colors" />
                            </div>

                            <div className="space-y-3">
                                {sekme === 'firsat' ? (
                                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-6 text-center">
                                        <h3 className="text-lg font-black text-amber-500 mb-2 uppercase tracking-wide">AI Fırsat Radarı (Upcycle) Devrede</h3>
                                        <p className="text-sm text-amber-200/70 mb-6">Depoda bekleyen, hareketsiz kumaşlarınızı (Ölü Stok) sisteme yükleyin. M1 Trend İstihbarat motoru ile eşleşen güncel modelleri bulup, doğrudan M3 Modelhaneye üretim tavsiyesi ve marj analizi sunalım.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                            {firsatlar && firsatlar.length > 0 ? (
                                                firsatlar.map((f, i) => {
                                                    const aiVeri = f.ai_trend_eslesme || {};
                                                    return (
                                                        <div key={i} className="bg-[#0b121a] border border-[#21262d] rounded-xl p-4 flex gap-4">
                                                            <div className="w-20 h-20 bg-[#161b22] rounded-lg border border-[#30363d] shrink-0 overflow-hidden flex items-center justify-center relative">
                                                                {f.fotograf_urls && f.fotograf_urls[0] ? (
                                                                    <img src={f.fotograf_urls[0]} alt="Kumas" className="w-full h-full object-cover opacity-80" />
                                                                ) : (
                                                                    <span className="text-sm text-[#8b949e]">FOTOĞRAF</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-start">
                                                                    <h4 className="font-bold text-white text-sm">{f.ad} {f.kondisyon_notu ? `(${f.kondisyon_notu})` : ''}</h4>
                                                                    <span className="text-sm bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                                                                        %{aiVeri.beklenen_marj_yuzdesi || 65} TAHMİNİ MARJ
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-[#8b949e] mt-1 mb-2">
                                                                    M1 Trend Eşleşmesi: {aiVeri.model_tavsiyesi || "Sistem eşleşme arıyor..."}. Stok: {f.stok_miktar} {f.stok_birimi}
                                                                </p>
                                                                <button className="text-sm font-bold text-black bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-md transition-colors w-full">
                                                                    MODEL UYARLA VE M3'E YOLLA
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="col-span-1 border border-dashed border-amber-500/30 p-4 text-center rounded-xl text-amber-500/50">
                                                    Şu an için "is_firsat = true" olarak M2 veritabanına eklenmiş kayıt bulunmuyor.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {kumasRaporu.map((k, idx) => (
                                            <div key={idx} className={`rounded-xl border flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${k.durum === 'riskli' ? 'border-rose-500/30' : 'border-[#30363d]'}`}>

                                                {/* GÖRSEL ALANI (ARŞİV) */}
                                                <div className="h-40 bg-[#0b121a] relative flex items-center justify-center border-b border-[#21262d]">
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] to-transparent z-10"></div>
                                                    <span className="text-sm text-[#8b949e] font-black tracking-widest uppercase">GÖRSEL EKLENMEDİ</span>
                                                    {k.durum === 'riskli' && (
                                                        <div className="absolute top-2 right-2 z-20 bg-rose-500/90 text-white text-xs font-black uppercase px-2 py-0.5 rounded shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                                                            RİSK
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`p-4 flex flex-col flex-1 bg-[#0d1117]`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-black uppercase bg-[#21262d] text-emerald-400 px-2 py-0.5 rounded border border-[#30363d]">{k.kodu}</span>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-white tracking-wide">{k.ad}</h3>
                                                    <p className="text-sm text-[#8b949e] mt-1 mb-4 border-l-2 border-[#30363d] pl-2">{k.kompozisyon}</p>

                                                    <div className="grid grid-cols-2 gap-3 mb-4 bg-[#161b22] p-3 rounded-lg border border-[#21262d]">
                                                        <div className="flex flex-col gap-1 border-r border-[#30363d]">
                                                            <span className="text-xs text-[#8b949e] font-bold uppercase tracking-wider">Maliyet</span>
                                                            <span className="text-lg font-mono text-white">₺{k.birimFiyat.toFixed(2)}<span className="text-sm text-gray-500">/mt</span></span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 pl-2">
                                                            <span className="text-xs text-[#8b949e] font-bold uppercase tracking-wider">M11 Stok</span>
                                                            <span className={`text-lg font-mono font-bold ${k.stok <= k.minStok ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                {k.stok}<span className="text-sm text-gray-500">mt</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest border-t border-[#30363d] pt-3 mb-4">
                                                        <span className="text-[#8b949e]">Alternatif:</span>
                                                        <span className={k.alternatifVar ? 'text-[#c9d1d9]' : 'text-rose-400'}>{k.tedarikci}</span>
                                                    </div>

                                                    <div className="flex gap-2 mt-auto">
                                                        <button className="flex-1 text-sm font-bold text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 uppercase tracking-widest border border-[#30363d]">
                                                            <Eye size={14} /> KARTELA
                                                        </button>
                                                        <Link href="/kalip" className="flex-1">
                                                            <button className="w-full text-sm font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 py-2.5 rounded-lg transition-colors border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] uppercase tracking-widest flex items-center justify-center gap-1">
                                                                M3'E AT
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {/* FİZİBİLİTE VE KARTELA MODALI */}
            {fizibiliteModalAcik && seciliTalep && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0d1117] border border-emerald-500/30 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden">

                        <div className="bg-[#161b22] p-5 border-b border-[#30363d] flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <Scale size={18} /> M2 FİZİBİLİTE KONTROLÜ
                                </h2>
                                <p className="text-xs text-[#8b949e] mt-1 font-semibold">Tedarikçi/Kartela Kumaşıyla Kârlılık Testi</p>
                            </div>
                            <button onClick={() => setFizibiliteModalAcik(false)} className="text-[#8b949e] hover:text-white">✕</button>
                        </div>

                        <div className="p-6">
                            <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-xl mb-6 flex justify-between items-center">
                                <div>
                                    <div className="text-sm text-[#8b949e] font-bold uppercase mb-1">AR-GE'NİN BULDUĞU HEDEF (BİNGO)</div>
                                    <div className="text-sm font-black text-white">{seciliTalep.baslik}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-amber-500 font-bold uppercase mb-1">Rakip Pazar Satış Fiyatı</div>
                                    <input
                                        type="number"
                                        value={maliyetForm.rakipSatis}
                                        onChange={e => setMaliyetForm({ ...maliyetForm, rakipSatis: e.target.value })}
                                        className="bg-[#0b121a] text-amber-400 font-mono text-right border border-amber-500/30 rounded px-2 py-1 w-24 text-sm outline-none focus:border-amber-500"
                                    /> ₺
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#8b949e] uppercase mb-1">Bulunan Kartela Metre Fiyatı (₺)</label>
                                        <input type="number" placeholder="Örn: 85" value={maliyetForm.kumasFiyat} onChange={e => setMaliyetForm({ ...maliyetForm, kumasFiyat: e.target.value })} className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#8b949e] uppercase mb-1">Takıma Kaç Metre Gider?</label>
                                        <input type="number" placeholder="Örn: 2.5" value={maliyetForm.kumasMiktar} onChange={e => setMaliyetForm({ ...maliyetForm, kumasMiktar: e.target.value })} className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#8b949e] uppercase mb-1">Toplam İşçilik/Aksesuar (₺)</label>
                                        <input type="number" placeholder="Örn: 75" value={maliyetForm.iscilik} onChange={e => setMaliyetForm({ ...maliyetForm, iscilik: e.target.value })} className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
                                    </div>

                                    <div className={`p-4 rounded-xl border-2 flex flex-col justify-center items-center h-[66px] transition-colors ${toplamMaliyet > 0 ? (karlilikUygun ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-rose-500/10 border-rose-500/50') : 'bg-[#161b22] border-[#30363d]'}`}>
                                        <div className="text-sm font-bold uppercase tracking-widest text-[#8b949e] mb-1">BİZİM MALİYETİMİZ</div>
                                        <div className="text-xl font-black font-mono text-white">₺ {toplamMaliyet.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>

                            {toplamMaliyet > 0 && (
                                <div className={`p-5 rounded-xl border flex justify-between items-center mb-6 transition-all ${karlilikUygun ? 'bg-emerald-950/20 border-emerald-500' : 'bg-rose-950/20 border-rose-500'}`}>
                                    <div>
                                        <div className={`text-xs font-bold uppercase tracking-widest ${karlilikUygun ? 'text-emerald-400' : 'text-rose-400'}`}>Tahmini Kâr Marjı</div>
                                        <div className={`text-3xl font-black font-mono mt-1 ${karlilikUygun ? 'text-emerald-400' : 'text-rose-500'}`}>
                                            %{karMarjiYuzde}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-[#8b949e] uppercase font-bold">Adet Başı Net Kâr</div>
                                        <div className={`text-xl font-black font-mono ${karlilikUygun ? 'text-white' : 'text-rose-400'}`}>₺ {karMarjiTutar.toFixed(2)}</div>
                                        {karlilikUygun ? (
                                            <div className="text-sm text-emerald-400 font-bold uppercase mt-1">✓ Fizibilite Onaylandı</div>
                                        ) : (
                                            <div className="text-sm text-rose-500 font-bold uppercase mt-1">⚠ Zarar Kes (Uzak Dur)</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                disabled={!karlilikUygun || toplamMaliyet === 0}
                                onClick={() => {
                                    setFizibiliteModalAcik(false);
                                    m3eAktar({ ...seciliTalep, maliyet: toplamMaliyet, kar_marji: karMarjiYuzde });
                                }}
                                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${karlilikUygun && toplamMaliyet > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-[#21262d] text-[#64748b] cursor-not-allowed'}`}
                            >
                                <Scissors size={18} />
                                {karlilikUygun && toplamMaliyet > 0 ? "BİNGO! ONAYLANDI -> M3 KALIPHANEYE GÖNDER" : "KÂRLILIK YETERSİZ (BEKLİYOR)"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
