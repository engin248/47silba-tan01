"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function M2FinansPaneli() {
    const [finansVerileri, setFinansVerileri] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFinansData = async () => {
        try {
            setLoading(true);
            // 'm2_finans_veto' tablosundan, onaylanan veya reddedilen raporları çek
            // RLS (Row Level Security) devreye girecek, Supabase sadece "yonetici" rolündekilere veri verecek.
            // (Test için şu an public anon key fetch edebilir veya boş döner).
            const { data, error } = await supabase
                .from('m2_finans_veto')
                .select('*, b1_arge_products(urun_adi)')
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) {
                setFinansVerileri(data);
            } else {
                console.error("M2 Yetki veya Fetch Hatası: ", error?.message);
            }
        } catch (err) {
            console.error(err);
            alert("SİSTEM BAĞLANTISI KOPUK (M2): Veritabanına ulaşılamıyor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinansData();
    }, []);

    return (
        <div className="p-8 min-h-screen text-white" style={{ background: '#0a0d14', fontFamily: 'Inter, sans-serif' }}>
            {/* ÜST BAR */}
            <div className="flex justify-between items-center mb-10 pb-4 border-b border-[rgba(255,255,255,0.05)]">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-amber-500 drop-shadow-md">M2 MALİYET VE VETO KANUNU</h1>
                    <p className="text-gray-400 mt-1 text-sm font-medium tracking-wide border-l-2 border-amber-600 pl-3">Sıfır İnsiyatif: İşçilik, Kumaş ve İade Zararının Hesaplanıp Üretimin veya Vetonun Kesinleştiği Alan</p>
                </div>
                <div className="flex bg-amber-900/30 border border-amber-500/30 px-4 py-2 rounded-md">
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        Askeri Seviye Yönetici İzni Gerektirir (RLS)
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="p-10 text-center text-gray-400 animate-pulse rounded-xl border border-[rgba(255,255,255,0.05)]">
                        Mali Veritabanı ve Şifreleme Çözülüyor...
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1">
                        {finansVerileri.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 italic rounded-xl border border-[rgba(255,255,255,0.02)] bg-[rgba(255,255,255,0.01)]">
                                Finansal hesaplama zırhına henüz herhangi bir Ajan raporu düşmedi veya Yönetici (RLS) yetkiniz yok.
                            </div>
                        ) : (
                            finansVerileri.map((fin) => (
                                <div key={fin.id} className="bg-[#0f151e] p-6 rounded-xl border border-[rgba(255,255,255,0.05)] hover:border-amber-500/50 transition-colors group relative overflow-hidden flex flex-col md:flex-row justify-between gap-6">

                                    {/* Neon Kenar Çizgisi */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${fin.kar_kilidi_onayi ? 'bg-green-500' : 'bg-red-600'}`}></div>

                                    {/* SOL: BİLGİ */}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-xl text-white mb-2">{fin.b1_arge_products?.urun_adi || 'Bilinmeyen Ürün'}</h3>
                                        <p className="text-sm text-gray-400 mb-4">{fin.ai_finans_yorumu || "AI Yorumu Yok"}</p>

                                        <div className="flex gap-4 text-xs font-mono text-gray-500 uppercase tracking-wider">
                                            <span>Kumaş: <span className="text-gray-300">{fin.kumas_maliyeti} ₺</span></span>
                                            <span>İşçilik: <span className="text-gray-300">{fin.iscilik_maliyeti} ₺</span></span>
                                            <span>Kargo/Çöp: <span className="text-gray-300">{fin.kargo_ve_paketleme} ₺</span></span>
                                            <span className="text-amber-500/80">İade Riski: %{Math.round(fin.tahmini_iade_orani * 100)}</span>
                                        </div>
                                    </div>

                                    {/* SAĞ: FİNANS HESABI */}
                                    <div className="bg-[#090b10] rounded-lg p-4 border border-[rgba(255,255,255,0.03)] min-w-[250px] flex flex-col justify-center">
                                        <div className="flex justify-between mb-2 pb-2 border-b border-[rgba(255,255,255,0.05)]">
                                            <span className="text-gray-400 text-xs">Net Maliyet</span>
                                            <span className="font-bold text-white">{fin.net_birim_maliyet} ₺</span>
                                        </div>
                                        <div className="flex justify-between mb-2 pb-2 border-b border-[rgba(255,255,255,0.05)]">
                                            <span className="text-gray-400 text-xs">Satış Fiyatı</span>
                                            <span className="font-bold text-green-400">{fin.tavsiye_satis_fiyati} ₺</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-gray-400 text-xs uppercase tracking-widest">Kâr Marjı</span>
                                            <span className={`font-bold text-lg ${fin.kar_kilidi_onayi ? 'text-green-500' : 'text-red-500'}`}>
                                                {fin.kar_kilidi_onayi ? `+${fin.beklenen_net_kar} ₺` : 'VETO ZARAR'}
                                            </span>
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
