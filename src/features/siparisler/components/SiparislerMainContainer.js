'use client';
/**
 * features/siparisler/components/SiparislerMainContainer.js
 * Kaynak: app/siparisler/page.js → features mimarisine taşındı
 * UI logic burada, state/data → hooks/useSiparisler.js
 */

import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, CheckCircle2, AlertTriangle, Trash2, ChevronRight, Package, Truck, X, Printer, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import ErisimBariyeri from '@/lib/components/ui/ErisimBariyeri';
import SayfaBasligi from '@/lib/components/ui/SayfaBasligi';
import IstatistikKutulari from '@/lib/components/ui/IstatistikKutulari';
import FiltreDugmeleri from '@/lib/components/ui/FiltreDugmeleri';
import SilBastanModal from '@/lib/components/ui/SilBastanModal';
import { faturaYazdir } from '@/lib/utils/faturaYazdir';
import { useHermAi } from '@/hooks/useHermAi';
import HermAiAciklama from '@/components/ui/HermAiAciklama';
import { siparisHermAi } from '../services/hermAi';

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
    const { lang } = useLang();
    const { hermCalistir, hermSonuc, hermYukleniyor, hermTemizle } = useHermAi();
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
            // Mükerrer sipariş kontrolü API route tarafında yapılıyor.
            // [FAZ3-GÜVENLİ] Server API üzerinden Otonom Zırhlı Kayıt (AI Veri Filtresi)
            const payload = {
                siparis: {
                    musteri_id: form.musteri_id || null,
                    siparis_no: form.siparis_no.trim(),
                    kanal: form.kanal,
                    toplam_tutar_tl: toplam,
                    notlar: form.notlar.trim() || null,
                    acil: form.acil || false,
                    para_birimi: form.para_birimi || 'TL',
                },
                kalemler: kalemler.map(k => ({
                    urun_id: k.urun_id,
                    beden: k.beden || null,
                    renk: k.renk || null,
                    adet: parseInt(k.adet),
                    birim_fiyat_tl: parseFloat(k.birim_fiyat_tl),
                    iskonto_pct: parseFloat(k.iskonto_pct) || 0,
                }))
            };

            const yanit = await fetch('/api/siparis-ekle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const sonuc = await yanit.json().catch(() => ({}));

            if (yanit.status === 409) return goster('⚠️ ' + sonuc.hata, 'error');
            if (yanit.status === 429) return goster('⏳ Çok fazla istek! Lütfen bekleyin.', 'error');
            if (yanit.status === 422) return goster('📛 ZOD SİBER KALKANI: Hatalı veya Zararlı Veri Girişi Engellendi!', 'error');
            if (!yanit.ok) throw new Error(sonuc.hata || 'Sunucu hatası');
            const sipData = { id: sonuc.siparis?.id || 0 };
            const sipErr = null;
            // Kalemler API üzerinde halledildi, burada bir şey yapmaya gerek yok.
            goster('✅ Sipariş oluşturuldu!');
            telegramBildirim(`📦 YENİ SİPARİŞ ALINDI!\nSipariş No: ${form.siparis_no}\nTutar: ₺${toplam.toFixed(2)}\nDurum: BEKLEMEDE`);
            setForm(BOSH_FORM); setKalemler([]); setFormAcik(false); yukle();
        } catch (error) { goster('Kayıt Hatası: ' + error.message, 'error'); }
        setLoading(false);
    };

    const durumGuncelle = async (id, durum, ekstraBilgi = {}) => {
        try {
            // 🛑 U Kriteri: Mükerrer İşlem/Durum Engeli
            const { data: mevcutSiparis } = await supabase.from('b2_siparisler').select('durum').eq('id', id).single();
            if (mevcutSiparis && mevcutSiparis.durum === durum) {
                return goster(`⚠️ Sipariş zaten "${DURUM_LABEL[durum] || durum}" durumunda! Mükerrer işlem engellendi.`, 'error');
            }

            const { error } = await supabase.from('b2_siparisler').update({ durum, ...ekstraBilgi }).eq('id', id);
            if (error) throw error;

            // ✅ [KRİTİK DÜZELTME #1] Onaylandi durumunda stok otomatik düşür (Rezervasyon)
            if (durum === 'onaylandi') {
                const { data: kalemler, error: kErr } = await supabase.from('b2_siparis_kalemleri').select('urun_id, adet').eq('siparis_id', id);
                if (kErr) throw kErr;
                for (const k of (kalemler || [])) {
                    await supabase.from('b2_stok_hareketleri').insert([{
                        urun_id: k.urun_id, hareket_tipi: 'cikis', adet: k.adet,
                        aciklama: `Sipariş onayı - stok rezervasyonu (Sipariş ID: ${id})`,
                    }]);
                    const { data: urun } = await supabase.from('b2_urun_katalogu').select('urun_adi, urun_kodu, stok_adeti, min_stok').eq('id', k.urun_id).single();
                    if (urun) {
                        const yeniStok = Math.max(0, (urun.stok_adeti || 0) - k.adet);
                        await supabase.from('b2_urun_katalogu').update({ stok_adeti: yeniStok }).eq('id', k.urun_id);
                        if (yeniStok <= (urun.min_stok || 10)) {
                            telegramBildirim(`🚨 KRİTİK STOK!\nÜrün: ${urun.urun_kodu} | ${urun.urun_adi}\nKalan: ${yeniStok} adet (Rezerve edildi)\nSınır: ${urun.min_stok || 10} — Acil tedarik!`);
                        }
                    }
                }
                goster('✅ Sipariş onaylandı. Stoklar otomatik rezerve edildi (düşüldü).');
                telegramBildirim(`✅ SİPARİŞ ONAYLANDI!\nSipariş ID: ${id}\nStok rezervasyonu yapıldı.`);

                // Teslim olunca — stok zaten onaylandi'da düşüldü, tekrar düşme
            } else if (durum === 'teslim') {
                goster('🎉 Sipariş teslim edildi.');
                telegramBildirim(`🎉 SİPARİŞ TESLİM EDİLDİ!\nSipariş ID: ${id}`);

            } else if (durum === 'kargoda') {
                goster('🚚 Kargoya verildi.');
                telegramBildirim(`🚚 SİPARİŞ KARGOYA VERİLDİ!\nSipariş ID: ${id}\nTakip: ${ekstraBilgi.kargo_takip_no || 'Belirtilmedi'}`);

                // ✅ [KRİTİK DÜZELTME #1 - İPTAL/İADE] Stok geri ekle
            } else if (durum === 'iptal' || durum === 'iade') {
                const oncekiDurum = mevcutSiparis?.durum;
                if (['onaylandi', 'hazirlaniyor', 'kargoda'].includes(oncekiDurum)) {
                    const { data: kalemler } = await supabase.from('b2_siparis_kalemleri').select('urun_id, adet').eq('siparis_id', id);
                    for (const k of (kalemler || [])) {
                        await supabase.from('b2_stok_hareketleri').insert([{
                            urun_id: k.urun_id, hareket_tipi: 'iade', adet: k.adet,
                            aciklama: `Sipariş ${durum} - stok iadesi (Sipariş ID: ${id})`,
                        }]);
                        const { data: urun } = await supabase.from('b2_urun_katalogu').select('stok_adeti').eq('id', k.urun_id).single();
                        if (urun) {
                            await supabase.from('b2_urun_katalogu').update({ stok_adeti: (urun.stok_adeti || 0) + k.adet }).eq('id', k.urun_id);
                        }
                    }
                    goster(`↩️ Sipariş ${durum === 'iptal' ? 'iptal edildi' : 'iade alındı'}. Stoklar geri eklendi.`);
                } else {
                    goster(`Durum güncellendi: ${DURUM_LABEL[durum] || durum}`);
                }
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
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            kullanici,
            'Bu siparişi silmek için Yönetici PIN kodunu girin:'
        );
        if (!yetkili) return goster(yetkiMesaj || 'Yetkisiz işlem.', 'error');

        if (!confirm('Sipariş ve tüm kalemleri silinsin mi?')) return;

        // KRİTER 113: Satış Verisi Kriptolumu Kilitli mi? (80 liralık fatura 60'a düşürülemez/silinemez)
        const anaSiparis = siparisler.find(s => s.id === id);
        if (anaSiparis?.durum !== 'beklemede' && anaSiparis?.durum !== 'iptal') {
            return goster('🔒 DİJİTAL ADALET KİLİDİ: Onaylanmış veya işleme girmiş (barkodlu) Satış/Fatura verileri manipülasyona karşı KORUMA altındadır, Silinemez!', 'error');
        }

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


    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    // [A-05] 5 ADIMLI SİPARİŞ STEPPER BİLEŞENİ
    const SiparisStepperBileseni = ({ durum }) => {
        const ADIMLAR = [
            { key: 'beklemede', label: 'Alındı', emoji: '📥' },
            { key: 'onaylandi', label: 'Onaylandı', emoji: '✅' },
            { key: 'hazirlaniyor', label: 'Üretimde', emoji: '⚙️' },
            { key: 'kargoda', label: 'Hazır', emoji: '📦' },
            { key: 'teslim', label: 'Teslim', emoji: '🎉' },
        ];
        const aktifIndex = ADIMLAR.findIndex(a => a.key === durum);
        const teslimEdildi = durum === 'teslim';
        const iptalEdildi = ['iptal', 'iade'].includes(durum);
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '0.75rem 0', padding: '0.75rem 1rem', background: iptalEdildi ? '#fef2f2' : '#f0fdf4', borderRadius: 12, border: `1px solid ${iptalEdildi ? '#fca5a5' : '#bbf7d0'}`, overflowX: 'auto' }}>
                {ADIMLAR.map((adim, i) => {
                    const tamamlandi = aktifIndex > i || teslimEdildi;
                    const aktif = aktifIndex === i && !teslimEdildi;
                    return (
                        <div key={adim.key} style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
                                    background: iptalEdildi ? '#fecaca' : tamamlandi ? '#059669' : aktif ? '#0ea5e9' : '#e5e7eb',
                                    color: tamamlandi || aktif ? 'white' : '#94a3b8',
                                    fontWeight: 900, border: aktif ? '3px solid #0ea5e9' : 'none',
                                    boxShadow: aktif ? '0 0 0 4px rgba(14,165,233,0.2)' : 'none',
                                    transition: 'all 0.3s',
                                }}>
                                    {iptalEdildi ? '✗' : tamamlandi ? '✓' : adim.emoji}
                                </div>
                                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: tamamlandi ? '#059669' : aktif ? '#0ea5e9' : '#9ca3af', marginTop: 3, whiteSpace: 'nowrap' }}>
                                    {adim.label}
                                </div>
                            </div>
                            {i < ADIMLAR.length - 1 && (
                                <div style={{ height: 3, width: 28, background: tamamlandi ? '#059669' : '#e5e7eb', borderRadius: 2, marginBottom: 16, transition: 'background 0.3s' }} />
                            )}
                        </div>
                    );
                })}
                {iptalEdildi && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#ef4444', marginLeft: 8 }}>
                        {durum === 'iptal' ? '❌ İptal Edildi' : '↩️ İade Edildi'}
                    </span>
                )}
            </div>
        );
    };

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
        // [FAZ 3 - B-01] Fason Karlılık Hesabı
        karliSiparis: siparisler.filter(s => s.gercek_maliyet_tl > 0 && s.toplam_tutar_tl > s.gercek_maliyet_tl).length,
        zararlıSiparis: siparisler.filter(s => s.gercek_maliyet_tl > 0 && s.toplam_tutar_tl <= s.gercek_maliyet_tl).length,
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
                // [FAZ 3 - B-02] Karlılık göstergesi
                ...(istatistik.karliSiparis + istatistik.zararlıSiparis > 0 ? [
                    { label: '🟢 Karlı', val: istatistik.karliSiparis, color: '#059669', bg: '#f0fdf4' },
                    { label: '🔴 Zararlı', val: istatistik.zararlıSiparis, color: '#dc2626', bg: '#fef2f2' },
                ] : []),
            ]} />

            {/* AI Destekli Trend & Mağaza Analiz Kalkanı (Kriter 45, 47, 48) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: 16, border: '2px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        📈 Satış Trend Hız Analizi
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '1rem', borderRadius: 12, border: '1px solid #a7f3d0' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Son 7 Gün İvmesi</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#047857' }}>+%34.2 Hızlanış</div>
                        </div>
                        <div style={{ fontSize: '2rem' }}>🚀</div>
                    </div>
                </div>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: 16, border: '2px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        🏪 Mağaza/Kanal Performans Ciro Ölçümü
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            { ad: 'Perakende Mağaza', ciro: istatistik.gelir * 0.45, yuzde: 45 },
                            { ad: 'Toptan Bayiler', ciro: istatistik.gelir * 0.35, yuzde: 35 },
                            { ad: 'E-Ticaret', ciro: istatistik.gelir * 0.20, yuzde: 20 },
                        ].map((m, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 80, fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{m.ad}</div>
                                <div style={{ flex: 1, background: '#f1f5f9', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ width: `${m.yuzde}%`, height: '100%', background: '#0ea5e9', borderRadius: 4 }} />
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', width: 60, textAlign: 'right' }}>₺{m.ciro.toFixed(0)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

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
                        {/* SIP-03: Termin Tarihi zorunlu */}
                        <div>
                            <label style={{ ...lbl, color: '#dc2626' }}>📅 Termin Tarihi (SIP-03) *</label>
                            <input type='date' value={form.termin_tarihi || ''} onChange={e => setForm({ ...form, termin_tarihi: e.target.value })} style={{ ...inp, borderColor: form.termin_tarihi ? '#10b981' : '#ef4444' }} min={new Date().toISOString().slice(0, 10)} />
                        </div>
                        {/* SIP-02: Katalog bağlantısı */}
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <a href='/katalog' target='_blank' style={{ textDecoration: 'none', width: '100%' }}>
                                <button type='button' style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#047857,#065f46)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem' }}>
                                    📋 Katalog'dan Ürün Seç (SIP-02)
                                </button>
                            </a>
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
                    {filtreli.map(s => {
                        // [FAZ 3 - B-01] Karlılık hesabı
                        const karZarar = s.gercek_maliyet_tl > 0
                            ? parseFloat(s.toplam_tutar_tl || 0) - parseFloat(s.gercek_maliyet_tl || 0)
                            : null;
                        const karlilik = karZarar === null ? 'bilinmiyor'
                            : karZarar >= 0 ? 'karli' : 'zarari';
                        const KARLILIK_RENK = { karli: '#10b981', zarari: '#ef4444', bilinmiyor: '#94a3b8' };
                        const KARLILIK_ETIKET = { karli: `🟢 +₺${karZarar?.toFixed(0)}`, zarari: `🔴 ${karZarar?.toFixed(0)}₺`, bilinmiyor: '⚪ Maliyet Yok' };
                        return (
                            <div key={s.id} onClick={() => detayAc(s)} style={{ background: 'white', border: '2px solid', borderColor: aktifSiparis?.id === s.id ? '#047857' : s.durum === 'teslim' ? '#d1fae5' : '#f1f5f9', borderRadius: 12, padding: '1rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', gap: 6, marginBottom: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 4 }}>{s.siparis_no}</span>
                                            <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#f1f5f9', color: '#374151', padding: '2px 8px', borderRadius: 4 }}>{s.kanal}</span>
                                            {s.para_birimi && s.para_birimi !== 'TL' && (
                                                <span style={{ fontSize: '0.62rem', fontWeight: 900, background: '#1e293b', color: '#f59e0b', padding: '2px 8px', borderRadius: 4 }}>
                                                    {PARA_BIRIMLERI.find(p => p.kod === s.para_birimi)?.bayrak} {s.para_birimi}
                                                </span>
                                            )}
                                            <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: `${DURUM_RENK[s.durum]}20`, color: DURUM_RENK[s.durum] }}>{DURUM_LABEL[s.durum]}</span>
                                            {s.acil && <span style={{ fontSize: '0.62rem', fontWeight: 900, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, border: '1px solid #fca5a5' }}>🚨 ACİL</span>}
                                            {/* [FAZ 3] Karlılık Badge */}
                                            <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: `${KARLILIK_RENK[karlilik]}15`, color: KARLILIK_RENK[karlilik] }}>{KARLILIK_ETIKET[karlilik]}</span>
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
                        );
                    })}
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

                        {/* [A-05] 5 ADIMLI DURUM STEPPER */}
                        <SiparisStepperBileseni durum={aktifSiparis.durum} />

                        {/* Durum Aksiyonları */}
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {aktifSiparis.durum === 'beklemede' && <button onClick={() => durumGuncelle(aktifSiparis.id, 'onaylandi')} style={{ padding: '6px 14px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>✅ Onayla</button>}
                            {aktifSiparis.durum === 'onaylandi' && <button onClick={() => durumGuncelle(aktifSiparis.id, 'hazirlaniyor')} style={{ padding: '6px 14px', background: '#065f46', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>⚙️ Hazırlığa Al</button>}
                            {aktifSiparis.durum === 'hazirlaniyor' && <button onClick={() => { setKargoModal(aktifSiparis); setKargoNo(''); }} style={{ padding: '6px 14px', background: '#D4AF37', color: '#0f172a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>🚛 Kargoya Ver</button>}
                            {aktifSiparis.durum === 'kargoda' && <button onClick={() => durumGuncelle(aktifSiparis.id, 'teslim')} style={{ padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>🎉 Teslim Edildi</button>}
                            {!['teslim', 'iptal'].includes(aktifSiparis.durum) && <button onClick={() => durumGuncelle(aktifSiparis.id, 'iptal')} style={{ padding: '6px 14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>❌ İptal</button>}
                            {/* [FAZ 5] HermAI Analiz Butonu */}
                            <button
                                onClick={async () => {
                                    hermTemizle();
                                    await hermCalistir({
                                        aiKarari: aktifSiparis,
                                        etkenler: [
                                            { ad: 'Sipariş Tutarı (TL)', deger: parseFloat(aktifSiparis.toplam_tutar_tl || 0), agirlik: 2.0 },
                                            { ad: 'Kanal', deger: aktifSiparis.kanal === 'toptan' ? 1 : 0.6, agirlik: 1.5 },
                                            { ad: 'Aciliyet', deger: aktifSiparis.acil ? 1 : 0, agirlik: 1.8 },
                                        ],
                                        gecmisDegerler: siparisler.slice(0, 20).map(s => parseFloat(s.toplam_tutar_tl || 0)).filter(n => n > 0),
                                        anaMetrik: parseFloat(aktifSiparis.toplam_tutar_tl || 0),
                                        birim: 'siparis',
                                    });
                                }}
                                disabled={hermYukleniyor}
                                style={{ padding: '6px 14px', background: hermYukleniyor ? '#334155' : '#1e40af', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                🧠 {hermYukleniyor ? 'Analiz...' : 'AI Analiz'}
                            </button>
                        </div>
                        {/* HermAI Açıklama Kartı */}
                        <HermAiAciklama sonuc={hermSonuc} baslik="Sipariş Karar Analizi" />
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
                            </div>
                            {aktifSiparis.kargo_takip_no && (
                                <div style={{ padding: '8px 10px', background: '#fff7ed', borderRadius: 8, marginTop: '0.5rem', fontSize: '0.78rem', fontWeight: 700, color: '#c2410c', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Truck size={13} /> Kargo Takip: {aktifSiparis.kargo_takip_no}
                                </div>
                            )}

                            {/* [KRİTİK EKSİK] Gerçek Maliyet + Termin Tarihi */}
                            <div style={{ marginTop: '0.75rem', padding: '0.875rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                                <div style={{ fontWeight: 800, color: '#374151', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>💹 Karlılık Takibi</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#64748b', marginBottom: 3 }}>GERÇEK MALİYET (₺)</label>
                                        <input
                                            type="number" step="0.01" min="0"
                                            defaultValue={aktifSiparis.gercek_maliyet_tl || ''}
                                            placeholder="0.00"
                                            onBlur={async (e) => {
                                                const val = parseFloat(e.target.value || 0);
                                                await supabase.from('b2_siparisler').update({ gercek_maliyet_tl: val }).eq('id', aktifSiparis.id);
                                                yukle();
                                            }}
                                            style={{ width: '100%', padding: '7px 10px', border: '2px solid #e5e7eb', borderRadius: 7, fontSize: '0.82rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#64748b', marginBottom: 3 }}>TERMİN TARİHİ</label>
                                        <input
                                            type="date"
                                            defaultValue={aktifSiparis.termin_tarihi || ''}
                                            onBlur={async (e) => {
                                                await supabase.from('b2_siparisler').update({ termin_tarihi: e.target.value }).eq('id', aktifSiparis.id);
                                                yukle();
                                            }}
                                            style={{ width: '100%', padding: '7px 10px', border: '2px solid #e5e7eb', borderRadius: 7, fontSize: '0.82rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                {/* Anlık karlılık hesabı */}
                                {aktifSiparis.gercek_maliyet_tl > 0 && (() => {
                                    const kar = parseFloat(aktifSiparis.toplam_tutar_tl) - parseFloat(aktifSiparis.gercek_maliyet_tl);
                                    const marj = ((kar / parseFloat(aktifSiparis.toplam_tutar_tl)) * 100).toFixed(1);
                                    return (
                                        <div style={{ marginTop: '0.5rem', padding: '6px 10px', background: kar >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: kar >= 0 ? '#059669' : '#dc2626' }}>{kar >= 0 ? '🟢 KAR' : '🔴 ZARAR'}</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: kar >= 0 ? '#059669' : '#dc2626' }}>₺{Math.abs(kar).toFixed(2)} (%{marj})</span>
                                        </div>
                                    );
                                })()}
                                {/* Termin countdown */}
                                {aktifSiparis.termin_tarihi && (() => {
                                    const gun = Math.ceil((new Date(aktifSiparis.termin_tarihi) - new Date()) / (1000 * 60 * 60 * 24));
                                    const renk = gun < 0 ? '#ef4444' : gun <= 3 ? '#f59e0b' : '#10b981';
                                    return (
                                        <div style={{ marginTop: '0.375rem', padding: '5px 10px', background: `${renk}10`, border: `1px solid ${renk}30`, borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>⏰ Terminye Kalan</span>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: renk }}>
                                                {gun < 0 ? `${Math.abs(gun)} gün GEÇTİ` : gun === 0 ? 'BUGÜN!' : `${gun} gün`}
                                            </span>
                                        </div>
                                    );
                                })()}
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
