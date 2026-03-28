'use client';
/**
 * features/siparisler/components/SiparislerMainContainer.js
 * Kaynak: app/siparisler/page.js
 * Spagetti koddan Modüler Clean Architecture'a geçirildi.
 */

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import { telegramBildirim } from '@/lib/utils';
import ErisimBariyeri from '@/lib/components/ui/ErisimBariyeri';
import SayfaBasligi from '@/components/ui/SayfaBasligi';
import FiltreDugmeleri from '@/components/ui/FiltreDugmeleri';
import SilBastanModal from '@/components/ui/SilBastanModal';
import { useHermAi } from '@/hooks/useHermAi';
import Link from 'next/link';

// Servis Katmanı & Alt Bileşenler
import {
    siparisleriVeBilesenleriGetir,
    siparisDetayiniGetir,
    siparisGercekZamanliKur,
    siparisKanaliniKapat,
    siparisDurumGuncelleVeOtonomTetikle,
    siparisVeBaglantilariSil,
    siparisGercekMaliyetVeyaTerminGuncelle
} from '../services/siparislerMainApi';
import SiparisIstatistikleriTab from './tabs/SiparisIstatistikleriTab';
import SiparisFormTab from './tabs/SiparisFormTab';
import SiparisGridTab from './tabs/SiparisGridTab';
import SiparisDetayPanel from './tabs/SiparisDetayPanel';

const KANALLAR = ['trendyol', 'amazon', 'magaza', 'toptan', 'diger'];
const BOSH_FORM = { musteri_id: '', siparis_no: '', kanal: 'magaza', notlar: '', acil: false, para_birimi: 'TL', odeme_yontemi: 'nakit', termin_tarihi: '' };

