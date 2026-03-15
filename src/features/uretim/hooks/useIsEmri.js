/**
 * features/uretim/hooks/useIsEmri.js
 * Üretim Bandı — Tüm İş Emri + Maliyet + Devir Mantığı
 * Bu hook, uretim/page.js'ten tüm logic'i taşır.
 */
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';

export const DEPARTMANLAR = [
    { id: 'is_emri', ad: 'İş Emirleri' },
    { id: 'kesim', ad: 'Bant & Montaj' },
    { id: 'kalite', ad: 'Kalite & Süre' },
    { id: 'maliyet', ad: 'Maliyet Girişi' },
    { id: 'devir', ad: 'Mağazaya Sevk' },
    { id: 'takip', ad: 'Canlı Pano' },
];

export const DURUS_KODLARI = [
    { kod: 'MAK-ARZ', etki: false },
    { kod: 'MLZ-EKS', etki: false },
    { kod: 'KIS-HTA', etki: true },
    { kod: 'TVL-MOL', etki: false },
    { kod: 'OGL-MOL', etki: false },
    { kod: 'SEF-BKL', etki: false },
];

export const MALIYET_TIPLERI = [
    { deger: 'personel_iscilik', etiket: 'Personel İşçilik' },
    { deger: 'isletme_gideri', etiket: 'İşletme Gideri' },
    { deger: 'sarf_malzeme', etiket: 'Sarf Malzeme' },
];

