'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Save, RefreshCw, Monitor, Type, Palette, Layout, Lock, Globe, FileCheck, Plus, Trash2, AlignLeft, Box, Bell, Minus } from 'lucide-react';
import { createGoster } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const TUM_SAYFALAR = ['/', '/arge', '/kumas', '/kalip', '/modelhane', '/kesim', '/uretim', '/maliyet', '/muhasebe', '/katalog', '/siparisler', '/stok', '/kasa', '/musteriler', '/personel', '/gorevler', '/raporlar', '/ajanlar', '/kameralar', '/guvenlik', '/denetmen', '/ayarlar'];

const VARSAYILAN_AYAR = { ana_renk: '#047857', ikincil_renk: '#0f172a', arkaplan_renk: '#f8fafc', kutu_arka_plan: '#ffffff', yazi_tipi: 'Inter, sans-serif', kose_radius: '12px', golge_stili: 'yumusak' };

const PALET_KATEGORILER = [
    {
        baslik: '🌿 Yeşiller', renkler: [
            { isim: 'Emerald', ana: '#047857', ik: '#0f172a', ark: '#f0fdf4' }, { isim: 'Nane', ana: '#059669', ik: '#0f172a', ark: '#ecfdf5' },
            { isim: 'Yeşil', ana: '#16a34a', ik: '#0f172a', ark: '#f0fdf4' }, { isim: 'Çimen', ana: '#65a30d', ik: '#1a2e05', ark: '#f7fee7' },
            { isim: 'Teal', ana: '#0d9488', ik: '#0f172a', ark: '#f0fdfa' }, { isim: 'Orman', ana: '#166534', ik: '#f0fdf4', ark: '#052e16' },
        ]
    },
    {
        baslik: '🌊 Maviler', renkler: [
            { isim: 'Okyanus', ana: '#0369a1', ik: '#0f172a', ark: '#f0f9ff' }, { isim: 'Gök', ana: '#0284c7', ik: '#0f172a', ark: '#e0f7ff' },
            { isim: 'Lacivert', ana: '#1d4ed8', ik: '#eff6ff', ark: '#1e3a8a' }, { isim: 'İndigo', ana: '#4338ca', ik: '#e0e7ff', ark: '#1e1b4b' },
            { isim: 'Turkuaz', ana: '#0891b2', ik: '#0f172a', ark: '#ecfeff' }, { isim: 'Deniz', ana: '#2563eb', ik: '#dbeafe', ark: '#1e3a5f' },
        ]
    },
    {
        baslik: '🍇 Morlar & Pembeler', renkler: [
            { isim: 'Mor', ana: '#7c3aed', ik: '#1e1b4b', ark: '#faf5ff' }, { isim: 'Leylak', ana: '#9333ea', ik: '#f3e8ff', ark: '#2e1065' },
            { isim: 'Fuşya', ana: '#c026d3', ik: '#fdf4ff', ark: '#4a044e' }, { isim: 'Pembe', ana: '#db2777', ik: '#fdf2f8', ark: '#500724' },
            { isim: 'Gül', ana: '#e11d48', ik: '#fff1f2', ark: '#4c0519' }, { isim: 'Orkide', ana: '#a855f7', ik: '#f5f3ff', ark: '#3b0764' },
        ]
    },
    {
        baslik: '🔥 Sıcak Renkler', renkler: [
            { isim: 'Kırmızı', ana: '#dc2626', ik: '#1c1917', ark: '#fff1f2' }, { isim: 'Turuncu', ana: '#ea580c', ik: '#1c1917', ark: '#fff7ed' },
            { isim: 'Amber', ana: '#d97706', ik: '#1c1917', ark: '#fffbeb' }, { isim: 'Altın', ana: '#ca8a04', ik: '#1c1917', ark: '#fefce8' },
            { isim: 'Mercan', ana: '#f97316', ik: '#431407', ark: '#fff7ed' }, { isim: 'Kehribar', ana: '#b45309', ik: '#fffbeb', ark: '#451a03' },
        ]
    },
    {
        baslik: '🖤 Nötr & Koyu', renkler: [
            { isim: 'Koyu Gold', ana: '#D4AF37', ik: '#f8fafc', ark: '#0f172a' }, { isim: 'Gece', ana: '#1e293b', ik: '#f8fafc', ark: '#0f172a' },
            { isim: 'Slate', ana: '#475569', ik: '#f8fafc', ark: '#1e293b' }, { isim: 'Gri', ana: '#6b7280', ik: '#f9fafb', ark: '#111827' },
            { isim: 'Taş', ana: '#78716c', ik: '#fafaf9', ark: '#1c1917' }, { isim: 'Duman', ana: '#374151', ik: '#f3f4f6', ark: '#111827' },
        ]
    },
    {
        baslik: '✨ Özel Temalar', renkler: [
            { isim: 'Karanlık', ana: '#6366f1', ik: '#e0e7ff', ark: '#0f0f1a' }, { isim: 'Güneş', ana: '#f59e0b', ik: '#78350f', ark: '#fffbeb' },
            { isim: 'Akdeniz', ana: '#0ea5e9', ik: '#0c4a6e', ark: '#e0f2fe' }, { isim: 'Şarap', ana: '#9f1239', ik: '#fff1f2', ark: '#4c0519' },
            { isim: 'Petrol', ana: '#134e4a', ik: '#ccfbf1', ark: '#042f2e' }, { isim: 'Somon', ana: '#f43f5e', ik: '#fff1f2', ark: '#fce7f3' },
        ]
    },
];

