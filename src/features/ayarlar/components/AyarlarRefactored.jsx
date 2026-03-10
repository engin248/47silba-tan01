'use client';
/**
 * features/ayarlar/components/AyarlarRefactored.jsx
 *
 * Tailwind-based Ayarlar UI — tüm logic useAyarlar() hookta.
 * ~200 satır (eski AyarlarMainContainer.js yerine)
 */
import { useState, useRef } from 'react';
import {
    Settings, Building2, Image, Bell, Save, AlertTriangle,
    CheckCircle2, Shield, DollarSign, Clock, Globe, Eye, EyeOff,
} from 'lucide-react';
import { useAyarlar, VARSAYILAN_AYARLAR } from '../hooks/useAyarlar';
import { logoYukle } from '../services/ayarlarApi';
import { useAuth } from '@/lib/auth';

// ─── Toggle bileşeni ─────────────────────────────────────────────
function Toggle({ aktif, onClick, etiket }) {
    return (
        <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{etiket}</span>
            <button onClick={onClick}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${aktif ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${aktif ? 'left-7' : 'left-1'}`} />
            </button>
        </label>
    );
}

// ─── Bölüm kartı ─────────────────────────────────────────────────
function Bolum({ icon: Icon, renk, baslik, aciklama, children }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`flex items-center gap-3 px-5 py-4 border-b border-slate-100 ${renk}`}>
                <Icon size={20} className="opacity-80" />
                <div>
                    <h3 className="font-black text-base">{baslik}</h3>
                    {aciklama && <p className="text-xs opacity-70 font-medium mt-0.5">{aciklama}</p>}
                </div>
            </div>
            <div className="p-5 space-y-4">{children}</div>
        </div>
    );
}

// ─── Ana bileşen ─────────────────────────────────────────────────
export default function AyarlarRefactored() {
    const { kullanici } = useAuth();
    const { yetkiliMi, ayarlar, setAlt, loading, mesaj, kaydet } = useAyarlar(kullanici);
    const [logoYukleniyor, setLogoYukleniyor] = useState(false);
    const [finansGizli, setFinansGizli] = useState(true);
    const logoRef = useRef();

    if (!yetkiliMi) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Shield size={48} className="text-red-400 mb-4" />
                <h2 className="text-xl font-black text-red-700 uppercase">Yetkisiz Giriş Engellendi</h2>
                <p className="text-slate-500 font-medium mt-2">Sistem Ayarları yalnızca yöneticilere açıktır.</p>
            </div>
        );
    }

    const handleLogoSec = async (e) => {
        const dosya = e.target.files?.[0];
        if (!dosya) return;
        setLogoYukleniyor(true);
        const { ok, url, mesaj: msg } = await logoYukle(dosya, ayarlar.firma_adi || 'firma');
        if (ok && url) setAlt('firma_logo_url', url);
        setLogoYukleniyor(false);
    };

    return (
        <div className="pb-20 max-w-4xl mx-auto">

            {/* BAŞLIK */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
                        <Settings size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Sistem Ayarları</h1>
                        <p className="text-xs text-slate-500 font-semibold">M17 — Yönetici Paneli</p>
                    </div>
                </div>
                <button onClick={() => setFinansGizli(!finansGizli)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">
                    {finansGizli ? <><Eye size={14} /> Sayıları Göster</> : <><EyeOff size={14} /> Gizle</>}
                </button>
            </div>

            {/* BİLDİRİM */}
            {mesaj.text && (
                <div className={`flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border-2 font-bold text-sm ${mesaj.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' : 'bg-emerald-50 border-emerald-400 text-emerald-800'}`}>
                    {mesaj.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                    {mesaj.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* FIRMA PROFİLİ */}
                <div className="md:col-span-2">
                    <Bolum icon={Building2} renk="bg-blue-50 text-blue-800" baslik="Firma Profili" aciklama="Logo, addres ve vergi bilgileri">
                        <div className="flex items-start gap-6">
                            {/* Logo */}
                            <div className="flex flex-col items-center gap-2 shrink-0">
                                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                                    {ayarlar.firma_logo_url
                                        ? <img src={ayarlar.firma_logo_url} alt="firma logo" className="w-full h-full object-contain p-1" />
                                        : <Image size={28} className="text-slate-300" />
                                    }
                                </div>
                                <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoSec} className="hidden" />
                                <button onClick={() => logoRef.current?.click()} disabled={logoYukleniyor}
                                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
                                    {logoYukleniyor ? 'Yükleniyor...' : '📁 Logo Seç'}
                                </button>
                                <p className="text-[10px] text-slate-400 text-center">PNG/JPG/SVG<br />Max 2MB</p>
                            </div>

                            {/* Firma bilgileri */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { label: 'Firma Adı', key: 'firma_adi', ph: '47 Nizam Tekstil' },
                                    { label: 'Vergi No', key: 'firma_vergi_no', ph: '1234567890' },
                                    { label: 'Telefon', key: 'firma_telefon', ph: '+90 555 000 00 00' },
                                    { label: 'E-posta', key: 'firma_eposta', ph: 'info@firma.com', type: 'email' },
                                ].map(({ label, key, ph, type = 'text' }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-black text-slate-500 uppercase mb-1">{label}</label>
                                        <input type={type} value={ayarlar[key] || ''} onChange={e => setAlt(key, e.target.value)}
                                            placeholder={ph}
                                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-colors" />
                                    </div>
                                ))}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">Adres</label>
                                    <textarea value={ayarlar.firma_adres || ''} onChange={e => setAlt('firma_adres', e.target.value)}
                                        placeholder="Firma tam adresi..." rows={2}
                                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-400 outline-none transition-colors resize-none" />
                                </div>
                            </div>
                        </div>
                    </Bolum>
                </div>

                {/* ÜCRETLENDİRME */}
                <Bolum icon={DollarSign} renk="bg-emerald-50 text-emerald-800" baslik="Ücretlendirme" aciklama="Maliyet ve prim hesaplama">
                    {[
                        { label: 'Dakika Başı Ücret (₺)', key: 'dakika_basi_ucret', min: 0, max: 500, step: 0.5 },
                        { label: 'Prim Oranı (%)', key: 'prim_orani', min: 0, max: 0.99, step: 0.01, carpan: 100, birim: '%' },
                        { label: 'Yıllık İzin Hakkı (Gün)', key: 'yillik_izin_hakki', min: 0, max: 90 },
                    ].map(({ label, key, min, max, step = 1, carpan = 1, birim = '' }) => (
                        <div key={key}>
                            <label className="flex justify-between text-xs font-bold text-slate-600 mb-1 uppercase">
                                {label}
                                <span className={`font-black ${finansGizli ? 'blur-sm' : ''} text-emerald-700`}>
                                    {finansGizli ? '***' : `${(parseFloat(ayarlar[key] || 0) * carpan).toFixed(carpan !== 1 ? 0 : 1)}${birim}`}
                                </span>
                            </label>
                            <input type="range" min={min} max={max} step={step}
                                value={ayarlar[key] || 0}
                                onChange={e => setAlt(key, parseFloat(e.target.value))}
                                className="w-full accent-emerald-600" />
                        </div>
                    ))}
                </Bolum>

                {/* SİSTEM AYARLARI */}
                <Bolum icon={Clock} renk="bg-amber-50 text-amber-800" baslik="Sistem" aciklama="Operasyonel kurallar">
                    <Toggle aktif={ayarlar.teknik_foy_zorunlu} onClick={() => setAlt('teknik_foy_zorunlu', !ayarlar.teknik_foy_zorunlu)} etiket="Teknik Föy Zorunlu" />
                    <Toggle aktif={ayarlar.siraladim_adim} onClick={() => setAlt('siraladim_adim', !ayarlar.siraladim_adim)} etiket="Sıralı Adım Takibi" />
                    <Toggle aktif={ayarlar.vidan_hesaplayici} onClick={() => setAlt('vidan_hesaplayici', !ayarlar.vidan_hesaplayici)} etiket="Vida/Maliyet Hesaplayıcı" />
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-1">Maks. Video Süresi (sn)</label>
                        <input type="number" min={30} max={600} value={ayarlar.max_video_sn || 300}
                            onChange={e => setAlt('max_video_sn', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-amber-400 outline-none" />
                    </div>
                </Bolum>

                {/* BİLDİRİMLER */}
                <Bolum icon={Bell} renk="bg-violet-50 text-violet-800" baslik="Bildirimler" aciklama="Telegram ve e-posta bildirimleri">
                    <Toggle aktif={ayarlar.bildirim_uretim} onClick={() => setAlt('bildirim_uretim', !ayarlar.bildirim_uretim)} etiket="Üretim Bildirimleri" />
                    <Toggle aktif={ayarlar.bildirim_stok} onClick={() => setAlt('bildirim_stok', !ayarlar.bildirim_stok)} etiket="Stok Alarmları" />
                    <Toggle aktif={ayarlar.bildirim_siparis} onClick={() => setAlt('bildirim_siparis', !ayarlar.bildirim_siparis)} etiket="Sipariş Bildirimleri" />
                    <Toggle aktif={ayarlar.bildirim_personel} onClick={() => setAlt('bildirim_personel', !ayarlar.bildirim_personel)} etiket="Personel Bildirimleri" />
                </Bolum>

                {/* DİL */}
                <Bolum icon={Globe} renk="bg-sky-50 text-sky-800" baslik="Dil Ayarı" aciklama="Arayüz dili">
                    <div className="grid grid-cols-2 gap-3">
                        {[{ val: 'tr', label: '🇹🇷 Türkçe' }, { val: 'ar', label: '🇸🇦 Arapça' }].map(({ val, label }) => (
                            <button key={val} onClick={() => setAlt('aktif_dil', val)}
                                className={`py-3 rounded-xl font-black text-sm border-2 transition-all ${ayarlar.aktif_dil === val ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </Bolum>
            </div>

            {/* KAYDET */}
            <div className="mt-6 flex justify-end">
                <button onClick={kaydet} disabled={loading}
                    className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-base shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <Save size={18} />
                    {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet (PIN Gerekli)'}
                </button>
            </div>
        </div>
    );
}