export const ST_RENK = { pending: '#f59e0b', in_progress: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' };
export const ST_LABEL = { pending: 'Bekliyor', in_progress: 'Üretimde', completed: 'Tamamlandı', cancelled: 'İptal' };
// [A1 FIX] status değeri tanımsız gelirse varsayılan renk/etiket döner — TypeError: Cannot read '.bg' of undefined hatası engellendi
export const getST_RENK = (status) => ST_RENK[status] ?? '#94a3b8';
export const getST_LABEL = (status) => ST_LABEL[status] ?? status ?? 'Bilinmiyor';

const BOSH_FORM_ORDER = { model_id: '', quantity: '', planned_start_date: '', planned_end_date: '' };
const BOSH_MALIYET_FORM = { order_id: '', maliyet_tipi: 'personel_iscilik', tutar_tl: '', kalem_aciklama: '' };

export function useIsEmri(kullanici) {
    const [dept, setDept] = useState('is_emri');
    const [orders, setOrders] = useState([]);
    const [personel, setPersonel] = useState([]);
    const [maliyetler, setMaliyetler] = useState([]);
    const [raporlar, setRaporlar] = useState([]);
    const [modeller, setModeller] = useState([]);
    const [formOrder, setFormOrder] = useState(BOSH_FORM_ORDER);
    const [formAcik, setFormAcik] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [kronometer, setKronometer] = useState({});
    const [sure, setSure] = useState({});
    const [maliyetForm, setMaliyetForm] = useState(BOSH_MALIYET_FORM);
    const [maliyetFormAcik, setMaliyetFormAcik] = useState(false);
    const [aramaMetni, setAramaMetni] = useState('');
    const [filtreDurum, setFiltreDurum] = useState('hepsi');
    const [duzenleId, setDuzenleId] = useState(null);
    const [barkodOkutulanIsId, setBarkodOkutulanIsId] = useState('');
    const [seciliSiparisler, setSeciliSiparisler] = useState([]);
    const [islemdeId, setIslemdeId] = useState(null); // [SPAM ZIRHI]

    const timerRef = useRef({});
    const barkodInputRef = useRef(null);
    const goster = createGoster(setMesaj);

    // ── YÜKLE ──────────────────────────────────────────────────────────────
    const yukle = useCallback(async () => {
        setLoading(true);
        try {
            const timeout = (ms) => new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı')), ms));
            const [mRes, oRes, pRes] = await Promise.all([
                Promise.race([supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').limit(500), timeout(10000)]),
                Promise.race([supabase.from('production_orders').select('*').order('created_at', { ascending: false }).limit(200), timeout(10000)]),
                Promise.race([supabase.from('b1_personel').select('id,personel_kodu,ad_soyad,rol,durum,saatlik_ucret_tl').eq('durum', 'aktif').order('ad_soyad').limit(100), timeout(10000)]),
            ]);
            const modellerData = mRes.data || [];
            if (modellerData.length > 0) setModeller(modellerData);
            if (oRes.data) {
                const enriched = oRes.data.map(o => ({
                    ...o,
                    b1_model_taslaklari: modellerData.find(m => m.id === o.model_id) || { model_kodu: '?', model_adi: 'Model bulunamadı' }
                }));
                setOrders(enriched);
            }
            if (pRes.data) setPersonel(pRes.data);
            if (dept === 'maliyet' || dept === 'devir') {
                const [malRes, rRes] = await Promise.all([
                    Promise.race([supabase.from('b1_maliyet_kayitlari').select('*').order('created_at', { ascending: false }).limit(200), timeout(10000)]),
                    Promise.race([supabase.from('b1_muhasebe_raporlari').select('*').order('created_at', { ascending: false }).limit(100), timeout(10000)]),
                ]);
                if (malRes.data) setMaliyetler(malRes.data);
                if (rRes.data) setRaporlar(rRes.data);
            }
        } catch (e) {
            goster('Sistem veri yükleme hatası: ' + e.message, 'error');
        }
        setLoading(false);
    }, [dept, kullanici]);

    // ── REALTIME BAĞLANTISI ────────────────────────────────────────────────
    useEffect(() => {
        // [A1 FIX] Hem sb47_uretim_token hem sb47_uretim_pin token anahtarları destekleniyor
        const uretimPin = typeof window !== 'undefined' && (
            !!sessionStorage.getItem('sb47_uretim_token') ||
            !!sessionStorage.getItem('sb47_uretim_pin')
        );
        const yetkili = kullanici?.grup === 'tam' || uretimPin;
        if (!yetkili) return;

        const kanal = supabase.channel('islem-gercek-zamanli-ai')
            .on('postgres_changes', { event: '*', schema: 'public' }, yukle)
            .subscribe();
        yukle();
        return () => supabase.removeChannel(kanal);
    }, [dept, kullanici]);

    useEffect(() => {
        // [C1 FIX] Tarayıcı çökerse veya yenilenirse kronometre uçmasın (Crash Recovery)
        try {
            const kayitli = JSON.parse(localStorage.getItem('m14_kronometre_yedek')) || {};
            const yeniKronometer = {};
            const yeniSure = {};
            let devamEdenVarMi = false;

            Object.keys(kayitli).forEach(id => {
                yeniKronometer[id] = kayitli[id];
                if (kayitli[id].aktif) {
                    devamEdenVarMi = true;
                    const baslangic_gercek = kayitli[id].baslangic;
                    yeniSure[id] = Math.floor((Date.now() - baslangic_gercek) / 1000);

                    timerRef.current[id] = setInterval(() => {
                        setSure(prev => ({ ...prev, [id]: Math.floor((Date.now() - baslangic_gercek) / 1000) }));
                    }, 1000);
                } else {
                    // Duraklatılmışsa süresini de kurtaralım
                    yeniSure[id] = kayitli[id].birikmis_sn || 0;
                }
            });
            if (Object.keys(yeniKronometer).length > 0) {
                setKronometer(prev => ({ ...prev, ...yeniKronometer }));
                setSure(prev => ({ ...prev, ...yeniSure }));
            }
        } catch (e) { }

        return () => Object.values(timerRef.current).forEach(clearInterval);
    }, []);

    // ── DURUM GÜNCELLE ─────────────────────────────────────────────────────
    const durumGuncelle = async (id, status) => {
        if (islemdeId === 'durum_' + id) return;
        setIslemdeId('durum_' + id);
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('production_orders', 'UPDATE', { id, status });
            setIslemdeId(null);
            return goster('⚡ Çevrimdışı: Durum kuyruğa alındı.');
        }
        try {
            const { error } = await supabase.from('production_orders').update({ status }).eq('id', id);
            if (error) throw error;
            goster('Durum güncellendi.');
            if (status === 'in_progress') telegramBildirim('🏭 ÜRETİM BAŞLADI');
            if (status === 'completed') telegramBildirim('✅ ÜRETİM TAMAMLANDI');
            yukle();
        } catch (e) { goster('Durum hatası: ' + e.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    // ── KRONOMETREyi DURDUR + PERFORMANS PUANLA ────────────────────────────
    const durdurVePerformansPuanla = async (id) => {
        clearInterval(timerRef.current[id]);
        const toplamSn = sure[id] || 0;
        const sureDk = Math.max(1, Math.round(toplamSn / 60)); // Minimum 1 dakika yazılsın

        setKronometer(prev => {
            const n = { ...prev };
            delete n[id];
            localStorage.setItem('m14_kronometre_yedek', JSON.stringify(n));
            return n;
        });
        setSure(prev => {
            const ns = { ...prev };
            delete ns[id];
            return ns;
        });

        const dakikaUcret = parseFloat(process.env.NEXT_PUBLIC_DAKIKA_UCRETI || '2.50');
        const anaSiparis = orders.find(x => x.id === id);
        const zorlukKatsayisi = anaSiparis?.b1_model_taslaklari?.talep_skoru ? (anaSiparis.b1_model_taslaklari.talep_skoru / 5) : 1.2;
        let liyakatYildiz = sureDk < 60 ? '⭐⭐⭐⭐⭐' : sureDk < 120 ? '⭐⭐⭐⭐' : '⭐⭐';

        if (toplamSn > 0) {
            try {
                const tutar = sureDk * dakikaUcret * zorlukKatsayisi;
                await supabase.from('b1_maliyet_kayitlari').insert([{
                    order_id: id, maliyet_tipi: 'personel_iscilik', tutar_tl: tutar,
                    kalem_aciklama: `Kronometre: ${formatSure(toplamSn)} (${sureDk} dk) | x${zorlukKatsayisi.toFixed(1)} - ${liyakatYildiz}`,
                    onay_durumu: 'hesaplandi'
                }]);
            } catch (e) { }
        }
    };

    // ── BARKODLU OTONOM ─────────────────────────────────────────────────────
    const barkodlaOtonomIslemYap = async (is_id) => {
        if (!is_id) return;
        const o = orders.find(x => x.id === is_id || x.id == is_id);
        if (!o) return goster('Barkod sistemde bulunamadı!', 'error');
        if (o.status === 'pending') {
            await durumGuncelle(o.id, 'in_progress');
            goster(`⏱️ OTONOM BAŞLATMA: [ID: ${o.id}] bantta.`);
            baslat(o.id);
        } else if (o.status === 'in_progress') {
            const gecenSn = sure[o.id] || 0;
            if (gecenSn < 15) {
                setBarkodOkutulanIsId('');
                return goster('🚨 MANİPÜLASYON TESPİTİ: Spam barkod engellendi.', 'error');
            }
            await durdurVePerformansPuanla(o.id);
            await durumGuncelle(o.id, 'completed');
            goster('✅ OTONOM BİTİRME: İş kapatıldı.');
        } else if (o.status === 'completed') {
            setBarkodOkutulanIsId('');
            return goster('🔒 DİJİTAL KİLİT: Tamamlanmış paket tekrar açılamaz!', 'error');
        }
        setBarkodOkutulanIsId('');
        if (barkodInputRef.current) barkodInputRef.current.focus();
    };

    // ── YENİ / DÜZENLE İŞ EMRİ ─────────────────────────────────────────────
    const yeniIsEmri = async () => {
        if (islemdeId === 'kayit') return;
        setIslemdeId('kayit');
        if (!formOrder.model_id) { setIslemdeId(null); return goster('Model seçiniz!', 'error'); }
        if (!formOrder.quantity || parseInt(formOrder.quantity) < 1) { setIslemdeId(null); return goster('Adet giriniz!', 'error'); }
        setLoading(true);
        try {
            if (duzenleId) {
                const { data: eskiKayit } = await supabase.from('production_orders').select('status').eq('id', duzenleId).single();
                if (eskiKayit?.status === 'completed') {
                    setLoading(false);
                    setIslemdeId(null);
                    return goster('🔒 DİJİTAL ADALET: Tamamlanmış paket güncellenemez.', 'error');
                }
                const { error } = await supabase.from('production_orders').update({
                    model_id: formOrder.model_id, quantity: parseInt(formOrder.quantity),
                    planned_start_date: formOrder.planned_start_date || null,
                    planned_end_date: formOrder.planned_end_date || null,
                }).eq('id', duzenleId);
                if (error) throw error;
                goster('✅ İş emri güncellendi.');
                setFormOrder(BOSH_FORM_ORDER); setFormAcik(false); setDuzenleId(null); yukle();
            } else {
                const { data: mevcut } = await supabase.from('production_orders')
                    .select('id').eq('model_id', formOrder.model_id).in('status', ['pending', 'in_progress']);
                if (mevcut?.length > 0) { setLoading(false); setIslemdeId(null); return goster('⚠️ Bu model için bekleyen iş emri mevcut!', 'error'); }
                const { error } = await supabase.from('production_orders').insert([{
                    model_id: formOrder.model_id, quantity: parseInt(formOrder.quantity), status: 'pending',
                    planned_start_date: formOrder.planned_start_date || null,
                    planned_end_date: formOrder.planned_end_date || null,
                }]);
                if (!error) {
                    goster('İş emri oluşturuldu.');
                    telegramBildirim(`📋 YENİ İŞ EMRİ\nAdet: ${formOrder.quantity}`);
                    setFormOrder(BOSH_FORM_ORDER); setFormAcik(false); yukle();
                } else throw error;
            }
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        finally { setLoading(false); setIslemdeId(null); }
    };

    const duzenleIsEmri = (o) => {
        setFormOrder({ model_id: o.model_id || '', quantity: String(o.quantity || ''), planned_start_date: o.planned_start_date || '', planned_end_date: o.planned_end_date || '' });
        setDuzenleId(o.id); setFormAcik(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── TOPLU GÜNCELLE ─────────────────────────────────────────────────────
    const toggleSiparisSec = (id) => setSeciliSiparisler(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const tumunuSec = (gorunenSiparisler) => {
        if (seciliSiparisler.length === gorunenSiparisler.length) setSeciliSiparisler([]);
        else setSeciliSiparisler(gorunenSiparisler.map(o => o.id));
    };
    const topluDurumGuncelleAction = async (yeniDurum) => {
        if (islemdeId === 'toplu_guncelle') return;
        setIslemdeId('toplu_guncelle');
        if (seciliSiparisler.length === 0) { setIslemdeId(null); return goster('Lütfen sipariş seçin!', 'error'); }
        if (!confirm(`${seciliSiparisler.length} siparişi toplu güncellemek istiyorsunuz?`)) { setIslemdeId(null); return; }
        setLoading(true);
        try {
            const { error } = await supabase.from('production_orders').update({ status: yeniDurum }).in('id', seciliSiparisler);
            if (error) throw error;
            goster(`✅ ${seciliSiparisler.length} sipariş güncellendi!`);
            telegramBildirim(`📦 TOPLU İŞLEM\n${seciliSiparisler.length} iş emri güncellendi.`);
            setSeciliSiparisler([]); yukle();
        } catch (e) { goster('Toplu hata: ' + e.message, 'error'); }
        finally { setLoading(false); setIslemdeId(null); }
    };

    // ── SİL / ARŞİVLE ──────────────────────────────────────────────────────
    const silIsEmri = async (id) => {
        if (islemdeId === 'sil_' + id) return;
        setIslemdeId('sil_' + id);
        const { yetkili, mesaj: yMsg } = await silmeYetkiDogrula(kullanici, 'Yönetici PIN kodunuzu girin:');
        if (!yetkili) { setIslemdeId(null); return goster(yMsg || 'Yetkisiz.', 'error'); }
        if (!confirm('İş emri arşive (iptal) kaldırılsın mı?')) { setIslemdeId(null); return; }
        try {
            await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'production_orders', islem_tipi: 'ARŞİVLEME', kullanici_adi: 'Saha Yetkilisi', eski_veri: { is_emri_id: id } }]);
            const { error } = await supabase.from('production_orders').update({ status: 'cancelled' }).eq('id', id);
            if (error) throw error;
            goster('İş emri arşive kaldırıldı.');
            telegramBildirim('🗑️ İŞ EMRİ İPTALİ\nBir iş emri arşive kaldırıldı.');
            yukle();
        } catch (e) { goster('Arşivleme hatası: ' + e.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    // ── KRONOMETREyİ BAŞLAT / DURDUR ───────────────────────────────────────
    const baslat = (id) => {
        const oncekiSn = sure[id] || 0;
        const baslangic = Date.now() - (oncekiSn * 1000);

        setKronometer(prev => {
            const n = { ...prev, [id]: { aktif: true, baslangic } };
            localStorage.setItem('m14_kronometre_yedek', JSON.stringify(n));
            return n;
        });

        if (timerRef.current[id]) clearInterval(timerRef.current[id]);

        timerRef.current[id] = setInterval(() => {
            setSure(prev => ({ ...prev, [id]: Math.floor((Date.now() - baslangic) / 1000) }));
        }, 1000);
        goster('⏱️ Üretim süreci başlatıldı / devam ediyor.');
    };

    const duraklat = (id) => {
        clearInterval(timerRef.current[id]);
        const anlikSure = sure[id] || 0;
        setKronometer(prev => {
            const n = { ...prev, [id]: { aktif: false, birikmis_sn: anlikSure } };
            localStorage.setItem('m14_kronometre_yedek', JSON.stringify(n));
            return n;
        });
        goster('⏸️ Üretim duraklatıldı. Süre kaydı korundu.');
    };

    const durdur = async (id) => { await durdurVePerformansPuanla(id); goster('✋ Kronometre kapatıldı ve maliyet yazıldı.'); };
    const formatSure = (s) => { const d = Math.floor((s || 0) / 60); const sn = (s || 0) % 60; return `${String(d).padStart(2, '0')}:${String(sn).padStart(2, '0')}`; };

    // ── MALİYET KAYDET ─────────────────────────────────────────────────────
    const maliyetKaydet = async () => {
        if (islemdeId === 'maliyet_kayit') return;
        setIslemdeId('maliyet_kayit');
        if (!maliyetForm.order_id) { setIslemdeId(null); return goster('İş emri seçiniz!', 'error'); }
        if (!maliyetForm.tutar_tl || parseFloat(maliyetForm.tutar_tl) <= 0) { setIslemdeId(null); return goster('Tutar giriniz!', 'error'); }
        if (!maliyetForm.kalem_aciklama.trim()) { setIslemdeId(null); return goster('Açıklama zorunlu!', 'error'); }
        setLoading(true);
        try {
            const { error } = await supabase.from('b1_maliyet_kayitlari').insert([{
                order_id: maliyetForm.order_id, maliyet_tipi: maliyetForm.maliyet_tipi,
                tutar_tl: parseFloat(maliyetForm.tutar_tl), kalem_aciklama: maliyetForm.kalem_aciklama.trim(),
                onay_durumu: 'hesaplandi'
            }]);
            if (!error) {
                goster('Maliyet kaydedildi.');
                setMaliyetForm(BOSH_MALIYET_FORM); setMaliyetFormAcik(false); yukle();
            } else throw error;
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        finally { setLoading(false); setIslemdeId(null); }
    };

    // ── DEVİR YAP ─────────────────────────────────────────────────────────
    const devirYap = async (orderId) => {
        if (islemdeId === 'devir_' + orderId) return;
        setIslemdeId('devir_' + orderId);
        const { yetkili, mesaj: yMsg } = await silmeYetkiDogrula(kullanici, 'Devir için PIN girin:');
        if (!yetkili) { setIslemdeId(null); return goster(yMsg || 'Yetkisiz.', 'error'); }
        if (!confirm('Bu partiyi 2. Birime devredeceksiniz. Onaylıyor musunuz?')) { setIslemdeId(null); return; }
        setLoading(true);
        try {
            const { data: mevcut } = await supabase.from('b1_muhasebe_raporlari').select('id').eq('order_id', orderId);
            if (mevcut?.length > 0) { setLoading(false); setIslemdeId(null); return goster('⚠️ Bu iş emri için devir raporu zaten mevcut!', 'error'); }
            const pt = maliyetler.filter(m => m.order_id === orderId).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
            const { error } = await supabase.from('b1_muhasebe_raporlari').insert([{
                order_id: orderId, gerceklesen_maliyet_tl: pt, net_uretilen_adet: 0, zayiat_adet: 0, rapor_durumu: 'taslak', devir_durumu: false
            }]);
            if (!error) { goster('Devir başlatıldı. M8 Muhasebede rapor oluşturuldu.'); yukle(); }
            else throw error;
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        finally { setLoading(false); setIslemdeId(null); }
    };

    return {
        // State
        dept, setDept, orders, personel, maliyetler, raporlar, modeller,
        formOrder, setFormOrder, formAcik, setFormAcik, loading, mesaj,
        kronometer, sure, maliyetForm, setMaliyetForm, maliyetFormAcik, setMaliyetFormAcik,
        aramaMetni, setAramaMetni, filtreDurum, setFiltreDurum, duzenleId,
        barkodOkutulanIsId, setBarkodOkutulanIsId, seciliSiparisler, barkodInputRef,
        islemdeId, setIslemdeId, // [SPAM ZIRHI]
        // Fonksiyonlar
        yukle, durumGuncelle, baslat, duraklat, durdur, formatSure, barkodlaOtonomIslemYap,
        yeniIsEmri, duzenleIsEmri, silIsEmri, maliyetKaydet, devirYap,
        toggleSiparisSec, tumunuSec, topluDurumGuncelleAction,
    };
}
