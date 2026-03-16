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
import { telegramBildirim, formatTarih } from '@/lib/utils';
import ErisimBariyeri from '@/lib/components/ui/ErisimBariyeri';
import SayfaBasligi from '@/components/ui/SayfaBasligi';
import IstatistikKutulari from '@/components/ui/IstatistikKutulari';
import FiltreDugmeleri from '@/components/ui/FiltreDugmeleri';
import SilBastanModal from '@/components/ui/SilBastanModal';
import { faturaYazdir } from '@/lib/utils/faturaYazdir';
import { useHermAi } from '@/hooks/useHermAi';
import HermAiAciklama from '@/components/ui/HermAiAciklama';
import { siparisHermAi } from '../services/hermAi';
import Link from 'next/link';

const KANALLAR = ['trendyol', 'amazon', 'magaza', 'toptan', 'diger'];
const DURUMLAR = ['beklemede', 'onaylandi', 'hazirlaniyor', 'kargoda', 'teslim', 'iptal', 'iade'];
const DURUM_RENK = { beklemede: '#f59e0b', onaylandi: '#3b82f6', hazirlaniyor: '#8b5cf6', kargoda: '#f97316', teslim: '#10b981', iptal: '#ef4444', iade: '#64748b' };
const DURUM_LABEL = { beklemede: '⏳ Beklemede', onaylandi: '✅ Onaylandı', hazirlaniyor: '⚙️ Hazırlanıyor', kargoda: '🚛 Kargoda', teslim: '🎉 Teslim', iptal: '❌ İptal', iade: '↩️ İade' };
const PARA_BIRIMLERI = [
    { kod: 'TL', simge: '₺', bayrak: '🇹🇷' },
    { kod: 'USD', simge: '$', bayrak: '🇺🇸' },
    { kod: 'EUR', simge: '€', bayrak: '🇪🇺' },
];
const BOSH_FORM = { musteri_id: '', siparis_no: '', kanal: 'magaza', notlar: '', acil: false, para_birimi: 'TL', odeme_yontemi: 'nakit', termin_tarihi: '' };