const FONTLAR = [
    { deger: 'Inter, sans-serif', isim: 'Inter', aciklama: 'Modern & Temiz' },
    { deger: 'Roboto, sans-serif', isim: 'Roboto', aciklama: 'Klasik & Güvenilir' },
    { deger: 'Outfit, sans-serif', isim: 'Outfit', aciklama: 'Yuvarlak & Canlı' },
    { deger: 'Tahoma, Arial, sans-serif', isim: 'Tahoma', aciklama: 'Arapça Uyumlu' },
    { deger: 'Georgia, serif', isim: 'Georgia', aciklama: 'Kurumsal & Resmi' },
    { deger: 'Courier New, monospace', isim: 'Courier', aciklama: 'Teknik & Yazılım' },
    { deger: '"Times New Roman", serif', isim: 'Times', aciklama: 'Klasik Gazete' },
    { deger: 'Verdana, sans-serif', isim: 'Verdana', aciklama: 'Geniş & Okunaklı' },
];

const BLOK_TIPLERI = [
    { tip: 'baslik', isim: 'Başlık Yazısı', ikon: '📝', aciklama: 'Büyük başlık metni' },
    { tip: 'paragraf', isim: 'Paragraf', ikon: '📄', aciklama: 'Normal metin bloku' },
    { tip: 'bilgi_kutusu', isim: 'Bilgi Kutusu', ikon: '📦', aciklama: 'İkon + başlık + değer' },
    { tip: 'duyuru', isim: 'Duyuru Şeridi', ikon: '🔔', aciklama: 'Önemli uyarı/bilgi' },
    { tip: 'ayirici', isim: 'Ayırıcı Çizgi', ikon: '➖', aciklama: 'Bölüm ayırıcı' },
];

