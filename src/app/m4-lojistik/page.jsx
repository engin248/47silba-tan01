"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function M4LojistikPaneli() {
    const [lojistikKayitlari, setLojistikKayitlari] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLojistik = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('b3_uretilen_tasarimlar')
                .select('id, tasarim_adi, kumas_dokusu, onay_durumu')
                .in('onay_durumu', ['KALIPHANEDE', 'URETIMDE', 'SHOPIFYDA'])
                .order('created_at', { ascending: false });

            if (data && !error) {
                const mappedData = data.map(item => ({
                    id: item.id,
                    urun: item.tasarim_adi,
                    kumaş: item.kumas_dokusu || "Bekleniyor",
                    shopify: item.onay_durumu === 'SHOPIFYDA' ? "Yayında" : "Beklemede",
                    status: item.onay_durumu === 'KALIPHANEDE' ? 'BEKLİYOR' : 'YOLDA'
                }));
                setLojistikKayitlari(mappedData);
            }
        } catch (err) {
            console.error("M4 Fetch Hatasi:", err);
            alert("SİSTEM BAĞLANTISI KOPUK (M4): Lojistik veritabanına ulaşılamıyor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLojistik();
    }, []);

    return (
        <div className="p-8 min-h-screen text-white" style={{ background: '#0a0a0d', fontFamily: 'Inter, sans-serif' }}>

            {/* ST BAR */}
            <div className="flex justify-between items-center mb-10 pb-4 border-b border-[rgba(255,255,255,0.05)]">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-fuchsia-500 drop-shadow-md">M4 E-TİCARET VE LOJİSTİK SS</h1>
                    <p className="text-gray-400 mt-1 text-sm font-medium tracking-wide border-l-2 border-fuchsia-600 pl-3">retilen rnlerin B2B Tedarik Takibi, Shopify n-Satış Yayını ve Muhasebe Entegrasyonu</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="animate-pulse bg-red-900/30 text-red-500 text-xs font-bold px-3 py-1 rounded border border-red-500/30">Fiziksel API Bekleniyor (Faz 6)</span>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-200 tracking-wide mb-4">Otomasyon Canlı Akışı</h2>

                {loading ? (
                    <div className="p-10 text-center text-gray-400 animate-pulse rounded-xl border border-[rgba(255,255,255,0.05)]">
                        Shopify ve B2B Lojistik Bağlantıları zmleniyor...
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {lojistikKayitlari.map((kayit) => (
                            <div key={kayit.id} className="bg-[#121217] p-6 rounded-xl border border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg text-white mb-1">{kayit.urun}</h3>
                                    <p className="text-sm text-gray-400 font-mono">Tedariki: <span className="text-fuchsia-400">{kayit.kumaş}</span></p>
                                    <p className="text-sm text-gray-400 font-mono mt-1">Vitrin Ceketi: <span className="text-blue-400">{kayit.shopify}</span></p>
                                </div>
                                <div>
                                    {kayit.status === 'BEKLİYOR' ? (
                                        <span className="badge bg-yellow-900/40 text-yellow-300 border border-yellow-500/40 px-3 py-1 text-xs">{kayit.status} (Kaliphanede)</span>
                                    ) : (
                                        <span className="badge bg-green-900/40 text-green-300 border border-green-500/40 px-3 py-1 text-xs">Sorunsuz (retimde/Sevk)</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
