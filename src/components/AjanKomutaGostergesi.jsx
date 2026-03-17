'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bot, Cpu, Search, Zap, Camera, Shield, Network, Loader2, CheckCircle2, Clock, XCircle, Play, Server } from 'lucide-react';
import { formatTarih } from '@/lib/utils';

// Sabit Ajan Mimari Tanımları
const AJAN_SISTEMLERI = [
    { id: 'oluisci', ad: 'Ölü İşçi', ikon: Network, renk: '#eab308', bg: '#fef08a', rol: 'Veri Madencisi (Scraper)', aciklama: 'Trendyol, Zara veri akışını kazar.', konum: 'VPS Sunucu (Node.js)', yetenekler: ['Trendyol Kazıma', 'Zara Fiyat Takibi', 'Rakip Analizi'] },
    { id: 'hermai', ad: 'HermAI Yargıç', ikon: Cpu, renk: '#c026d3', bg: '#fdf4ff', rol: 'Karar & Onay Mekanizması', aciklama: 'Trendleri stratejik süzer.', konum: 'Vercel Serverless', yetenekler: ['Koleksiyon Onayı', 'Risk Analizi', 'Üretim Emri Çıkarma'] },
    { id: 'kasif', ad: 'Trend Kâşifi', ikon: Search, renk: '#3b82f6', bg: '#eff6ff', rol: 'Pazar Araştırması', aciklama: 'Perplexity ile internet taraması.', konum: 'Vercel Edge', yetenekler: ['Viral Ürün Tespiti', 'Kumaş Eğilimleri', 'Anahtar Kelime Taraması'] },
    { id: 'nizambot', ad: 'NİZAMBOT', ikon: Bot, renk: '#10b981', bg: '#ecfdf5', rol: 'Telegram Koordinatör', aciklama: 'Sistem - insan arası köprü.', konum: 'Telegram API Pulu', yetenekler: ['Manuel Bildirim Atma', 'Acil Durum İhbarı', 'Personel Sorgusu'] },
    { id: 'kopru', ad: 'Köprü Ajanı', ikon: Zap, renk: '#f97316', bg: '#fff7ed', rol: 'Veri Dönüştürücü', aciklama: 'Düz metni yapılandırır.', konum: 'Supabase Edge', yetenekler: ['JSON Formatlama', 'Veri Temizliği', 'Tablo Senkronizasyonu'] },
    { id: 'vision', ad: 'Kamera Gözcüsü', ikon: Camera, renk: '#06b6d4', bg: '#ecfeff', rol: 'Görüntü İşleme (Vision)', aciklama: 'Kumaş defo ve üretim darboğazı.', konum: 'Lokal Kiosk / go2rtc', yetenekler: ['Defo Görme', 'Barkod Okuma', 'Darboğaz Tespiti'] },
    { id: 'kalkan', ad: 'Zırh Kalkanı', ikon: Shield, renk: '#8b5cf6', bg: '#f5f3ff', rol: 'Güvenlik (Middleware)', aciklama: 'DDoS ve Spam engelleme.', konum: 'Vercel Middleware', yetenekler: ['Rate Limiting', 'IP Engelleme', 'Bot Savunması'] },
];

