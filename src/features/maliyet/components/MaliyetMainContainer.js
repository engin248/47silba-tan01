'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect, useCallback, useRef } from 'react';
import { DollarSign, Plus, Trash2, BarChart2, Edit2, X, TrendingUp, Package, Calculator, Upload, ChevronDown, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import Link from 'next/link';

const MALIYET_TIPLERI = ['personel_iscilik', 'hammadde_kumas', 'isletme_gideri', 'sarf_malzeme', 'fire_kaybi', 'sabit_gider', 'nakliye_lojistik'];
const MALIYET_RENK = { personel_iscilik: '#3b82f6', hammadde_kumas: '#8b5cf6', isletme_gideri: '#f59e0b', sarf_malzeme: '#10b981', fire_kaybi: '#ef4444', sabit_gider: '#06b6d4', nakliye_lojistik: '#f97316' };
const MALIYET_LABEL = { personel_iscilik: '👷 Personel İşçilik', hammadde_kumas: '🧵 Hammadde/Kumaş', isletme_gideri: '🏭 İşletme Gideri', sarf_malzeme: '📦 Sarf Malzeme', fire_kaybi: '🔥 Fire/Kayıp', sabit_gider: '🏠 Kira/Elektrik', nakliye_lojistik: '🚚 Nakliye/Lojistik' };
const BOSH_FORM = { order_id: '', maliyet_tipi: 'hammadde_kumas', kalem_aciklama: '', tutar_tl: '', miktar: '', birim: 'adet', birim_fiyat: '' };

const SEKMELER = [
    { id: 'giris', label: '📋 Maliyet Girişi', desc: 'Kalem ekle / düzenle' },
    { id: 'analiz', label: '📊 Sipariş Analizi', desc: 'Birim maliyet hesabı' },
    { id: 'trend', label: '📈 Dönemsel Trend', desc: 'Aylık maliyet grafiği' },
    { id: 'satis', label: '💰 Satış Fiyatı', desc: 'Kar marjı & öneri' },
];

export default function MaliyetMainContainer() {
    const { kullanici: rawKullanici } = useAuth();
    const kullanici = /** @type {any} */(rawKullanici);
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [sekme, setSekme] = useState('giris');
    const [maliyetler, setMaliyetler] = useState(/** @type {any[]} */([]));
    const [orderler, setOrderler] = useState(/** @type {any[]} */([]));
    const [form, setForm] = useState(/** @type {any} */(BOSH_FORM));
    const [formAcik, setFormAcik] = useState(false);
    const [duzenleId, setDuzenleId] = useState(/** @type {any} */(null));
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtreTip, setFiltreTip] = useState('hepsi');
    const [filtreOrder, setFiltreOrder] = useState('hepsi');
    const [karMarji, setKarMarji] = useState(30);
    const [menuAcik, setMenuAcik] = useState(false);
    const [csvModal, setCsvModal] = useState(false);
    const [csvText, setCsvText] = useState('');
    const [aramaMetni, setAramaMetni] = useState('');
    const [islemdeId, setIslemdeId] = useState(/** @type {any} */(null)); // ÇİFT TIKLAMA KORUMASI
    const [maliyetSayfa, setMaliyetSayfa] = useState(50); // K-09 PAGINATION
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (menuRef.current && !(/** @type {any} */(menuRef.current).contains(e.target))) setMenuAcik(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const goster = (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), 5000);
    };

    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            // GÜVENLİK ALGORİTMASI: 10sn timeout kalkanı
            const timeout = (ms) => new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı')), ms));
            const { data: m, error: mErr } = await Promise.race([
                supabase.from('b1_maliyet_kayitlari').select('*').order('created_at', { ascending: false }).limit(200),
                timeout(10000)
            ]);
            if (mErr) throw mErr;
            if (m) setMaliyetler(m);

            const { data: sifarisler, error: sifErr } = await Promise.race([
                supabase.from('production_orders')
                    .select('id, quantity, b1_model_taslaklari(model_kodu, model_adi)')
                    .order('created_at', { ascending: false }).limit(200),
                timeout(10000)
            ]);
            if (sifErr) throw sifErr;

            if (sifarisler && sifarisler.length > 0) {
                setOrderler(sifarisler.map(o => ({
                    id: o.id,
                    quantity: o.quantity || 1,
                    b1_model_taslaklari: o.b1_model_taslaklari || { model_kodu: 'KSM-ORD', model_adi: 'Bağlantısız Sipariş' }
                })));
            } else {
                setOrderler([]);
            }
        } catch (error) {
            goster('Yükleme hatası: ' + error.message, 'error');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const isYetkili = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(isYetkili);

        let kanal;
        const baslatKanal = () => {
            if (isYetkili && !document.hidden) {
                // PERFORMANS OPTİMİZASYONU: Realtime WebSocket Visibility
                kanal = supabase.channel('maliyet-gercek-zamanli-optimize')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_maliyet_kayitlari' }, yukle)
                    .subscribe();
            }
        };

        const durdurKanal = () => { if (kanal) { supabase.removeChannel(kanal); kanal = null; } };

        const handleVisibility = () => {
            if (document.hidden) { durdurKanal(); } else { baslatKanal(); yukle(); }
        };

        baslatKanal();
        yukle();

        document.addEventListener('visibilitychange', handleVisibility);
        return () => { durdurKanal(); document.removeEventListener('visibilitychange', handleVisibility); };
    }, [kullanici?.grup, kullanici?.id, yukle]);

    // telegramBildirim → @/lib/utils'den import ediliyor (yerel tanım kaldırıldı)

    const handleMiktarFiyatDegisim = (field, val) => {
        const yeniForm = { ...form, [field]: val };
        if (yeniForm.miktar && yeniForm.birim_fiyat) {
            yeniForm.tutar_tl = (parseFloat(yeniForm.miktar) * parseFloat(yeniForm.birim_fiyat)).toFixed(2);
        }
        setForm(yeniForm);
    };

    const kaydet = async () => {
        if (!form.order_id) return goster('Sipariş seçiniz!', 'error');
        if (!form.kalem_aciklama.trim() || form.kalem_aciklama.length > 250) return goster('Açıklama zorunlu (max 250 karakter)!', 'error');

        // VERİ DOĞRULAMA: Tutar ve Miktar/Birim Fiyat doğrulama kontrolü
        let gercekTutar = parseFloat(form.tutar_tl) || 0;
        if (form.miktar && form.birim_fiyat) {
            const gercekCarpim = parseFloat(form.miktar) * parseFloat(form.birim_fiyat);
            if (Math.abs(gercekTutar - gercekCarpim) > 0.01) {

                gercekTutar = parseFloat(gercekCarpim.toFixed(2));
            }
        }

        if (gercekTutar <= 0) return goster('Geçerli tutar giriniz!', 'error');

        // ÇEVRİMDIŞI ÇALIŞMA: Bağlantı koptuğunda veriyi kaydetme kalkanı
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_maliyet_kayitlari', duzenleId ? 'UPDATE' : 'INSERT', /** @type {any} */(form));
            return goster('⚡ Çevrimdışı: Kuyruğa alındı.');
        }
        setLoading(true);
        try {
            const payload = { order_id: form.order_id, maliyet_tipi: form.maliyet_tipi, kalem_aciklama: form.kalem_aciklama.trim(), tutar_tl: gercekTutar, onay_durumu: 'hesaplandi' };
            if (duzenleId) {
                const { error } = await supabase.from('b1_maliyet_kayitlari').update(payload).eq('id', duzenleId);
                if (!error) { goster('✅ Maliyet güncellendi!'); setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); yukle(); }
                else throw error;
            } else {
                const { error } = await supabase.from('b1_maliyet_kayitlari').insert([payload]);
                if (!error) {
                    goster('✅ Maliyet kaydedildi!');
                    telegramBildirim(`💸 YENİ MALİYET\nTutar: ₺${payload.tutar_tl}\nKategori: ${MALIYET_LABEL[payload.maliyet_tipi]}\nAçıklama: ${payload.kalem_aciklama}`);
                    setForm(BOSH_FORM); setFormAcik(false); yukle();
                } else throw error;
            }
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        setLoading(false);
    };

    const duzenle = (m) => {
        setForm({ order_id: m.order_id, maliyet_tipi: m.maliyet_tipi, kalem_aciklama: m.kalem_aciklama, tutar_tl: m.tutar_tl, miktar: '', birim: 'adet', birim_fiyat: '' });
        setDuzenleId(m.id); setFormAcik(true); setSekme('giris');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onayla = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        try {
            const { error } = await supabase.from('b1_maliyet_kayitlari').update({ onay_durumu: 'onaylandi' }).eq('id', id);
            if (error) throw error;
            yukle(); goster('Maliyet onaylandı');
        } catch (error) { goster('Onay hatası: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const sil = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            /** @type {any} */(kullanici)
        );
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Hatalı yetki!', 'error'); }
        if (!confirm('Bu maliyet kalemi silinsin mi?')) { setIslemdeId(null); return; }
        try {
            // SİSTEM LOGLARI: Silme işlemlerini B0 tablosuna kayıt
            await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_maliyet_kayitlari', islem_tipi: 'SILME', kullanici_adi: 'Saha Yetkilisi', eski_veri: { id } }]);
            const { error } = await supabase.from('b1_maliyet_kayitlari').delete().eq('id', id);
            if (error) throw error;
            yukle(); goster('Silindi');
            telegramBildirim('🗑️ MALİYET SİLİNDİ');
        } catch (error) { goster('Silme hatası: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const csvYukle = async () => {
        const satirlar = csvText.trim().split('\n').filter(s => s.trim());
        if (satirlar.length === 0) return goster('CSV boş!', 'error');
        setLoading(true);
        try {
            let basarili = 0, hatali = 0, oplar = [];
            for (const satir of satirlar) {
                const parts = satir.split(',').map(p => p.trim());
                if (parts.length < 4) { hatali++; continue; }
                const modelBul = orderler.find(o => o.b1_model_taslaklari?.model_kodu === parts[0]);
                if (!modelBul) { hatali++; continue; } // KORUMA: Bilinmeyen model numarasını ilk modele yığma, reddet!
                oplar.push({ order_id: modelBul.id, maliyet_tipi: MALIYET_TIPLERI.includes(parts[1]) ? parts[1] : 'isletme_gideri', kalem_aciklama: parts[2], tutar_tl: parseFloat(parts[3]) || 0, onay_durumu: 'hesaplandi' });
            }
            if (oplar.length > 0) {
                const { error } = await supabase.from('b1_maliyet_kayitlari').insert(oplar);
                if (!error) { basarili = oplar.length; telegramBildirim(`📊 TOPLU MALİYET: ${basarili} kalem eklendi.`); }
                else throw error;
            }
            goster(`✅ ${basarili} kayıt eklendi.${hatali > 0 ? ` ⚠ ${hatali} satır hatalı.` : ''}`);
        } catch (error) { goster('Yükleme hatası: ' + error.message, 'error'); }
        setCsvModal(false); setCsvText(''); setLoading(false); yukle();
    };

    const tumunuSil = async () => {
        if (islemdeId === 'tumunu_sil') return;
        setIslemdeId('tumunu_sil');
        const { yetkili: tYetkili, mesaj: tYetkiMesaj } = await silmeYetkiDogrula(
            /** @type {any} */(kullanici)
        );
        if (!tYetkili) { setIslemdeId(null); return goster(tYetkiMesaj || 'Hatalı yetki!', 'error'); }
        if (!confirm(`DİKKAT: ${maliyetler.length} kayıt silinecek!`)) { setIslemdeId(null); return; }
        if (!confirm('Son onay: Bu işlem geri alınamaz!')) { setIslemdeId(null); return; }
        try {
            const { error } = await supabase.from('b1_maliyet_kayitlari').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
            goster('Tüm kayıtlar silindi.');
            telegramBildirim('🚨 TÜM MALİYET KAYITLARI SİLİNDİ!');
            yukle();
        } catch (e) { goster('Silinemedi: ' + e.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const toplamlar = MALIYET_TIPLERI.reduce((acc, tip) => {
        acc[tip] = maliyetler.filter(m => m.maliyet_tipi === tip).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
        return acc;
    }, /** @type {any} */({}));
    const genelToplam = Object.values(toplamlar).reduce((s, v) => s + v, 0);
    const onaysiz = maliyetler.filter(m => m.onay_durumu === 'hesaplandi').length;

    const siparisFistiklari = orderler.map(o => {
        const sipMaliyetler = maliyetler.filter(m => m.order_id === o.id);
        const sipToplam = sipMaliyetler.reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
        const adet = parseInt(o.quantity) || 1;
        const birimMaliyet = adet > 0 ? sipToplam / adet : 0;
        const onerilenSatisFiyati = birimMaliyet * (1 + karMarji / 100);
        const brutKar = onerilenSatisFiyati - birimMaliyet;
        return { ...o, sipToplam, adet, birimMaliyet, onerilenSatisFiyati, brutKar, kalemSayisi: sipMaliyetler.length };
    }).filter(o => o.kalemSayisi > 0);

    const filtreli = maliyetler.filter(m => {
        const tipOk = filtreTip === 'hepsi' || m.maliyet_tipi === filtreTip;
        const orderOk = filtreOrder === 'hepsi' || m.order_id === filtreOrder;
        const aramaOk = !aramaMetni || m.kalem_aciklama?.toLowerCase().includes(aramaMetni.toLowerCase());
        return tipOk && orderOk && aramaOk;
    });

    const inp = /** @type {any} */ ({ width: '100%', padding: '9px 12px', border: '2px solid #1e4a43', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' });
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 5, textTransform: 'uppercase' };

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 border-2 border-rose-900/50 rounded-2xl m-8 shadow-2xl" dir={isAR ? 'rtl' : 'ltr'}>
                <Lock size={48} className="mx-auto mb-4 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
                <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p className="text-rose-300 font-bold mt-2">Maliyet Verileri gizlidir. Üretim PİN girişi zorunludur.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-[#0d1117] text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6" style={{ animation: 'fadeUp 0.4s ease-out' }} dir={isAR ? 'rtl' : 'ltr'}>
                {/* BAŞLIK */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                            <DollarSign size={24} className="text-emerald-50" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight m-0">{isAR ? 'مركز التكلفة' : 'M5 Maliyet Karargahı'}</h1>
                            <p className="text-xs font-bold text-emerald-200 mt-1 uppercase tracking-wider">{isAR ? 'تكلفة الوحدة · سعر البيع · تحليل الربح' : 'Birim maliyet · Satış fiyatı · Kar analizi'}</p>
                        </div>
                    </div>
                    {/* SPLIT BUTTON */}
                    <div ref={menuRef} className="relative flex shadow-[0_4px_14px_rgba(4,120,87,0.3)] hover:shadow-[0_4px_20px_rgba(4,120,87,0.5)] rounded-xl transition-all">
                        <button onClick={() => { setForm(BOSH_FORM); setDuzenleId(null); setFormAcik(!formAcik); setSekme('giris'); setMenuAcik(false); }}
                            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-l-xl font-black text-sm border-y border-l border-emerald-500/30">
                            <Plus size={18} /> MALİYET EKLE
                        </button>
                        <button onClick={() => setMenuAcik(!menuAcik)}
                            className="bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-r-xl border-y border-r border-emerald-500/30 border-l border-l-emerald-600">
                            <ChevronDown size={18} />
                        </button>
                        {menuAcik && (
                            <div className="absolute top-[110%] right-0 bg-[#122b27] border-2 border-[#1e4a43] rounded-xl shadow-2xl min-w-[220px] z-50 overflow-hidden">
                                <button onClick={() => { setForm(BOSH_FORM); setDuzenleId(null); setFormAcik(true); setSekme('giris'); setMenuAcik(false); }}
                                    className="flex items-center gap-3 w-full px-4 py-3 bg-[#122b27] hover:bg-[#0d1117] text-white text-white font-bold text-sm text-left transition-colors">
                                    <Plus size={16} className="text-cyan-500" /> Tek Maliyet Ekle
                                </button>
                                <button onClick={() => { setCsvModal(true); setMenuAcik(false); }}
                                    className="flex items-center gap-3 w-full px-4 py-3 bg-[#122b27] hover:bg-[#0d1117] text-white text-white font-bold text-sm text-left border-t border-slate-100 transition-colors">
                                    <Upload size={16} className="text-violet-500" /> Gider Toplu Yükle (CSV)
                                </button>
                                <Link href="/muhasebe" className="no-underline block border-t border-slate-100">
                                    <button className="flex items-center gap-3 w-full px-4 py-3 bg-[#122b27] hover:bg-[#0d1117] text-white text-emerald-600 font-bold text-sm text-left transition-colors">
                                        <BarChart2 size={16} className="text-emerald-500" /> Muhasebe (M8)
                                    </button>
                                </Link>
                                <button disabled={islemdeId === 'tumunu_sil'} onClick={() => { setMenuAcik(false); tumunuSil(); }}
                                    className={`flex items-center gap-3 w-full px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm text-left border-t border-rose-100 transition-colors ${islemdeId === 'tumunu_sil' ? 'opacity-50 cursor-wait' : ''}`}>
                                    <Trash2 size={16} className="text-rose-600" /> {islemdeId === 'tumunu_sil' ? 'Siliniyor...' : 'Tüm Kayıtları Sil'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ÖZET KARTLAR */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {[
                        { label: '💰 Genel Toplam', val: `₺${genelToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, color: 'white', bg: '#f8fafc', border: '#e2e8f0' },
                        { label: '🧵 Hammadde', val: `₺${toplamlar.hammadde_kumas.toFixed(2)}`, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                        { label: '👷 İşçilik', val: `₺${toplamlar.personel_iscilik.toFixed(2)}`, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                        { label: '🔥 Fire', val: `₺${toplamlar.fire_kaybi.toFixed(2)}`, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                        { label: '📦 Sipariş', val: `${siparisFistiklari.length} sipariş`, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
                        { label: '⏳ Onay Bk.', val: onaysiz, color: onaysiz > 0 ? '#d97706' : '#059669', bg: onaysiz > 0 ? '#fffbeb' : '#ecfdf5', border: onaysiz > 0 ? '#fed7aa' : '#a7f3d0' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 12, padding: '0.875rem 1rem' }}>
                            <div style={{ fontSize: '0.68rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: s.color }}>{s.val}</div>
                        </div>
                    ))}
                </div>

                {/* MESAJ */}
                {mesaj.text && (
                    <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>
                        {mesaj.text}
                    </div>
                )}

                {/* FORM */}
                {formAcik && (
                    <div style={{ background: '#122b27', border: `2px solid ${duzenleId ? '#f59e0b' : '#06b6d4'}`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: 800, color: duzenleId ? '#92400e' : '#0e7490', margin: 0, fontSize: '1rem' }}>
                                {duzenleId ? '✏️ Maliyet Düzenle' : '💰 Yeni Maliyet Kalemi'}
                            </h3>
                            <button onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                            <div>
                                <label style={lbl}>Sipariş / Parti *</label>
                                <select value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: '#122b27' }}>
                                    <option value="">— Sipariş Seçiniz —</option>
                                    {orderler.map(o => <option key={o.id} value={o.id}>{o.b1_model_taslaklari?.model_kodu || 'Sipariş'} | {o.quantity} adet</option>)}
                                    {orderler.length === 0 && <option disabled>⚠ Sipariş bulunamadı</option>}
                                </select>
                            </div>
                            <div>
                                <label style={lbl}>Maliyet Tipi *</label>
                                <select value={form.maliyet_tipi} onChange={e => setForm({ ...form, maliyet_tipi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: '#122b27' }}>
                                    {MALIYET_TIPLERI.map(t => <option key={t} value={t}>{MALIYET_LABEL[t]}</option>)}
                                </select>
                            </div>
                            <div style={{ gridColumn: '1/-1' }}>
                                <label style={lbl}>Kalem Açıklaması *</label>
                                <input value={form.kalem_aciklama} onChange={e => setForm({ ...form, kalem_aciklama: e.target.value })} placeholder="Örn: Gömleklik poplin kumaş — 45m × 85 TL/m" style={inp} />
                            </div>
                            <div>
                                <label style={lbl}>Miktar (isteğe bağlı)</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <input type="number" step="0.01" min="0" value={form.miktar} onChange={e => handleMiktarFiyatDegisim('miktar', e.target.value)} placeholder="45" style={{ ...inp, width: '60%' }} />
                                    <select value={form.birim} onChange={e => setForm({ ...form, birim: e.target.value })} style={{ ...inp, width: '40%', cursor: 'pointer', background: '#122b27' }}>
                                        {['adet', 'metre', 'kg', 'saat', 'gün', 'paket'].map(b => <option key={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={lbl}>Birim Fiyat (TL)</label>
                                <input type="number" step="0.01" min="0" value={form.birim_fiyat} onChange={e => handleMiktarFiyatDegisim('birim_fiyat', e.target.value)} placeholder="85.00" style={inp} />
                            </div>
                            <div style={{ gridColumn: '1/-1' }}>
                                <label style={lbl}>Toplam Tutar (TL) *{form.miktar && form.birim_fiyat && <span style={{ color: '#06b6d4', marginLeft: 8 }}>⚡ Otomatik</span>}</label>
                                <input type="number" step="0.01" min="0.01" value={form.tutar_tl} onChange={e => setForm({ ...form, tutar_tl: e.target.value })} placeholder="3825.00" style={{ ...inp, fontWeight: 800, fontSize: '1rem' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setForm(BOSH_FORM); setFormAcik(false); setDuzenleId(null); }} style={{ padding: '9px 18px', border: '2px solid #1e4a43', borderRadius: 8, background: '#122b27', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                            <button onClick={kaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : duzenleId ? '#d97706' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                                {loading ? '...' : duzenleId ? 'Güncelle' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                )}

                {/* SEKMELER */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                    {SEKMELER.map(s => (
                        <button key={s.id} onClick={() => setSekme(s.id)}
                            style={{ padding: '8px 18px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', background: sekme === s.id ? '#047857' : 'transparent', color: sekme === s.id ? 'white' : '#64748b' }}>
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* SEKME 1: MALİYET GİRİŞİ */}
                {sekme === 'giris' && (
                    <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <select value={filtreTip} onChange={e => setFiltreTip(e.target.value)} style={{ padding: '7px 14px', border: '2px solid #1e4a43', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                                <option value="hepsi">Tüm Tipler</option>
                                {MALIYET_TIPLERI.map(t => <option key={t} value={t}>{MALIYET_LABEL[t]}</option>)}
                            </select>
                            <select value={filtreOrder} onChange={e => setFiltreOrder(e.target.value)} style={{ padding: '7px 14px', border: '2px solid #1e4a43', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                                <option value="hepsi">Tüm Siparişler</option>
                                {orderler.map(o => <option key={o.id} value={o.id}>{o.b1_model_taslaklari?.model_kodu || o.id.slice(0, 8)}</option>)}
                            </select>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}>🔍</span>
                                <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                                    placeholder="Açıklama ara..."
                                    style={{ padding: '7px 10px 7px 30px', border: '2px solid #1e4a43', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem', outline: 'none', width: 160 }} />
                            </div>
                            <div style={{ marginLeft: 'auto', fontSize: '0.82rem', fontWeight: 700, color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <BarChart2 size={14} /> {filtreli.length} kayıt | <strong style={{ color: 'white' }}>₺{filtreli.reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0).toFixed(2)}</strong>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filtreli.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', background: '#0b1d1a', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                                    <DollarSign size={40} style={{ color: '#e5e7eb', marginBottom: '0.5rem' }} />
                                    <p style={{ color: '#94a3b8', fontWeight: 700 }}>Maliyet kaydı yok.</p>
                                    <p style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Sağ üstteki "Maliyet Ekle" butonuna tıklayın.</p>
                                </div>
                            )}
                            {filtreli.slice(0, maliyetSayfa).map(m => {
                                const onaylandi = m.onay_durumu === 'onaylandi';
                                const siparis = orderler.find(o => o.id === m.order_id);
                                return (
                                    <div key={m.id} style={{ background: '#122b27', border: `1.5px solid ${onaylandi ? '#d1fae5' : '#f1f5f9'}`, borderRadius: 10, padding: '0.875rem 1rem', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ width: 8, height: 44, borderRadius: 4, background: MALIYET_RENK[m.maliyet_tipi] || '#94a3b8' }} />
                                        <div>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: MALIYET_RENK[m.maliyet_tipi], textTransform: 'uppercase', background: MALIYET_RENK[m.maliyet_tipi] + '15', padding: '2px 7px', borderRadius: 4 }}>{MALIYET_LABEL[m.maliyet_tipi]}</span>
                                                {siparis && <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{siparis.b1_model_taslaklari?.model_kodu}</span>}
                                            </div>
                                            <div style={{ fontWeight: 700, color: 'white', fontSize: '0.88rem' }}>{m.kalem_aciklama}</div>
                                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>{onaylandi ? '✅ Onaylandı' : '⏳ Onay Bekliyor'} · {new Date(m.created_at).toLocaleDateString('tr-TR')}</div>
                                        </div>
                                        <div style={{ fontWeight: 900, color: 'white', fontSize: '1.1rem', textAlign: 'right' }}>₺{parseFloat(m.tutar_tl).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                                        <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                                            <button onClick={() => duzenle(m)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '4px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}><Edit2 size={11} /> Düzenle</button>
                                            {!onaylandi && <button disabled={islemdeId === m.id} onClick={() => onayla(m.id)} style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '4px 10px', borderRadius: 6, fontWeight: 700, cursor: islemdeId === m.id ? 'wait' : 'pointer', fontSize: '0.72rem', opacity: islemdeId === m.id ? 0.5 : 1 }}>✅ {islemdeId === m.id ? '...' : 'Onayla'}</button>}
                                            <button disabled={islemdeId === m.id} onClick={() => sil(m.id)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 10px', borderRadius: 6, cursor: islemdeId === m.id ? 'wait' : 'pointer', fontSize: '0.72rem', opacity: islemdeId === m.id ? 0.5 : 1 }}><Trash2 size={11} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* K-09 PAGINATION: Daha Fazla Göster */}
                        {filtreli.length > maliyetSayfa && (
                            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <button
                                    onClick={() => setMaliyetSayfa(p => p + 50)}
                                    style={{ padding: '9px 24px', background: 'linear-gradient(135deg,#047857,#065f46)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(4,120,87,0.3)' }}
                                >
                                    ⬇ Daha Fazla Göster ({filtreli.length - maliyetSayfa} kaldı)
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* SEKME 2: SİPARİŞ ANALİZİ */}
                {sekme === 'analiz' && (
                    <div>
                        <div style={{ background: '#f0f9ff', border: '2px solid #bae6fd', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#0369a1', fontWeight: 600 }}>
                            <Calculator size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            <strong>Birim Maliyet = Toplam Maliyet ÷ Üretim Adedi.</strong> Satış fiyatı için önce bu hesabı tamamlayın.
                        </div>
                        {siparisFistiklari.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', background: '#0b1d1a', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                                <Package size={40} style={{ color: '#e5e7eb', display: 'block', margin: '0 auto 0.5rem' }} />
                                <p style={{ color: '#94a3b8', fontWeight: 700 }}>Henüz maliyet girilmiş sipariş yok.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                {siparisFistiklari.map(o => (
                                    <div key={o.id} style={{ background: '#122b27', border: '2px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                                        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>{o.b1_model_taslaklari?.model_kodu} — {o.b1_model_taslaklari?.model_adi}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{o.adet} adet · {o.kalemSayisi} maliyet kalemi</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>BİRİM MALİYET</div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#06b6d4' }}>₺{o.birimMaliyet.toFixed(2)}</div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '1rem 1.25rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '0.5rem', marginBottom: '0.875rem' }}>
                                                {MALIYET_TIPLERI.map(tip => {
                                                    const tutarBu = maliyetler.filter(m => m.order_id === o.id && m.maliyet_tipi === tip).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
                                                    if (tutarBu === 0) return null;
                                                    const pct = o.sipToplam > 0 ? (tutarBu / o.sipToplam * 100).toFixed(1) : 0;
                                                    return (
                                                        <div key={tip} style={{ background: MALIYET_RENK[tip] + '12', border: `1px solid ${MALIYET_RENK[tip]}30`, borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                                                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: MALIYET_RENK[tip] }}>{MALIYET_LABEL[tip]}</div>
                                                            <div style={{ fontWeight: 800, color: 'white', fontSize: '0.88rem' }}>₺{tutarBu.toFixed(2)}</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>%{pct}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid #f1f5f9', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <div><span style={{ fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 700 }}>TOPLAM MALİYET</span><br /><strong style={{ color: 'white' }}>₺{o.sipToplam.toFixed(2)}</strong></div>
                                                <div><span style={{ fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 700 }}>ÜRETİM ADEDİ</span><br /><strong style={{ color: 'white' }}>{o.adet} adet</strong></div>
                                                <div><span style={{ fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 700 }}>BİRİM MALİYET</span><br /><strong style={{ color: '#06b6d4', fontSize: '1.1rem' }}>₺{o.birimMaliyet.toFixed(2)}</strong></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* [ML-05] SEKME 3: DÖNEMSEL MALİYET TRENDİ */}
                {sekme === 'trend' && (
                    <div>
                        <div style={{ background: '#122b27', border: '2px solid #1e4a43', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a7f3d0', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                📈 [ML-05] Dönemsel Maliyet Trendi — Son 12 Ay
                            </div>
                            {(() => {
                                // Client-side aylık gruplama — maliyetler state'inden
                                const aylikMap = {};
                                maliyetler.forEach(k => {
                                    const t = new Date(k.created_at);
                                    const ayKey = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
                                    if (!aylikMap[ayKey]) aylikMap[ayKey] = { ay: ayKey, toplam: 0 };
                                    aylikMap[ayKey].toplam += parseFloat(k.tutar_tl || 0);
                                });
                                const aylar = Object.values(aylikMap).sort((a, b) => a.ay.localeCompare(b.ay)).slice(-12);
                                if (aylar.length === 0) return (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontWeight: 700 }}>Henüz maliyet verisi yok.</div>
                                );
                                const maxToplam = Math.max(...aylar.map(a => a.toplam));
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {aylar.map((a, i) => {
                                            const pct = maxToplam > 0 ? (a.toplam / maxToplam * 100) : 0;
                                            const [yil, ay] = a.ay.split('-');
                                            const ayAd = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][parseInt(ay)];
                                            return (
                                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a7f3d0', textAlign: 'right' }}>{ayAd} {yil}</div>
                                                    <div style={{ height: 22, background: '#0b1d1a', borderRadius: 4, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${pct}%`, background: pct > 75 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981', borderRadius: 4, transition: 'width 0.5s' }} />
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white', textAlign: 'right' }}>₺{a.toplam.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}


                {sekme === 'satis' && (
                    <div>
                        <div style={{ background: '#122b27', border: '2px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.875rem' }}>
                                <TrendingUp size={20} color="#10b981" />
                                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'white' }}>Hedef Kar Marjı</h3>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <input type="range" min="5" max="99" step="1" value={karMarji} onChange={e => setKarMarji(parseInt(e.target.value))} style={{ flex: 1, accentColor: karMarji >= 50 ? '#10b981' : karMarji >= 25 ? '#f59e0b' : '#ef4444' }} />
                                <div style={{ position: 'relative', width: 80 }}>
                                    <input type="number" min="5" max="99" value={karMarji} onChange={e => setKarMarji(Math.min(99, Math.max(5, parseInt(e.target.value) || 5)))} style={{ ...inp, paddingRight: '1.8rem', textAlign: 'center', fontWeight: 900, color: '#10b981' }} />
                                    <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94a3b8' }}>%</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {[15, 20, 25, 30, 40, 50].map(v => (
                                    <button key={v} onClick={() => setKarMarji(v)} style={{ padding: '3px 10px', border: '1px solid', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, borderColor: karMarji === v ? '#10b981' : '#e5e7eb', background: karMarji === v ? '#10b981' : 'white', color: karMarji === v ? 'white' : '#64748b' }}>%{v}</button>
                                ))}
                            </div>
                        </div>
                        {siparisFistiklari.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', background: '#0b1d1a', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                                <p style={{ color: '#94a3b8', fontWeight: 700 }}>Önce maliyet kalemi giriniz.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {siparisFistiklari.map(o => {
                                    const satisFiyati = o.birimMaliyet * (1 + karMarji / 100);
                                    const brutKar = satisFiyati - o.birimMaliyet;
                                    const toplamKar = brutKar * o.adet;
                                    return (
                                        <div key={o.id} style={{ background: '#122b27', border: '2px solid #d1fae5', borderRadius: 14, padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>{o.b1_model_taslaklari?.model_kodu} — {o.b1_model_taslaklari?.model_adi}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#a7f3d0' }}>{o.adet} adet · Birim Maliyet: ₺{o.birimMaliyet.toFixed(2)}</div>
                                                </div>
                                                <div style={{ background: '#ecfdf5', border: '2px solid #10b981', borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.62rem', color: '#059669', fontWeight: 700 }}>ÖNERİLEN SATIŞ</div>
                                                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#065f46' }}>₺{satisFiyati.toFixed(2)}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                                                {[
                                                    { label: 'Birim Maliyet', val: `₺${o.birimMaliyet.toFixed(2)}`, color: 'white', bg: '#f8fafc' },
                                                    { label: `Kar (%${karMarji})`, val: `₺${brutKar.toFixed(2)}`, color: '#059669', bg: '#ecfdf5' },
                                                    { label: 'Satış Fiyatı', val: `₺${satisFiyati.toFixed(2)}`, color: '#0284c7', bg: '#f0f9ff' },
                                                    { label: `Toplam Kar (${o.adet} ad.)`, val: `₺${toplamKar.toFixed(2)}`, color: '#7c3aed', bg: '#f5f3ff' },
                                                ].map((k, i) => (
                                                    <div key={i} style={{ background: k.bg, borderRadius: 8, padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                                                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>{k.label}</div>
                                                        <div style={{ fontWeight: 900, color: k.color, fontSize: '0.95rem' }}>{k.val}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* CSV MODAL */}
                {csvModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <div style={{ background: '#122b27', borderRadius: 18, padding: '1.75rem', width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontWeight: 900, color: 'white', margin: 0, fontSize: '1rem' }}>
                                    <Upload size={18} style={{ verticalAlign: 'middle', marginRight: 8, color: '#8b5cf6' }} />Gider Toplu Yükleme (CSV)
                                </h3>
                                <button onClick={() => { setCsvModal(false); setCsvText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                            </div>
                            <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 10, padding: '0.875rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#5b21b6', fontWeight: 600 }}>
                                <strong>Format:</strong> MODEL_KODU, maliyet_tipi, açıklama, tutar<br />
                                <code style={{ fontSize: '0.7rem' }}>personel_iscilik · hammadde_kumas · isletme_gideri · sarf_malzeme · fire_kaybi · sabit_gider · nakliye_lojistik</code>
                            </div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6, textTransform: 'uppercase' }}>CSV Verisi</label>
                            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder={'MDL-001, hammadde_kumas, Kumas alimi, 4500\nMDL-001, personel_iscilik, Usta Ali, 850'} rows={8} style={{ width: '100%', padding: '10px 12px', border: '2px solid #1e4a43', borderRadius: 10, fontSize: '0.82rem', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button onClick={() => { setCsvModal(false); setCsvText(''); }} style={{ padding: '9px 18px', border: '2px solid #1e4a43', borderRadius: 8, background: '#122b27', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                                <button onClick={csvYukle} disabled={loading || !csvText.trim()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 22px', background: csvText.trim() ? '#8b5cf6' : '#94a3b8', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                                    <Upload size={16} /> Yükle
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
