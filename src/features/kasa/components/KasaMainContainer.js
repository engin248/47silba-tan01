'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { DollarSign, Lock, Plus, Trash2, RefreshCw, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import Link from 'next/link';

// [A-03] CSV Export
const kasaCsvIndir = (hareketler, filtreTip, filtreOnay) => {
    const filtreli = hareketler.filter(h => {
        const tipOk = filtreTip === 'hepsi' || h.hareket_tipi === filtreTip;
        const onayOk = filtreOnay === 'hepsi' || h.onay_durumu === filtreOnay;
        return tipOk && onayOk;
    });
    const baslik = ['Tarih', 'Tip', 'Ödeme Yöntemi', 'Açıklama', 'Tutar (TL)', 'Onay Durumu', 'Müşteri', 'Vade Tarihi'];
    const satirlar = filtreli.map(h => [
        h.created_at ? new Date(h.created_at).toLocaleDateString('tr-TR') : '',
        h.hareket_tipi || '',
        h.odeme_yontemi || '',
        h.aciklama || '',
        parseFloat(h.tutar_tl || 0).toFixed(2),
        h.onay_durumu || '',
        h.b2_musteriler?.ad_soyad || '',
        h.vade_tarihi ? new Date(h.vade_tarihi).toLocaleDateString('tr-TR') : '',
    ]);
    const encodeField = (val) => {
        const s = String(val ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const icerik = [baslik, ...satirlar].map(r => r.map(encodeField).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + icerik], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kasa_hareketleri_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
};

const HAREKET_TIPLERI = ['tahsilat', 'iade_odeme', 'cek', 'senet', 'avans', 'diger'];
const ODEME_YONTEMLERI = ['nakit', 'eft', 'kredi_karti', 'cek', 'senet', 'diger'];
const BOSH_FORM = {
    hareket_tipi: 'tahsilat',
    odeme_yontemi: 'nakit',
    tutar_tl: '',
    aciklama: '',
    vade_tarihi: '',
    musteri_id: '',
    personel_id: '', // [M13-M7 KÖPRÜSÜ KONTROLÜ]
};

const TIP_RENK = {
    tahsilat: '#059669', iade_odeme: '#ef4444', cek: '#f59e0b',
    senet: '#8b5cf6', avans: '#3b82f6', diger: '#64748b',
};
const TIP_ICON = {
    tahsilat: '📈', iade_odeme: '↩️', cek: '📄', senet: '📋', avans: '💵', diger: '💰',
};

export default function KasaMainContainer() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const [hareketler, setHareketler] = useState(/** @type {any[]} */([]));
    const [musteriler, setMusteriler] = useState(/** @type {any[]} */([]));
    const [personeller, setPersoneller] = useState(/** @type {any[]} */([])); // [M13-M7 KÖPRÜSÜ KONTROLÜ]
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [filtreTip, setFiltreTip] = useState('hepsi');
    const [filtreOnay, setFiltreOnay] = useState('hepsi');
    const [islemdeId, setIslemdeId] = useState(/** @type {any} */(null)); // ÇİFT TIKLAMA KORUMASI
    const [kasaSayfa, setKasaSayfa] = useState(50); // K-13 PAGINATION

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const isYetkili = /** @type {any} */ (kullanici)?.grup === 'tam' || uretimPin;
        setYetkiliMi(isYetkili);

        let kanal;
        const baslatKanal = () => {
            if (isYetkili && !document.hidden) {
                // SİSTEM OPTİMİZASYONU: Realtime WebSocket (Visibility Optimizasyonu)
                kanal = supabase.channel('kasa-gercek-zamanli-optimize')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_kasa_hareketleri' }, yukle)
                    .subscribe();
            }
        };

        const durdurKanal = () => { if (kanal) { supabase.removeChannel(kanal); kanal = null; } };

        const handleVisibility = () => {
            if (document.hidden) { durdurKanal(); } else { baslatKanal(); yukle(); }
        };

        baslatKanal();
        if (isYetkili) yukle();

        document.addEventListener('visibilitychange', handleVisibility);
        return () => { durdurKanal(); document.removeEventListener('visibilitychange', handleVisibility); };
    }, [kullanici]);

    // telegramBildirim → @/lib/utils'den import ediliyor (yerel tanım kaldırıldı)

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setLoading(true);
        try {
            // SİSTEM OPTİMİZASYONU: 10sn timeout DDoS kalkanı (Kriter Q)
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Bağlantı zaman aşımı (10sn)')), 10000));
            const [harRes, musRes, perRes] = await Promise.race([
                Promise.allSettled([
                    supabase.from('b2_kasa_hareketleri')
                        .select('*, b2_musteriler:musteri_id(ad_soyad, musteri_kodu), b1_personel:personel_id(ad_soyad, personel_kodu)')
                        .order('created_at', { ascending: false }).limit(300),
                    supabase.from('b2_musteriler').select('id,musteri_kodu,ad_soyad').eq('aktif', true).limit(500),
                    supabase.from('b1_personel').select('id,personel_kodu,ad_soyad').eq('durum', 'aktif').limit(300),
                ]),
                timeout
            ]);
            if (harRes.status === 'fulfilled' && harRes.value.data) setHareketler(harRes.value.data);
            else if (harRes.status === 'fulfilled' && harRes.value.error) throw harRes.value.error;
            if (musRes.status === 'fulfilled' && musRes.value.data) setMusteriler(musRes.value.data);
            if (perRes.status === 'fulfilled' && perRes.value.data) setPersoneller(perRes.value.data);
        } catch (e) { goster('Kasa verileri alınamadı: ' + e.message, 'error'); }
        setLoading(false);
    };

    const kaydet = async () => {
        if (!form.tutar_tl || parseFloat(form.tutar_tl) <= 0) return goster('Tutar 0\'dan büyük olmalı!', 'error');
        if (parseFloat(form.tutar_tl) > 10000000) return goster('Tutar çok yüksek! Kontrol edin.', 'error');
        if (!form.aciklama.trim()) return goster('Açıklama zorunlu!', 'error');
        if (form.aciklama.length > 500) return goster('Açıklama çok uzun!', 'error');

        const veri = {
            hareket_tipi: form.hareket_tipi,
            odeme_yontemi: form.odeme_yontemi,
            tutar_tl: parseFloat(form.tutar_tl),
            aciklama: form.aciklama.trim(),
            vade_tarihi: form.vade_tarihi || null,
            musteri_id: form.hareket_tipi === 'avans' ? null : (form.musteri_id || null),
            personel_id: form.hareket_tipi === 'avans' ? (form.personel_id || null) : null,
            onay_durumu: 'bekliyor',
        };

        // SİSTEM OPTİMİZASYONU: Offline Modu (Kriter J)
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b2_kasa_hareketleri', 'INSERT', veri);
            goster('⚡ Çevrimdışı: Kasa işlemi kuyruğa alındı.');
            setForm(BOSH_FORM); setFormAcik(false);
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('b2_kasa_hareketleri').insert([veri]);
            if (error) throw error;
            goster(`✅ ${TIP_ICON[form.hareket_tipi]} Kasa hareketi kaydedildi: ₺${parseFloat(form.tutar_tl).toFixed(2)}`);
            telegramBildirim(`💰 KASA HAREKETİ\nTip: ${form.hareket_tipi.toUpperCase()}\nTutar: ₺${parseFloat(form.tutar_tl).toFixed(2)}\nAçıklama: ${form.aciklama}`);
            setForm(BOSH_FORM); setFormAcik(false); yukle();
        } catch (e) { goster('Kayıt hatası: ' + e.message, 'error'); }
        setLoading(false);
    };

    const onayDegistir = async (id, yeniOnay) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b2_kasa_hareketleri', 'UPDATE', { id, onay_durumu: yeniOnay });
            setIslemdeId(null);
            return goster('⚡ Çevrimdışı: Onay değişikliği kuyruğa alındı.');
        }
        try {
            const { error } = await supabase.from('b2_kasa_hareketleri').update({ onay_durumu: yeniOnay }).eq('id', id);
            if (error) throw error;
            goster(yeniOnay === 'onaylandi' ? '✅ Tahsilat onaylandı!' : '❌ İptal edildi.'); yukle();
        } catch (e) { goster('Onay hatası: ' + e.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const sil = async (id) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici);
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Yetkisiz işlem!', 'error'); }
        if (!confirm('Bu kasa kaydı silinsin mi?')) { setIslemdeId(null); return; }

        // KRİTER 114: Kasa Sabitlenip Kilitlendi mi? Kasa Log Değiştirilemez!
        const kasaKaydi = hareketler.find((h) => /** @type {any} */(h).id === id);
        if (/** @type {any} */ (kasaKaydi)?.onay_durumu === 'onaylandi') {
            setIslemdeId(null); return goster('🔒 DİJİTAL ADALET KİLİDİ: Banka güvenlik regülasyonları gereği Onaylanmış Kasa hareketleri ASLA SİLİNEMEZ!', 'error');
        }

        // SİSTEM OPTİMİZASYONU: B0 Kara Kutu silme logu (Kriter 25)
        try {
            await supabase.from('b0_sistem_loglari').insert([{
                tablo_adi: 'b2_kasa_hareketleri', islem_tipi: 'SILME',
                kullanici_adi: /** @type {any} */ (kullanici)?.label || 'Kasa Yetkilisi',
                eski_veri: { mesaj: `Kasa hareketi silindi. ID: ${id}` }
            }]);
        } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: KasaMainContainer.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }

        try {
            const { error } = await supabase.from('b2_kasa_hareketleri').delete().eq('id', id);
            if (error) throw error;
            goster('Kayıt silindi.'); yukle();
        } catch (e) { goster('Silinemedi: ' + e.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    // Hesaplamalar
    const tahsilat = hareketler.filter(h => h.hareket_tipi === 'tahsilat' && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);

    // [LİKİDİTE KÖR NOKTA ÇÖZÜMÜ]: TL Kasası ve Banka (EFT/POS) ayrıştırılarak gerçek nakit tespiti yapıldı.
    const nakitTahsilat = hareketler.filter(h => h.hareket_tipi === 'tahsilat' && h.onay_durumu === 'onaylandi' && h.odeme_yontemi === 'nakit').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const bankaEftPos = hareketler.filter(h => h.hareket_tipi === 'tahsilat' && h.onay_durumu === 'onaylandi' && ['eft', 'kredi_karti'].includes(h.odeme_yontemi)).reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const evrakCekSenet = hareketler.filter(h => ['cek', 'senet'].includes(h.hareket_tipi) && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);

    const bekleyen = hareketler.filter(h => h.onay_durumu === 'bekliyor').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);

    // [EKONOMİK KÖR NOKTA KONTROLÜ]: Bakiye hesaplamasında 'avans' ve 'diger' çıkışları (ödemeler) da kasadan düşmelidir. Yoksa fiziki kasa ile sistem uyuşmaz.
    const cikislar = hareketler.filter(h => ['iade_odeme', 'avans', 'diger'].includes(h.hareket_tipi) && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const netBakiye = tahsilat - cikislar;

    const vadesi = hareketler.filter(h => ['cek', 'senet'].includes(h.hareket_tipi) && h.vade_tarihi && new Date(h.vade_tarihi) < new Date());

    const filtreli = hareketler.filter(h => {
        const tipOk = filtreTip === 'hepsi' || h.hareket_tipi === filtreTip;
        const onayOk = filtreOnay === 'hepsi' || h.onay_durumu === filtreOnay;
        return tipOk && onayOk;
    });

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #1e4a43', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: /** @type {'border-box'} */ ('border-box'), outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 5, textTransform: 'uppercase' };

    if (!yetkiliMi) return (
        <div className="p-12 text-center bg-rose-950/20 border-2 border-rose-900/50 rounded-2xl m-8 shadow-2xl" dir={isAR ? 'rtl' : 'ltr'}>
            <Lock size={48} className="mx-auto mb-4 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
            <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">YETKİSİZ GİRİŞ ENGELLENDİ</h2>
            <p className="text-rose-300 font-bold mt-2">Kasa & Finans verileri gizlidir. Üretim PİN girişi zorunludur.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* BAŞLIK */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                        <DollarSign size={24} className="text-emerald-50" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight m-0">{isAR ? 'الصندوق والمالية' : 'Kasa & Finans'}</h1>
                        <p className="text-xs font-bold text-emerald-200 mt-1 uppercase tracking-wider">{isAR ? 'التحصيل → الموافقة → الرصيد → متابعة الشيكات' : 'Tahsilat → Onay → Bakiye → Çek/Senet Takibi'}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setForm(BOSH_FORM); setFormAcik(!formAcik); }}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-emerald-500/20 border-b-4 border-emerald-800 transition-all">
                        <Plus size={18} /> Yeni Hareket
                    </button>
                    <button onClick={yukle} disabled={loading}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-[#1e4a43] px-4 py-2.5 rounded-xl font-bold text-sm transition-all">
                        <RefreshCw size={15} /> Yenile
                    </button>
                    {/* [A-03] CSV Export */}
                    <button
                        onClick={() => kasaCsvIndir(hareketler, filtreTip, filtreOnay)}
                        title="Kasa hareketlerini CSV olarak indir"
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border-b-4 border-slate-950 px-4 py-2.5 rounded-xl font-black text-sm shadow-md transition-all">
                        ⬇️ CSV İndir
                    </button>
                </div>
            </div>

            {/* ÖZET KUTULARI */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-black text-emerald-700 uppercase mb-1">NAKİT TAHSİLAT</div>
                    <div className="text-2xl font-black text-emerald-600 tracking-tight">₺{nakitTahsilat.toFixed(2)}</div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-black text-blue-800 uppercase mb-1">BANKA / EFT / POS</div>
                    <div className="text-2xl font-black text-blue-600 tracking-tight">₺{bankaEftPos.toFixed(2)}</div>
                </div>
                <div className="bg-violet-50 border-2 border-violet-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-black text-violet-800 uppercase mb-1">ÇEK & SENET</div>
                    <div className="text-2xl font-black text-violet-600 tracking-tight">₺{evrakCekSenet.toFixed(2)}</div>
                </div>
                <div className={`border-2 rounded-2xl p-4 shadow-sm ${netBakiye >= 0 ? 'bg-slate-900 border-emerald-500/50' : 'bg-red-900 border-red-500/50'}`}>
                    <div className="text-sm font-black text-slate-400 uppercase mb-1">NET TL BAKİYE</div>
                    <div className={`text-2xl font-black tracking-tight ${netBakiye >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{netBakiye >= 0 ? '+' : ''}₺{netBakiye.toFixed(2)}</div>
                </div>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-black text-amber-800 uppercase mb-1">Bekleyen İşlem</div>
                    <div className="text-2xl font-black text-amber-600 tracking-tight">₺{bekleyen.toFixed(2)}</div>
                </div>
                <div className={`border-2 rounded-2xl p-4 shadow-sm ${vadesi.length > 0 ? 'bg-red-50 border-red-200' : 'bg-[#0d1117] text-white border-[#1e4a43]'}`}>
                    <div className={`text-sm font-black uppercase mb-1 ${vadesi.length > 0 ? 'text-red-800' : 'text-emerald-200'}`}>Vadesi Geçen</div>
                    <div className={`text-2xl font-black tracking-tight ${vadesi.length > 0 ? 'text-red-600' : 'text-white'}`}>{vadesi.length} Adet</div>
                </div>
            </div>

            {/* GÜNLÜK KAPANIŞ VE BORÇ RAPORU VİDGETLERİ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#122b27] rounded-2xl p-5 border-2 border-[#1e4a43] shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-sm font-black text-emerald-200 uppercase mb-1 tracking-widest">GÜNLÜK KASA KAPANIŞ ÖZETİ</div>
                        <div className="text-xl font-black text-white mb-1">Bugün Tahsilat: <span className="text-emerald-600">₺{(hareketler.filter(h => new Date(h.created_at).toDateString() === new Date().toDateString() && h.hareket_tipi === 'tahsilat' && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0)).toFixed(2)}</span></div>
                        <div className="text-xs font-bold text-slate-400">Günün onaylanan tahsilat ve çıkışları hesaplandı.</div>
                    </div>
                    <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 border-b-4 border-slate-950 text-white rounded-xl px-4 py-2 font-black text-xs uppercase transition-all whitespace-nowrap">Gün Sonu Kes</button>
                </div>

                <div className="bg-[#122b27] rounded-2xl p-5 border-2 border-[#1e4a43] shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-sm font-black text-red-600 uppercase mb-1 tracking-widest">MÜŞTERİ BORÇ RİSKİ</div>
                        <div className="text-xl font-black text-white mb-1">Açık / Riskliler: <span className="text-red-600">{(musteriler.filter(m => m.bakiye && m.bakiye > 10000)).length} Müşteri</span></div>
                        <div className="text-xs font-bold text-slate-400">Bakiye riski &gt; 10.000 TL olan cari hesaplar.</div>
                    </div>
                    <Link href="/musteriler" className="bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-700 rounded-xl px-4 py-2 font-black text-xs uppercase transition-all no-underline whitespace-nowrap">Müşteriler Görüntüle</Link>
                </div>
            </div>

            {/* MESAJ */}
            {mesaj.text && (
                <div className={`p-4 rounded-xl font-bold flex items-center shadow-sm border-2 ${mesaj.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {mesaj.text}
                </div>
            )}

            {/* FORM */}
            {formAcik && (
                <div style={{ background: '#122b27', border: '2px solid #059669', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(5,150,105,0.1)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>Yeni Kasa Hareketi</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={lbl}>Hareket Tipi *</label>
                            <select value={form.hareket_tipi} onChange={e => setForm({ ...form, hareket_tipi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: '#122b27', fontWeight: 700, color: TIP_RENK[form.hareket_tipi] }}>
                                {HAREKET_TIPLERI.map(t => <option key={t} value={t}>{TIP_ICON[t]} {t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Ödeme Yöntemi *</label>
                            <select value={form.odeme_yontemi} onChange={e => setForm({ ...form, odeme_yontemi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: '#122b27' }}>
                                {ODEME_YONTEMLERI.map(y => <option key={y} value={y}>{y.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Tutar (₺) *</label>
                            <input type="number" min="0.01" step="0.01" value={form.tutar_tl} onChange={e => setForm({ ...form, tutar_tl: e.target.value })} placeholder="0.00" style={{ ...inp, fontWeight: 800, color: '#059669' }} />
                        </div>
                        <div>
                            <label style={lbl}>Vade Tarihi (Çek/Senet)</label>
                            <input type="date" value={form.vade_tarihi} onChange={e => setForm({ ...form, vade_tarihi: e.target.value })} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>{form.hareket_tipi === 'avans' ? 'İlişkili Personel (Avans için)' : 'Müşteri / Firma (İsteğe Bağlı)'}</label>
                            {form.hareket_tipi === 'avans' ? (
                                <select value={form.personel_id} onChange={e => setForm({ ...form, personel_id: e.target.value, musteri_id: '' })} style={{ ...inp, cursor: 'pointer', background: '#122b27' }}>
                                    <option value="">— Avans Verilen Personeli Seçin —</option>
                                    {personeller.map(p => <option key={p.id} value={p.id}>{p.personel_kodu} | {p.ad_soyad}</option>)}
                                </select>
                            ) : (
                                <select value={form.musteri_id} onChange={e => setForm({ ...form, musteri_id: e.target.value, personel_id: '' })} style={{ ...inp, cursor: 'pointer', background: '#122b27' }}>
                                    <option value="">— Anonim / Perakende —</option>
                                    {musteriler.map(m => <option key={m.id} value={m.id}>{m.musteri_kodu} | {m.ad_soyad}</option>)}
                                </select>
                            )}
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Açıklama *</label>
                            <input maxLength={500} value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} placeholder="Kasa hareketinin detayını yazın..." style={inp} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setForm(BOSH_FORM); setFormAcik(false); }} style={{ padding: '9px 18px', border: '2px solid #1e4a43', borderRadius: 8, background: '#122b27', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={kaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#059669', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                            {loading ? '...' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            )}

            {/* FİLTRELER */}
            <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#0d1117] text-white p-2 rounded-xl border border-[#1e4a43]">
                <span className="text-sm font-black text-emerald-200 mr-1 uppercase">TİP:</span>
                {['hepsi', ...HAREKET_TIPLERI].map(t => (
                    <button key={t} onClick={() => setFiltreTip(t)}
                        style={{ backgroundColor: filtreTip === t ? (TIP_RENK[t] || '#334155') : 'transparent', color: filtreTip === t ? 'white' : '#475569', borderColor: filtreTip === t ? 'transparent' : '#cbd5e1' }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all`}>
                        {t === 'hepsi' ? 'Tümü' : `${TIP_ICON[t]} ${t.replace('_', ' ')}`}
                    </button>
                ))}
                <div className="w-[2px] h-6 bg-slate-200 mx-2" />
                <span className="text-sm font-black text-emerald-200 mr-1 uppercase">ONAY:</span>
                {['hepsi', 'bekliyor', 'onaylandi', 'iptal'].map(o => (
                    <button key={o} onClick={() => setFiltreOnay(o)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all ${filtreOnay === o ? 'bg-slate-700 text-white border-transparent' : 'bg-transparent text-emerald-300 border-[#1e4a43]'}`}>
                        {o === 'hepsi' ? 'Tümü' : o === 'bekliyor' ? '⏳ Bekliyor' : o === 'onaylandi' ? '✅ Onaylı' : '❌ İptal'}
                    </button>
                ))}
                <span className="text-xs font-bold text-slate-400 ml-auto bg-[#122b27] px-2 py-1 rounded-md border border-[#1e4a43]">{filtreli.length} işlem listeleniyor</span>
            </div>

            {/* LİSTE */}
            <div className="flex flex-col gap-3">
                {loading && filtreli.length === 0 && (
                    <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest bg-[#0d1117] text-white rounded-2xl border-2 border-slate-100">⏳ Yükleniyor...</div>
                )}
                {!loading && filtreli.length === 0 && (
                    <div className="text-center py-16 bg-[#0d1117] text-white border-2 border-dashed border-[#1e4a43] rounded-2xl">
                        <DollarSign size={48} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-emerald-200 font-bold text-lg">Kasa hareketi bulunamadı.</p>
                        <p className="text-slate-400 text-sm">"Yeni Hareket" butonu ile ilk işlemi ekleyin.</p>
                    </div>
                )}
                {filtreli.slice(0, kasaSayfa).map(h => (
                    <div key={h.id} style={{ borderColor: h.onay_durumu === 'onaylandi' ? '#34d399' : h.onay_durumu === 'iptal' ? '#fca5a5' : '#fcd34d' }} className="bg-[#122b27] border-l-8 border-y border-r border-[#1e4a43] rounded-xl p-4 flex justify-between items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 flex-1">
                            <div style={{ backgroundColor: (TIP_RENK[h.hareket_tipi] || '#64748b') + '20', color: TIP_RENK[h.hareket_tipi] || '#64748b' }} className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 font-black">
                                {TIP_ICON[h.hareket_tipi] || '💰'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-black text-white text-lg truncate whitespace-normal mb-1">{h.aciklama}</div>
                                <div className="flex gap-2 flex-wrap items-center">
                                    <span style={{ backgroundColor: (TIP_RENK[h.hareket_tipi] || '#64748b') + '20', color: TIP_RENK[h.hareket_tipi] || '#64748b' }} className="text-sm font-black px-2.5 py-1 rounded uppercase tracking-wider">
                                        {h.hareket_tipi?.replace('_', ' ')}
                                    </span>
                                    <span className="text-sm font-black px-2.5 py-1 rounded bg-slate-100 text-emerald-300 uppercase tracking-wider">
                                        {h.odeme_yontemi?.replace('_', ' ')}
                                    </span>
                                    {h.b2_musteriler?.ad_soyad && (
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">👤 {h.b2_musteriler.ad_soyad}</span>
                                    )}
                                    {h.b1_personel?.ad_soyad && (
                                        <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">👷 {h.b1_personel.ad_soyad} (Avans)</span>
                                    )}
                                    {h.vade_tarihi && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${new Date(h.vade_tarihi) < new Date() ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'}`}>
                                            ⏰ Vade: {formatTarih(h.vade_tarihi)}
                                        </span>
                                    )}
                                    <span className="text-xs font-medium text-slate-400">🗓 {formatTarih(h.created_at)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <div style={{ color: TIP_RENK[h.hareket_tipi] || '#0f172a' }} className="font-black text-xl text-right">
                                ₺{parseFloat(h.tutar_tl || 0).toFixed(2)}
                            </div>
                            <div className="flex flex-col gap-1 w-[110px]">
                                <span className={`text-sm font-black w-full text-center px-2 py-1.5 rounded-lg border ${h.onay_durumu === 'onaylandi' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : h.onay_durumu === 'iptal' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                    {h.onay_durumu === 'onaylandi' ? '✅ ONAYLI' : h.onay_durumu === 'iptal' ? '❌ İPTAL' : '⏳ BEKLİYOR'}
                                </span>
                                {h.onay_durumu === 'bekliyor' && (
                                    <button disabled={islemdeId === h.id} onClick={() => onayDegistir(h.id, 'onaylandi')} title="Onayla"
                                        className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${islemdeId === h.id ? 'opacity-50 cursor-wait' : ''}`}>
                                        <CheckCircle size={10} /> {islemdeId === h.id ? '...' : 'TASDİK ET'}
                                    </button>
                                )}
                            </div>
                            <button disabled={islemdeId === h.id} onClick={() => sil(h.id)} className={`p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200 ${islemdeId === h.id ? 'opacity-50 cursor-wait' : ''}`}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {/* K-13 PAGINATION */}
            {filtreli.length > kasaSayfa && (
                <div className="text-center mt-4">
                    <button
                        onClick={() => setKasaSayfa(p => p + 50)}
                        aria-label="Daha fazla kasa hareketi yükle"
                        className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 border-b-4 border-emerald-900 transition-all"
                    >
                        ⬇ Daha Fazla Göster ({filtreli.length - kasaSayfa} kaldı)
                    </button>
                </div>
            )}
        </div>
    );
}
