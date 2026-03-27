"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function M3TasarimPaneli() {
    const [tasarimlar, setTasarimlar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [onaylanmis, setOnaylanmis] = useState({});

    const fetchTasarimData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('b3_uretilen_tasarimlar')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) {
                setTasarimlar(data);
            }
        } catch (err) {
            console.error(err);
            alert("SİSTEM BAĞLANTISI KOPUK (M3): Veritabanına ulaşılamıyor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasarimData();
    }, []);

    const handleUretimeGonder = async (id) => {
        try {
            // Supabase'den statsn ONAYLANDI / URETIMDE yap
            const { error } = await supabase
                .from('b3_uretilen_tasarimlar')
                .update({ onay_durumu: 'KALIPHANEDE' })
                .eq('id', id);

            if (!error) {
                setOnaylanmis(prev => ({ ...prev, [id]: true }));

                // Faz 6 (B2B/Shopify Webhook) Ajan Tetiği Lehimlendi
                try {
                    fetch('/api/b2b-webhook-tetikle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tasarim_id: id })
                    }).catch(err => console.error("Webhook trigger arkaplan hatasi:", err));
                } catch (e) {
                    // Sessiz kal, frontend cokmesin
                }

                alert("retim Kalıphanesine Aktarıldı ve B2B Ajanları Uyandırıldı!");
            } else {
                console.error("Yetki (RLS) hatası veya bağlantı kopuk:", error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8 min-h-screen text-white" style={{ background: '#080808', fontFamily: 'Inter, sans-serif' }}>

            {/* ST BAR */}
            <div className="flex justify-between items-center mb-10 pb-4 border-b border-[rgba(255,255,255,0.05)]">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-blue-500 drop-shadow-md">M3 OTONOM TASARIM VE RETİM SS</h1>
                    <p className="text-gray-400 mt-1 text-sm font-medium tracking-wide border-l-2 border-blue-600 pl-3">Midjourney Manken Tasarımları, Hermania PR Mailleri ve Kalıphane Nihai Onayı (Patron Mhr)</p>
                </div>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="p-10 text-center text-gray-400 animate-pulse rounded-xl border border-[rgba(255,255,255,0.05)]">
                        DALL-E 3 / Midjourney Galerisi Ykleniyor...
                    </div>
                ) : (
                    <div className="grid gap-8 grid-cols-1 xl:grid-cols-2">
                        {tasarimlar.length === 0 ? (
                            <div className="xl:col-span-2 p-8 text-center text-gray-500 italic rounded-xl border border-[rgba(255,255,255,0.02)]">
                                Henz onaylanmış ve grselleştirilmiş bir tasarım (Bot 8 Sentezi) bulunmuyor.
                            </div>
                        ) : (
                            tasarimlar.map((tas) => (
                                <div key={tas.id} className="bg-[#111116] rounded-xl border border-[rgba(255,255,255,0.05)] overflow-hidden shadow-2xl flex flex-col md:flex-row group">

                                    {/* SOL: GRSEL (Sanal Manken) */}
                                    <div className="md:w-2/5 bg-[#1a1a24] p-4 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.05)] relative min-h-[300px]">
                                        <span className="absolute top-2 left-2 badge bg-blue-900/50 text-blue-300 border border-blue-500/30 text-xs px-2 py-1 rounded-sm">BOT 8</span>

                                        {tas.yapay_zeka_gorseli && tas.yapay_zeka_gorseli !== 'YOK' ? (
                                            <img src={tas.yapay_zeka_gorseli} alt={tas.tasarim_adi} className="rounded object-cover max-h-full w-full opacity-90 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center opacity-50">
                                                <span className="text-4xl mb-2">📸</span>
                                                <span className="text-sm font-mono text-gray-400">Midjourney/DALL-E nizleme Bekleniyor</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* SAĞ: PARAMETRELER VE ONAY */}
                                    <div className="md:w-3/5 p-6 flex flex-col">
                                        <h3 className="font-bold text-xl text-white mb-1">{tas.tasarim_adi}</h3>
                                        <p className="text-xs text-blue-400 mb-4">{tas.kumas_dokusu}</p>

                                        <div className="bg-[#0b0b10] border border-[rgba(255,255,255,0.05)] rounded p-3 mb-4 text-sm text-gray-400 overflow-y-auto max-h-24 styled-scroll">
                                            <strong className="text-gray-300 uppercase text-[10px] tracking-widest block mb-1">Tasarım Prompt (Hermania):</strong>
                                            {tas.ai_prompt}
                                        </div>

                                        <div className="bg-[#0b0b10] border border-[rgba(255,255,255,0.05)] rounded p-3 mb-6 text-sm text-gray-400">
                                            <strong className="text-gray-300 uppercase text-[10px] tracking-widest block mb-1">Patron Notu / M3 Kalıp Ustasının Grevi:</strong>
                                            {tas.patrona_not || "zel bir not dşlmedi."}
                                        </div>

                                        {/* ONAY BUTONU */}
                                        <div className="mt-auto">
                                            {onaylanmis[tas.id] || tas.onay_durumu === 'KALIPHANEDE' ? (
                                                <div className="w-full text-center py-3 bg-green-900/20 border border-green-500/30 text-green-400 font-bold tracking-widest uppercase rounded">
                                                     retime ıktı
                                                </div>
                                            ) : (
                                                <button onClick={() => handleUretimeGonder(tas.id)} className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-bold tracking-widest uppercase transition-all rounded shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.5)] active:scale-95">
                                                    ️ RET (Patron Mhr)
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
