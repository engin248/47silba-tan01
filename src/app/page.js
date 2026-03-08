'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { ShieldCheck, BarChart3, Database, AlertCircle, TrendingUp, HandHeart, PlusCircle, Trash2, Edit3, Mic, X, Lock, Unlock, KeyRound, Eye, EyeOff, Factory, Activity, CheckSquare, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function KarargahSayfasi() {
    const { kullanici } = useAuth();
    const [mimariModalAcik, setMimariModalAcik] = useState(false);
    const [yetkiState, setYetkiState] = useState({ uretim: false, genel: false });
    const [canliVeri, setCanliVeri] = useState({ ciro: 0, maliyet: 0, personelGider: 0, fire: 0, yukleniyor: true });
    const [alarmlar, setAlarmlar] = useState({ gorevler: [], kritikStok: [], vadeliOdeme: [], yukleniyor: true });
    const [hızlıGorev, setHızlıGorev] = useState('');
    const [hızlıOncelik, setHızlıOncelik] = useState('normal');
    const [gorevBildirim, setGorevBildirim] = useState('');
    const [veriHata, setVeriHata] = useState('');
    const [dinliyor, setDinliyor] = useState(false);
    const [finansGizli, setFinansGizli] = useState(true);

    const [islemYapiliyor, setIslemYapiliyor] = useState(false);

    const alarmYukle = async () => {
        try {
            const [gorevRes, stokRes, kasaRes] = await Promise.allSettled([
                supabase.from('b1_gorevler').select('id,baslik,oncelik,son_tarih').eq('durum', 'bekliyor').order('created_at', { ascending: false }).limit(5),
                // [DÜZELTMEa]: get_kritik_stok RPC yerine direkt sorgu (Stok < min_stok)
                supabase.from('b2_urun_katalogu')
                    .select('urun_kodu,urun_adi,stok_adeti,min_stok')
                    .filter('stok_adeti', 'lt', 'min_stok')
                    .limit(10),
                supabase.from('b2_kasa_hareketleri').select('aciklama,tutar_tl,vade_tarihi,hareket_tipi').eq('onay_durumu', 'bekliyor').not('vade_tarihi', 'is', null),
            ]);

            const gorevVeri = gorevRes.status === 'fulfilled' ? gorevRes.value.data : [];
            const stokVeri = stokRes.status === 'fulfilled' ? stokRes.value.data : [];
            const kasaVeri = kasaRes.status === 'fulfilled' ? kasaRes.value.data : [];

            const kritikStok = (stokVeri || []).filter(u => (u.stok_adeti || 0) < (u.min_stok || 0));
            const vadeliOdeme = (kasaVeri || []).filter(h => new Date(h.vade_tarihi) <= new Date());
            setAlarmlar({ gorevler: gorevVeri || [], kritikStok, vadeliOdeme, yukleniyor: false });
        } catch (err) {
            setAlarmlar({ gorevler: [], kritikStok: [], vadeliOdeme: [], yukleniyor: false });
            setVeriHata('Alarm verileri yüklenemedi: ' + err.message);
        }
    };

    useEffect(() => {
        const uretimPin = !!sessionStorage.getItem('sb47_uretim_pin');
        const genelPin = !!sessionStorage.getItem('sb47_genel_pin');
        setYetkiState({ uretim: uretimPin, genel: genelPin });

        if (!kullanici && !genelPin && !uretimPin) {
            setCanliVeri({ ciro: 'N/A', maliyet: 'N/A', personelGider: 'N/A', fire: 'N/A', yukleniyor: false, koptu: true });
            setAlarmlar({ gorevler: [], kritikStok: [], vadeliOdeme: [], yukleniyor: false });
            setVeriHata('Yetkisiz Giriş: Hassas karargâh verileri gizlendi.');
            return;
        }

        (async () => {
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Bağlantı zaman aşımına uğradı (10sn)')), 10000)
            );
            try {
                const [sipRes, malRes] = await Promise.race([
                    Promise.all([
                        supabase.from('b2_siparisler').select('toplam_tutar_tl,durum'),
                        supabase.from('b1_maliyet_kayitlari').select('maliyet_tipi,tutar_tl'),
                    ]),
                    timeout.then(() => { throw new Error('timeout'); })
                ]).catch(e => { throw e; });

                const ciro = (sipRes.data || []).filter(s => s.durum === 'teslim').reduce((a, s) => a + parseFloat(s.toplam_tutar_tl || 0), 0);
                const tumMaliyet = (malRes.data || []).reduce((a, m) => a + parseFloat(m.tutar_tl || 0), 0);
                const personelGider = (malRes.data || []).filter(m => m.maliyet_tipi === 'personel_iscilik').reduce((a, m) => a + parseFloat(m.tutar_tl || 0), 0);
                const fire = (malRes.data || []).filter(m => m.maliyet_tipi === 'fire_kaybi').reduce((a, m) => a + parseFloat(m.tutar_tl || 0), 0);
                setCanliVeri({ ciro, maliyet: tumMaliyet, personelGider, fire, yukleniyor: false });

                await alarmYukle();

                const kanal = supabase.channel('karargah-gercek-zamanli')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_gorevler' }, () => { alarmYukle(); })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_urun_katalogu' }, () => { alarmYukle(); })
                    .subscribe();

                return () => {
                    supabase.removeChannel(kanal);
                }
            } catch (err) {
                setCanliVeri({ ciro: 'N/A', maliyet: 'N/A', personelGider: 'N/A', fire: 'N/A', yukleniyor: false, koptu: true });
                setVeriHata(err.message || 'Bağlantı hatası: Veriler yüklenemedi.');
            }
        })();
    }, [kullanici]);

    const yetkiVer = (grup) => {
        const ad = grup === 'uretim' ? 'Üretim' : 'Genel';
        const kod = prompt(`"${ad}" erişimi için yeni kod belirleyin (en az 4 karakter):`);
        if (!kod || kod.length < 4) { alert('Kod en az 4 karakter olmalı.'); return; }
        sessionStorage.setItem(`sb47_${grup}_pin`, btoa(kod));
        document.cookie = `sb47_${grup}_pin=${btoa(kod)}; path=/; max-age=28800; SameSite=Strict`;
        setYetkiState(prev => ({ ...prev, [grup]: true }));
    };

    const yetkiKapat = (grup) => {
        if (!confirm('Bu erişimi kapatmak istediğinizden emin misiniz?')) return;
        sessionStorage.removeItem(`sb47_${grup}_pin`);
        document.cookie = `sb47_${grup}_pin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

        try {
            const m = JSON.parse(sessionStorage.getItem('sb47_auth') || 'null');
            if (m?.grup === grup) sessionStorage.removeItem('sb47_auth');
        } catch { }
        setYetkiState(prev => ({ ...prev, [grup]: false }));
    };

    const hizliGorevSil = async (id, e) => {
        if (e) e.stopPropagation();
        if (!confirm('Yanlış eklenen görevi silmek istiyor musunuz?')) return;

        try {
            await supabase.from('b0_sistem_loglari').insert([{
                tablo_adi: 'b1_gorevler',
                islem_tipi: 'SILME',
                kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
            }]).catch(() => { });
        } catch (e) { }

        const { error } = await supabase.from('b1_gorevler').delete().eq('id', id);
        if (!error) {
            setGorevBildirim('Görev başarılı şekilde çöp kutusuna atıldı.');
            setTimeout(() => setGorevBildirim(''), 3000);
            alarmYukle();
        } else {
            setVeriHata('Silme işlemi başarısız: ' + error.message);
        }
    }

    const hizliGorevEkle = async () => {
        if (!hızlıGorev.trim() || islemYapiliyor) {
            if (!hızlıGorev.trim() && !islemYapiliyor) {
                setVeriHata('Görev başlığı boş bırakılamaz!');
                setTimeout(() => setVeriHata(''), 3000);
            }
            return;
        }

        setIslemYapiliyor(true);

        try {
            const response = await fetch('/api/gorev-ekle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baslik: hızlıGorev.trim(),
                    oncelik: hızlıOncelik,
                    kullanici: kullanici,
                    pinler: yetkiState
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setVeriHata(data.hata || 'Sunucu işlemi reddetti.');
            } else {
                setHızlıGorev('');
                setGorevBildirim(data.mesaj);
                setTimeout(() => setGorevBildirim(''), 4000);
                await alarmYukle();
            }
        } catch (err) {
            if (!navigator.onLine) {
                await cevrimeKuyrugaAl({
                    tablo: 'b1_gorevler',
                    islem_tipi: 'INSERT',
                    veri: { baslik: hızlıGorev.trim(), oncelik: hızlıOncelik, durum: 'bekliyor' }
                });
                setHızlıGorev('');
                setGorevBildirim('İnternet Yok: Görev çevrimdışı kuyruğa alındı (Bağlantı gelince sunulacak).');
                setTimeout(() => setGorevBildirim(''), 4500);
            } else {
                setVeriHata('Bağlantı hatası: Güvenli tünel (Server) kurulamadı.');
            }
        }
        if (navigator.onLine) {
            setTimeout(() => setVeriHata(''), 4500);
        }
        setIslemYapiliyor(false);
    };

    const sesDinle = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVeriHata('Tarayıcınız sesli komutu desteklemiyor (Chrome/Edge önerilir).');
            return;
        }

        const recon = new SpeechRecognition();
        recon.lang = 'tr-TR';
        recon.interimResults = false;
        recon.maxAlternatives = 1;

        recon.onstart = () => {
            setDinliyor(true);
        };

        recon.onresult = (e) => {
            const metin = e.results[0][0].transcript;
            setHızlıGorev(metin);
            setGorevBildirim(`🎤 Ses algılandı: "${metin}". Hızlıca kaydedebilirsiniz.`);
            setTimeout(() => setGorevBildirim(''), 4500);
        };

        recon.onerror = (e) => {
            setVeriHata('Mikrofon algılanamadı: ' + e.error);
            setTimeout(() => setVeriHata(''), 4000);
        };

        recon.onend = () => {
            setDinliyor(false);
        };

        recon.start();
    };

    const yetkiSorgula = (rota, varsayilanHref) => {
        if (kullanici?.grup === 'tam') return varsayilanHref;
        if (rota === '/uretim' && yetkiState.uretim) return varsayilanHref;
        if (yetkiState.uretim || yetkiState.genel) return varsayilanHref;
        return '#yetkisiz';
    };

    const tiklamaKorumasi = (e, rota) => {
        if (yetkiSorgula(rota, rota) === '#yetkisiz') {
            e.preventDefault();
            setVeriHata('Erişim Ataması bölümünden PİN kodunuzu aktifleştirmelisiniz.');
            setTimeout(() => setVeriHata(''), 4000);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen p-2 md:p-6 text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* HATA VE BİLDİRİM BALONLARI */}
            {veriHata && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded text-sm font-semibold text-red-700 shadow-md flex justify-between animate-pulse">
                    <span>{veriHata}</span>
                    <button onClick={() => setVeriHata('')} className="font-bold cursor-pointer hover:text-red-900">✕</button>
                </div>
            )}
            {gorevBildirim && (
                <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-sm font-semibold text-emerald-700 shadow-md flex justify-between animate-pulse">
                    <span>✨ {gorevBildirim}</span>
                    <button onClick={() => setGorevBildirim('')} className="font-bold cursor-pointer hover:text-emerald-900">✕</button>
                </div>
            )}

            {/* TEPE ÜST BÖLÜM - GÖRKEMLİ BAŞLIK */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-500 m-0 tracking-tight">
                        KARARGÂH
                    </h1>
                    <p className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mt-1">
                        Üretim · Maliyet · Harekât Merkezi
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setFinansGizli(!finansGizli)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 transition-all shadow-sm">
                        {finansGizli ? <><EyeOff size={16} className="text-red-500" /> Sansürlü Mode</> : <><Eye size={16} className="text-emerald-600" /> Şeffaf Mode</>}
                    </button>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-black px-4 py-2 rounded-xl uppercase border border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        THE ORDER – GÜVENLİ AĞ
                    </span>
                </div>
            </div>

            {/* 4 TEMEL KPI BÖLÜMÜ (GLASSMORPHISM & GRADYAN KARTLAR) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Ciro */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100 p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp size={100} />
                    </div>
                    <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <TrendingUp size={14} /> Teslim Edilen Ciro
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-900 mb-1">
                        {canliVeri.yukleniyor ? '⏳' : canliVeri.koptu ? <span className="text-red-600 text-lg font-bold">BAĞLANTI KOPTU</span> : finansGizli ? '₺ ••••••' : `₺${canliVeri.ciro.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600">Başarıyla kapanan siparişler toplamı</div>
                </div>

                {/* Maliyet */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Database size={100} />
                    </div>
                    <div className="text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <HandHeart size={14} /> Toplam Maliyet
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-indigo-900 mb-1">
                        {canliVeri.yukleniyor ? '⏳' : canliVeri.koptu ? <span className="text-red-600 text-lg font-bold">BAĞLANTI KOPTU</span> : finansGizli ? '₺ ••••••' : `₺${canliVeri.maliyet.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`}
                    </div>
                    <div className="text-[10px] font-bold text-indigo-600">Maliyet merkezlerine kaydedilen tutar</div>
                </div>

                {/* Personel */}
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-fuchsia-100 p-6 rounded-2xl border border-purple-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={100} />
                    </div>
                    <div className="text-purple-700 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <ShieldCheck size={14} /> Personel & Prim
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-purple-900 mb-1">
                        {canliVeri.yukleniyor ? '⏳' : canliVeri.koptu ? <span className="text-red-600 text-lg font-bold">BAĞLANTI KOPTU</span> : finansGizli ? '₺ ••••••' : `₺${canliVeri.personelGider.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`}
                    </div>
                    <div className="text-[10px] font-bold text-purple-600">Aylık işçilik ve net hakediş ödemeleri</div>
                </div>

                {/* Fire Loss */}
                <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-100 p-6 rounded-2xl border border-red-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                        <AlertCircle size={100} />
                    </div>
                    <div className="text-red-700 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                        <AlertCircle size={14} /> Fire & Zayiat
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-red-900 mb-1">
                        {canliVeri.yukleniyor ? '⏳' : canliVeri.koptu ? <span className="text-red-600 text-lg font-bold">BAĞLANTI KOPTU</span> : finansGizli ? '₺ ••••••' : `₺${canliVeri.fire.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`}
                    </div>
                    {!canliVeri.yukleniyor && canliVeri.maliyet > 0 && (
                        <div className="text-[11px] font-black text-red-600 px-2 py-0.5 bg-red-100 rounded inline-block">
                            Zarar Oranı: {finansGizli ? '%•••' : `%${((canliVeri.fire / canliVeri.maliyet) * 100).toFixed(1)}`}
                        </div>
                    )}
                </div>
            </div>

            {/* İKİ SÜTUNLU ANA GÖVDE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                {/* SOL SÜTUN - İŞLETME YÖNETİMİ & ALARMLAR */}
                <div className="flex flex-col gap-6">
                    {/* HIZLI GÖREV & MİKROFON AI KONSOLU */}
                    <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><Zap size={18} className="text-amber-500" /> Otonom Görev Atama</h2>
                            <Link href="/gorevler" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1 rounded-full">Tüm Görevler →</Link>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 items-stretch relative z-10">
                            <div className="relative flex-1">
                                <input
                                    value={hızlıGorev}
                                    onChange={e => setHızlıGorev(e.target.value)}
                                    maxLength={200}
                                    disabled={islemYapiliyor || dinliyor}
                                    onKeyDown={async e => { if (e.key === 'Enter') await hizliGorevEkle(); }}
                                    placeholder={dinliyor ? "🎤 Sizi dinliyorum, konuşun..." : islemYapiliyor ? "İşleniyor..." : "Görev gir veya mikrofona tıkla..."}
                                    className={`w-full pl-4 pr-12 py-3 border-2 ${dinliyor ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white'} rounded-xl text-sm font-semibold outline-none transition-all`}
                                />
                                <button
                                    onClick={dinliyor ? null : sesDinle}
                                    disabled={islemYapiliyor}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${dinliyor ? 'text-red-600 bg-red-100 animate-pulse' : 'text-slate-400 hover:bg-slate-200 hover:text-indigo-600'}`}
                                    title="Mikrofonla Komut Ver"
                                >
                                    <Mic size={18} />
                                </button>
                            </div>

                            <select
                                value={hızlıOncelik}
                                onChange={e => setHızlıOncelik(e.target.value)}
                                disabled={islemYapiliyor}
                                className="px-4 py-3 border-2 border-slate-200 bg-slate-50 text-slate-700 rounded-xl font-bold text-sm cursor-pointer outline-none hover:bg-white focus:border-indigo-500 transition-all"
                            >
                                <option value="dusuk">🟢 Düşük Öncelik</option>
                                <option value="normal">🟡 Normal Görev</option>
                                <option value="yuksek">🟠 Yüksek Aciliyet</option>
                                <option value="kritik">🔴 Kritik Emir!</option>
                            </select>

                            <button
                                onClick={hizliGorevEkle}
                                disabled={islemYapiliyor || (!hızlıGorev.trim() && !dinliyor)}
                                className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50"
                            >
                                YAYINLA
                            </button>
                        </div>
                    </div>

                    {/* ERP İZOLE BİRİM GEÇİŞLERİ */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4"><Database size={18} className="text-sky-500" /> Kritik Ana Kısayollar</h2>
                        <div className="flex flex-col gap-3">
                            <Link href={yetkiSorgula('/imalat', '/imalat')} onClick={(e) => tiklamaKorumasi(e, '/imalat')} className="group flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all">
                                <div className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform"><Factory size={22} /></div>
                                <div>
                                    <div className="font-black text-blue-900 text-sm">İmalat (Ön Hazırlık) Zinciri</div>
                                    <div className="font-semibold text-blue-600/70 text-xs">Ar-Ge, Kumaş, Kalıp, Modelhane Bacakları</div>
                                </div>
                            </Link>

                            <Link href={yetkiSorgula('/uretim', '/uretim')} onClick={(e) => tiklamaKorumasi(e, '/uretim')} className="group flex items-center gap-4 p-4 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300 transition-all">
                                <div className="bg-purple-600 text-white p-3 rounded-xl shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform"><Activity size={22} /></div>
                                <div>
                                    <div className="font-black text-purple-900 text-sm">Bant, Üretim ve Fason Yönetimi</div>
                                    <div className="font-semibold text-purple-600/70 text-xs">Canlı Aktif Takip Rotaları</div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* SAĞ SÜTUN - YETKİLER VE OTONOM SİSTEM ALARMLARI */}
                <div className="flex flex-col gap-6">
                    {/* YETKİ KONTROL KONSOLU */}
                    {kullanici?.grup === 'tam' && (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                            <div className="flex items-center gap-2 mb-4">
                                <KeyRound size={18} className="text-zinc-300" />
                                <h2 className="text-base font-black text-white tracking-wide">PİN / Güvenlik Terminali</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                {[{ key: 'uretim', label: 'Üretim Terminali', renk: 'blue', aciklama: 'M1–M8, Sipariş, Stok' },
                                { key: 'genel', label: 'Genel Gözlemci', renk: 'emerald', aciklama: 'Anasayfa, Rapor (OnlyView)' }].map(g => (
                                    <div key={g.key} className={`border border-zinc-700/50 rounded-xl p-4 flex flex-col justify-between ${yetkiState[g.key] ? 'bg-zinc-800/80 border-indigo-500/30' : 'bg-black/20'}`}>
                                        <div className="mb-4">
                                            <div className="text-sm font-bold text-zinc-100">{g.label}</div>
                                            <div className="text-[10px] font-medium text-zinc-400 mt-1">{g.aciklama}</div>
                                        </div>
                                        <div className="mt-auto">
                                            {yetkiState[g.key] ? (
                                                <button onClick={() => yetkiKapat(g.key)} className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2"><Lock size={12} /> Vizeyi Kapat</button>
                                            ) : (
                                                <button onClick={() => yetkiVer(g.key)} className="w-full bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2"><Unlock size={12} /> Şifre Ata</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* REALTIME SİSTEM ALARMLARI */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex-1 flex flex-col">
                        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <h2 className="text-base font-black text-slate-800 flex items-center gap-2"><AlertCircle size={18} className="text-rose-500" /> Aktif Alarmlar (Realtime)</h2>
                            <button onClick={alarmYukle} className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">🔄 Tazele</button>
                        </div>

                        <div className="p-2 sm:p-4 flex-1 flex flex-col gap-3 min-h-[300px] overflow-y-auto">
                            {alarmlar.yukleniyor && <div className="m-auto text-sm font-bold text-slate-400 animate-pulse">📡 Radar Taranıyor...</div>}

                            {!alarmlar.yukleniyor && alarmlar.gorevler.length === 0 && alarmlar.kritikStok.length === 0 && alarmlar.vadeliOdeme.length === 0 && (
                                <div className="m-auto flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center"><CheckSquare size={24} /></div>
                                    <span className="text-sm font-black text-emerald-600">Sistem Tamamen Temiz</span>
                                </div>
                            )}

                            {alarmlar.gorevler.map((g, i) => (
                                <div key={`g${i}`} className={`flex justify-between items-center p-3 rounded-xl border-l-4 ${g.oncelik === 'kritik' ? 'bg-red-50 border-red-500' : g.oncelik === 'yuksek' ? 'bg-amber-50 border-amber-500' : 'bg-slate-50 border-slate-400'}`}>
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Piyade Görevi / {g.oncelik}</div>
                                        <div className="text-sm font-bold text-slate-800">{g.baslik}</div>
                                    </div>
                                    <button onClick={(e) => hizliGorevSil(g.id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"><Trash2 size={16} /></button>
                                </div>
                            ))}

                            {alarmlar.kritikStok.map((u, i) => (
                                <Link href="/katalog" key={`s${i}`} className="block p-3 rounded-xl border-l-4 border-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors">
                                    <div className="text-[10px] font-black uppercase text-rose-500 tracking-wider mb-1">Kritik Stok Uyarısı</div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm font-bold text-slate-800">{u.urun_kodu} — {u.urun_adi}</div>
                                        <div className="text-xs font-black text-rose-700 bg-white px-2 py-1 rounded shadow-sm">{u.stok_adeti} / {u.min_stok} Kaldı</div>
                                    </div>
                                </Link>
                            ))}

                            {alarmlar.vadeliOdeme.map((h, i) => (
                                <div key={`v${i}`} className="block p-3 rounded-xl border-l-4 border-violet-500 bg-violet-50">
                                    <div className="text-[10px] font-black uppercase text-violet-500 tracking-wider mb-1">Gecikmiş Finansman İşlemi</div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm font-bold text-slate-800">{h.aciklama || h.hareket_tipi}</div>
                                        <div className="text-sm font-black text-violet-700">₺{parseFloat(h.tutar_tl).toFixed(0)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