export default function SiparislerSayfasi() {
    const { kullanici: rawKullanici } = useAuth();
    const kullanici = rawKullanici;
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const { lang } = useLang();
    const { hermCalistir, hermSonuc, hermYukleniyor, hermTemizle } = useHermAi();

    // Datalar
    const [siparisler, setSiparisler] = useState([]);
    const [musteriler, setMusteriler] = useState([]);
    const [urunler, setUrunler] = useState([]);
    const [kalemler, setKalemler] = useState([]);

    // UI Durumları
    const [form, setForm] = useState(BOSH_FORM);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [aktifSiparis, setAktifSiparis] = useState(null);
    const [kargoModal, setKargoModal] = useState(null);
    const [kargoNo, setKargoNo] = useState('');
    const [islemdeId, setIslemdeId] = useState(null);

    // Filtre ve Arama
    const [filtreKanal, setFiltreKanal] = useState('hepsi');
    const [filtreDurum, setFiltreDurum] = useState('hepsi');
    const [filtreAcil, setFiltreAcil] = useState(false);
    const [aramaMetni, setAramaMetni] = useState('');

    // Pagination
    const [sayfaNo, setSayfaNo] = useState(0);
    const [dahaFazlaVar, setDahaFazlaVar] = useState(true);
    const SAYFA_BOYUTU = 50;
    const kanalRef = useRef(null);

    useEffect(() => {
        let satisPin = false;
        try { satisPin = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { satisPin = !!sessionStorage.getItem('sb47_uretim_pin'); }
        const erisebilir = kullanici?.grup === 'tam' || satisPin;
        setYetkiliMi(erisebilir);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && erisebilir && !kanalRef.current) {
                yukle(0, true);
                kanalRef.current = siparisGercekZamanliKur(() => yukle(0, true));
            } else if (document.visibilityState === 'hidden') {
                siparisKanaliniKapat(kanalRef.current);
                kanalRef.current = null;
            }
        };

        if (erisebilir) {
            kanalRef.current = siparisGercekZamanliKur(() => yukle(0, true));
            document.addEventListener('visibilitychange', handleVisibilityChange);
            yukle(0, true);
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            siparisKanaliniKapat(kanalRef.current);
        };
    }, [kullanici]);

    const goster = (text, type = 'success') => { setMesaj({ text, type }); setTimeout(() => setMesaj({ text: '', type: '' }), 5000); };

    const yukle = async (sayfa = 0, sifirla = true) => {
        setLoading(true);
        try {
            const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Bağlantı zaman aşımı')), 10000));
            const [sRes, mRes, uRes] = await siparisleriVeBilesenleriGetir(sayfa, SAYFA_BOYUTU, timeout);

            if (sRes?.status === 'fulfilled' && sRes.value.data) {
                setSiparisler(prev => sifirla ? sRes.value.data : [...prev, ...sRes.value.data]);
                setDahaFazlaVar(sRes.value.data.length === SAYFA_BOYUTU);
                setSayfaNo(sayfa);
            }
            if (mRes?.status === 'fulfilled' && mRes.value.data) setMusteriler(mRes.value.data);
            if (uRes?.status === 'fulfilled' && uRes.value.data) setUrunler(uRes.value.data);
        } catch (error) {
            goster('Sistem verileri alınamadı.', 'error');
        }
        setLoading(false);
    };

    const siparisNoUret = () => `SIP-${Date.now().toString().slice(-8)}`;
    const toplamHesapla = () => kalemler.reduce((s, k) => s + (parseInt(k.adet) || 0) * parseFloat(k.birim_fiyat_tl || 0) * (1 - (parseFloat(k.iskonto_pct) || 0) / 100), 0);

    const kaydet = async () => {
        if (!form.siparis_no.trim() || kalemler.length === 0) return goster('Sipariş no VE en az 1 kalem zorunlu!', 'error');
        if (kalemler.some(k => !k.urun_id)) return goster('Ürün seçimi zorunlu!', 'error');

        const enYuksekIskonto = Math.max(...kalemler.map(k => parseFloat(k.iskonto_pct) || 0));
        if (enYuksekIskonto > 10 && !yetkiliMi) return goster('Maksimum %10 iskonto! (Yetkisiz)', 'error');

        setLoading(true);
        try {
            const ozelNotlar = kalemler.filter(k => k.kalem_notu).map((k, idx) => `[K${idx + 1}]: ${k.kalem_notu}`).join('\n');
            const sonNot = [form.notlar.trim(), ozelNotlar].filter(Boolean).join('\n\n');

            const payload = {
                siparis: {
                    musteri_id: form.musteri_id || null, siparis_no: form.siparis_no.trim(),
                    kanal: form.kanal, toplam_tutar_tl: toplamHesapla(), notlar: sonNot || null,
                    acil: form.acil || false, para_birimi: form.para_birimi || 'TL', odeme_yontemi: form.odeme_yontemi || 'nakit',
                    termin_tarihi: form.termin_tarihi || null
                },
                kalemler: kalemler.map(k => ({
                    urun_id: k.urun_id, beden: k.beden || null, renk: k.renk || null,
                    adet: parseInt(k.adet), birim_fiyat_tl: parseFloat(k.birim_fiyat_tl), iskonto_pct: parseFloat(k.iskonto_pct) || 0,
                }))
            };

            const yanit = await fetch('/api/siparis-ekle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const sonuc = await yanit.json().catch(() => ({}));
            if (!yanit.ok) throw new Error(sonuc.hata || 'Sunucu hatası');

            goster('✅ Sipariş oluşturuldu!');
            telegramBildirim(`📦 YENİ SİPARİŞ ALINDI!\nSipariş No: ${form.siparis_no}\nDurum: BEKLEMEDE`);
            setForm(BOSH_FORM); setKalemler([]); setFormAcik(false); yukle(0, true);
        } catch (error) { goster('Kayıt Hatası: ' + error.message, 'error'); }
        finally { setLoading(false); }
    };

    const durumGuncelle = async (id, durum, ekstraBilgi = {}) => {
        if (islemdeId === 'durum_' + id) return;
        setIslemdeId('durum_' + id);
        try {
            const anaSiparis = siparisler.find(s => s.id === id);
            const r = await siparisDurumGuncelleVeOtonomTetikle(id, durum, ekstraBilgi, anaSiparis);
            goster(r.mesaj);
            if (r.telegram) telegramBildirim(r.telegram);
            if (aktifSiparis?.id === id) setAktifSiparis(prev => ({ ...prev, durum, ...ekstraBilgi }));
            yukle(0, true);
        } catch (error) { goster('Durum Güncelleme Hatası: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const kargoGonder = async () => {
        if (!kargoModal) return;
        await durumGuncelle(kargoModal.id, 'kargoda', { kargo_takip_no: kargoNo.trim() || null });
        setKargoModal(null); setKargoNo('');
    };

    const siparisSil = async (id) => {
        if (islemdeId === 'sil_' + id) return;
        setIslemdeId('sil_' + id);
        const { yetkili, mesaj: yetkiMesaj } = await silmeYetkiDogrula(kullanici);
        if (!yetkili) { setIslemdeId(null); return goster(yetkiMesaj || 'Yetkisiz işlem.', 'error'); }

        const anaSiparis = siparisler.find(s => s.id === id);
        if (anaSiparis?.durum !== 'beklemede' && anaSiparis?.durum !== 'iptal') {
            setIslemdeId(null); return goster('🔒 KİLİDİ: Onaylanmış fatura silinemez!', 'error');
        }

        if (!confirm('Sipariş silinsin mi?')) { setIslemdeId(null); return; }

        try {
            await siparisVeBaglantilariSil(id, anaSiparis, kullanici);
            goster('Sipariş silindi.');
            if (aktifSiparis?.id === id) setAktifSiparis(null);
            yukle(0, true);
        } catch (error) { goster('Silinemedi: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const detayAc = async (siparis) => {
        setAktifSiparis(siparis);
        try {
            const { data, error } = await siparisDetayiniGetir(siparis.id);
            if (error) throw error;
            setAktifSiparis({ ...siparis, kalemler: data || [] });
        } catch (error) { goster('Detaylar okunamadı.', 'error'); }
    };

    const gercekMaliyetGuncelle = async (id, miktar) => {
        await siparisGercekMaliyetVeyaTerminGuncelle(id, 'gercek_maliyet_tl', miktar);
        yukle(0, true);
    };

    const terminGuncelle = async (id, tarih) => {
        await siparisGercekMaliyetVeyaTerminGuncelle(id, 'termin_tarihi', tarih);
        yukle(0, true);
    };

    const filtreli = siparisler.filter(s => {
        const kanalOk = filtreKanal === 'hepsi' || s.kanal === filtreKanal;
        const durumOk = filtreDurum === 'hepsi' || s.durum === filtreDurum;
        const acilOk = !filtreAcil || s.acil === true;
        const aramaOk = !aramaMetni || [s.siparis_no, s.b2_musteriler?.ad_soyad, s.kanal].some(v => v?.toLowerCase().includes(aramaMetni.toLowerCase()));
        return kanalOk && durumOk && acilOk && aramaOk;
    });

    const istatistik = {
        toplam: siparisler.length, bekleyen: siparisler.filter(s => s.durum === 'beklemede').length,
        kargoda: siparisler.filter(s => s.durum === 'kargoda').length,
        gelir: siparisler.filter(s => s.durum === 'teslim').reduce((s, o) => s + parseFloat(o.toplam_tutar_tl || 0), 0),
        karliSiparis: siparisler.filter(s => s.gercek_maliyet_tl > 0 && s.toplam_tutar_tl > s.gercek_maliyet_tl).length,
        zararlıSiparis: siparisler.filter(s => s.gercek_maliyet_tl > 0 && s.toplam_tutar_tl <= s.gercek_maliyet_tl).length,
    };

    if (!yetkiliMi) return <ErisimBariyeri yetki={yetkiliMi} mesaj="Satış PİN veya Yetkili girişi gereklidir." />;

    return (
        <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <SayfaBasligi
                ikon={ShoppingCart} renkler={{ bg: 'linear-gradient(135deg,#047857,#065f46)' }}
                baslik={lang === 'ar' ? 'إدارة الطلبات' : 'Sipariş Yönetimi (Hazine)'} altBaslik={'Siber Otonom Yönetim Merkezi (M8)'}
                islemButonlari={
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <button onClick={() => { setForm({ ...BOSH_FORM, siparis_no: siparisNoUret() }); setFormAcik(!formAcik); }}
                            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold cursor-pointer shadow-md border-0 transition-transform hover:scale-105">
                            <Plus size={18} /> Yeni Sipariş
                        </button>
                        <Link href="/stok" className="flex-1 sm:flex-none no-underline">
                            <button className="w-full flex justify-center items-center gap-2 bg-slate-900 border border-slate-700 hover:bg-black text-white px-5 py-2.5 rounded-xl font-black cursor-pointer text-sm shadow-md transition-all">
                                📦 Stoklar (M11)
                            </button>
                        </Link>
                    </div>
                }
            />

            <SiparisIstatistikleriTab siparisler={siparisler} istatistik={istatistik} isAdmin={kullanici?.rol === 'admin'} />

            {mesaj.text && (
                <div className={`p-3 mb-4 rounded-xl font-bold text-sm border-2 animate-pulse ${mesaj.type === 'error' ? 'border-red-500 bg-red-950/20 text-red-500' : 'border-emerald-500 bg-emerald-950/20 text-emerald-500'}`}>
                    {mesaj.text}
                </div>
            )}

            {formAcik && (
                <SiparisFormTab
                    form={form} setForm={setForm} BOSH_FORM={BOSH_FORM}
                    kalemler={kalemler} setKalemler={setKalemler}
                    urunler={urunler} musteriler={musteriler}
                    kaydet={kaydet} loading={loading} setFormAcik={setFormAcik} goster={goster}
                />
            )}

            <div className="relative mb-4 max-w-sm">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                    placeholder="Sipariş no, müşteri, kanal ara..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#122b27] border border-[#1e4a43] rounded-xl font-bold text-slate-300 outline-none focus:border-emerald-500 transition-all text-sm" />
            </div>

            <div className="flex gap-2 mb-6 flex-wrap items-center bg-[#0d1117] text-white p-2 rounded-xl border border-[#1e4a43]">
                <FiltreDugmeleri
                    aktifDeger={filtreKanal} onClickSecenegi={setFiltreKanal} renkler={{ aktifBg: '#059669' }}
                    secenekler={[{ v: 'hepsi', l: 'Tüm Kanallar' }, ...KANALLAR.map(k => ({ v: k, l: k.charAt(0).toUpperCase() + k.slice(1) }))]}
                />
                <div className="w-[1px] h-6 bg-slate-700 mx-1 hidden sm:block" />
                <FiltreDugmeleri
                    aktifDeger={filtreDurum} onClickSecenegi={setFiltreDurum} renkler={{ aktifBg: '#334155' }}
                    secenekler={[
                        { v: 'hepsi', l: 'Tüm Durumlar', r: '#00000000' },
                        ...['beklemede', 'onaylandi', 'kargoda', 'teslim'].map(d => ({ v: d, l: d.toUpperCase(), r: '#00000000' }))
                    ]}
                />
                <FiltreDugmeleri
                    aktifDeger={filtreAcil ? 'acil' : 'hepsi'} onClickSecenegi={() => setFiltreAcil(!filtreAcil)}
                    secenekler={[{ v: 'acil', l: '🚨 Sadece Acil', r: '#ef4444', isBooleanActive: filtreAcil }]}
                />
            </div>

            <div className="flex flex-wrap gap-4 items-start">
                <SiparisGridTab
                    filtreli={filtreli} aktifSiparis={aktifSiparis} detayAc={detayAc} dahaFazlaVar={dahaFazlaVar}
                    yukle={yukle} sayfaNo={sayfaNo} loading={loading} siparislerLength={siparisler.length} SAYFA_BOYUTU={SAYFA_BOYUTU}
                />
                <SiparisDetayPanel
                    aktifSiparis={aktifSiparis} setAktifSiparis={setAktifSiparis} siparisSil={siparisSil} durumGuncelle={durumGuncelle}
                    islemdeId={islemdeId} setKargoModal={setKargoModal} setKargoNo={setKargoNo}
                    hermTemizle={hermTemizle} hermCalistir={hermCalistir} hermYukleniyor={hermYukleniyor} hermSonuc={hermSonuc}
                    siparisler={siparisler} gercekMaliyetGuncelle={gercekMaliyetGuncelle} terminGuncelle={terminGuncelle}
                />
            </div>

            <SilBastanModal title="🚛 Kargo Takip Numarası" acik={!!kargoModal} onClose={() => setKargoModal(null)}>
                {kargoModal && (
                    <div className="p-4 text-center">
                        <p className="text-sm text-slate-400 mb-4 font-bold">Sipariş: <span className="text-white font-black bg-slate-800 px-2 py-1 rounded">{kargoModal.siparis_no}</span></p>
                        <input maxLength={50} value={kargoNo} onChange={e => setKargoNo(e.target.value)} placeholder="Örn: MNG-123456789" className="w-full px-4 py-3 bg-slate-900 border-2 border-emerald-600 rounded-xl font-bold text-white outline-none focus:border-emerald-400 text-center mb-5" />
                        <div className="flex gap-3 justify-end items-center">
                            <button onClick={() => setKargoModal(null)} className="px-5 py-2.5 border-2 border-slate-700 hover:border-slate-600 bg-slate-800 rounded-xl text-white font-bold transition-all cursor-pointer">İptal</button>
                            <button onClick={kargoGonder} className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white border-0 rounded-xl font-black cursor-pointer shadow-md transition-all flex items-center gap-2">
                                Kargoya Ver ✅
                            </button>
                        </div>
                    </div>
                )}
            </SilBastanModal>
        </div>
    );
}
