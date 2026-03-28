'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Lock, ScanEye, Package, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { telegramBildirim, formatTarih } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { videoVeResimDenetle } from '@/lib/ai/visionAjanCore';
import SilBastanModal from '@/components/ui/SilBastanModal';

import DenetmenUyarilarTab from './tabs/DenetmenUyarilarTab';
import DenetmenBuyukVeriTab from './tabs/DenetmenBuyukVeriTab';
import DenetmenAqlTab from './tabs/DenetmenAqlTab';
import DenetmenHataKodTab from './tabs/DenetmenHataKodTab';
import DenetmenSikayetlerTab from './tabs/DenetmenSikayetlerTab';
import DenetmenVisionModal from './DenetmenVisionModal'; // Varsa veya direkt modal kullanılacak

const TIP_İKON = {
    dusuk_stok: { ikon: <Package size={14} />, etiket: 'Düşük Stok' },
    maliyet_asimi: { ikon: <TrendingUp size={14} />, etiket: 'Maliyet Aşımı' },
    fire_yuksek: { ikon: <AlertTriangle size={14} />, etiket: 'Fire Yüksek' },
    video_eksik: { ikon: <XCircle size={14} />, etiket: 'Video Eksik' },
    malzeme_eksik: { ikon: <Package size={14} />, etiket: 'Malzeme Eksik' },
    liyakat_uyari: { ikon: <ShieldAlert size={14} />, etiket: 'Liyakat' },
    diger: { ikon: <AlertTriangle size={14} />, etiket: 'Uyarı' },
};