export default function AjanKomutaGostergesi() {
    const [loglar, setLoglar] = useState(/** @type {any[]} */([]));
    const [yukleniyor, setYukleniyor] = useState(true);

    const veriCek = async () => {
        try {
            const { data } = await supabase
                .from('b1_agent_loglari')
                .select('ajan_adi, islem_tipi, mesaj, sonuc, created_at')
                .order('created_at', { ascending: false })
                .limit(200);

            if (data) setLoglar(data);
        } catch (error) {
            console.error('Ajan logları çekilemedi:', error);
        } finally {
            setYukleniyor(false);
        }
    };

    useEffect(() => {
        veriCek();

        const sub = supabase.channel('komuta_gostergesi_log')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_agent_loglari' }, (payload) => {
                setLoglar(prev => [payload.new, ...prev].slice(0, 200));
            })
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, []);

    // Ajan bazlı son logu bulma
    const sonDurumBul = (ajanKimligi) => {
        let eslesmeler = [];
        if (ajanKimligi === 'oluisci') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('isci') || l.ajan_adi?.toLowerCase().includes('scrapper'));
        else if (ajanKimligi === 'hermai') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('yargic') || l.ajan_adi?.toLowerCase().includes('hermai') || l.ajan_adi?.toLowerCase().includes('gemini'));
        else if (ajanKimligi === 'kasif') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('kasif') || l.ajan_adi?.toLowerCase().includes('kâşifi') || l.ajan_adi?.toLowerCase().includes('perplexity'));
        else if (ajanKimligi === 'nizambot') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('nizam') || l.ajan_adi?.toLowerCase().includes('telegram'));
        else if (ajanKimligi === 'kopru') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('kopru') || l.ajan_adi?.toLowerCase().includes('köprü'));
        else if (ajanKimligi === 'vision') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('vision') || l.ajan_adi?.toLowerCase().includes('kamera'));
        else if (ajanKimligi === 'kalkan') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('kalkan') || l.ajan_adi?.toLowerCase().includes('guvenlik'));

        if (eslesmeler.length === 0) return { durum: 'bekliyor', mesaj: 'Sistem hazır, görev bekliyor.', sure: null, sonuc: 'bekliyor' };

        const sonIslem = eslesmeler[0];
        const gecenSure = Date.now() - new Date(sonIslem.created_at).getTime();
        const calisiyorMu = gecenSure < 60000; // 1 dakikadan yeniyse "aktif" dönüyor varsay

        return {
            durum: calisiyorMu ? 'çalışıyor' : 'tamamlandı',
            mesaj: sonIslem.mesaj || sonIslem.islem_tipi,
            sure: sonIslem.created_at,
            sonuc: sonIslem.sonuc // basarili, hata, atlandi vb
        };
    };

    return (
        <div className="bg-[#0b1d1a] border border-[#1e4a43] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Animasyonlu Arkaplan Parıltısı */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <Cpu size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white m-0 tracking-wide uppercase">Evrensel AI Komuta Ağı</h2>
                        <div className="text-[11px] text-emerald-200/70 font-semibold tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Tüm Yapay Zeka Düğümleri Canlı İzlemede
                        </div>
                    </div>
                </div>
                {yukleniyor && <Loader2 size={18} className="text-emerald-500 animate-spin" />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {AJAN_SISTEMLERI.map((ajan, idx) => {
                    const durumObj = sonDurumBul(ajan.id);
                    const islemdeMi = durumObj.durum === 'çalışıyor';
                    const hataliMi = durumObj.sonuc?.toLowerCase() === 'hata';

                    return (
                        <div key={idx} className="bg-[#122b27] border border-[#1e4a43] rounded-xl p-4 hover:border-emerald-500/50 transition-all group relative overflow-hidden">

                            {/* Aktiflik Işığı */}
                            {islemdeMi && <div className="absolute -top-10 -right-10 w-20 h-20 bg-emerald-500/20 blur-2xl rounded-full animate-pulse"></div>}

                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: ajan.bg, border: `1px solid ${ajan.renk}40` }}>
                                        <ajan.ikon size={18} style={{ color: ajan.renk }} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-white">{ajan.ad}</div>
                                        <div className="text-[10px] text-emerald-200/50 font-medium">{ajan.rol}</div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black tracking-wider uppercase border
                                    ${islemdeMi ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' :
                                        hataliMi ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}
                                `}>
                                    {islemdeMi ? <Loader2 size={10} className="animate-spin" /> :
                                        hataliMi ? <XCircle size={10} /> :
                                            durumObj.durum === 'bekliyor' ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                                    {islemdeMi ? 'İŞLEMDE' : hataliMi ? 'HATA' : durumObj.durum === 'bekliyor' ? 'BEKLEMEDE' : 'HAZIR'}
                                </div>
                            </div>

                            {/* Yetenekler ve Konum */}
                            <div className="mt-1 mb-3">
                                <div className="text-[10px] text-emerald-100/60 mb-2 flex items-center gap-1.5 font-medium border-b border-[#1e4a43] pb-2">
                                    <Server size={12} className="text-indigo-400" /> Konum: <span className="text-emerald-300 font-semibold">{ajan.konum}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {ajan.yetenekler.map((yt, i) => (
                                        <span key={i} className="text-[9px] px-2 py-1 rounded-md bg-[#081513] text-emerald-100/80 border border-[#1e4a43]">
                                            {yt}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Emir Özeti */}
                            <div className="bg-[#081513] border border-[#173a34] rounded-lg p-3 flex flex-col justify-between mb-3 shadow-inner">
                                <p className="text-[10px] text-emerald-100/90 leading-relaxed font-medium m-0 line-clamp-2">
                                    <span className="text-emerald-500/50 uppercase tracking-wider text-[9px] mr-1 block mb-0.5">Son Log:</span>
                                    {durumObj.mesaj}
                                </p>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#173a34]">
                                    <span className="text-[9px] text-[#484f58] font-mono">
                                        {durumObj.sure ? formatTarih(durumObj.sure) : 'Görev yok'}
                                    </span>
                                    <span className="text-[9px] text-emerald-500/50 font-semibold group-hover:text-emerald-400 transition-colors cursor-pointer">
                                        Detaylı Günlük →
                                    </span>
                                </div>
                            </div>

                            {/* Görev Verme Butonu */}
                            <button
                                onClick={() => alert(`${ajan.ad} (${ajan.konum}) için atanacak yeni otonom görev penceresi açılıyor...`)}
                                className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-lg transition-all"
                            >
                                <Play size={11} className="fill-emerald-400" /> Görev Ver
                            </button>

                        </div>
                    );
                })}
            </div>

        </div>
    );
}
