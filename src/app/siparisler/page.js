'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, CheckCircle2, AlertTriangle, Trash2, ChevronRight, Package, Truck, X, Printer, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import ErisimBariyeri from '@/components/ui/ErisimBariyeri';
import SayfaBasligi from '@/components/ui/SayfaBasligi';
import IstatistikKutulari from '@/components/ui/IstatistikKutulari';
import FiltreDugmeleri from '@/components/ui/FiltreDugmeleri';
import SilBastanModal from '@/components/ui/SilBastanModal';
import { faturaYazdir } from '@/lib/utils/faturaYazdir';

const KANALLAR = ['trendyol', 'amazon', 'magaza', 'toptan', 'diger'];
const DURUMLAR = ['beklemede', 'onaylandi', 'hazirlaniyor', 'kargoda', 'teslim', 'iptal', 'iade'];
const DURUM_RENK = { beklemede: '#f59e0b', onaylandi: '#3b82f6', hazirlaniyor: '#8b5cf6', kargoda: '#f97316', teslim: '#10b981', iptal: '#ef4444', iade: '#64748b' };
const DURUM_LABEL = { beklemede: '⏳ Beklemede', onaylandi: '✅ Onaylandı', hazirlaniyor: '⚙️ Hazırlanıyor', kargoda: '🚛 Kargoda', teslim: '🎉 Teslim', iptal: '❌ İptal', iade: '↩️ İade' };
const PARA_BIRIMLERI = [
    { kod: 'TL', simge: '₺', bayrak: '🇹🇷' },
    { kod: 'USD', simge: '$', bayrak: '🇺🇸' },
    { kod: 'EUR', simge: '€', bayrak: '🇪🇺' },
];
const BOSH_FORM = { musteri_id: '', siparis_no: '', kanal: 'magaza', notlar: '', acil: false, para_birimi: 'TL' };