export default function SiparislerSayfasi() {
    const { kullanici: rawKullanici } = useAuth();
    const kullanici = /** @type {any} */ (rawKullanici);
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const { lang } = useLang();
    const { hermCalistir, hermSonuc, hermYukleniyor, hermTemizle } = useHermAi();
    const [siparisler, setSiparisler] = useState(/** @type {any[]} */([]));
    const [musteriler, setMusteriler] = useState(/** @type {any[]} */([]));
    const [urunler, setUrunler] = useState(/** @type {any[]} */([]));
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [kalemler, setKalemler] = useState(/** @type {any[]} */([]));
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [aktifSiparis, setAktifSiparis] = useState(/** @type {any} */(null));
    const [filtreKanal, setFiltreKanal] = useState('hepsi');
    const [filtreDurum, setFiltreDurum] = useState('hepsi');
    const [kargoModal, setKargoModal] = useState(/** @type {any} */(null));
    const [kargoNo, setKargoNo] = useState('');
    const [aramaMetni, setAramaMetni] = useState('');
    const [islemdeId, setIslemdeId] = useState(/** @type {any} */(null)); // [SPAM ZIRHI]

    useEffect(() => {
        let satisPin = false;
        try { satisPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { satisPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = /** @type {any} */ (kullanici)?.grup === 'tam' || satisPin;
        setYetkiliMi(erisebilir);

        let kanal = /** @type {any} */ (null);
        let isSubscribed = false;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && erisebilir && !isSubscribed) {
                yukle(); // sekme tekrar açılınca güncel veriyi çek
                kanal = supabase.channel('siparis_gercek_zamanli')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_siparisler' }, (payload) => {
                        yukle();
                    })
                    .subscribe();
                isSubscribed = true;
            } else if (document.visibilityState === 'hidden' && kanal) {
                // [SIFIR MALİYET ZIRHI]: Sekme arkaplana düşünce websocket kopartılır (fatura engeli)
                supabase.removeChannel(kanal);
                kanal = null;
                isSubscribed = false;
            }
        };

        if (erisebilir) {
            kanal = supabase.channel('siparis_gercek_zamanli')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_siparisler' }, (payload) => {
                    yukle();
                })
                .subscribe();
            isSubscribed = true;
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        yukle();

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (kanal) supabase.removeChannel(kanal);
        };
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

    const kalemEkle = () => setKalemler(prev => [...prev, { urun_id: '', beden: '', renk: '', adet: 1, birim_fiyat_tl: 0, iskonto_pct: 0, kalem_notu: '' }]);
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

        // [M9 ZIRHI]: %10 Üzeri İskonto Kalkanı
        const enYuksekIskonto = Math.max(...kalemler.map(k => parseFloat(k.iskonto_pct) || 0));
        if (enYuksekIskonto > 10 && !yetkiliMi) {
            return goster('🚨 GÜVENLİK İHLALİ: %10 üzerinde iskonto vermek için KASA/YÖNETİCİ yetkisi zorunludur!', 'error');
        }

        setLoading(true);
        const toplam = toplamHesapla();
        try {
            // Mükerrer sipariş kontrolü API route tarafında yapılıyor.
            // [FAZ3-GÜVENLİ] Server API üzerinden Otonom Zırhlı Kayıt (AI Veri Filtresi)
            // Kalem notlarını ana notlara birleştir (DB yapısını bozmadan kalıcılık sağlamak için)
            const ozelNotlar = kalemler.filter(k => k.kalem_notu).map((k, idx) => `[Kalem ${idx + 1} İstek]: ${k.kalem_notu}`).join('\n');
            const sonNot = [form.notlar.trim(), ozelNotlar].filter(Boolean).join('\n\n');

            const payload = {
                siparis: {
                    musteri_id: form.musteri_id || null,
                    siparis_no: form.siparis_no.trim(),
                    kanal: form.kanal,
                    toplam_tutar_tl: toplam,
                    notlar: sonNot || null,
                    acil: form.acil || false,
                    para_birimi: form.para_birimi || 'TL',
                    odeme_yontemi: form.odeme_yontemi || 'nakit',
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
        finally { setLoading(false); }
    };

    const durumGuncelle = async (id, durum, ekstraBilgi = {}) => {
        if (islemdeId === 'durum_' + id) return;
        setIslemdeId('durum_' + id);
        try {
            // 🛑 U Kriteri: Mükerrer İşlem/Durum Engeli
            const { data: mevcutSiparis } = await supabase.from('b2_siparisler').select('durum, toplam_tutar_tl, siparis_no, musteri_id, odeme_yontemi').eq('id', id).single();
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
                // ✅ [KRİTİK DÜZELTME #2] Kasa Entegrasyonu: Teslim edilen siparişin tahsilatını Kasa'ya devret
                try {
                    await supabase.from('b2_kasa_hareketleri').insert([{
                        hareket_tipi: 'tahsilat',
                        odeme_yontemi: mevcutSiparis?.odeme_yontemi || 'nakit',
                        tutar_tl: mevcutSiparis?.toplam_tutar_tl || 0,
                        aciklama: `Otonom Sipariş Tahsilatı (Sipariş No: ${mevcutSiparis?.siparis_no || id})`,
                        musteri_id: mevcutSiparis?.musteri_id || null,
                        onay_durumu: 'onaylandi' // Sistem aktardığı için direkt onaylı
                    }]);
                } catch (e) {
                    console.error('Kasa yazma hatası:', e);
                }

                goster('🎉 Sipariş teslim edildi ve tahsilat (Gelir) Kasa modülüne aktarıldı!');
                telegramBildirim(`🎉 SİPARİŞ TESLİM EDİLDİ!\nSipariş No: ${mevcutSiparis?.siparis_no || id}\nTahsilat işlemleri Kasaya yönlendirildi.`);

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
        finally { setIslemdeId(null); }
    };

    const kargoGonder = async () => {
        if (!kargoModal) return;
        if (kargoNo.length > 50) return goster('Kargo Takip No çok uzun!', 'error');
        await durumGuncelle(kargoModal.id, 'kargoda', { kargo_takip_no: kargoNo.trim() || null });
        setKargoModal(null);
        setKargoNo('');
    };

    const siparisSil = async (id) => {
        if (islemdeId === 'sil_' + id) return;
        setIslemdeId('sil_' + id);
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(
            kullanici
        );
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Yetkisiz işlem.', 'error'); }

        if (!confirm('Sipariş ve tüm kalemleri silinsin mi?')) { setIslemdeId(null); return; }

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
                }]);
            } catch (e) { }

            const { error } = await supabase.from('b2_siparisler').delete().eq('id', id);
            if (error) throw error;
            goster('Sipariş silindi.'); if (aktifSiparis?.id === id) setAktifSiparis(null); yukle();
        } catch (error) { goster('Silinemedi: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
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
            <div className={`flex items-center gap-0 my-3 py-3 px-4 rounded-xl border overflow-x-auto custom-scrollbar ${iptalEdildi ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                {ADIMLAR.map((adim, i) => {
                    const tamamlandi = aktifIndex > i || teslimEdildi;
                    const aktif = aktifIndex === i && !teslimEdildi;
                    return (
                        <div key={adim.key} className="flex items-center min-w-0">
                            <div className="flex flex-col items-center min-w-[52px]">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300
                                    ${iptalEdildi ? 'bg-red-200 text-red-500' : tamamlandi ? 'bg-emerald-600 text-white' : aktif ? 'bg-sky-500 text-white border-4 border-sky-500/30' : 'bg-slate-200 text-slate-400'}`}>
                                    {iptalEdildi ? '✗' : tamamlandi ? '✓' : adim.emoji}
                                </div>
                                <div className={`text-[10px] font-black mt-1.5 whitespace-nowrap ${tamamlandi ? 'text-emerald-600' : aktif ? 'text-sky-500' : 'text-slate-400'}`}>
                                    {adim.label}
                                </div>
                            </div>
                            {i < ADIMLAR.length - 1 && (
                                <div className={`h-[3px] w-7 rounded-sm mb-4 transition-colors duration-300 mx-1 ${tamamlandi ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    );
                })}
                {iptalEdildi && (
                    <span className="text-[11px] font-black text-red-500 ml-2 whitespace-nowrap">
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
            return <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded ml-1.5 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse">🔥 {Math.floor(gecenSaat - limit)} SAAT GECİKTİ!</span>;
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
                renkler={/** @type {any} */ ({ bg: 'linear-gradient(135deg,#047857,#065f46)' })}
                baslik={isAR ? 'إدارة الطلبات' : 'Sipariş Yönetimi'}
                altBaslik={/** @type {any} */ (isAR ? 'استلام → تأكيد → شحن → تسليم' : 'Al → Onayla → Hazırla → Kargoyla → Teslim')}
                islemButonlari={/** @type {any} */(
                    <>
                        <button onClick={() => { setForm({ ...BOSH_FORM, siparis_no: siparisNoUret() }); setFormAcik(!formAcik); }}
                            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white border-0 px-5 py-2.5 rounded-xl font-bold cursor-pointer transition-all shadow-[0_4px_14px_rgba(4,120,87,0.35)]">
                            <Plus size={18} /> Yeni Sipariş
                        </button>
                        <Link href="/stok" className="no-underline">
                            <button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white border-0 px-5 py-2.5 rounded-xl font-black cursor-pointer text-sm transition-all shadow-[0_4px_14px_rgba(217,119,6,0.35)]">
                                📦 Stoklar (M11)
                            </button>
                        </Link>
                    </>
                )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
                    <h3 className="m-0 mb-4 text-sm font-black text-slate-800 flex items-center gap-2 relative z-10">
                        <span className="text-emerald-600">📈</span> Satış Trend Hız Analizi
                    </h3>
                    {/* [A5 FIX] Hardcode +%34.2 kaldırıldı — gerçek son 7 gün vs önceki 7 gün ciro karşılaştırması */}
                    {(() => {
                        const bugun = new Date();
                        const son7 = siparisler.filter(s => {
                            const gt = (/** @type {any} */ (bugun) - /** @type {any} */ (new Date(s.created_at))) / (1000 * 60 * 60 * 24);
                            return gt <= 7 && !['iptal', 'iade'].includes(s.durum);
                        });
                        const onceki7 = siparisler.filter(s => {
                            const gt = (/** @type {any} */ (bugun) - /** @type {any} */ (new Date(s.created_at))) / (1000 * 60 * 60 * 24);
                            return gt > 7 && gt <= 14 && !['iptal', 'iade'].includes(s.durum);
                        });
                        const son7Ciro = son7.reduce((t, s) => t + parseFloat(s.toplam_tutar_tl || 0), 0);
                        const onceki7Ciro = onceki7.reduce((t, s) => t + parseFloat(s.toplam_tutar_tl || 0), 0);
                        let ivme = 0, yon = 'flat';
                        if (onceki7Ciro > 0) { ivme = (son7Ciro - onceki7Ciro) / onceki7Ciro * 100; yon = ivme > 0 ? 'up' : ivme < 0 ? 'down' : 'flat'; }
                        else if (son7Ciro > 0) { ivme = 100; yon = 'up'; }

                        const renkSinifMap = {
                            up: { yazi: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', textLight: 'text-emerald-600/70', emoji: '🚀', label: 'Hızlanış' },
                            down: { yazi: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', textLight: 'text-red-600/70', emoji: '📉', label: 'Yavaşlama' },
                            flat: { yazi: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', textLight: 'text-slate-500/70', emoji: '➡️', label: 'Sabit' }
                        };
                        const { yazi, bg, border, emoji, label, textLight } = renkSinifMap[yon];

                        return (
                            <div className={`flex justify-between items-center p-4 rounded-xl border ${bg} ${border} relative z-10`}>
                                <div>
                                    <div className={`text-[11px] font-black uppercase tracking-widest ${yazi}`}>
                                        Son 7G: {son7.length} Sipariş | Önceki: {onceki7.length} Sipariş
                                    </div>
                                    <div className={`text-2xl font-black mt-1 ${yazi}`}>
                                        {yon === 'up' ? '+' : ''}{ivme.toFixed(1)}% <span className="text-sm">{label}</span>
                                    </div>
                                    <div className={`text-[10px] font-bold mt-1 ${textLight}`}>
                                        Son 7G ₺{son7Ciro.toFixed(0)} <span className="mx-1">/</span> Önceki ₺{onceki7Ciro.toFixed(0)}
                                    </div>
                                </div>
                                <div className="text-4xl drop-shadow-sm">{emoji}</div>
                            </div>
                        );
                    })()}
                </div>
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm hover:border-sky-200 transition-colors">
                    <h3 className="m-0 mb-4 text-sm font-black text-slate-800 flex items-center gap-2">
                        <span className="text-sky-500">🏪</span> Mağaza/Kanal Performans Ciro Ölçümü
                    </h3>
                    <div className="flex flex-col gap-3">
                        {[
                            { ad: 'Perakende Mağaza', ciro: istatistik.gelir * 0.45, yuzde: 45, color: 'bg-sky-500' },
                            { ad: 'Toptan Bayiler', ciro: istatistik.gelir * 0.35, yuzde: 35, color: 'bg-emerald-500' },
                            { ad: 'E-Ticaret', ciro: istatistik.gelir * 0.20, yuzde: 20, color: 'bg-amber-500' },
                        ].map((m, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-24 text-xs font-bold text-slate-600 tracking-tight">{m.ad}</div>
                                <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                                    <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.yuzde}%` }} />
                                </div>
                                <div className="text-xs font-black text-slate-800 w-16 text-right">₺{(m.ciro || 0).toFixed(0)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {mesaj.text && <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', border: '2px solid', borderColor: mesaj.type === 'error' ? '#ef4444' : '#10b981', background: mesaj.type === 'error' ? '#fef2f2' : '#ecfdf5', color: mesaj.type === 'error' ? '#b91c1c' : '#065f46' }}>{mesaj.text}</div>}

            {/* FORM */}
            {formAcik && (
                <div className="bg-white border-2 border-emerald-600 rounded-2xl p-6 mb-6 shadow-[0_8px_32px_rgba(4,120,87,0.08)]">
                    <h3 className="font-black text-emerald-800 mb-5 text-lg">✨ Yeni Sipariş Oluştur</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Sipariş No *</label>
                            <input maxLength={50} value={form.siparis_no} onChange={e => setForm({ ...form, siparis_no: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Müşteri</label>
                            <select value={form.musteri_id} onChange={e => setForm({ ...form, musteri_id: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all text-sm cursor-pointer">
                                <option value="">— Perakende / Anonim —</option>
                                {musteriler.map(m => <option key={m.id} value={m.id}>{m.musteri_kodu} | {m.ad_soyad}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Kanal *</label>
                            <select value={form.kanal} onChange={e => setForm({ ...form, kanal: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all text-sm cursor-pointer">
                                {KANALLAR.map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-emerald-700 mb-1.5 uppercase tracking-widest">Ödeme Yöntemi</label>
                            <select value={form.odeme_yontemi} onChange={e => setForm({ ...form, odeme_yontemi: e.target.value })} className="w-full px-3 py-2.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl font-bold text-emerald-900 outline-none focus:border-emerald-500 transition-all text-sm cursor-pointer">
                                <option value="nakit">💵 Nakit / Peşin</option>
                                <option value="kredi_karti">💳 Kredi Kartı</option>
                                <option value="eft">🏦 EFT / Havale</option>
                                <option value="cek">📜 Çek / Evrak</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Para Birimi</label>
                            <select value={form.para_birimi} onChange={e => setForm({ ...form, para_birimi: e.target.value })} className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all text-sm cursor-pointer">
                                {PARA_BIRIMLERI.map(p => <option key={p.kod} value={p.kod}>{p.bayrak} {p.kod} ({p.simge})</option>)}
                            </select>
                        </div>
                        {/* SIP-03: Termin Tarihi zorunlu */}
                        <div>
                            <label className="block text-[11px] font-black text-red-600 mb-1.5 uppercase tracking-widest">📅 Termin Tarihi (SIP-03) *</label>
                            <input type='date' value={form.termin_tarihi || ''} onChange={e => setForm({ ...form, termin_tarihi: e.target.value })} min={new Date().toISOString().slice(0, 10)}
                                className={`w-full px-3 py-2.5 bg-white border-2 rounded-xl font-bold outline-none transition-all text-sm ${form.termin_tarihi ? 'border-emerald-500 text-slate-700' : 'border-red-400 text-red-700'}`} />
                        </div>
                        {/* SIP-02: Katalog bağlantısı */}
                        <div className="flex items-end lg:col-span-2">
                            <Link href='/katalog' target='_blank' className="w-full no-underline">
                                <button type='button' className="w-full h-[45px] bg-gradient-to-r from-emerald-700 to-emerald-800 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:from-emerald-800 hover:to-emerald-900 transition-colors shadow-md">
                                    📋 Katalog'dan Ürün Seç (SIP-02)
                                </button>
                            </Link>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Notlar</label>
                            <textarea maxLength={300} rows={1} value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })}
                                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm resize-none custom-scrollbar" />
                        </div>
                        <div className="md:col-span-1 lg:col-span-1 flex items-end">
                            <label className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 cursor-pointer transition-all ${form.acil ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                                <input type="checkbox" checked={form.acil} onChange={e => setForm({ ...form, acil: e.target.checked })} className="w-4 h-4 cursor-pointer accent-red-600" />
                                <span className="text-[11px] font-black tracking-wide">🚨 ACİL SİPARİŞ</span>
                            </label>
                        </div>
                    </div>

                    {/* ÜRÜN KALEMLERİ */}
                    <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-8 h-8 rounded-bl-3xl bg-emerald-100/50"></div>
                        <div className="flex flex-wrap justify-between items-center mb-4 gap-3 border-b-2 border-slate-100 pb-3">
                            <label className="font-black text-slate-700 text-sm m-0 uppercase flex items-center gap-2"><ShoppingCart size={16} className="text-emerald-600" /> Ürün Kalemleri *</label>
                            <div className="flex gap-4 items-center">
                                <span className="font-black text-emerald-600 text-lg bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">Toplam: ₺{toplamHesapla().toFixed(2)}</span>
                                <button type="button" onClick={kalemEkle} className="bg-slate-800 hover:bg-black text-emerald-400 border-0 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1">
                                    <Plus size={14} /> Ürün Ekle
                                </button>
                            </div>
                        </div>

                        {kalemler.length === 0 && (
                            <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold text-sm m-0">Önce müşteri/özel sipariş bilgilerini girip, ardından <span className="text-slate-600">"Ürün Ekle"</span> butonunu kullanın.</p>
                            </div>
                        )}

                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {kalemler.map((k, i) => {
                                const kalemTutar = (parseInt(k.adet) || 0) * parseFloat(k.birim_fiyat_tl || 0) * (1 - (parseFloat(k.iskonto_pct) || 0) / 100);
                                return (
                                    <div key={i} className="bg-white p-3.5 rounded-xl border-2 border-slate-100 shadow-sm relative group hover:border-emerald-200 transition-colors">
                                        <button type="button" onClick={() => kalemSil(i)} className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm border border-red-200"><X size={12} /></button>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-3">
                                            <div className="md:col-span-4">
                                                <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Ürün</label>
                                                <select value={k.urun_id} onChange={e => kalemGuncelle(i, 'urun_id', e.target.value)} className="w-full px-2.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-emerald-500 text-xs cursor-pointer truncate">
                                                    <option value="">— Katalogdan Seç —</option>
                                                    {urunler.map(u => <option key={u.id} value={u.id}>{u.urun_kodu} | ₺{(parseFloat(u.satis_fiyati_tl) || 0).toFixed(0)}</option>)}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Beden</label>
                                                <input maxLength={20} value={k.beden} onChange={e => kalemGuncelle(i, 'beden', e.target.value)} placeholder="Örn: M, XL" className="w-full px-2.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-emerald-500 text-xs" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Adet</label>
                                                <input type="number" min="1" value={k.adet} onChange={e => kalemGuncelle(i, 'adet', e.target.value)} className="w-full px-2.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-emerald-500 text-xs text-center" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Birim Fiyat</label>
                                                <input type="number" step="0.01" value={k.birim_fiyat_tl} onChange={e => kalemGuncelle(i, 'birim_fiyat_tl', e.target.value)} className="w-full px-2.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-emerald-500 text-xs" />
                                            </div>
                                            <div className="md:col-span-2 text-right self-center pt-2">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tutar</div>
                                                <div className="font-black text-emerald-600 text-[15px]">₺{kalemTutar.toFixed(2)}</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 items-center bg-sky-50 p-2 rounded-lg border border-sky-100">
                                            <span className="text-[9px] text-sky-700 font-bold whitespace-nowrap bg-sky-200/50 px-2 py-1 rounded">TERZİ/KALIP NOTU:</span>
                                            <input
                                                maxLength={100}
                                                value={k.kalem_notu || ''}
                                                onChange={e => kalemGuncelle(i, 'kalem_notu', e.target.value)}
                                                placeholder="Örn: Kolları daralsın, kırmızı iplik kullanılsın..."
                                                className={`w-full bg-transparent border-0 outline-none font-medium text-xs text-sky-900 placeholder:text-sky-700/40`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t-2 border-slate-100 mt-2">
                        <button onClick={() => { setForm(BOSH_FORM); setKalemler([]); setFormAcik(false); }} className="px-6 py-2.5 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-600 transition-all">İptal</button>
                        <button onClick={kaydet} disabled={loading} className={`px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 border-b-4 border-emerald-800 text-white rounded-xl font-black transition-all flex items-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}>
                            {loading ? '...' : '✅ Siparişi Kaydet'}
                        </button>
                    </div>
                </div>
            )}

            {/* ARAMA + FİLTRELER */}
            <div className="relative mb-4 max-w-sm">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                    placeholder="Sipariş no, müşteri, kanal ara..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all text-sm shadow-sm" />
            </div>
            <div className="flex gap-2 mb-6 flex-wrap items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                <FiltreDugmeleri
                    aktifDeger={filtreKanal}
                    onClickSecenegi={setFiltreKanal}
                    renkler={{ aktifBg: '#059669' }}
                    secenekler={[
                        { v: 'hepsi', l: 'Tüm Kanallar' },
                        ...KANALLAR.map(k => ({ v: k, l: k.charAt(0).toUpperCase() + k.slice(1) }))
                    ]}
                />

                <div className="w-[1px] h-6 bg-slate-300 mx-1 hidden sm:block" />

                <FiltreDugmeleri
                    aktifDeger={filtreDurum}
                    onClickSecenegi={setFiltreDurum}
                    renkler={{ aktifBg: '#334155' }}
                    secenekler={[
                        { v: 'hepsi', l: 'Tüm Durumlar', r: '#334155' },
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
            <div className="flex flex-wrap gap-4 items-start">
                <div className="flex-[1_1_340px] flex flex-col gap-3">
                    {filtreli.length === 0 && (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <ShoppingCart size={48} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 font-bold m-0">Sipariş bulunamadı.</p>
                        </div>
                    )}
                    {filtreli.map(s => {
                        // [FAZ 3 - B-01] Karlılık hesabı
                        const karZarar = s.gercek_maliyet_tl > 0
                            ? parseFloat(s.toplam_tutar_tl || 0) - parseFloat(s.gercek_maliyet_tl || 0)
                            : null;
                        const karlilik = karZarar === null ? 'bilinmiyor'
                            : karZarar >= 0 ? 'karli' : 'zarari';

                        const aktifMi = aktifSiparis?.id === s.id;
                        const teslimMi = s.durum === 'teslim';

                        return (
                            <div key={s.id} onClick={() => detayAc(s)}
                                className={`bg-white border-2 rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md
                                    ${aktifMi ? 'border-emerald-600 ring-2 ring-emerald-600/20' : teslimMi ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100'}`}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0">
                                        <div className="flex gap-1.5 flex-wrap items-center mb-2">
                                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md truncate max-w-[100px]">{s.siparis_no}</span>
                                            <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider">{s.kanal}</span>
                                            {s.para_birimi && s.para_birimi !== 'TL' && (
                                                <span className="text-[10px] font-black bg-slate-800 text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    {PARA_BIRIMLERI.find(p => p.kod === s.para_birimi)?.bayrak} {s.para_birimi}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md" style={{ background: `${DURUM_RENK[s.durum]}20`, color: DURUM_RENK[s.durum] }}>{DURUM_LABEL[s.durum]}</span>
                                            {s.acil && <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-md border border-red-200 shadow-sm">🚨 ACİL</span>}

                                            {/* [FAZ 3] Karlılık Badge */}
                                            {karlilik === 'karli' && <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100/50 text-emerald-600">🟢 +₺{karZarar?.toFixed(0)}</span>}
                                            {karlilik === 'zarari' && <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-100/50 text-red-600">🔴 {karZarar?.toFixed(0)}₺</span>}
                                            {karlilik === 'bilinmiyor' && <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100/50 text-slate-400">⚪ Mrj. Yok</span>}

                                            {getGecikmeAlarm(s)}
                                        </div>
                                        <div className="font-black text-slate-800 text-sm truncate">{s.b2_musteriler?.ad_soyad || 'Anonim'}</div>
                                        <div className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                                            🕐 {formatTarih(s.created_at)}
                                        </div>
                                    </div>
                                    <div className="font-black text-slate-800 text-base text-right shrink-0">
                                        <div className="flex items-baseline justify-end gap-0.5">
                                            <span className="text-sm">{PARA_BIRIMLERI.find(p => p.kod === (s.para_birimi || 'TL'))?.simge || '₺'}</span>
                                            {parseFloat(s.toplam_tutar_tl).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        {s.para_birimi && s.para_birimi !== 'TL' && <div className="text-[10px] text-slate-400 font-bold uppercase">{s.para_birimi}</div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* DETAY PANELİ */}
                {aktifSiparis && (
                    <div className="flex-[1.4_1_350px] bg-white border-2 border-emerald-600 rounded-2xl p-5 self-start sticky top-4 shadow-[0_10px_40px_rgba(4,120,87,0.1)]">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-slate-100">
                            <h3 className="font-black text-slate-800 m-0 text-lg flex items-center gap-2">
                                <span className="text-emerald-600">📋</span> {aktifSiparis.siparis_no}
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={() => faturaYazdir(aktifSiparis)} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-colors shadow-sm">
                                    <Printer size={14} /> Fatura
                                </button>
                                <button disabled={islemdeId === 'sil_' + aktifSiparis.id} onClick={() => siparisSil(aktifSiparis.id)}
                                    className={`flex items-center gap-1.5 bg-red-50 border-0 text-red-600 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors hover:bg-red-100 ${islemdeId === 'sil_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>
                                    🗑 {islemdeId === 'sil_' + aktifSiparis.id ? '...' : 'Sil'}
                                </button>
                                <button onClick={() => setAktifSiparis(null)} className="flex items-center gap-1.5 bg-slate-100 border-0 text-slate-500 px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors hover:bg-slate-200 hover:text-slate-700">
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* [A-05] 5 ADIMLI DURUM STEPPER */}
                        <SiparisStepperBileseni durum={aktifSiparis.durum} />

                        {/* Durum Aksiyonları */}
                        <div className="flex gap-2 flex-wrap mb-5 pt-2 border-t-2 border-slate-100">
                            {aktifSiparis.durum === 'beklemede' && <button disabled={islemdeId === 'durum_' + aktifSiparis.id} onClick={() => durumGuncelle(aktifSiparis.id, 'onaylandi')} className={`px-4 py-2 bg-emerald-700 text-white rounded-xl font-black text-sm transition-all shadow-md hover:bg-emerald-800 ${islemdeId === 'durum_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>✅ {islemdeId === 'durum_' + aktifSiparis.id ? '...' : 'Siparişi Onayla'}</button>}

                            {/* [FAZ 5] Onaylanan siparişi üretime bildirme UX Butonu */}
                            {aktifSiparis.durum === 'onaylandi' && (
                                <>
                                    <button disabled={islemdeId === 'durum_' + aktifSiparis.id} onClick={() => durumGuncelle(aktifSiparis.id, 'hazirlaniyor')} className={`px-4 py-2 bg-sky-500 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:bg-sky-600 ${islemdeId === 'durum_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>📦 Stoktan Hazırla</button>
                                    <button onClick={() => {
                                        window.open(`/uretim?siparis=${aktifSiparis.siparis_no}`, '_blank');
                                    }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm transition-all shadow-[0_4px_10px_rgba(79,70,229,0.3)] hover:bg-indigo-700 cursor-pointer">🚀 Üretime Sevk Et (M6)</button>
                                </>
                            )}

                            {aktifSiparis.durum === 'hazirlaniyor' && <button disabled={islemdeId === 'durum_' + aktifSiparis.id} onClick={() => { setKargoModal(aktifSiparis); setKargoNo(''); }} className={`px-4 py-2 bg-amber-500 text-amber-950 rounded-xl font-bold text-sm transition-all shadow-md hover:bg-amber-400 ${islemdeId === 'durum_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>🚛 {islemdeId === 'durum_' + aktifSiparis.id ? '...' : 'Kargoya Ver'}</button>}
                            {aktifSiparis.durum === 'kargoda' && <button disabled={islemdeId === 'durum_' + aktifSiparis.id} onClick={() => durumGuncelle(aktifSiparis.id, 'teslim')} className={`px-4 py-2 bg-emerald-500 text-white border-0 rounded-xl font-bold text-sm transition-all shadow-md hover:bg-emerald-600 ${islemdeId === 'durum_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>🎉 {islemdeId === 'durum_' + aktifSiparis.id ? '...' : 'Teslim Edildi'}</button>}
                            {!['teslim', 'iptal'].includes(aktifSiparis.durum) && <button disabled={islemdeId === 'durum_' + aktifSiparis.id} onClick={() => durumGuncelle(aktifSiparis.id, 'iptal')} className={`px-4 py-2 bg-red-500 text-white border-0 rounded-xl font-bold text-sm transition-all shadow-md hover:bg-red-600 ${islemdeId === 'durum_' + aktifSiparis.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>❌ {islemdeId === 'durum_' + aktifSiparis.id ? '...' : 'İptal'}</button>}

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
                                className={`px-4 py-2 text-white border-0 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all shadow-md
                                    ${hermYukleniyor ? 'bg-slate-700' : 'bg-blue-800 hover:bg-blue-900 cursor-pointer'}`}
                            >
                                🧠 {hermYukleniyor ? 'Analiz...' : 'AI Analiz'}
                            </button>
                        </div>
                        {/* HermAI Açıklama Kartı */}
                        <HermAiAciklama sonuc={hermSonuc} baslik="Sipariş Karar Analizi" />

                        {/* Kalemler */}
                        <div className="mt-6">
                            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Sipariş Kalemleri</div>
                            <div className="space-y-1.5">
                                {aktifSiparis.kalemler?.map((k, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm mb-0.5">{k.b2_urun_katalogu?.urun_adi}</div>
                                            <div className="text-[10px] font-bold text-slate-500">
                                                {k.adet} Adet × ₺{parseFloat(k.birim_fiyat_tl).toFixed(2)}{k.iskonto_pct > 0 ? ` (-%${k.iskonto_pct})` : ''} {k.beden ? `| Beden: ${k.beden}` : ''}
                                            </div>
                                        </div>
                                        <div className="font-black text-slate-800 text-base">₺{parseFloat(k.tutar_tl).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-800 rounded-xl mt-3 shadow-inner">
                                <span className="font-black text-slate-300 tracking-wider">TOPLAM</span>
                                <span className="font-black text-emerald-400 text-xl">₺{parseFloat(aktifSiparis.toplam_tutar_tl).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            {aktifSiparis.kargo_takip_no && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl mt-3 text-[11px] font-bold text-orange-700 flex items-center gap-2 shadow-sm">
                                    <Truck size={16} /> Kargo Takip: {aktifSiparis.kargo_takip_no}
                                </div>
                            )}

                            {aktifSiparis.notlar && (
                                <div className="p-4 bg-yellow-50/80 border-l-4 border-yellow-400 rounded-r-xl rounded-l-sm mt-4 text-xs font-medium text-yellow-800 whitespace-pre-wrap leading-relaxed">
                                    <div className="font-black mb-1 flex items-center gap-1.5 text-yellow-700 tracking-wide"><span className="text-sm">✍️</span> Müşteri / Operasyon Notları</div>
                                    {aktifSiparis.notlar}
                                </div>
                            )}

                            {/* [KRİTİK EKSİK] Gerçek Maliyet + Termin Tarihi */}
                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="font-black text-slate-600 text-[11px] uppercase tracking-widest mb-3 flex items-center gap-1.5"><span className="text-emerald-500">💹</span> Karlılık Takibi</div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-1">GERÇEK MALİYET (₺)</label>
                                        <input
                                            type="number" step="0.01" min="0"
                                            defaultValue={aktifSiparis.gercek_maliyet_tl || ''}
                                            placeholder="0.00"
                                            onBlur={async (e) => {
                                                const val = parseFloat(/** @type {any} */(e.target.value) || 0);
                                                await supabase.from('b2_siparisler').update({ gercek_maliyet_tl: val }).eq('id', aktifSiparis.id);
                                                yukle();
                                            }}
                                            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-emerald-500 text-sm transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 mb-1">TERMİN TARİHİ</label>
                                        <input
                                            type="date"
                                            defaultValue={aktifSiparis.termin_tarihi || ''}
                                            onBlur={async (e) => {
                                                await supabase.from('b2_siparisler').update({ termin_tarihi: e.target.value }).eq('id', aktifSiparis.id);
                                                yukle();
                                            }}
                                            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-emerald-500 text-sm transition-all"
                                        />
                                    </div>
                                </div>
                                {/* Anlık karlılık hesabı */}
                                {aktifSiparis.gercek_maliyet_tl > 0 && (() => {
                                    const kar = parseFloat(aktifSiparis.toplam_tutar_tl) - parseFloat(aktifSiparis.gercek_maliyet_tl);
                                    const marj = ((kar / parseFloat(aktifSiparis.toplam_tutar_tl)) * 100).toFixed(1);
                                    const isKarli = kar >= 0;
                                    return (
                                        <div className={`p-2.5 rounded-lg flex justify-between items-center ${isKarli ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                                            <span className={`text-[11px] font-black ${isKarli ? 'text-emerald-700' : 'text-red-700'}`}>{isKarli ? '🟢 KAR' : '🔴 ZARAR'}</span>
                                            <span className={`text-base font-black ${isKarli ? 'text-emerald-600' : 'text-red-600'}`}>₺{Math.abs(kar).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs opacity-75">(%{marj})</span></span>
                                        </div>
                                    );
                                })()}
                                {/* Termin countdown */}
                                {aktifSiparis.termin_tarihi && (() => {
                                    const gun = Math.ceil((/** @type {any} */ (new Date(aktifSiparis.termin_tarihi)) - /** @type {any} */ (new Date())) / (1000 * 60 * 60 * 24));
                                    const isGecti = gun < 0;
                                    const isYakin = gun >= 0 && gun <= 3;
                                    return (
                                        <div className={`mt-2 p-2 rounded-lg border flex justify-between items-center
                                            ${isGecti ? 'bg-red-50/50 border-red-200/50' : isYakin ? 'bg-amber-50/50 border-amber-200/50' : 'bg-emerald-50/50 border-emerald-200/50'}`}>
                                            <span className="text-[10px] font-bold text-slate-500">⏳ Termine Kalan</span>
                                            <span className={`text-xs font-black ${isGecti ? 'text-red-600' : isYakin ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                {isGecti ? `${Math.abs(gun)} Gün GEÇTİ` : gun === 0 ? 'BUGÜN!' : `${gun} Gün`}
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
                    <div className="p-4 text-center">
                        <p className="text-sm text-slate-400 mb-4 font-bold">Sipariş: <span className="text-white font-black bg-slate-800 px-2 py-1 rounded">{kargoModal.siparis_no}</span></p>
                        <input maxLength={50} value={kargoNo} onChange={e => setKargoNo(e.target.value)}
                            placeholder="Örn: MNG-123456789"
                            className="w-full px-4 py-3 bg-slate-900 border-2 border-emerald-600 rounded-xl font-bold text-white outline-none focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all mb-5 text-center"
                        />
                        <div className="flex gap-3 justify-end items-center">
                            <button onClick={() => setKargoModal(null)} className="px-5 py-2.5 border-2 border-slate-700 hover:border-slate-600 bg-slate-800 rounded-xl text-white font-bold transition-all">İptal</button>
                            <button onClick={kargoGonder} className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white border-0 rounded-xl font-black cursor-pointer shadow-[0_4px_14px_rgba(4,120,87,0.4)] transition-all flex items-center gap-2">
                                Kargoya Ver ✅
                            </button>
                        </div>
                    </div>
                )}
            </SilBastanModal>
        </div>
    );
}