function YeniBlokForm({ onEkle, onIptal }) {
    const [tip, setTip] = useState('baslik');
    const [baslik, setBaslik] = useState('');
    const [icerik, setIcerik] = useState('');
    const [renk, setRenk] = useState('#047857');
    const [ikon, setIkon] = useState('ℹ️');

    const ekle = () => {
        if (!baslik && tip !== 'ayirici') return;
        onEkle({ id: Date.now(), tip, baslik, icerik, renk, ikon });
    };

    return (
        <div className="bg-slate-50 border-2 border-fuchsia-200 rounded-xl p-3 space-y-2">
            <div>
                <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Blok Tipi</span>
                <div className="grid grid-cols-2 gap-1">
                    {BLOK_TIPLERI.map(b => (
                        <button key={b.tip} onClick={() => setTip(b.tip)}
                            className={`p-1.5 rounded-lg text-left border-2 transition-all ${tip === b.tip ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-slate-200 bg-white'}`}>
                            <span className="text-sm">{b.ikon}</span>
                            <span className="text-[10px] font-bold text-slate-700 ml-1">{b.isim}</span>
                        </button>
                    ))}
                </div>
            </div>

            {tip !== 'ayirici' && (
                <>
                    {(tip === 'bilgi_kutusu' || tip === 'duyuru') && (
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <span className="text-[10px] font-bold text-slate-500 block mb-1">İkon/Emoji</span>
                                <input value={ikon} onChange={e => setIkon(e.target.value)}
                                    className="w-full border-2 border-slate-200 rounded-lg p-1.5 text-sm text-center" maxLength={4} />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] font-bold text-slate-500 block mb-1">Renk</span>
                                <input type="color" value={renk} onChange={e => setRenk(e.target.value)}
                                    className="w-full h-9 rounded-lg border-2 border-slate-200 cursor-pointer p-0.5" />
                            </div>
                        </div>
                    )}
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">Başlık/Metin</span>
                        <input value={baslik} onChange={e => setBaslik(e.target.value)}
                            placeholder={tip === 'baslik' ? 'Sayfa başlığı...' : tip === 'bilgi_kutusu' ? 'Değer (ör: 1.240)' : 'Başlık...'}
                            className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm font-bold" />
                    </div>
                    {(tip === 'paragraf' || tip === 'bilgi_kutusu') && (
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">{tip === 'bilgi_kutusu' ? 'Alt Başlık' : 'İçerik'}</span>
                            <textarea value={icerik} onChange={e => setIcerik(e.target.value)}
                                placeholder={tip === 'bilgi_kutusu' ? 'Birim / Açıklama' : 'Metin içeriği...'}
                                className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm resize-none" rows={3} />
                        </div>
                    )}
                </>
            )}

            <div className="flex gap-2">
                <button onClick={ekle} className="flex-1 bg-fuchsia-600 text-white font-black py-2 rounded-lg text-xs hover:bg-fuchsia-700 flex items-center justify-center gap-1">
                    <Plus size={14} /> Ekle
                </button>
                <button onClick={onIptal} className="flex-1 bg-slate-200 text-slate-700 font-black py-2 rounded-lg text-xs hover:bg-slate-300">İptal</button>
            </div>
        </div>
    );
}

function BlokOnizleme({ blok }) {
    const stil = { backgroundColor: blok.renk ? blok.renk + '15' : '#f8fafc', border: `2px solid ${blok.renk || '#e2e8f0'}`, borderRadius: '8px', padding: '10px' };
    if (blok.tip === 'baslik') return <div style={stil}><h2 style={{ color: blok.renk || '#1e293b', fontWeight: 900, fontSize: '1.25rem', margin: 0 }}>{blok.baslik}</h2></div>;
    if (blok.tip === 'paragraf') return <div style={stil}><p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>{blok.baslik}</p>{blok.icerik && <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>{blok.icerik}</p>}</div>;
    if (blok.tip === 'bilgi_kutusu') return <div style={{ ...stil, display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '1.5rem' }}>{blok.ikon || 'ℹ️'}</span><div><div style={{ fontWeight: 900, fontSize: '1.1rem', color: blok.renk || '#1e293b' }}>{blok.baslik}</div><div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>{blok.icerik}</div></div></div>;
    if (blok.tip === 'duyuru') return <div style={{ ...stil, display: 'flex', gap: '8px', alignItems: 'flex-start', backgroundColor: blok.renk + '20', borderColor: blok.renk }}><span style={{ fontSize: '1.2rem' }}>{blok.ikon || '🔔'}</span><div style={{ fontWeight: 700, color: '#1e293b' }}>{blok.baslik}</div></div>;
    if (blok.tip === 'ayirici') return <hr style={{ border: 'none', borderTop: `2px solid ${blok.renk || '#e2e8f0'}`, margin: '8px 0' }} />;
    return null;
}