export default function DenetmenMainContainer() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);

    const [uyarilar, setUyarilar] = useState([]);
    const [loglar, setLoglar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tarama, setTarama] = useState(false);
    const [filtre, setFiltre] = useState('hepsi');
    const [mesaj, setMesaj] = useState('');
    const [aiAnaliz, setAiAnaliz] = useState(null);
    const [aiYukleniyor, setAiYukleniyor] = useState(false);
    const [islemdeId, setIslemdeId] = useState(null);

    const [anaSekme, setAnaSekme] = useState('uyarilar');

    const [visionModalAcik, setVisionModalAcik] = useState(false);
    const [visionYukleniyor, setVisionYukleniyor] = useState(false);
    const [visionFotoSecili, setVisionFotoSecili] = useState(null);
    const [visionSonuc, setVisionSonuc] = useState(null);

    useEffect(() => {
        let denetmenPin = false;
        try { denetmenPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { denetmenPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || denetmenPin;
        setYetkiliMi(erisebilir);

        let kanal;
        if (erisebilir) {
            kanal = supabase.channel('islem-gercek-zamanli-ai')
                .on('postgres_changes', { event: '*', schema: 'public' }, () => { yukle(); })
                .subscribe();
        }

        yukle();

        return () => { if (kanal) supabase.removeChannel(kanal); };
    }, [kullanici]);

    const yukle = async () => {
        setLoading(true);
        try {
            const [uyariSonuc, logSonuc] = await Promise.allSettled([
                supabase.from('b1_sistem_uyarilari').select('id, baslik, aciklama, tip, kritik, durum, olusturma, seviye, uyari_tipi, kaynak_id, mesaj').eq('durum', 'aktif').order('olusturma', { ascending: false }).limit(20),
                supabase.from('b1_agent_loglari').select('id, ajan_adi, islem_tipi, mesaj, sonuc, created_at').order('created_at', { ascending: false }).limit(10)
            ]);

            if (uyariSonuc.status === 'fulfilled' && uyariSonuc.value.data) {
                const siraliUyari = uyariSonuc.value.data.sort((a, b) => new Date(b.olusturma || 0) - new Date(a.olusturma || 0));
                setUyarilar(siraliUyari);
            }
            if (logSonuc.status === 'fulfilled' && logSonuc.value.data) setLoglar(logSonuc.value.data);
        } catch (error) { setMesaj('Veriler yüklenemedi: ' + error.message); }
        setLoading(false);
    };

    const taramaCalistir = async () => {
        if (tarama) return setMesaj('⏳ Tarama zaten devam ediyor...');
        setTarama(true);
        setMesaj('');
        try {
            const { data: urunler } = await supabase.from('b2_urun_katalogu').select('id, urun_adi_tr, stok_adeti, min_stok_alarm').eq('aktif', true).not('min_stok_alarm', 'is', null).limit(500);
            let yeniUyari = 0;
            for (const u of (urunler || [])) {
                if (u.stok_adeti <= u.min_stok_alarm) {
                    const { data: var_ } = await supabase.from('b1_sistem_uyarilari').select('id').eq('uyari_tipi', 'dusuk_stok').eq('kaynak_id', u.id).eq('durum', 'aktif').limit(1);
                    if (!var_?.length) {
                        await supabase.from('b1_sistem_uyarilari').insert([{ uyari_tipi: 'dusuk_stok', seviye: u.stok_adeti === 0 ? 'kritik' : 'uyari', baslik: `${u.stok_adeti === 0 ? 'Stok Sıfır' : 'Düşük Stok'}: ${u.urun_adi_tr}`, mesaj: `${u.stok_adeti} adet | Min: ${u.min_stok_alarm} adet`, kaynak_tablo: 'b2_urun_katalogu', kaynak_id: u.id, durum: 'aktif' }]);
                        yeniUyari++;
                    }
                }
            }

            const { data: raporlar } = await supabase.from('b1_muhasebe_raporlari').select('id, hedeflenen_maliyet_tl, gerceklesen_maliyet_tl, fark_tl').not('hedeflenen_maliyet_tl', 'is', null).order('created_at', { ascending: false }).limit(50);
            for (const r of (raporlar || [])) {
                const hedef = parseFloat(r.hedeflenen_maliyet_tl || 0);
                const fark = parseFloat(r.fark_tl || 0);
                if (hedef <= 0) continue;
                const yuzde = (fark / hedef) * 100;
                if (yuzde > 10) {
                    const { data: var_ } = await supabase.from('b1_sistem_uyarilari').select('id').eq('uyari_tipi', 'maliyet_asimi').eq('kaynak_id', r.id).eq('durum', 'aktif').limit(1);
                    if (!var_?.length) {
                        await supabase.from('b1_sistem_uyarilari').insert([{ uyari_tipi: 'maliyet_asimi', seviye: yuzde > 25 ? 'kritik' : 'uyari', baslik: `Maliyet Aşımı: %${yuzde.toFixed(1)}`, mesaj: `Hedef: ₺${hedef.toFixed(0)} | Gerçek: ₺${parseFloat(r.gerceklesen_maliyet_tl).toFixed(0)} | Fark: +₺${fark.toFixed(0)}`, kaynak_tablo: 'b1_muhasebe_raporlari', kaynak_id: r.id, durum: 'aktif' }]);
                        yeniUyari++;
                    }
                }
            }
            setMesaj(`Tarama tamamlandı. ${yeniUyari} yeni uyarı oluşturuldu.`);
            yukle();
        } catch (e) { setMesaj('Tarama hatası: ' + e.message); }
        finally { setTimeout(() => setTarama(false), 3000); }
    };

    const aiAnalizYap = async () => {
        if (uyarilar.length === 0) return setMesaj('Uyarı yok, önce Tara & Güncelle\'ye basın.');
        if (aiYukleniyor) return setMesaj('⏳ AI zaten analiz ediyor...');
        setAiYukleniyor(true);
        setAiAnaliz(null);
        try {
            const ozet = uyarilar.slice(0, 10).map(u => `- [${u.seviye?.toUpperCase()}] ${u.baslik}: ${u.mesaj}`).join('\n');
            const res = await fetch('/api/trend-ara', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sorgu: `Bir tekstil atölyesinde şu sistem uyarıları var:\n${ozet}\n\nBunları öncelik sırasına göre değerlendir ve kısa Türkçe çözüm önerileri sun. Sadece pratik ve uygulanabilir öneriler ver.` }),
            });
            const data = await res.json();
            setAiAnaliz(data.ozet || data.sonuclar?.[0]?.aciklama || 'Analiz tamamlandı.');
        } catch (e) { setAiAnaliz('Bağlantı hatası: ' + e.message); }
        finally { setTimeout(() => setAiYukleniyor(false), 3000); }
    };

    const coz = async (id, baslik) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            const { error } = await supabase.from('b1_sistem_uyarilari').update({ durum: 'cozuldu', cozum_tarihi: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            setUyarilar(prev => prev.filter(u => u.id !== id));
            telegramBildirim(`✅ ALARM ÇÖZÜLDÜ\nMüfettiş: ${baslik}`);
        } catch (error) { setMesaj('Hata: ' + error.message); }
        setIslemdeId(null);
    };

    const gozArd = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            const { error } = await supabase.from('b1_sistem_uyarilari').update({ durum: 'goz_ardi' }).eq('id', id);
            if (error) throw error;
            setUyarilar(prev => prev.filter(u => u.id !== id));
        } catch (error) { setMesaj('Hata: ' + error.message); }
        setIslemdeId(null);
    };

    const kritikSayisi = uyarilar.filter(u => u.seviye === 'kritik').length;
    const uyariSayisi = uyarilar.filter(u => u.seviye === 'uyari').length;

    if (!yetkiliMi) {
        return (
            <div dir={isAR ? 'rtl' : 'ltr'} style={{ padding: '3rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '16px', margin: '2rem' }}>
                <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2 style={{ color: '#b91c1c', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>Sistem denetmeni verileri son derece gizlidir. Görüntülemek için Yetkili Kullanıcı girişi gereklidir.</p>
            </div>
        );
    }

    return (
        <div>
            {/* BAŞLIK VE BUTONLAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', margin: 0 }}>Sistem Denetmeni (M3)</h1>
                        <p style={{ fontSize: '0.78rem', color: '#a7f3d0', margin: '2px 0 0', fontWeight: 600 }}>Otomatik alarm merkezi — otonom mimari</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={taramaCalistir} disabled={tarama}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: tarama ? '#94a3b8' : '#7c3aed', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: tarama ? 'not-allowed' : 'pointer', opacity: tarama ? 0.7 : 1 }}>
                        <RefreshCw size={16} style={{ animation: tarama ? 'spin 1s linear infinite' : 'none' }} />
                        {tarama ? 'Taranıyor...' : 'Tara & Güncelle'}
                    </button>
                    <button onClick={async () => {
                        const ozet = [
                            `📊 *SİSTEM DENETMENİ — HAFTALIK ÖZET*`,
                            `🚨 Aktif Uyarı: *${uyarilar.length}* adet`,
                            `🔴 Kritik: *${kritikSayisi}*  |  🟡 Uyarı: *${uyariSayisi}*`,
                            `✅ THE ORDER ERP`
                        ].join('\n');
                        telegramBildirim(ozet);
                        setMesaj('📨 Haftalık rapor Telegram\'a gönderildi!');
                        setTimeout(() => setMesaj(''), 4000);
                    }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#064e3b', color: '#34d399', border: '2px solid #34d399', padding: '9px 14px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
                        📨 Haftalık Rapor
                    </button>
                    <button onClick={() => { setVisionModalAcik(true); setVisionFotoSecili(null); setVisionSonuc(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', color: '#38bdf8', border: '2px solid #0284c7', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}>
                        <ScanEye size={18} /> Kumaş / Dikim Analiz
                    </button>
                    <button onClick={aiAnalizYap} disabled={aiYukleniyor || uyarilar.length === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: aiYukleniyor ? '#334155' : 'white', color: '#059669', border: '2px solid #059669', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: (aiYukleniyor || uyarilar.length === 0) ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
                        🤖 {aiYukleniyor ? 'Düşünüyor...' : 'Gemini AI Analizi'}
                    </button>
                </div>
            </div>

            {/* SEKMELER */}
            <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', background: '#173a34', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
                <button onClick={() => setAnaSekme('uyarilar')} style={{ flex: 1, minWidth: '120px', padding: '10px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s', background: anaSekme === 'uyarilar' ? 'white' : 'transparent', color: anaSekme === 'uyarilar' ? '#7c3aed' : '#64748b', boxShadow: anaSekme === 'uyarilar' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                    🚨 Sistem Uyarıları
                </button>
                <button onClick={() => setAnaSekme('buyuk_veri')} style={{ flex: 1, minWidth: '120px', padding: '10px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s', background: anaSekme === 'buyuk_veri' ? '#1e1b4b' : 'transparent', color: anaSekme === 'buyuk_veri' ? '#a78bfa' : '#64748b', boxShadow: anaSekme === 'buyuk_veri' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }}>
                    🧠 Büyük Veri AI
                </button>
                <button onClick={() => setAnaSekme('aql')} style={{ flex: 1, minWidth: '120px', padding: '10px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s', background: anaSekme === 'aql' ? '#047857' : 'transparent', color: anaSekme === 'aql' ? 'white' : '#64748b', boxShadow: anaSekme === 'aql' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }}>
                    📋 AQL Kalite Formu
                </button>
                <button onClick={() => setAnaSekme('hata_kod')} style={{ flex: 1, minWidth: '120px', padding: '10px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s', background: anaSekme === 'hata_kod' ? '#9f1239' : 'transparent', color: anaSekme === 'hata_kod' ? 'white' : '#64748b', boxShadow: anaSekme === 'hata_kod' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }}>
                    ❌ Hata Kodları & Pareto
                </button>
                <button onClick={() => setAnaSekme('sikayetler')} style={{ flex: 1, minWidth: '120px', padding: '10px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s', background: anaSekme === 'sikayetler' ? '#ea580c' : 'transparent', color: anaSekme === 'sikayetler' ? 'white' : '#64748b', boxShadow: anaSekme === 'sikayetler' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }}>
                    [DN-05] Müşteri Şikayetleri
                </button>
            </div>

            {/* İçerik */}
            {anaSekme === 'uyarilar' && (
                <DenetmenUyarilarTab
                    uyarilar={uyarilar} kritikSayisi={kritikSayisi} uyariSayisi={uyariSayisi}
                    loglar={loglar} loading={loading} mesaj={mesaj}
                    aiAnaliz={aiAnaliz} setAiAnaliz={setAiAnaliz}
                    filtre={filtre} setFiltre={setFiltre}
                    TIP_İKON={TIP_İKON} coz={coz} gozArd={gozArd}
                />
            )}
            {anaSekme === 'buyuk_veri' && <DenetmenBuyukVeriTab />}
            {anaSekme === 'aql' && <DenetmenAqlTab />}
            {anaSekme === 'hata_kod' && <DenetmenHataKodTab />}
            {anaSekme === 'sikayetler' && <DenetmenSikayetlerTab />}

            {/* Modal Geçici Olarak Main'de tutulabilir */}
        </div>
    );
}
