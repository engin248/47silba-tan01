'use client';

// =========================================================================
// 47 ANTİGRAVİTY ERP - TASARIM STÜDYOSU (GÖRSEL SAYFA YAPICI)
// =========================================================================
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Settings, Save, RefreshCw, Smartphone, Monitor, Type, Palette, Layout, Lock } from 'lucide-react';
import { createGoster } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function TasarimMainContainer() {
    const { kullanici } = useAuth();
    const router = useRouter();
    const [yukleniyor, setYukleniyor] = useState(false);
    const [pinOnay, setPinOnay] = useState(false);

    const [hedefSayfa, setHedefSayfa] = useState('global_tema');

    // Tasarım Ayarları State
    const [ayarlar, setAyarlar] = useState({
        ana_renk: '#047857', // Emerald
        ikincil_renk: '#0f172a', // Slate
        arkaplan_renk: '#f8fafc',
        kutu_arka_plan: '#ffffff',
        yazi_tipi: 'Inter, sans-serif',
        kose_radius: '12px',
        golge_stili: 'yumusak',
    });

    // Sayfa yüklendiğinde VEYA hedef sayfa değiştiğinde mevcut tasarımı çek
    useEffect(() => {
        tasarimiGetir();
    }, [hedefSayfa]);

    useEffect(() => {
        // PIN Yetki Kontrolü
        const genelPin = !!sessionStorage.getItem('sb47_genel_pin');
        if (kullanici?.grup === 'tam' || genelPin) {
            setPinOnay(true);
        }
    }, [kullanici]);

    const tasarimiGetir = async () => {
        setYukleniyor(true);
        try {
            const { data, error } = await supabase
                .from('b0_tasarim_ayarlari')
                .select('*')
                .eq('ayar_anahtari', hedefSayfa)
                .single();

            if (data) {
                setAyarlar({
                    ana_renk: data.ana_renk || '#047857',
                    ikincil_renk: data.ikincil_renk || '#0f172a',
                    arkaplan_renk: data.arkaplan_renk || '#f8fafc',
                    kutu_arka_plan: data.kutu_arka_plan || '#ffffff',
                    yazi_tipi: data.yazi_tipi || 'Inter, sans-serif',
                    kose_radius: data.kose_radius || '12px',
                    golge_stili: data.golge_stili || 'yumusak',
                });
            } else {
                // Özel bir sayfa ilk kez tasarlanıyorsa varsayılan değerleri bas
                setAyarlar({
                    ana_renk: '#047857',
                    ikincil_renk: '#0f172a',
                    arkaplan_renk: '#f8fafc',
                    kutu_arka_plan: '#ffffff',
                    yazi_tipi: 'Inter, sans-serif',
                    kose_radius: '12px',
                    golge_stili: 'yumusak',
                });
            }
        } catch (error) {
            console.error('Tasarım henüz yüklenmedi veya tablo yok.');
        } finally {
            setYukleniyor(false);
        }
    };

    const tasarimiKaydet = async () => {
        const goster = createGoster();
        if (!pinOnay) return goster('Değişiklik için Yönetici Yetkisi (PIN) gerekli.', 'error');

        setYukleniyor(true);
        try {
            // "global_tema" yoksa INSERT, varsa UPDATE yapan Supabase fonskyionu (Upsert)
            const payload = {
                ayar_anahtari: hedefSayfa,
                ana_renk: ayarlar.ana_renk,
                ikincil_renk: ayarlar.ikincil_renk,
                arkaplan_renk: ayarlar.arkaplan_renk,
                kutu_arka_plan: ayarlar.kutu_arka_plan,
                yazi_tipi: ayarlar.yazi_tipi,
                kose_radius: ayarlar.kose_radius,
                golge_stili: ayarlar.golge_stili,
                guncelleyen: kullanici?.ad || 'Yönetici'
            };

            const { error } = await supabase
                .from('b0_tasarim_ayarlari')
                .upsert([payload], { onConflict: 'ayar_anahtari' });

            if (error) {
                // Tablo yoksa kullanıcıya bildir
                if (error.code === '42P01') {
                    throw new Error('Supabase üzerinde tasarım tablosu kurulmamış! Lütfen bildirimdeki SQL kodunu çalıştırın.');
                }
                throw error;
            }

            goster('🎉 Tasarım başarıyla kaydedildi! Sayfa yenileniyor...');
            // Gerçekten uygulamak için sayfayı yeniletebilir veya context'e atabiliriz
            setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
            goster(error.message, 'error');
        } finally {
            setYukleniyor(false);
        }
    };

    // Yetkisiz Ekranı
    if (!pinOnay) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border-2 border-red-100">
                    <Lock size={64} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-slate-800 mb-2">Tasarım Stüdyosu Kilitli</h1>
                    <p className="text-sm font-bold text-slate-500 mb-6">Sistemin görsel şablonlarını değiştirmek için Karargah üzerinden Yönetici (PIN) Yetkisini aktif etmelisiniz.</p>
                    <button onClick={() => router.push('/')} className="bg-slate-800 text-white font-bold py-3 px-6 rounded-xl w-full hover:bg-slate-700">
                        Karargah'a Dön
                    </button>
                </div>
            </div>
        );
    }

    // TASARIM STÜDYOSU ARAYÜZÜ
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 font-sans" style={{ fontFamily: ayarlar.yazi_tipi }}>

            {/* SOL PANEL (Ayarlar Menüsü) */}
            <div className="w-full md:w-80 bg-white border-r border-slate-200 shadow-lg flex flex-col h-screen overflow-y-auto sticky top-0">
                <div className="p-5 border-b border-slate-100 bg-slate-800 text-white">
                    <h1 className="text-xl font-black flex items-center gap-2">
                        <Palette size={24} className="text-fuchsia-400" /> Tasarım Stüdyosu
                    </h1>
                    <p className="text-xs font-bold text-slate-300 mt-1 opacity-80">Wix/Elementor Altyapısı (Test)</p>
                </div>

                <div className="p-5 flex flex-col gap-6 flex-1">
                    {/* HEDEF SAYFA SEÇİMİ */}
                    <div>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Monitor size={14} /> Tasarlanacak Sayfa</h2>
                        <select
                            value={hedefSayfa}
                            onChange={e => setHedefSayfa(e.target.value)}
                            className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700 outline-none focus:border-fuchsia-400 bg-slate-50"
                        >
                            <option value="global_tema">🌍 Tümü İçin (Global Tema)</option>
                            <option value="/karargah">Ana Karargah</option>
                            <option value="/musteriler">👤 Müşteriler</option>
                            <option value="/siparisler">🛒 Siparişler</option>
                            <option value="/imalat">🏭 İmalat</option>
                            <option value="/stok">📦 Stok</option>
                            <option value="/personel">👥 Personel</option>
                            <option value="/muhasebe">💰 Muhasebe</option>
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1 font-bold">Kendi tasarımı olmayan sayfalar Global Tema'yı kullanır.</p>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* RENKLER */}
                    <div>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Palette size={14} /> Ana Renkler</h2>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700">Vurgu Rengi</span>
                                <input type="color" value={ayarlar.ana_renk} onChange={e => setAyarlar({ ...ayarlar, ana_renk: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700">Başlık (İkincil) Renk</span>
                                <input type="color" value={ayarlar.ikincil_renk} onChange={e => setAyarlar({ ...ayarlar, ikincil_renk: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700">Sayfa Arkaplanı</span>
                                <input type="color" value={ayarlar.arkaplan_renk} onChange={e => setAyarlar({ ...ayarlar, arkaplan_renk: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700">Kart/Kutu Arkaplanı</span>
                                <input type="color" value={ayarlar.kutu_arka_plan} onChange={e => setAyarlar({ ...ayarlar, kutu_arka_plan: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                            </label>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* TİPOGRAFİ */}
                    <div>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Type size={14} /> Tipografi (Yazı Tipi)</h2>
                        <select
                            value={ayarlar.yazi_tipi}
                            onChange={e => setAyarlar({ ...ayarlar, yazi_tipi: e.target.value })}
                            className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700 outline-none focus:border-fuchsia-400"
                        >
                            <option value="Inter, sans-serif">Modern (Inter)</option>
                            <option value="Roboto, sans-serif">Klasik (Roboto)</option>
                            <option value="Outfit, sans-serif">Yuvarlak (Outfit)</option>
                            <option value="Tahoma, Arial, sans-serif">Arapça Uyumlu (Tahoma)</option>
                        </select>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* DÜZEN VE YAPISAL */}
                    <div>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Layout size={14} /> Çizgiler ve Gölgeler</h2>

                        <div className="mb-3">
                            <span className="text-sm font-bold text-slate-700 block mb-1">Köşe Keskenliği (Radius)</span>
                            <div className="flex gap-2">
                                {['0px', '8px', '16px', '24px'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setAyarlar({ ...ayarlar, kose_radius: r })}
                                        className={`flex-1 py-1.5 text-[10px] font-black rounded-md border-2 transition-all ${ayarlar.kose_radius === r ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-200 text-slate-500'}`}
                                    >
                                        {r === '0px' ? 'Dik' : r === '16px' ? 'Yuvarlak' : r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-bold text-slate-700 block mb-1">Derinlik (Gölge Etkisi)</span>
                            <div className="flex gap-2">
                                {['yok', 'sert', 'yumusak'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setAyarlar({ ...ayarlar, golge_stili: g })}
                                        className={`flex-1 py-1.5 text-[10px] uppercase font-black rounded-md border-2 transition-all ${ayarlar.golge_stili === g ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-200 text-slate-500'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto">
                    <button
                        onClick={tasarimiKaydet}
                        disabled={yukleniyor}
                        className="w-full bg-slate-900 border border-slate-700 text-white font-black py-3 rounded-xl hover:bg-black transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
                    >
                        {yukleniyor ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                        Canlıya Al (Yayınla)
                    </button>
                </div>
            </div>

            {/* SAĞ PANEL (CANLI ÖNİZLEME) */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto" style={{ backgroundColor: ayarlar.arkaplan_renk }}>

                <div className="max-w-4xl mx-auto">
                    {/* Üst Bar Simülasyonu */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <span className="bg-slate-800 text-white px-3 py-1 text-xs font-black rounded-full shadow-lg">CANLI ÖNİZLEME</span>
                            <span className="text-slate-400 text-sm font-bold"><Monitor size={16} className="inline mr-1" /> Masaüstü Görünümü</span>
                        </div>
                    </div>

                    {/* Test Arayüzü İçeriği */}
                    <div className="grid gap-6">

                        {/* Başlık Kartı */}
                        <div
                            className="p-6 transition-all duration-300"
                            style={{
                                backgroundColor: ayarlar.kutu_arka_plan,
                                borderRadius: ayarlar.kose_radius,
                                boxShadow: ayarlar.golge_stili === 'yumusak' ? '0 10px 40px -10px rgba(0,0,0,0.08)' : ayarlar.golge_stili === 'sert' ? '8px 8px 0 rgba(0,0,0,1)' : 'none',
                                border: ayarlar.golge_stili === 'sert' ? '2px solid #000' : '1px solid rgba(0,0,0,0.05)'
                            }}
                        >
                            <h2 style={{ color: ayarlar.ikincil_renk }} className="text-2xl font-black mb-2">Tasarım Simülatörü</h2>
                            <p className="text-slate-500 font-medium mb-4 text-sm">Bu kutunun rengi, köşeleri ve yazı tipi soldaki menüden seçtiğiniz değerlere göre anında güncellenir. Onayladığınızda tüm sisteme uygulanır.</p>

                            <button
                                className="px-6 py-2.5 text-white font-bold transition-all hover:opacity-90 active:scale-95"
                                style={{
                                    backgroundColor: ayarlar.ana_renk,
                                    borderRadius: ayarlar.kose_radius
                                }}
                            >
                                Test Butonu
                            </button>
                        </div>

                        {/* Dummy İstatistik Kartları */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className="p-5 flex flex-col justify-between transition-all"
                                    style={{
                                        backgroundColor: ayarlar.kutu_arka_plan,
                                        borderRadius: ayarlar.kose_radius,
                                        boxShadow: ayarlar.golge_stili === 'yumusak' ? '0 8px 24px -8px rgba(0,0,0,0.06)' : ayarlar.golge_stili === 'sert' ? '4px 4px 0 rgba(0,0,0,1)' : 'none',
                                        border: ayarlar.golge_stili === 'sert' ? '2px solid #000' : '1px solid rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <span className="text-xs font-black uppercase tracking-wider opacity-60" style={{ color: ayarlar.ikincil_renk }}>Bölüm {i}</span>
                                    <div className="text-3xl font-black mt-2 mb-1" style={{ color: ayarlar.ana_renk }}>
                                        {i === 1 ? '1.240' : i === 2 ? '%84' : '₺ 45K'}
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 mt-2 overflow-hidden" style={{ borderRadius: ayarlar.kose_radius }}>
                                        <div className="h-full" style={{ width: `${i * 30}%`, backgroundColor: ayarlar.ana_renk }}></div>
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

