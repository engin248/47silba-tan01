'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/langContext';
import { TrendingUp, Users, DollarSign, Award, Target, Activity, AlertTriangle, RefreshCw } from 'lucide-react';

export default function KarlilikPrimEkrani() {
    const { lang } = useLang();
    const isAR = lang === 'ar';
    /** @type {[any[], any]} */
    const [personelRaporlari, setPersonelRaporlari] = useState([]);
    const [loading, setLoading] = useState(true);

    // Kâhin AI States
    const [aiRaporu, setAiRaporu] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        raporAnalizEt();
    }, []);

    const raporAnalizEt = async () => {
        setLoading(true);
        // 1. Personelleri Çek
        const { data: pData } = await supabase.from('b1_personel').select('id, ad_soyad, birim, aylik_maliyet_tl, aylik_hedef_saat');
        if (!pData) { setLoading(false); return; }

        // 2. Bu ayın performans kayıtlarını çek
        const date = new Date();
        const ilkGun = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const { data: perfData } = await supabase
            .from('b1_personel_performans')
            .select('personel_id, isletmeye_katilan_deger, kazanilan_prim')
            .gte('created_at', ilkGun);

        // 3. Eşleştir ve Analiz Et
        const analizer = pData.map(p => {
            const pLogs = (perfData || []).filter(log => log.personel_id === p.id);
            const toplamDeger = pLogs.reduce((acc, curr) => acc + (Number(curr.isletmeye_katilan_deger) || 0), 0);
            const toplamPrim = pLogs.reduce((acc, curr) => acc + (Number(curr.kazanilan_prim) || 0), 0);

            const maliyet = Number(p.aylik_maliyet_tl) || 0;
            const amortiYuzdesi = maliyet > 0 ? (toplamDeger / maliyet) * 100 : (toplamDeger > 0 ? 100 : 0);

            let analiz = { tur: 'neutral', mesaj: '' };
            if (amortiYuzdesi >= 100) { analiz = { tur: 'success', mesaj: 'ŞİRKET KARDA (PRİM HAKKI)' }; }
            else if (amortiYuzdesi >= 70) { analiz = { tur: 'warning', mesaj: 'AMORTİYE YAKLAŞIYOR' }; }
            else if (amortiYuzdesi > 0) { analiz = { tur: 'error', mesaj: 'ŞİRKET ZARAR EDİYOR' }; }
            else { analiz = { tur: 'info', mesaj: 'HENÜZ ÜRETİM YAPMADI' }; }

            return {
                ...p,
                toplamDeger,
                toplamPrim,
                maliyet,
                amortiYuzdesi,
                analiz
            };
        });

        // En kardakileri başa dizecek şekilde sırala
        analizer.sort((a, b) => b.amortiYuzdesi - a.amortiYuzdesi);
        setPersonelRaporlari(analizer);
        setLoading(false);
    };

    const sirketOzet = {
        toplamMaliyet: personelRaporlari.reduce((acc, curr) => acc + curr.maliyet, 0),
        toplamUretilenDeger: personelRaporlari.reduce((acc, curr) => acc + curr.toplamDeger, 0),
        toplamDagitilanPrim: personelRaporlari.reduce((acc, curr) => acc + curr.toplamPrim, 0),
    };

    // İşletmeye Kalan Net Kar = (Üretilen Değer) - (Maliyetler + Dağıtılan Prim)
    let netKar = sirketOzet.toplamUretilenDeger - (sirketOzet.toplamMaliyet + sirketOzet.toplamDagitilanPrim);
    // Zarar durumunda maliyeti henüz çıkarmamış demektir.
    if (sirketOzet.toplamUretilenDeger < sirketOzet.toplamMaliyet) {
        netKar = sirketOzet.toplamUretilenDeger - sirketOzet.toplamMaliyet; // Negatif Değer Çıkar
    }

    const kahinRaporuIste = async () => {
        setAiLoading(true);
        setAiRaporu('');
        try {
            const res = await fetch('/api/ai-kahin-ajan', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setAiRaporu(data.aiCevap);
            } else {
                setAiRaporu('Kahin AI Hata Verdi: ' + (data.error || 'Bilinmeyen Hata, API Key eksik olabilir.'));
            }
        } catch (err) {
            setAiRaporu('Sistem Hatası: ' + err.message);
        }
        setAiLoading(false);
    };

    return (
        <div className="animate-fade-in space-y-8">
            {/* ÜST BİLGİ PANELİ */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1117] border border-[#1e4a43] p-6 rounded-2xl shadow-xl">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <TrendingUp className="text-emerald-500" size={32} />
                        {isAR ? 'تحليل الربحية والأقساط الذكية للموظفين' : 'Akıllı MES - Personel Karlılık ve Prim Analist Paneli'}
                    </h2>
                    <p className="text-emerald-200 font-bold mt-2">
                        {isAR ? '"النموذج العادل": يتم دفع الأقساط فقط بعد أن يغطي الموظف تكلفته بالنسبة للشركة.' : '"Adil Prim Modeli": Personel önce şirkete olan maliyetini çıkarır (Amorti eder), sonrasında prim kazanır.'}
                    </p>
                </div>
                <button onClick={raporAnalizEt} disabled={loading} className="bg-[#122b27] hover:bg-[#1a3833] text-emerald-400 border border-emerald-800 px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> {isAR ? 'تحديث' : 'Analizi Yenile'}
                </button>
            </div>

            {/* GENEL ŞİRKET ÖZETİ (Dashboard Kartları) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#122b27] border-l-4 border-slate-500 p-6 rounded-xl shadow-md">
                    <h3 className="text-slate-400 font-bold text-xs uppercase mb-1">{isAR ? 'إجمالي تكلفة الموظفين' : 'Toplam Personel Maliyeti'}</h3>
                    <div className="text-3xl font-black text-white">{sirketOzet.toplamMaliyet.toLocaleString()} <span className="text-lg">₺</span></div>
                </div>
                <div className="bg-[#122b27] border-l-4 border-emerald-500 p-6 rounded-xl shadow-md">
                    <h3 className="text-emerald-400 font-bold text-xs uppercase mb-1">{isAR ? 'إجمالي القيمة المضافة / الإنتاج' : 'Tesisin Ürettiği Katma Değer'}</h3>
                    <div className="text-3xl font-black text-emerald-400">{sirketOzet.toplamUretilenDeger.toLocaleString()} <span className="text-lg">₺</span></div>
                </div>
                <div className="bg-[#122b27] border-l-4 border-purple-500 p-6 rounded-xl shadow-md">
                    <h3 className="text-purple-400 font-bold text-xs uppercase mb-1">{isAR ? 'إجمالي الأقساط الموزعة' : 'Dağıtılan Toplam Hak Ediş / Prim'}</h3>
                    <div className="text-3xl font-black text-purple-400">{sirketOzet.toplamDagitilanPrim.toLocaleString()} <span className="text-lg">₺</span></div>
                </div>
                <div className={`border-l-4 p-6 rounded-xl shadow-md ${netKar >= 0 ? 'bg-[#064e3b] border-green-400' : 'bg-[#450a0a] border-red-500'}`}>
                    <h3 className="text-white/70 font-bold text-xs uppercase mb-1">{isAR ? 'صافي الربح / الخسارة الصافية للشركة' : 'Şirket Net Kar / Zarar Durumu'}</h3>
                    <div className="text-3xl font-black text-white">{netKar >= 0 ? '+' : ''}{netKar.toLocaleString()} <span className="text-lg">₺</span></div>
                </div>
            </div>

            {/* PERSONEL TABLOSU */}
            <div className="bg-[#0d1117] border border-[#1e4a43] rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-[#122b27] p-4 border-b border-[#1e4a43]">
                    <h3 className="font-black text-white flex items-center gap-2"><Target className="text-orange-500" /> {isAR ? 'لوحة القيادة (المتصدرون)' : 'Üretim Bandı Lig Tablosu (Leaderboard)'}</h3>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent flex items-center justify-center rounded-full mx-auto mb-4"></div>
                        <p className="font-bold text-slate-400">{isAR ? 'جارٍ تحليل بيانات الكاميرا والإنتاج...' : 'Kamera Sayacı ve Performanslar Analiz Ediliyor...'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#0f172a] text-slate-400 border-b border-[#1e4a43]">
                                <tr>
                                    <th className="p-4 font-black uppercase text-xs">Personel Sırası</th>
                                    <th className="p-4 font-black uppercase text-xs text-center border-l border-[#1e4a43]/50">Şirkete Kendi Maliyeti (Kota)</th>
                                    <th className="p-4 font-black uppercase text-xs text-center border-l border-[#1e4a43]/50">Şirkete Kazandırdığı (Değer)</th>
                                    <th className="p-4 font-black uppercase text-xs border-l border-[#1e4a43]/50" style={{ width: '30%' }}>Amorti Durumu (Performans Barı)</th>
                                    <th className="p-4 font-black uppercase text-xs text-right border-l border-[#1e4a43]/50 text-purple-400">Ödenecek Prim (Bonus)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {personelRaporlari.map((p, index) => (
                                    <tr key={p.id} className="border-b border-[#1e4a43]/50 hover:bg-[#122b27] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${index === 0 ? 'bg-yellow-500 text-yellow-900 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : index === 1 ? 'bg-slate-300 text-slate-700' : index === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-800 text-slate-400'}`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <div className="font-black text-white text-lg">{p.ad_soyad}</div>
                                                    <div className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                                        <Activity size={12} /> {p.birim || 'Üretim Bandı'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-slate-400 bg-slate-900/30 border-l border-[#1e4a43]/30">
                                            {p.maliyet > 0 ? (
                                                <span>{p.maliyet.toLocaleString()} ₺</span>
                                            ) : (
                                                <span className="text-orange-500 text-xs">- GİRİLMEDİ -</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center font-black text-white border-l border-[#1e4a43]/30">
                                            {p.toplamDeger > 0 ? (
                                                <span className="text-emerald-400">+{p.toplamDeger.toLocaleString()} ₺</span>
                                            ) : (
                                                <span className="text-slate-600">0 ₺</span>
                                            )}
                                        </td>
                                        <td className="p-4 border-l border-[#1e4a43]/30">
                                            <div className="w-full relative">
                                                <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                                                    <span className={p.analiz.tur === 'success' ? 'text-emerald-400' : p.analiz.tur === 'error' ? 'text-red-400' : 'text-slate-400'}>
                                                        {p.analiz.mesaj}
                                                    </span>
                                                    <span className="text-white">%{p.amortiYuzdesi.toFixed(1)}</span>
                                                </div>
                                                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-[#1e4a43]">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${p.amortiYuzdesi >= 100 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`}
                                                        style={{ width: `${Math.min(100, p.amortiYuzdesi)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right border-l border-[#1e4a43]/30">
                                            {p.toplamPrim > 0 ? (
                                                <div className="inline-block bg-[#4c1d95] text-purple-200 border border-purple-500 px-3 py-1.5 rounded-lg font-black text-lg shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                                                    {p.toplamPrim.toLocaleString()} ₺
                                                </div>
                                            ) : (
                                                <div className="text-slate-500 font-bold">- Yok -</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {personelRaporlari.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                                            Sistemde analiz edilecek personel maliyeti/verisi bulunmuyor. Lütfen b1_personel tablosuna aylık maliyetleri girin.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-[#0f172a] text-slate-400 border border-slate-800 rounded-xl p-6 text-sm font-medium shadow-xl">
                <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={24} />
                    <div className="flex-1">
                        <strong className="text-amber-500 text-lg block mb-1">Kâhin (AI Yargıç) Analizi:</strong>
                        <p>
                            Yapay Zeka bu verileri okuyarak personelin karlılık haritası hakkında tarafsız bir rapor oluşturabilir. Ürettiğinden çok zarar ettirenler tespit edilip, şirketi sırtlayanlara ödül mekanizmaları önerilir.
                        </p>
                    </div>
                    <button onClick={kahinRaporuIste} disabled={aiLoading || personelRaporlari.length === 0} className="bg-amber-600 hover:bg-amber-700 text-white border-b-4 border-amber-900 px-6 py-4 rounded-xl font-black flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-wait shrink-0 h-14">
                        <Activity className={aiLoading ? 'animate-pulse' : ''} /> {aiLoading ? 'YAPAY ZEKA ANALİZ EDİYOR...' : 'KÂHİN YARCIDI ÇAĞIR (GEMINI)'}
                    </button>
                </div>

                {aiRaporu && (
                    <div className="mt-6 p-6 bg-[#020617] border-2 border-[#1e4a43] rounded-xl text-emerald-100/90 whitespace-pre-wrap leading-relaxed">
                        <div className="flex items-center gap-2 mb-4 border-b border-[#1e4a43] pb-2">
                            <Target className="text-emerald-500" /> <span className="font-black text-emerald-400 text-lg">YAPAY ZEKA (KÂHİN) KARAR METNİ</span>
                        </div>
                        {aiRaporu}
                    </div>
                )}
            </div>
        </div>
    );
}
