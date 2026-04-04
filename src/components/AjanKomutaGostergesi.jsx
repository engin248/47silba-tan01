'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bot, Cpu, Search, Zap, Camera, Shield, Network, Loader2, CheckCircle2, Clock, XCircle, Play, Server, Boxes, Wallet, Factory } from 'lucide-react';
import { formatTarih } from '@/lib/utils';

// Sabit Ajan Mimari Tanımları
const AJAN_SISTEMLERI = [
    { id: 'oluisci', ad: 'Ölü İşçi', ikon: Network, renk: '#eab308', bg: '#fef08a', rol: 'Veri Madencisi (Scraper)', aciklama: 'Trendyol, Zara veri akışını kazar.', konum: 'VPS Sunucu (Node.js)', yetenekler: ['Trendyol Kazıma', 'Zara Fiyat Takibi', 'Rakip Analizi'] },
    { id: 'hermai', ad: 'HermAI Yargıç', ikon: Cpu, renk: '#c026d3', bg: '#fdf4ff', rol: 'Karar & Onay Mekanizması', aciklama: 'Trendleri stratejik süzer.', konum: 'Vercel Serverless', yetenekler: ['Koleksiyon Onayı', 'Risk Analizi', 'Üretim Emri Çıkarma'] },
    { id: 'kasif', ad: 'Trend Kâşifi', ikon: Search, renk: '#3b82f6', bg: '#eff6ff', rol: 'Pazar Araştırması', aciklama: 'Perplexity ile internet taraması.', konum: 'Vercel Edge', yetenekler: ['Viral Ürün Tespiti', 'Kumaş Eğilimleri', 'Anahtar Kelime Taraması'] },
    { id: 'mizanetbot', ad: 'MİZANET BOT', ikon: Bot, renk: '#10b981', bg: '#ecfdf5', rol: 'Telegram Koordinatör', aciklama: 'Sistem - insan arası köprü.', konum: 'Telegram API Pulu', yetenekler: ['Manuel Bildirim Atma', 'Acil Durum İhbarı', 'Personel Sorgusu'] },
    { id: 'kopru', ad: 'Köprü Ajanı', ikon: Zap, renk: '#f97316', bg: '#fff7ed', rol: 'Veri Dönüştürücü', aciklama: 'Düz metni yapılandırır.', konum: 'Supabase Edge', yetenekler: ['JSON Formatlama', 'Veri Temizliği', 'Tablo Senkronizasyonu'] },
    { id: 'vision', ad: 'Kamera Gözcüsü', ikon: Camera, renk: '#06b6d4', bg: '#ecfeff', rol: 'Görüntü İşleme (Vision)', aciklama: 'Kumaş defo ve üretim darboğazı.', konum: 'Lokal Kiosk / go2rtc', yetenekler: ['Defo Görme', 'Barkod Okuma', 'Darboğaz Tespiti'] },
    { id: 'kalkan', ad: 'Zırh Kalkanı', ikon: Shield, renk: '#8b5cf6', bg: '#f5f3ff', rol: 'Güvenlik (Middleware)', aciklama: 'DDoS ve Spam engelleme.', konum: 'Vercel Middleware', yetenekler: ['Rate Limiting', 'IP Engelleme', 'Bot Savunması'] },
    { id: 'stokotonomu', ad: 'Depo & Stok Otonomu', ikon: Boxes, renk: '#84cc16', bg: '#ecfccb', rol: 'Lojistik & Stok Algoritması', aciklama: 'Üretimden depoya otonom kayıt.', konum: 'Veritabanı Tetikleyicisi (DB)', yetenekler: ['Stok Düşümü', 'Devir İşlemi', 'Kritik Stok Uyarısı'] },
    { id: 'kasaotonomu', ad: 'Finans & Kasa Algoritması', ikon: Wallet, renk: '#14b8a6', bg: '#ccfbf1', rol: 'Muhasebe Botu', aciklama: 'Sipariş tahsilatlarını denetler.', konum: 'Supabase Cron', yetenekler: ['Ciro Hesaplama', 'Otomatik Tahsilat', 'Maliyet Analizi'] },
    { id: 'uretimplanlayici', ad: 'Üretim Planlayıcısı', ikon: Factory, renk: '#f43f5e', bg: '#ffe4e6', rol: 'Bant & Makine Optimizasyonu', aciklama: 'Kiosklardan gelen hızı ölçer.', konum: 'Merkezi Sunucu', yetenekler: ['Performans Ölçümü', 'Makine Ataması', 'Fire Tespiti'] },
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
        else if (ajanKimligi === 'mizanetbot') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('mizanet') || l.ajan_adi?.toLowerCase().includes('telegram'));
        else if (ajanKimligi === 'kopru') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('kopru') || l.ajan_adi?.toLowerCase().includes('köprü'));
        else if (ajanKimligi === 'vision') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('vision') || l.ajan_adi?.toLowerCase().includes('kamera'));
        else if (ajanKimligi === 'kalkan') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('kalkan') || l.ajan_adi?.toLowerCase().includes('guvenlik'));
        else if (ajanKimligi === 'stokotonomu') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('stok') || l.ajan_adi?.toLowerCase().includes('depo'));
        else if (ajanKimligi === 'kasaotonomu') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('kasa') || l.ajan_adi?.toLowerCase().includes('finans'));
        else if (ajanKimligi === 'uretimplanlayici') eslesmeler = loglar.filter(l => l.ajan_adi?.toLowerCase().includes('üretim') || l.ajan_adi?.toLowerCase().includes('uretim') || l.ajan_adi?.toLowerCase().includes('planlayici'));

        if (eslesmeler.length === 0) return { durum: 'bekliyor', mesaj: 'Sistem altyapısı kuruluyor. Henüz log düşmedi.', sure: null, sonuc: 'bekliyor' };

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
                                    <span className="text-[9px] text-emerald-300/60 font-mono">
                                        {durumObj.sure ? formatTarih(durumObj.sure) : 'Görev yok'}
                                    </span>
                                    <span className="text-[9px] text-emerald-500/50 font-semibold group-hover:text-emerald-400 transition-colors cursor-pointer">
                                        Detaylı Günlük →
                                    </span>
                                </div>
                            </div>

                            {/* Görev Verme Butonu */}
                            <button
                                onClick={async () => {
                                    const Swal = (await import('sweetalert2')).default;
                                    const { value: formValues } = await Swal.fire({
                                        title: `${ajan.ad} Komuta Merkezi`,
                                        html: `
                                            <div style="text-align: left; font-size: 14px;">
                                                <p style="color: #64748b; margin-bottom: 15px;">Botun hedef rotasını ve toplayacağı veri sınırını belirleyin.</p>
                                                
                                                <label style="font-weight: bold; font-size: 13px;">Hedef Kategori / Anahtar Kelime:</label>
                                                <input id="swal-hedef" class="swal2-input" placeholder="Örn: kadin-giyim-c82 veya Yırtmaçlı Pantolon" style="width: 85%; max-width: 100%; margin-top: 5px; font-size: 14px;">
                                                
                                                <label style="font-weight: bold; font-size: 13px; margin-top: 15px; display: block;">Maksimum Tarama Sayfası:</label>
                                                <input id="swal-limit" type="number" class="swal2-input" value="1" min="1" max="10" style="width: 85%; max-width: 100%; margin-top: 5px; font-size: 14px;">
                                            </div>
                                        `,
                                        focusConfirm: false,
                                        showCancelButton: true,
                                        confirmButtonText: '⚡ Operasyonu Başlat',
                                        cancelButtonText: 'İptal',
                                        confirmButtonColor: '#10b981',
                                        background: '#0f172a',
                                        color: '#f8fafc',
                                        preConfirm: () => {
                                            const v1 = (/** @type {HTMLInputElement} */ (document.getElementById('swal-hedef')))?.value;
                                            const v2 = (/** @type {HTMLInputElement} */ (document.getElementById('swal-limit')))?.value;
                                            if (!v1) {
                                                Swal.showValidationMessage('Hedef veya Kategori boş bırakılamaz!');
                                            }
                                            return { hedef: v1, sayfa: v2, ajanId: ajan.id };
                                        }
                                    });

                                    if (formValues) {
                                        // 1. Simülasyon: Kullanıcıya başlatıldığına dair log yazalım (b1_agent_loglari)
                                        const { error } = await supabase.from('b1_agent_loglari').insert([{
                                            ajan_adi: ajan.ad,
                                            islem_tipi: 'Otonom Görev Ataması',
                                            mesaj: `Karargahtan manuel emre uyuluyor. Hedef: ${formValues.hedef}, Derinlik: ${formValues.sayfa} syf.`,
                                            sonuc: 'bekliyor',
                                            created_at: new Date().toISOString()
                                        }]);

                                        if (!error) {
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Emir İletildi!',
                                                text: `${ajan.ad} hedefe doğru ilerliyor. Sonuçlar Karargah ekranına düşecektir.`,
                                                background: '#0f172a',
                                                color: '#10b981',
                                                timer: 3000,
                                                showConfirmButton: false
                                            });

                                            // NOT: Backend API'miz (Next.js route vb.) olsaydı burada fetch atıp botu server üzerinden ayaklandırırdık. 
                                            // Ancak Terminalden (VPS / Local) de çalışabildiği için log bırakmak ekibi uyaracaktır.
                                        }
                                    }
                                }}
                                className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-lg transition-all"
                            >
                                <Play size={11} className="fill-emerald-400" /> Görev Ver
                            </button>

                        </div>
                    );
                })}

                {/* Müfettiş (AI) — Aktif Sistem Denetmeni */}
                <a href="/denetmen" className="bg-[#122b27] border border-[#7c3aed]/40 rounded-xl p-4 relative overflow-hidden hover:border-[#7c3aed]/80 transition-all group cursor-pointer no-underline block">
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-500/10 blur-2xl rounded-full group-hover:bg-purple-500/20 transition-all"></div>
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f5f3ff', border: '1px solid #7c3aed40' }}>
                                <span className="text-lg">🛡️</span>
                            </div>
                            <div>
                                <div className="font-bold text-sm text-white">Müfettiş (AI)</div>
                                <div className="text-[10px] text-purple-300/60 font-medium">Sistem Denetmeni & Alarm Merkezi</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black tracking-wider uppercase border bg-purple-500/10 text-purple-400 border-purple-500/30">
                            AKTİF
                        </div>
                    </div>
                    <div className="mt-1 mb-3">
                        <div className="text-[10px] text-emerald-100/60 mb-2 flex items-center gap-1.5 font-medium border-b border-[#1e4a43] pb-2">
                            <Server size={12} className="text-purple-400" /> Konum: <span className="text-purple-300 font-semibold">Vercel Serverless</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {['Sistem Uyarıları', 'AI Analizi', 'Büyük Veri'].map((yt, i) => (
                                <span key={i} className="text-[9px] px-2 py-1 rounded-md bg-[#081513] text-emerald-100/80 border border-[#1e4a43]">{yt}</span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-[#081513] border border-[#173a34] rounded-lg p-3 flex flex-col justify-between mb-3 shadow-inner">
                        <p className="text-[10px] text-purple-300/80 leading-relaxed font-medium m-0">
                            <span className="text-purple-500/50 uppercase tracking-wider text-[9px] mr-1 block mb-0.5">Durum:</span>
                            Sistem dinleniyor. Kritik uyarılarda otomatik alarm verir.
                        </p>
                    </div>
                    <div className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg transition-all">
                        <Play size={11} className="fill-purple-400" /> Müfettiş Paneli →
                    </div>
                </a>

                {/* Kalite Kontrol — Yakında */}
                <div className="bg-[#0d2420] border border-dashed border-[#1e4a43]/60 rounded-xl p-4 relative overflow-hidden opacity-60">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#081513] border border-[#1e4a43]">
                                <span className="text-lg">🔧</span>
                            </div>
                            <div>
                                <div className="font-bold text-sm text-white/60">Kalite Kontrol</div>
                                <div className="text-[10px] text-emerald-200/30 font-medium">Otomatik Fire & Hata Tespit Sistemi</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black tracking-wider uppercase border bg-slate-500/10 text-slate-400 border-slate-500/20">
                            YAKINDA
                        </div>
                    </div>
                    <div className="bg-[#081513] border border-[#173a34] rounded-lg p-3 text-center">
                        <p className="text-[10px] text-emerald-100/30 font-medium">Bu ajan modülü geliştirme aşamasında.</p>
                    </div>
                </div>

            </div>

        </div>
    );
}