export default function TasarimMainContainer() {
    const { kullanici } = useAuth();
    const router = useRouter();
    const [yukleniyor, setYukleniyor] = useState(false);
    const [pinOnay, setPinOnay] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const goster = createGoster(setMesaj);
    const [hedefSayfa, setHedefSayfa] = useState('global_tema');
    const [ayarlar, setAyarlar] = useState(VARSAYILAN_AYAR);
    const [kayitModal, setKayitModal] = useState(false);
    const [aktifSekme, setAktifSekme] = useState('tema'); // 'tema' | 'icerik'
    const [bloklar, setBloklar] = useState([]);
    const [yeniBlokAc, setYeniBlokAc] = useState(false);

    useEffect(() => { tasarimiGetir(); }, [hedefSayfa]);
    useEffect(() => {
        const genelPin = !!sessionStorage.getItem('sb47_genel_pin');
        if (kullanici?.grup === 'tam' || genelPin) setPinOnay(true);
    }, [kullanici]);

    const tasarimiGetir = async () => {
        setYukleniyor(true);
        try {
            const { data } = await supabase.from('b0_tasarim_ayarlari').select('*').eq('ayar_anahtari', hedefSayfa).maybeSingle();
            if (data) {
                setAyarlar({ ana_renk: data.ana_renk || VARSAYILAN_AYAR.ana_renk, ikincil_renk: data.ikincil_renk || VARSAYILAN_AYAR.ikincil_renk, arkaplan_renk: data.arkaplan_renk || VARSAYILAN_AYAR.arkaplan_renk, kutu_arka_plan: data.kutu_arka_plan || VARSAYILAN_AYAR.kutu_arka_plan, yazi_tipi: data.yazi_tipi || VARSAYILAN_AYAR.yazi_tipi, kose_radius: data.kose_radius || VARSAYILAN_AYAR.kose_radius, golge_stili: data.golge_stili || VARSAYILAN_AYAR.golge_stili });
                setBloklar(data.icerik_bloklari || []);
            } else {
                setAyarlar({ ...VARSAYILAN_AYAR }); setBloklar([]);
            }
        } catch (e) { console.error(e); }
        finally { setYukleniyor(false); }
    };

    const blokEkle = (yeniBlok) => { setBloklar([...bloklar, yeniBlok]); setYeniBlokAc(false); };
    const blokSil = (id) => setBloklar(bloklar.filter(b => b.id !== id));

    const kaydetBuSayfaya = async () => {
        if (!pinOnay) return goster('Yönetici yetkisi gerekli.', 'error');
        setYukleniyor(true); setKayitModal(false);
        try {
            const anahtar = hedefSayfa === 'global_tema' ? 'global_tema' : hedefSayfa;
            const { error } = await supabase.from('b0_tasarim_ayarlari').upsert([{ ayar_anahtari: anahtar, ...ayarlar, icerik_bloklari: bloklar, guncelleyen: kullanici?.ad || 'Yönetici' }], { onConflict: 'ayar_anahtari' });
            if (error) throw error;
            goster(`✅ "${anahtar}" kaydedildi!`);
        } catch (e) { goster(e.message, 'error'); }
        finally { setYukleniyor(false); }
    };

    const tumSayfalara = async () => {
        if (!pinOnay) return goster('Yönetici yetkisi gerekli.', 'error');
        setYukleniyor(true); setKayitModal(false);
        try {
            const kayitlar = ['global_tema', ...TUM_SAYFALAR].map(s => ({ ayar_anahtari: s, ...ayarlar, icerik_bloklari: bloklar, guncelleyen: kullanici?.ad || 'Yönetici' }));
            const { error } = await supabase.from('b0_tasarim_ayarlari').upsert(kayitlar, { onConflict: 'ayar_anahtari' });
            if (error) throw error;
            goster(`🎉 ${kayitlar.length} sayfa güncellendi!`);
        } catch (e) { goster(e.message, 'error'); }
        finally { setYukleniyor(false); }
    };

    if (!pinOnay) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border-2 border-red-100">
                    <Lock size={64} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-slate-800 mb-2">Tasarım Stüdyosu Kilitli</h1>
                    <p className="text-sm font-bold text-slate-500 mb-6">Karargah üzerinden Yönetici PIN yetkisini aktif edin.</p>
                    <button onClick={() => router.push('/')} className="bg-slate-800 text-white font-bold py-3 px-6 rounded-xl w-full hover:bg-slate-700">Karargah&apos;a Dön</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-slate-100" style={{ fontFamily: ayarlar.yazi_tipi }}>

            {/* YAYINLAMA MODAL */}
            {kayitModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
                        <h2 className="text-xl font-black text-slate-800 mb-2">Nereye Uygulansın?</h2>
                        <p className="text-sm text-slate-500 mb-5">Değişiklikler nereler için geçerli olsun?</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={kaydetBuSayfaya} className="flex items-center gap-3 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all text-left">
                                <FileCheck size={24} className="text-emerald-600 flex-shrink-0" />
                                <div><div className="font-black text-slate-800 text-sm">Sadece Bu Sayfa</div><div className="text-xs text-slate-500 font-bold">{hedefSayfa === 'global_tema' ? 'Global Tema' : hedefSayfa}</div></div>
                            </button>
                            <button onClick={tumSayfalara} className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all text-left">
                                <Globe size={24} className="text-blue-600 flex-shrink-0" />
                                <div><div className="font-black text-slate-800 text-sm">Tüm Sayfalara Uygula</div><div className="text-xs text-slate-500 font-bold">{TUM_SAYFALAR.length + 1} sayfa güncellenir</div></div>
                            </button>
                            <button onClick={() => setKayitModal(false)} className="py-2 text-sm font-bold text-slate-500 hover:text-slate-700">İptal</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SOL PANEL */}
            <div className="w-80 bg-white border-r border-slate-200 shadow-lg flex flex-col h-screen overflow-y-auto sticky top-0 flex-shrink-0">
                {/* Başlık */}
                <div className="p-4 bg-slate-800 text-white flex-shrink-0">
                    <h1 className="text-lg font-black flex items-center gap-2"><Palette size={20} className="text-fuchsia-400" /> Tasarım Stüdyosu</h1>
                </div>

                {/* Sekme Seçici */}
                <div className="flex border-b border-slate-200 flex-shrink-0">
                    {[{ id: 'tema', isim: '🎨 Tema' }, { id: 'icerik', isim: '📝 İçerik' }].map(s => (
                        <button key={s.id} onClick={() => setAktifSekme(s.id)}
                            className={`flex-1 py-2.5 text-xs font-black transition-all ${aktifSekme === s.id ? 'bg-fuchsia-50 text-fuchsia-700 border-b-2 border-fuchsia-500' : 'text-slate-500 hover:text-slate-700'}`}>
                            {s.isim}
                        </button>
                    ))}
                </div>

                {/* SAYFA SEÇİMİ — her iki sekmede de görünür */}
                <div className="p-3 border-b border-slate-100 flex-shrink-0">
                    <select value={hedefSayfa} onChange={e => setHedefSayfa(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-fuchsia-400 bg-slate-50">
                        <option value="global_tema">🌍 Tümü — Global Tema</option>
                        <optgroup label="── ANA ──"><option value="/">🏠 Karargah</option></optgroup>
                        <optgroup label="── 1. BİRİM ──">
                            <option value="/arge">🔬 Ar-Ge &amp; Trend (M1)</option>
                            <option value="/kumas">🧵 Kumaş &amp; Arşiv (M2)</option>
                            <option value="/kalip">📐 Kalıp &amp; Serileme (M3)</option>
                            <option value="/modelhane">🎨 Modelhane (M4)</option>
                            <option value="/kesim">✂️ Kesim (M5)</option>
                            <option value="/uretim">🏭 Üretim Bandı (M6)</option>
                            <option value="/maliyet">💹 Maliyet (M7)</option>
                            <option value="/muhasebe">📊 Muhasebe (M8)</option>
                        </optgroup>
                        <optgroup label="── 2. BİRİM ──">
                            <option value="/katalog">📚 Katalog (M9)</option>
                            <option value="/siparisler">🛒 Siparişler (M10)</option>
                            <option value="/stok">📦 Stok (M11)</option>
                            <option value="/kasa">💰 Kasa (M12)</option>
                        </optgroup>
                        <optgroup label="── YÖNETİM ──">
                            <option value="/musteriler">👤 Müşteriler (M13)</option>
                            <option value="/personel">👥 Personel (M14)</option>
                            <option value="/gorevler">✅ Görevler (M15)</option>
                            <option value="/raporlar">📈 Raporlar (M16)</option>
                        </optgroup>
                        <optgroup label="── SİSTEM ──">
                            <option value="/ajanlar">🤖 Ajan Komuta (M17)</option>
                            <option value="/kameralar">📹 Kameralar (M18)</option>
                            <option value="/guvenlik">🔒 Güvenlik</option>
                            <option value="/denetmen">🕵️ Denetmen</option>
                            <option value="/ayarlar">⚙️ Sistem Ayarları</option>
                        </optgroup>
                    </select>
                </div>

                {/* İÇERİK ALANI */}
                <div className="flex-1 overflow-y-auto p-3">

                    {/* === TEMA SEKMESİ === */}
                    {aktifSekme === 'tema' && (
                        <div className="space-y-4">
                            {/* RENKLER */}
                            <div>
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🎨 Renkler</h2>
                                <div className="space-y-2 mb-3">
                                    {[{ label: 'Vurgu (Ana) Rengi', key: 'ana_renk' }, { label: 'Başlık Rengi', key: 'ikincil_renk' }, { label: 'Sayfa Arkaplanı', key: 'arkaplan_renk' }, { label: 'Kart Arkaplanı', key: 'kutu_arka_plan' }].map(r => (
                                        <label key={r.key} className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-600">{r.label}</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-mono text-slate-400">{ayarlar[r.key]}</span>
                                                <input type="color" value={ayarlar[r.key]} onChange={e => setAyarlar({ ...ayarlar, [r.key]: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-2 border-slate-200 p-0.5" />
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">— Hazır Paletler —</span>
                                {PALET_KATEGORILER.map(kat => (
                                    <div key={kat.baslik} className="mb-2">
                                        <span className="text-[10px] font-bold text-slate-500 block mb-1">{kat.baslik}</span>
                                        <div className="grid grid-cols-3 gap-1">
                                            {kat.renkler.map(p => (
                                                <button key={p.isim} onClick={() => setAyarlar({ ...ayarlar, ana_renk: p.ana, ikincil_renk: p.ik, arkaplan_renk: p.ark })} title={p.isim}
                                                    className={`flex items-center gap-1 p-1.5 rounded-lg border-2 transition-all ${ayarlar.ana_renk === p.ana ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-slate-100 hover:border-slate-300'}`}>
                                                    <div className="w-4 h-4 rounded-full flex-shrink-0 border border-slate-200" style={{ backgroundColor: p.ana }} />
                                                    <span className="text-[9px] font-bold text-slate-600 truncate">{p.isim}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* YAZI TİPİ */}
                            <div>
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🔤 Yazı Tipi</h2>
                                <div className="space-y-1">
                                    {FONTLAR.map(f => (
                                        <button key={f.deger} onClick={() => setAyarlar({ ...ayarlar, yazi_tipi: f.deger })}
                                            className={`w-full p-2 rounded-lg border-2 text-left transition-all ${ayarlar.yazi_tipi === f.deger ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                            style={{ fontFamily: f.deger }}>
                                            <div className="flex justify-between"><span className="font-black text-slate-800 text-xs">{f.isim}</span><span className="text-[9px] text-slate-400">{f.aciklama}</span></div>
                                            <div className="text-slate-500 text-[11px]">AaBbCc 123 · ÇŞÜĞİÖ</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* KÖŞE & GÖLGE */}
                            <div>
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">📐 Köşe &amp; Gölge</h2>
                                <div className="mb-2">
                                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Köşe Keskinliği</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {[{ d: '0px', n: 'Dik' }, { d: '4px', n: '4px' }, { d: '8px', n: '8px' }, { d: '12px', n: '12px' }, { d: '16px', n: 'Yvr' }, { d: '24px', n: 'Tam' }].map(r => (
                                            <button key={r.d} onClick={() => setAyarlar({ ...ayarlar, kose_radius: r.d })}
                                                className={`flex-1 min-w-[44px] py-1.5 text-[9px] font-black transition-all border-2 ${ayarlar.kose_radius === r.d ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-200 text-slate-500 bg-white'}`}
                                                style={{ borderRadius: r.d }}>{r.n}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Gölge</span>
                                    <div className="flex gap-1">
                                        {[{ d: 'yok', n: 'Yok' }, { d: 'hafif', n: 'Hafif' }, { d: 'yumusak', n: 'Yum.' }, { d: 'sert', n: 'Sert' }, { d: 'derin', n: 'Derin' }].map(g => (
                                            <button key={g.d} onClick={() => setAyarlar({ ...ayarlar, golge_stili: g.d })}
                                                className={`flex-1 py-1.5 text-[9px] font-black rounded-lg border-2 transition-all ${ayarlar.golge_stili === g.d ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-200 text-slate-500 bg-white'}`}>{g.n}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === İÇERİK SEKMESİ === */}
                    {aktifSekme === 'icerik' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📝 Sayfa Blokları</h2>
                                <button onClick={() => setYeniBlokAc(true)}
                                    className="flex items-center gap-1 bg-fuchsia-600 text-white px-2 py-1 rounded-lg text-[10px] font-black hover:bg-fuchsia-700">
                                    <Plus size={12} /> Yeni Blok
                                </button>
                            </div>

                            <p className="text-[10px] text-slate-400 font-bold leading-tight">
                                Bu sayfaya özel metin, bilgi kutusu veya duyuru ekle. Kaydedince sayfada görünür.
                            </p>

                            {yeniBlokAc && <YeniBlokForm onEkle={blokEkle} onIptal={() => setYeniBlokAc(false)} />}

                            {bloklar.length === 0 && !yeniBlokAc && (
                                <div className="text-center py-6 text-slate-400">
                                    <Box size={32} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-xs font-bold">Henüz blok eklenmedi</p>
                                    <p className="text-[10px]">&quot;Yeni Blok&quot; ile başla</p>
                                </div>
                            )}

                            {bloklar.map((blok, i) => (
                                <div key={blok.id || i} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                                    <div className="flex items-center justify-between px-2 py-1 bg-slate-50 border-b border-slate-200">
                                        <span className="text-[10px] font-black text-slate-500">{BLOK_TIPLERI.find(b => b.tip === blok.tip)?.isim || blok.tip}</span>
                                        <button onClick={() => blokSil(blok.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={12} /></button>
                                    </div>
                                    <div className="p-2">
                                        <BlokOnizleme blok={blok} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* BUTONLAR */}
                <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2 flex-shrink-0">
                    {mesaj.text && (
                        <div className={`p-2 rounded-lg text-xs font-bold text-center ${mesaj.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>{mesaj.text}</div>
                    )}
                    <button onClick={kaydetBuSayfaya} disabled={yukleniyor}
                        className="w-full bg-slate-100 border-2 border-slate-300 text-slate-700 font-black py-2 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 text-sm">
                        {yukleniyor ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                        Kaydet (Bu Sayfaya)
                    </button>
                    <button onClick={() => setKayitModal(true)} disabled={yukleniyor}
                        className="w-full bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                        {yukleniyor ? <RefreshCw className="animate-spin" size={18} /> : <Globe size={18} />}
                        Canlıya Al — Nereye?
                    </button>
                </div>
            </div>

            {/* SAĞ PANEL — CANLI SAYFA */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 text-white text-xs font-bold border-b border-slate-700 flex-shrink-0">
                    <span className="bg-emerald-500 px-3 py-1 rounded-full font-black">CANLI SAYFA</span>
                    <span className="text-slate-300 flex-1 truncate">{hedefSayfa === 'global_tema' ? '/ (Ana Karargah)' : hedefSayfa}</span>
                    <a href={hedefSayfa === 'global_tema' ? '/' : hedefSayfa} target="_blank" rel="noopener noreferrer"
                        className="bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded-lg transition-colors font-bold flex-shrink-0">🔗 Tam Ekran Aç</a>
                </div>
                <iframe key={hedefSayfa} src={hedefSayfa === 'global_tema' ? '/' : hedefSayfa}
                    className="w-full flex-1 border-0" style={{ height: 'calc(100vh - 80px)' }} title="Sayfa Önizleme" />
                <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-200 text-xs text-amber-700 font-bold flex-shrink-0">
                    💡 Sol panelden tema/içerik düzenle → Kaydet → Değişiklikler yansır.
                </div>
            </div>
        </div>
    );
}