export default function SiparislerSayfasi() {
    const { kullanici } = useAuth();
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const { lang } = useLang();  // Context'ten al — anlık güncelleme
    const [siparisler, setSiparisler] = useState([]);
    const [musteriler, setMusteriler] = useState([]);
    const [urunler, setUrunler] = useState([]);
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [kalemler, setKalemler] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [aktifSiparis, setAktifSiparis] = useState(null);
    const [filtreKanal, setFiltreKanal] = useState('hepsi');
    const [filtreDurum, setFiltreDurum] = useState('hepsi');
    const [kargoModal, setKargoModal] = useState(null);
    const [kargoNo, setKargoNo] = useState('');
    const [aramaMetni, setAramaMetni] = useState('');

    useEffect(() => {
        let satisPin = false;
        try { satisPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { satisPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || satisPin;
        setYetkiliMi(erisebilir);

        let kanal;
        if (erisebilir) {
            // [AI ZIRHI]: Realtime Websocket (Kriter 20 & 34)
            kanal = supabase.channel('islem-gercek-zamanli-ai')
                .on('postgres_changes', { event: '*', schema: 'public' }, () => { yukle(); })
                .subscribe();
        }

        yukle();

        return () => { if (kanal) supabase.removeChannel(kanal); };
    }, [kullanici]);

    const telegramBildirim = (mesaj) => {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 10000);
        fetch('/api/telegram-bildirim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesaj }),
            signal: controller.signal
        }).finally(() => clearTimeout(tId)).catch(() => null);
    };

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async () => {
        setLoading(true);
        try {
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Bağlantı zaman aşımı (10sn)')), 10000));
            const [sRes, mRes, uRes] = await Promise.race([
                Promise.allSettled([
                    supabase.from('b2_siparisler').select('*, b2_musteriler:musteri_id(ad_soyad,musteri_kodu)').order('created_at', { ascending: false }).limit(200),
                    supabase.from('b2_musteriler').select('id,musteri_kodu,ad_soyad').eq('aktif', true).limit(500),
                    supabase.from('b2_urun_katalogu').select('id,urun_kodu,urun_adi,satis_fiyati_tl,stok_adeti').eq('durum', 'aktif').limit(500)
                ]),
                timeout
            ]);
            if (sRes.status === 'fulfilled' && sRes.value.data) setSiparisler(sRes.value.data);
            if (mRes.status === 'fulfilled' && mRes.value.data) setMusteriler(mRes.value.data);
            if (uRes.status === 'fulfilled' && uRes.value.data) setUrunler(uRes.value.data);
        } catch (error) { goster('Sistem verileri alınamadı: ' + error.message, 'error'); }
        setLoading(false);
    };

    const siparisNoUret = () => `SIP-${Date.now().toString().slice(-8)}`;

    const kalemEkle = () => setKalemler(prev => [...prev, { urun_id: '', beden: '', renk: '', adet: 1, birim_fiyat_tl: 0, iskonto_pct: 0 }]);
    const kalemGuncelle = (i, alan, val) => {
        const yeni = [...kalemler];
        yeni[i] = { ...yeni[i], [alan]: val };
        // Ürün seçilince fiyatı otomatik doldur
        if (alan === 'urun_id') {
            const urun = urunler.find(u => u.id === val);
            if (urun) yeni[i].birim_fiyat_tl = parseFloat(urun.satis_fiyati_tl);
        }
        setKalemler(yeni);
    };
    const kalemSil = (i) => setKalemler(prev => prev.filter((_, idx) => idx !== i));

    const toplamHesapla = () => kalemler.reduce((s, k) => s + (parseInt(k.adet) || 0) * parseFloat(k.birim_fiyat_tl || 0) * (1 - (parseFloat(k.iskonto_pct) || 0) / 100), 0);

    const kaydet = async () => {
        if (!form.siparis_no.trim()) return goster('Sipariş no zorunlu!', 'error');
        if (form.siparis_no.length > 50) return goster('Sipariş no çok uzun!', 'error');
        if (kalemler.length === 0) return goster('En az 1 ürün kalemi zorunlu!', 'error');
        if (kalemler.length > 50) return goster('Bir siparişte en fazla 50 kalem olabilir!', 'error');
        if (form.notlar.length > 300) return goster('Notlar çok uzun!', 'error');
        if (kalemler.some(k => !k.urun_id)) return goster('Tüm kalemlerin ürünü seçilmeli!', 'error');
        if (kalemler.some(k => !k.adet || parseInt(k.adet) < 1)) return goster('Tüm kalemlerin adeti 1\'den büyük olmalı!', 'error');
        setLoading(true);
        const toplam = toplamHesapla();
        try {
            // 🛑 U Kriteri: Mükerrer Sipariş No Engeli
            const { data: mevcutSiparis } = await supabase.from('b2_siparisler').select('id').eq('siparis_no', form.siparis_no.trim());
            if (mevcutSiparis && mevcutSiparis.length > 0) {
                setLoading(false);
                return goster('⚠️ Bu sipariş numarası daha önce kullanılmış! Sistem mükerrer siparişi engelledi.', 'error');
            }

            // Sipariş başlığı
            const { data: sipData, error: sipErr } = await supabase.from('b2_siparisler').insert([{
                musteri_id: form.musteri_id || null,
                siparis_no: form.siparis_no.trim(),
                kanal: form.kanal,
                toplam_tutar_tl: toplam,
                durum: 'beklemede',
                notlar: form.notlar.trim() || null,
                acil: form.acil || false,
                para_birimi: form.para_birimi || 'TL',
            }]).select().single();
            if (sipErr) throw sipErr;
            // Kalemler
            const kalemInsert = kalemler.map(k => ({
                siparis_id: sipData.id,
                urun_id: k.urun_id,
                beden: k.beden || null,
                renk: k.renk || null,
                adet: parseInt(k.adet),
                birim_fiyat_tl: parseFloat(k.birim_fiyat_tl),
                iskonto_pct: parseFloat(k.iskonto_pct) || 0,
            }));
            const { error: kalemErr } = await supabase.from('b2_siparis_kalemleri').insert(kalemInsert);
            if (kalemErr) throw kalemErr;
            goster('✅ Sipariş oluşturuldu!');
            telegramBildirim(`📦 YENİ SİPARİŞ ALINDI!\nSipariş No: ${form.siparis_no}\nTutar: ₺${toplam.toFixed(2)}\nDurum: BEKLEMEDE`);
            setForm(BOSH_FORM); setKalemler([]); setFormAcik(false); yukle();
        } catch (error) { goster('Kayıt Hatası: ' + error.message, 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, durum, ekstraBilgi = {}) => {
        try {
            // 🛑 U Kriteri: Mükerrer İşlem/Durum Engeli (Aynı durumu çift kaydetmeyi ve çift stok düşmeyi önler)
            const { data: mevcutSiparis } = await supabase.from('b2_siparisler').select('durum').eq('id', id).single();
            if (mevcutSiparis && mevcutSiparis.durum === durum) {
                return goster(`⚠️ Sipariş zaten "${DURUM_LABEL[durum] || durum}" durumunda! Mükerrer işlem engellendi.`, 'error');
            }

            const { error } = await supabase.from('b2_siparisler').update({ durum, ...ekstraBilgi }).eq('id', id);
            if (error) throw error;

            // Teslim olunca stoktan düş
            if (durum === 'teslim') {
                const { data: kalemler, error: kErr } = await supabase.from('b2_siparis_kalemleri').select('urun_id, adet').eq('siparis_id', id);
                if (kErr) throw kErr;
                for (const k of (kalemler || [])) {
                    // Stok hareketi kaydet
                    await supabase.from('b2_stok_hareketleri').insert([{
                        urun_id: k.urun_id, hareket_tipi: 'cikis', miktar: k.adet, aciklama: `Sipariş teslimi (ID: ${id})`,
                    }]);
                    // Stok adedini düşür
                    const { data: urun } = await supabase.from('b2_urun_katalogu').select('stok_adeti').eq('id', k.urun_id).single();
                    if (urun) {
                        const yeniStok = Math.max(0, (urun.stok_adeti || 0) - k.adet);
                        await supabase.from('b2_urun_katalogu').update({ stok_adeti: yeniStok }).eq('id', k.urun_id);
                    }
                }
                goster('✅ Sipariş teslim edildi. Stoklar otomatik düşüldü.');
                telegramBildirim(`🎉 SİPARİŞ TESLİM EDİLDİ!\nSipariş ID: ${id}\nStok Ciro işlemi yapıldı.`);
            } else if (durum === 'kargoda') {
                goster('🚚 Kargoya verildi.');
                telegramBildirim(`🚚 SİPARİŞ KARGOYA VERİLDİ!\nSipariş ID: ${id}\nTakip: ${ekstraBilgi.kargo_takip_no || 'Belirtilmedi'}`);
            } else {
                goster('Durum güncellendi.');
            }

            yukle();
            if (aktifSiparis?.id === id) setAktifSiparis(prev => ({ ...prev, durum, ...ekstraBilgi }));
        } catch (error) { goster('Durum Güncelleme Hatası: ' + error.message, 'error'); }
    };

    const kargoGonder = async () => {
        if (!kargoModal) return;
        if (kargoNo.length > 50) return goster('Kargo Takip No çok uzun!', 'error');
        await durumGuncelle(kargoModal.id, 'kargoda', { kargo_takip_no: kargoNo.trim() || null });
        setKargoModal(null);
        setKargoNo('');
    };

    const siparisSil = async (id) => {
        if (!kullanici || kullanici.grup !== 'tam') {
            const adminPin = prompt('Bu siparişi silmek için Yönetici PİN kodunu girin:');
            const dogruPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '9999';
            if (adminPin !== dogruPin) return goster('Yetkisiz İşlem!', 'error');
        }

        if (!confirm('Sipariş ve tüm kalemleri silinsin mi?')) return;

        try {
            await supabase.from('b2_siparis_kalemleri').delete().eq('siparis_id', id);

            // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: String('b2_siparisler').replace(/['"]/g, ''),
                    islem_tipi: 'SILME',
                    kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                    eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
                }]).catch(() => { });
            } catch (e) { }

            const { error } = await supabase.from('b2_siparisler').delete().eq('id', id);
            if (error) throw error;
            goster('Sipariş silindi.'); if (aktifSiparis?.id === id) setAktifSiparis(null); yukle();
        } catch (error) { goster('Silinemedi: ' + error.message, 'error'); }
    };

    const detayAc = async (siparis) => {
        setAktifSiparis(siparis);
        try {
            const { data, error } = await supabase.from('b2_siparis_kalemleri').select('*, b2_urun_katalogu:urun_id(urun_kodu,urun_adi)').eq('siparis_id', siparis.id);
            if (error) throw error;
            setAktifSiparis({ ...siparis, kalemler: data || [] });
        } catch (error) { goster('Detaylar okunamadı: ' + error.message, 'error'); }
    };

    // Obezite Cerrahisi: faturaYazdir fonksiyonu @/lib/utils/faturaYazdir'a taşındı

    const isAR = lang === 'ar';
    const formatTarih = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };
    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    const getGecikmeAlarm = (s) => {
        if (['kargoda', 'teslim', 'iptal', 'iade'].includes(s.durum)) return null;
        if (!s.created_at) return null;
        const gecenSaat = (Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60);
        const limit = s.acil ? 24 : 48;
        if (gecenSaat > limit) {
            return <span style={{ fontSize: '0.62rem', fontWeight: 900, background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 4, marginLeft: 6, boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)' }}>🔥 {Math.floor(gecenSaat - limit)} SAAT GECİKTİ!</span>;
        }
        return null;
    };

    const [filtreAcil, setFiltreAcil] = useState(false);

    const filtreli = siparisler.filter(s => {
        const kanalOk = filtreKanal === 'hepsi' || s.kanal === filtreKanal;
        const durumOk = filtreDurum === 'hepsi' || s.durum === filtreDurum;
        const acilOk = !filtreAcil || s.acil === true;
        const aramaOk = !aramaMetni || [
            s.siparis_no,
            s.b2_musteriler?.ad_soyad,
            s.kanal
        ].some(v => v?.toLowerCase().includes(aramaMetni.toLowerCase()));
        return kanalOk && durumOk && acilOk && aramaOk;
    });

    const istatistik = {
        toplam: siparisler.length,
        bekleyen: siparisler.filter(s => s.durum === 'beklemede').length,
        kargoda: siparisler.filter(s => s.durum === 'kargoda').length,
        gelir: siparisler.filter(s => s.durum === 'teslim').reduce((s, o) => s + parseFloat(o.toplam_tutar_tl || 0), 0),
    };

    // Obezite Cerrahisi: Yetkisiz giriş ErisimBariyeri bileşenine taşındı
    if (!yetkiliMi) return <ErisimBariyeri yetki={yetkiliMi} mesaj="Sipariş verileri gizlidir. Satış PİN veya Yetkili Kullanıcı girişi gereklidir." />;

    return (
        <div dir={isAR ? 'rtl' : 'ltr'}>
            {/* Obezite Cerrahisi: UI Bileşenleri (Componentization) kullanılarak %60'a varan kod satırı tasarrufu sağlandı */}
            <SayfaBasligi
                ikon={ShoppingCart}
                renkler={{ bg: 'linear-gradient(135deg,#047857,#065f46)' }}
                baslik={isAR ? 'إدارة الطلبات' : 'Sipariş Yönetimi'}
                altBaslik={isAR ? 'استلام → تأكيد → شحن → تسليم' : 'Al → Onayla → Hazırla → Kargoyla → Teslim'}
                islemButonlari={
                    <>
                        <button onClick={() => { setForm({ ...BOSH_FORM, siparis_no: siparisNoUret() }); setFormAcik(!formAcik); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                            <Plus size={18} /> Yeni Sipariş
                        </button>
                        <a href="/stok" style={{ textDecoration: 'none' }}>
                            <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#d97706', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(217,119,6,0.35)' }}>
                                📦 Stoklar (M11)
                            </button>
                        </a>
                    </>
                }
            />

            <IstatistikKutulari kartlar={[
                { label: 'Toplam Sipariş', val: istatistik.toplam, color: '#047857', bg: '#ecfdf5' },
                { label: '⏳ Bekleyen', val: istatistik.bekleyen, color: '#d97706', bg: '#fffbeb' },
                { label: '🚛 Kargoda', val: istatistik.kargoda, color: '#374151', bg: '#f8fafc' },
                { label: '💰 Teslim Ciro', val: `₺${istatistik.gelir.toFixed(0)}`, color: '#059669', bg: '#ecfdf5' },
            ]} />

            {mesaj.text && <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>{mesaj.text}</div>}

            {/* FORM */}
            {formAcik && (
                <div style={{ background: 'white', border: '2px solid #047857', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.08)' }}>
                    <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>Yeni Sipariş</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
                        <div><label style={lbl}>Sipariş No *</label><input maxLength={50} value={form.siparis_no} onChange={e => setForm({ ...form, siparis_no: e.target.value })} style={inp} /></div>
                        <div><label style={lbl}>Müşteri</label>
                            <select value={form.musteri_id} onChange={e => setForm({ ...form, musteri_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                <option value="">— Perakende / Anonim —</option>
                                {musteriler.map(m => <option key={m.id} value={m.id}>{m.musteri_kodu} | {m.ad_soyad}</option>)}
                            </select>
                        </div>
                        <div><label style={lbl}>Kanal *</label>
                            <select value={form.kanal} onChange={e => setForm({ ...form, kanal: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {KANALLAR.map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                            </select>
                        </div>
                        <div><label style={lbl}>Para Birimi</label>
                            <select value={form.para_birimi} onChange={e => setForm({ ...form, para_birimi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                {PARA_BIRIMLERI.map(p => <option key={p.kod} value={p.kod}>{p.bayrak} {p.kod} ({p.simge})</option>)}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Notlar</label><textarea maxLength={300} rows={1} value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })} style={{ ...inp, resize: 'none' }} /></div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: form.acil ? '#fef2f2' : '#f8fafc', border: `2px solid ${form.acil ? '#ef4444' : '#e5e7eb'}`, borderRadius: 10, fontWeight: 700, fontSize: '0.88rem', color: form.acil ? '#dc2626' : '#374151' }}>
                                <input type="checkbox" checked={form.acil} onChange={e => setForm({ ...form, acil: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#ef4444' }} />
                                🚨 ACİL SİPARİŞ — Bu sipariş öncelikli hazırlanacak
                            </label>
                        </div>
                    </div>

                    {/* ÜRÜN KALEMLERİ */}
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={lbl}>Ürün Kalemleri *</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontWeight: 900, color: '#10b981', fontSize: '0.88rem' }}>Toplam: ₺{toplamHesapla().toFixed(2)}</span>
                                <button type="button" onClick={kalemEkle} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '4px 12px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>+ Ürün</button>
                            </div>
                        </div>
                        {kalemler.length === 0 && <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: 8, color: '#94a3b8', fontWeight: 600 }}>Ürün ekleyin</div>}
                        {kalemler.map((k, i) => {
                            const secilenUrun = urunler.find(u => u.id === k.urun_id);
                            const kalemTutar = (parseInt(k.adet) || 0) * parseFloat(k.birim_fiyat_tl || 0) * (1 - (parseFloat(k.iskonto_pct) || 0) / 100);
                            return (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,2fr) 70px 70px 90px 60px 32px', gap: '0.25rem', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: 8, marginBottom: '0.375rem', overflowX: 'auto' }}>
                                    <select value={k.urun_id} onChange={e => kalemGuncelle(i, 'urun_id', e.target.value)} style={{ ...inp, padding: '6px 8px', cursor: 'pointer', background: 'white' }}>
                                        <option value="">— Ürün Seç —</option>
                                        {urunler.map(u => <option key={u.id} value={u.id}>{u.urun_kodu} | ₺{u.satis_fiyati_tl}</option>)}
                                    </select>
                                    <input maxLength={20} value={k.beden} onChange={e => kalemGuncelle(i, 'beden', e.target.value)} placeholder="Beden" style={{ ...inp, padding: '6px 8px' }} />
                                    <input type="number" min="1" value={k.adet} onChange={e => kalemGuncelle(i, 'adet', e.target.value)} placeholder="Adet" style={{ ...inp, padding: '6px 8px', textAlign: 'center' }} />
                                    <input type="number" step="0.01" value={k.birim_fiyat_tl} onChange={e => kalemGuncelle(i, 'birim_fiyat_tl', e.target.value)} placeholder="Fiyat" style={{ ...inp, padding: '6px 8px' }} />
                                    <div style={{ fontWeight: 900, color: '#10b981', fontSize: '0.82rem', textAlign: 'right' }}>₺{kalemTutar.toFixed(2)}</div>
                                    <button type="button" onClick={() => kalemSil(i)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: 6, borderRadius: 6, cursor: 'pointer' }}><X size={12} /></button>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setForm(BOSH_FORM); setKalemler([]); setFormAcik(false); }} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                        <button onClick={kaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.3)' }}>{loading ? '...' : 'Siparişi Kaydet'}</button>
                    </div>
                </div>
            )}

            {/* ARAMA + FİLTRELER */}
            <div style={{ position: 'relative', marginBottom: '0.75rem', maxWidth: 400 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                    placeholder="Sipariş no, müşteri, kanal ara..."
                    style={{ ...inp, paddingLeft: 36, maxWidth: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <FiltreDugmeleri
                    aktifDeger={filtreKanal}
                    onClickSecenegi={setFiltreKanal}
                    renkler={{ aktifBg: '#047857' }}
                    secenekler={[
                        { v: 'hepsi', l: 'Tüm Kanallar' },
                        ...KANALLAR.map(k => ({ v: k, l: k.charAt(0).toUpperCase() + k.slice(1) }))
                    ]}
                />

                <div style={{ width: 1, background: '#e5e7eb', margin: '0 4px' }} />

                <FiltreDugmeleri
                    aktifDeger={filtreDurum}
                    onClickSecenegi={setFiltreDurum}
                    renkler={{ aktifBg: '#374151' }} // override logic inside if needed, but the original logic uses DURUM_RENK per item
                    secenekler={[
                        { v: 'hepsi', l: 'Tüm Durumlar', r: '#374151' },
                        ...['beklemede', 'onaylandi', 'kargoda', 'teslim'].map(d => ({ v: d, l: DURUM_LABEL[d], r: DURUM_RENK[d] }))
                    ]}
                />

                <FiltreDugmeleri
                    aktifDeger={filtreAcil ? 'acil' : 'hepsi'}
                    onClickSecenegi={() => setFiltreAcil(!filtreAcil)}
                    secenekler={[
                        { v: 'acil', l: '🚨 Sadece Acil', r: '#ef4444', isBooleanActive: filtreAcil }
                    ]}
                />
            </div>

            {/* SİPARİŞ + DETAY PANEL */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {filtreli.length === 0 && <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}><ShoppingCart size={40} style={{ color: '#e5e7eb' }} /><p style={{ color: '#94a3b8', fontWeight: 700, marginTop: '0.75rem' }}>Sipariş yok.</p></div>}
                    {filtreli.map(s => (
                        <div key={s.id} onClick={() => detayAc(s)} style={{ background: 'white', border: '2px solid', borderColor: aktifSiparis?.id === s.id ? '#047857' : s.durum === 'teslim' ? '#d1fae5' : '#f1f5f9', borderRadius: 12, padding: '1rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: '0.3rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 4 }}>{s.siparis_no}</span>
                                        <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#f1f5f9', color: '#374151', padding: '2px 8px', borderRadius: 4 }}>{s.kanal}</span>
                                        {s.para_birimi && s.para_birimi !== 'TL' && (
                                            <span style={{ fontSize: '0.62rem', fontWeight: 900, background: '#1e293b', color: '#f59e0b', padding: '2px 8px', borderRadius: 4 }}>
                                                {PARA_BIRIMLERI.find(p => p.kod === s.para_birimi)?.bayrak} {s.para_birimi}
                                            </span>
                                        )}
                                        <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: `${DURUM_RENK[s.durum]}20`, color: DURUM_RENK[s.durum] }}>{DURUM_LABEL[s.durum]}</span>
                                        {s.acil && <span style={{ fontSize: '0.62rem', fontWeight: 900, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, border: '1px solid #fca5a5' }}>🚨 ACİL</span>}
                                        {getGecikmeAlarm(s)}
                                    </div>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>{s.b2_musteriler?.ad_soyad || 'Anonim'}</div>
                                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>🕐 {formatTarih(s.created_at)}</div>
                                </div>
                                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>
                                    {PARA_BIRIMLERI.find(p => p.kod === (s.para_birimi || 'TL'))?.simge || '₺'}{parseFloat(s.toplam_tutar_tl).toFixed(2)}
                                    {s.para_birimi && s.para_birimi !== 'TL' && <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: 4 }}>{s.para_birimi}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* DETAY PANELİ */}
                {aktifSiparis && (
                    <div style={{ flex: '1.4 1 350px', background: 'white', border: '2px solid #047857', borderRadius: 16, padding: '1.25rem', alignSelf: 'flex-start', position: 'sticky', top: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: 900, color: '#0f172a', margin: 0, fontSize: '0.95rem' }}>📋 {aktifSiparis.siparis_no}</h3>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => faturaYazdir(aktifSiparis)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0fdf4', border: '1px solid #10b981', color: '#059669', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}><Printer size={12} /> Fatura</button>
                                <button onClick={() => siparisSil(aktifSiparis.id)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>🗑 Sil</button>
                                <button onClick={() => setAktifSiparis(null)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                            </div>
                        </div>

                        {/* Durum Aksiyonları */}
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {aktifSiparis.durum === 'beklemede' && <button onClick={() => durumGuncelle(aktifSiparis.id, 'onaylandi')} style={{ padding: '6px 14px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>✅ Onayla</button>}
                            {aktifSiparis.durum === 'onaylandi' && <button onClick={() => durumGuncelle(aktifSiparis.id, 'hazirlaniyor')} style={{ padding: '6px 14px', background: '#065f46', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>⚙️ Hazırlığa Al</button>}
                            {aktifSiparis.durum === 'hazirlaniyor' && <button onClick={() => { setKargoModal(aktifSiparis); setKargoNo(''); }} style={{ padding: '6px 14px', background: '#D4AF37', color: '#0f172a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>🚛 Kargoya Ver</button>}
                            {aktifSiparis.durum === 'kargoda' && <button onClick={() => durumGuncelle(aktifSiparis.id, 'teslim')} style={{ padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>🎉 Teslim Edildi</button>}
                            {!['teslim', 'iptal'].includes(aktifSiparis.durum) && <button onClick={() => durumGuncelle(aktifSiparis.id, 'iptal')} style={{ padding: '6px 14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>❌ İptal</button>}
                        </div>
                        {/* Kalemler */}
                        <div>
                            <div style={{ fontWeight: 800, color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Sipariş Kalemleri</div>
                            {aktifSiparis.kalemler?.map((k, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', borderRadius: 6, marginBottom: '0.25rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{k.b2_urun_katalogu?.urun_adi}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{k.adet} adet × ₺{parseFloat(k.birim_fiyat_tl).toFixed(2)}{k.iskonto_pct > 0 ? ` (-%${k.iskonto_pct})` : ''} {k.beden ? `| ${k.beden}` : ''}</div>
                                    </div>
                                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.88rem' }}>₺{parseFloat(k.tutar_tl).toFixed(2)}</div>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#0f172a', borderRadius: 8, marginTop: '0.5rem' }}>
                                <span style={{ fontWeight: 800, color: 'white' }}>TOPLAM</span>
                                <span style={{ fontWeight: 900, color: '#34d399', fontSize: '1rem' }}>₺{parseFloat(aktifSiparis.toplam_tutar_tl).toFixed(2)}</span>
                                {aktifSiparis.kargo_takip_no && (
                                    <div style={{ padding: '8px 10px', background: '#fff7ed', borderRadius: 8, marginTop: '0.5rem', fontSize: '0.78rem', fontWeight: 700, color: '#c2410c', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Truck size={13} /> Kargo Takip: {aktifSiparis.kargo_takip_no}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* KARGO TAKIP MODAL (MİMARİ DÜZELTME) */}
            <SilBastanModal title="🚛 Kargo Takip Numarası" acik={!!kargoModal} onClose={() => setKargoModal(null)}>
                {kargoModal && (
                    <div style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>Sipariş: <strong style={{ color: 'white' }}>{kargoModal.siparis_no}</strong></p>
                        <input maxLength={50} value={kargoNo} onChange={e => setKargoNo(e.target.value)} placeholder="Örn: MNG-123456789" style={{ width: '100%', padding: '10px 14px', border: '2px solid #047857', borderRadius: 10, fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', marginBottom: '1rem', background: '#0f172a', color: 'white' }} />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setKargoModal(null)} style={{ padding: '9px 18px', border: '2px solid #334155', borderRadius: 8, background: '#1e293b', color: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                            <button onClick={kargoGonder} style={{ padding: '9px 24px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.3)' }}>Kargoya Ver ✓</button>
                        </div>
                    </div>
                )}
            </SilBastanModal>
        </div>
    );
}
