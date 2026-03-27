"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Client İstemci Tarafı Sadece Okuma İin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function M1IstihbaratPaneli() {
    const [products, setProducts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);

    // Veri ekme Fonksiyonu
    const fetchIstihbaratData = async () => {
        try {
            setLoading(true);
            // rnleri ek
            const { data: prodData, error: prodErr } = await supabase
                .from('b1_arge_products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (!prodErr && prodData) setProducts(prodData);

            // Logları ek
            const { data: logData, error: logErr } = await supabase
                .from('b1_agent_loglari')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (!logErr && logData) setLogs(logData);
        } catch (err) {
            console.error("Veri ekme hatası:", err);
            alert("SİSTEM BAĞLANTISI KOPUK (M1): Veritabanına veya API'ye ulaşılamıyor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIstihbaratData();
        // Gerek zamanlı gncellemeler veya periyodik yenileme iin poll
        const interval = setInterval(fetchIstihbaratData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleTetikle = async () => {
        setTriggering(true);
        try {
            const res = await fetch('/api/trigger-agents', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert("Ajanlar Sahaya Srld! (Asenkron Grev Başladı)");
                fetchIstihbaratData();
            } else {
                alert("Tetikleme Hatası: " + data.message);
            }
        } catch (e) {
            console.error(e);
            alert("API Ulaşılamıyor.");
        } finally {
            setTriggering(false);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'OK_SATAR' || status === 'BİNGO') return <span className="badge badge-success px-3 py-1 bg-green-900 text-green-100 rounded-full text-xs font-bold border border-green-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]">{status}</span>;
        if (status === 'İZLE') return <span className="badge badge-warning px-3 py-1 bg-yellow-900 text-yellow-100 rounded-full text-xs font-bold border border-yellow-500">{status}</span>;
        return <span className="badge badge-danger px-3 py-1 bg-red-900 text-red-100 rounded-full text-xs font-bold border border-red-500">{status}</span>;
    };

    return (
        <div className="p-8 min-h-screen text-white" style={{ background: '#0d1117', fontFamily: 'Inter, sans-serif' }}>

            {/* ST BAR */}
            <div className="flex justify-between items-center mb-10 pb-4 border-b border-[rgba(255,255,255,0.05)]">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-emerald-400 drop-shadow-md">M1 KARARGAH</h1>
                    <p className="text-gray-400 mt-1 text-sm font-medium tracking-wide border-l-2 border-emerald-500 pl-3">İstihbarat, Saha Taraması ve Trend Ağ Geidi</p>
                </div>

                <button
                    onClick={handleTetikle}
                    disabled={triggering}
                    className={`flex items-center gap-2 px-6 py-3 rounded-md font-bold text-sm transition-all shadow-lg border border-transparent
            ${triggering ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 hover:-translate-y-1 hover:shadow-[0_4px_15px_rgba(16,185,129,0.4)] border-emerald-500/30'}
          `}
                >
                    {triggering ? "🚀 Ajanlar Kodlanıyor..." : "️ BTN AJANLARI TETİKLE"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* SOL/ORTA KOLON: RN İSTİHBARATI */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">📡</span>
                        <h2 className="text-xl font-bold text-gray-200 tracking-wide">Son Keşfedilen Tasarımlar</h2>
                    </div>

                    {loading && products.length === 0 ? (
                        <div className="glass-panel p-10 text-center text-gray-400 animate-pulse rounded-xl border border-[rgba(255,255,255,0.05)]">
                            Kripto İstihbarat Ağı Taranıyor...
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {products.map((product) => (
                                <div key={product.id} className="glass-panel p-6 rounded-xl border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] transition-colors group relative overflow-hidden">

                                    {/* Neon Kenar izgisi Efekti */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-white mb-2">{product.product_name}</h3>
                                            <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                                                <span className="text-emerald-400 font-semibold mr-2">{product.trend_skoru}/100 Puan</span>
                                                {product.hermania_karar_yorumu || "AI Kararı Bekleniyor..."}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {getStatusBadge(product.ai_satis_karari)}
                                            <span className="text-xs text-gray-500">{new Date(product.created_at).toLocaleString('tr-TR')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {products.length === 0 && !loading && (
                                <div className="glass-panel p-8 text-center text-gray-500 italic rounded-xl border border-[rgba(255,255,255,0.02)]">
                                    Henz istihbarat verisi bulunamadı. Ajanları tetikleyin.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* SAĞ KOLON: CANLI LOGLAR VE SİSTEM SAĞLIĞI */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">🛡️</span>
                        <h2 className="text-xl font-bold text-gray-200 tracking-wide">Sistem İzleme (Sentinel)</h2>
                    </div>

                    <div className="glass-panel rounded-xl border border-[rgba(255,255,255,0.05)] overflow-hidden shadow-2xl relative">
                        <div className="bg-[#0b1d1a] border-b border-[rgba(255,255,255,0.05)] p-4 flex justify-between items-center">
                            <span className="text-xs font-mono text-emerald-500 font-bold uppercase tracking-widest">M1_TELEMETRI_TERMINALI</span>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                        </div>

                        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto styled-scroll" style={{ fontFamily: '"Fira Code", monospace' }}>
                            {logs.map((log) => (
                                <div key={log.id} className="text-sm border-b border-[rgba(255,255,255,0.02)] pb-3 last:border-0 last:pb-0">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-emerald-400">{log.ajan_adi}</span>
                                        <span className="text-gray-500">{new Date(log.created_at).toLocaleTimeString('tr-TR')}</span>
                                    </div>
                                    <p className={`${log.sonuc === 'hata' || log.sonuc === 'INFAZ_EDILDI' ? 'text-red-400' : 'text-gray-300'} leading-relaxed`}>
                                        &gt; {log.mesaj}
                                    </p>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-gray-600 italic">Sistem beklemede... Log gemişi temiz.</div>
                            )}
                        </div>
                    </div>

                    {/* DURUM KARTI */}
                    <div className="glass-panel p-5 rounded-xl border border-[rgba(255,255,255,0.03)] bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent">
                        <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">Asenkron Kalkan Durumu</h4>
                        <p className="text-sm text-gray-300">
                            M1, M2 ve M3 sreleri birbirinden %100 yalıtılmıştır. Buradaki hibir sre arka plan motorlarını veya retim hattını kilitleyemez.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
