'use client';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, Lock, Trash2, Edit2, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createGoster, telegramBildirim, formatTarih, yetkiKontrol } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { silmeYetkiDogrula } from '@/lib/silmeYetkiDogrula';
import Link from 'next/link';

export default function MuhasebeMainContainer() {
    const { kullanici: rawKullanici } = useAuth();
    const kullanici = /** @type {any} */ (rawKullanici);
    const [yetkiliMi, setYetkiliMi] = useState(false);
    const { lang } = useLang();  // Context'ten al — anlık güncelleme
    const [raporlar, setRaporlar] = useState(/** @type {any[]} */([]));
    const [secilenRapor, setSecilenRapor] = useState(/** @type {any} */(null));
    const [ilgiliMaliyetler, setIlgiliMaliyetler] = useState(/** @type {any[]} */([]));
    const [loading, setLoading] = useState(false);
    const [mesaj, setMesaj] = useState({ text: '', type: '' });
    const [raporsizemOrders, setRaporsizemOrders] = useState(/** @type {any[]} */([]));
    const [aramaMetni, setAramaMetni] = useState('');
    const [duzenleModal, setDuzenleModal] = useState(/** @type {any} */(null)); // { id, zayiat_adet, hedeflenen_maliyet_tl, notlar }
    const [duzenleForm, setDuzenleForm] = useState(/** @type {any} */({ zayiat_adet: '', hedeflenen_maliyet_tl: '', notlar: '', ek_maliyet_tl: '' }));
<<<<<<< HEAD
    const [islemdeId, setIslemdeId] = useState(/** @type {any} */(null)); // ÇİFT TIKLAMA KORUMASI
=======
    const [islemdeId, setIslemdeId] = useState(/** @type {any} */(null)); // [SPAM ZIRHI]
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

    useEffect(() => {
        let uretimPin = !!sessionStorage.getItem('sb47_uretim_token');
        const isYetkili = kullanici?.grup === 'tam' || uretimPin;
        setYetkiliMi(isYetkili);

        let kanal;
        const baslatKanal = () => {
            if (isYetkili && !document.hidden) {
<<<<<<< HEAD
                // PERFORMANS OPTİMİZASYONU: Realtime WebSocket
=======
                // [AI ZIRHI]: Realtime WebSocket (Visibility Optimizasyonu)
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                kanal = supabase.channel('muhasebe-gercek-zamanli-optimize')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_muhasebe_raporlari' }, yukle)
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
            const req1 = supabase.from('b1_muhasebe_raporlari').select('*').order('created_at', { ascending: false }).limit(200);
<<<<<<< HEAD

            // VERİ BÜTÜNLÜĞÜ: Model Taslakları yerine tamamlanmış İş Emirleri (production_orders) referans alınıyor
            const req2 = supabase.from('production_orders')
                .select('id, quantity, status, b1_model_taslaklari:model_id(model_kodu, model_adi)')
                .eq('status', 'completed')
                .order('updated_at', { ascending: false }).limit(200);

=======
            const req2 = supabase.from('b1_model_taslaklari').select('id, model_kodu, model_adi, hedef_adet').eq('durum', 'tamamlandi').order('created_at', { ascending: false }).limit(200);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            const timeoutPromise = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Bağlantı zaman aşımı (10 sn)')), 10000));
            const [rRes, mRes] = await Promise.race([
                Promise.allSettled([req1, req2]),
                timeoutPromise()
            ]);

            let currentRaporlar = [];
            if (rRes.status === 'fulfilled' && rRes.value.data) {
                currentRaporlar = rRes.value.data;
<<<<<<< HEAD
            }
            if (mRes.status === 'fulfilled' && mRes.value.data) {
                // b1_muhasebe_raporlari'ndaki (order_id) production_orders.id'sini temsil eder. 
                // Ekleme ile map yapıyoruz ki isimler ve kodlar raporlarda görünsün.
                currentRaporlar = currentRaporlar.map(r => {
                    const eslesenEmir = mRes.value.data.find(o => o.id === r.order_id);
                    return {
                        ...r,
                        model_kodu: eslesenEmir?.b1_model_taslaklari?.model_kodu || r.model_kodu || null,
                        model_adi: eslesenEmir?.b1_model_taslaklari?.model_adi || r.model_adi || null
                    };
                });
                setRaporlar(currentRaporlar);
                const raporOrderIds = new Set(currentRaporlar.map(r => r.order_id));
                // Model ID asimetrisi giderildiği için listeye doğrudan emir.id ve birleşik model verileri set edilecek:
                const maplenmisEmirler = mRes.value.data.map(o => ({
                    id: o.id,
                    model_kodu: o.b1_model_taslaklari?.model_kodu || 'Bilinmiyor',
                    model_adi: o.b1_model_taslaklari?.model_adi || 'Bilinmeyen Model',
                    hedef_adet: o.quantity || 0
                }));
                setRaporsizemOrders(maplenmisEmirler.filter(o => !raporOrderIds.has(o.id)));
=======
                setRaporlar(currentRaporlar);
            }
            if (mRes.status === 'fulfilled' && mRes.value.data) {
                const raporOrderIds = new Set(currentRaporlar.map(r => r.order_id));
                setRaporsizemOrders(mRes.value.data.filter(o => !raporOrderIds.has(o.id)));
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            }
        } catch (error) { goster('Ağ bağlantısı koptu! ' + error.message, 'error'); }
        setLoading(false);
    };

    const raporSec = async (rapor) => {
        setSecilenRapor(rapor);
        try {
            const { data, error } = await supabase.from('b1_maliyet_kayitlari').select('*').eq('order_id', rapor.order_id).order('created_at').limit(500);
            if (error) throw error;
            setIlgiliMaliyetler(data || []);
        } catch (error) { goster('Detay yüklenemedi: ' + error.message, 'error'); }
    };

    const durumGuncelle = async (id, yeniDurum) => {
        if (islemdeId === id) return;
        setIslemdeId(id);
        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'UPDATE', { id, rapor_durumu: yeniDurum, ...(yeniDurum === 'onaylandi' ? { onay_tarihi: new Date().toISOString() } : {}) });
            if (secilenRapor?.id === id) setSecilenRapor(prev => ({ ...prev, rapor_durumu: yeniDurum }));
            setIslemdeId(null);
            return goster('⚡ Çevrimdışı: Durum değişikliği kuyruğa alındı.');
        }
        try {
            const { error } = await supabase.from('b1_muhasebe_raporlari').update({
                rapor_durumu: yeniDurum,
                ...(yeniDurum === 'onaylandi' ? { onay_tarihi: new Date().toISOString() } : {}),
            }).eq('id', id);
            if (error) throw error;
            goster(`✅ Rapor durumu: ${yeniDurum}`); yukle();
            if (secilenRapor?.id === id) setSecilenRapor(prev => ({ ...prev, rapor_durumu: yeniDurum }));
            telegramBildirim(`📋 MUHASEBE GÜNCELLEMESİ:\nBir raporun durumu değiştirildi: ${yeniDurum.toUpperCase()}`);
        } catch (error) { goster('Hata: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const devirKapat = async (rapor) => {
        if (islemdeId === 'devir_' + rapor.id) return;
        setIslemdeId('devir_' + rapor.id);
        const { yetkili: dYetkili, mesaj: dYetkiMesaj } = await silmeYetkiDogrula(
            /** @type {any} */(kullanici)
        );
        if (!dYetkili) { setIslemdeId(null); return goster(dYetkiMesaj || 'Yetkisiz işlem.', 'error'); }
        if (!confirm('Bu raporu onaylıyor ve 2. Birime devir için kilitleniyor musunuz?')) { setIslemdeId(null); return; }

        if (!navigator.onLine) {
            await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'UPDATE', { id: rapor.id, rapor_durumu: 'kilitlendi', devir_durumu: true, onay_tarihi: new Date().toISOString() });
            setSecilenRapor(null);
            setIslemdeId(null);
            return goster('⚡ Çevrimdışı: Devir kilitlenme komutu kuyruğa yazıldı!');
        }

        try {
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b1_muhasebe_raporlari', islem_tipi: 'UPDATE', kullanici_adi: kullanici?.label || 'Muhasebe Yetkilisi',
                    eski_veri: { mesaj: rapor.model_kodu + ' numarali emrin muhasebesi kilitlendi ve devre verildi.' }
                }]);
<<<<<<< HEAD
            } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: MuhasebeMainContainer.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }
=======
            } catch (e) { console.error('[SİSTEM HATASI] Muhasebe JSON Parse:', e); }
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

            const { error } = await supabase.from('b1_muhasebe_raporlari').update({
                rapor_durumu: 'kilitlendi', devir_durumu: true, onay_tarihi: new Date().toISOString()
            }).eq('id', rapor.id);
            if (error) throw error;
<<<<<<< HEAD

            // ONAY AKIŞI: İmalat (M4) aşaması bittiğinde stoklar eklendiği için burada sadece 2. Birim Onayı log'laması yapılır.
            try {
                const { data: orderData } = await supabase.from('production_orders')
                    .select('model_id, quantity, b1_model_taslaklari(model_kodu)')
                    .eq('id', rapor.order_id).single();

                const mData = Array.isArray(orderData?.b1_model_taslaklari) ? orderData?.b1_model_taslaklari[0] : orderData?.b1_model_taslaklari;
                const modelKodu = mData?.model_kodu;

                if (modelKodu) {
                    // Sadece doğrulama logu yaz — Mükerrer stok girme!
                    await supabase.from('b0_sistem_loglari').insert([{
                        tablo_adi: 'b2_stok_hareketleri',
                        islem_tipi: 'MUHASEBE_STOK_DOGRULAMA',
                        kullanici_adi: kullanici?.label || 'Muhasebe Yöneticisi',
                        eski_veri: { rapor_id: rapor.id, model_kodu: modelKodu, not: 'İmalat Devri Zaten Stoklaşmıştı, bu bir Finans Kilit Onayıdır.' }
                    }]);
                }
            } catch (stockErr) {
                console.error('Doğrulama sızıntısı yakalandı:', stockErr);
            }

            goster('✅ Rapor kilitlendi. 2. Birime devir tamamlandı!'); yukle(); setSecilenRapor(null);
            telegramBildirim(`🔒 2. BİRİME DEVİR ONAYLANDI!\nBir üretim raporu KİLİTLENDİ ve tamamen muhasebeleştirildi. Stoklar denetlendi.`);
=======
            goster('✅ Rapor kilitlendi. 2. Birime devir tamamlandı!'); yukle(); setSecilenRapor(null);
            telegramBildirim(`🔒 2. BİRİME DEVİR ONAYLANDI!\nBir üretim raporu KİLİTLENDİ ve tamamen muhasebeleştirildi.`);
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
        } catch (error) { goster('Devir hatası: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const uretimdenRaporOlustur = async (model) => {
        setLoading(true);
        try {
            const { data: mevcut } = await supabase.from('b1_muhasebe_raporlari').select('id').eq('order_id', model.id);
            if (mevcut && mevcut.length > 0) {
                setLoading(false);
                return goster('Bu üretim emri için zaten bir Muhasebe Raporu mevcut!', 'error');
            }
            const { data: maliyetler, error: mErr } = await supabase.from('b1_maliyet_kayitlari').select('tutar_tl').eq('order_id', model.id);
            if (mErr) throw mErr;
            let toplamMaliyet = (maliyetler || []).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);

<<<<<<< HEAD
            // MALİYET KURALI: Otonom GÜG (Genel İşletme Gideri) Payı Kesintisi
=======
            // [M8 ZIRHI: Stratejik GÜG Körlüğü Kapatıldı]
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            const yuzde15Gider = parseFloat((toplamMaliyet * 0.15).toFixed(2));
            if (yuzde15Gider > 0) {
                try {
                    await supabase.from('b1_maliyet_kayitlari').insert([
                        { order_id: model.id, maliyet_tipi: 'isletme_gideri', kalem_aciklama: 'Otonom GÜG (%15 İşletme/Amortisman Payı)', tutar_tl: yuzde15Gider, onay_durumu: 'hesaplandi' }
                    ]);
                    toplamMaliyet += yuzde15Gider;
<<<<<<< HEAD
                } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: MuhasebeMainContainer.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }
=======
                } catch (e) { console.error('[B0 LOG HATASI] Muhasebe Fiş İptali:', e); }
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            }

            const insertData = {
                order_id: model.id,
                gerceklesen_maliyet_tl: parseFloat(String(toplamMaliyet)),
                net_uretilen_adet: model.hedef_adet || 0,
                zayiat_adet: 0,
                rapor_durumu: 'sef_onay_bekliyor',
                devir_durumu: false,
            };
            if (!navigator.onLine) {
                await cevrimeKuyrugaAl('b1_muhasebe_raporlari', 'INSERT', /** @type {any} */(insertData));
                goster('⚡ Çevrimdışı: Rapor işlemi tablete kaydedildi.');
            } else {
                const { error } = await supabase.from('b1_muhasebe_raporlari').insert([/** @type {any} */ (insertData)]);
                if (error) throw error;
                goster(`✅ ${model.model_adi} için rapor oluşturuldu. GÜG dahil toplam: ₺${toplamMaliyet.toFixed(2)}`); yukle();
            }
        } catch (error) { goster('Rapor oluşturma hatası: ' + error.message, 'error'); }
        setLoading(false);
    };

    const maliyetiSenkronize = async (rapor) => {
        if (!rapor.order_id) return goster('Raporda bağlı iş emri yok!', 'error');
        try {
            const { data: maliyetler, error: mErr } = await supabase.from('b1_maliyet_kayitlari').select('tutar_tl').eq('order_id', rapor.order_id);
            if (mErr) throw mErr;
            const toplam = (maliyetler || []).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
            const { error } = await supabase.from('b1_muhasebe_raporlari').update({ gerceklesen_maliyet_tl: toplam }).eq('id', rapor.id);
            if (error) throw error;
            goster(`✅ Maliyet güncellendi: ₺${toplam.toFixed(2)}`); yukle();
            if (secilenRapor?.id === rapor.id) setSecilenRapor(p => ({ ...p, gerceklesen_maliyet_tl: toplam }));
        } catch (error) { goster('Senkronizasyon hatası: ' + error.message, 'error'); }
    };

    // ─── YENİ: DÜZENLE ───────────────────────────────────────────────────────────
    const duzenleAc = (rapor) => {
        if (rapor.rapor_durumu === 'kilitlendi') return goster('Kilitli raporlar normal yoldan düzenlenemez! Ancak zeyilname (ek fatura) ekleyebilirsiniz.', 'error');
        setDuzenleForm({
            zayiat_adet: String(rapor.zayiat_adet || 0),
            hedeflenen_maliyet_tl: String(rapor.hedeflenen_maliyet_tl || ''),
            notlar: rapor.notlar || '',
            ek_maliyet_tl: '0'
        });
        setDuzenleModal({ ...rapor, zeyilname_modu: false });
    };

<<<<<<< HEAD
    // [M8 KONTROLÜ: ZEYİLNAME SİGORTASI]
=======
    // [M8 ZIRHI: ZEYİLNAME SİGORTASI]
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
    const zeyilnameAc = (rapor) => {
        if (rapor.rapor_durumu !== 'kilitlendi') return goster('Sadece devri tamamlanıp KİLİTLENMİŞ raporlara sonradan gelen farklar (Zeyilname) yazılabilir.', 'warning');
        setDuzenleForm({
            zayiat_adet: String(rapor.zayiat_adet || 0),
            hedeflenen_maliyet_tl: String(rapor.hedeflenen_maliyet_tl || ''),
            notlar: rapor.notlar || '',
            ek_maliyet_tl: String(rapor.ek_maliyet_tl || 0)
        });
        setDuzenleModal({ ...rapor, zeyilname_modu: true });
    };

    const duzenleKaydet = async () => {
        if (!duzenleModal) return;
        setLoading(true);
        try {
            let payload;
            if (duzenleModal.zeyilname_modu) {
                payload = {
                    ek_maliyet_tl: parseFloat(duzenleForm.ek_maliyet_tl) || 0,
                    notlar: duzenleForm.notlar?.trim() || null,
                };
            } else {
                payload = {
                    zayiat_adet: parseInt(duzenleForm.zayiat_adet) || 0,
                    hedeflenen_maliyet_tl: parseFloat(duzenleForm.hedeflenen_maliyet_tl) || 0,
                    notlar: duzenleForm.notlar?.trim() || null,
                };
            }

            const { error } = await supabase.from('b1_muhasebe_raporlari').update(payload).eq('id', duzenleModal.id);
            if (error) throw error;
            goster(duzenleModal.zeyilname_modu ? '✅ Zeyilname maliyeti kilitli dosyaya şerh düşüldü.' : '✅ Rapor güncellendi!');
            yukle();
            if (secilenRapor?.id === duzenleModal.id) setSecilenRapor(p => ({ ...p, ...payload }));
            setDuzenleModal(null);
        } catch (error) { goster('Düzenleme hatası: ' + error.message, 'error'); }
        setLoading(false);
    };

    // ─── YENİ: SİL ───────────────────────────────────────────────────────────────
    const raporSil = async (rapor) => {
        if (islemdeId === 'sil_' + rapor.id) return;
        setIslemdeId('sil_' + rapor.id);
        if (rapor.rapor_durumu === 'kilitlendi') { setIslemdeId(null); return goster('Kilitli raporlar silinemez! Devir tamamlanmış.', 'error'); }
        const { yetkili: sYetkili, mesaj: sYetkiMesaj } = await silmeYetkiDogrula(
            /** @type {any} */(kullanici)
        );
        if (!sYetkili) { setIslemdeId(null); return goster(sYetkiMesaj || 'Yetkisiz işlem.', 'error'); }
        if (!confirm(`"${rapor.model_kodu || rapor.id.slice(0, 8)}" raporunu siliyorsunuz. Emin misiniz?`)) { setIslemdeId(null); return; }
        try {
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: 'b1_muhasebe_raporlari', islem_tipi: 'SILME',
                    kullanici_adi: kullanici?.label || 'Muhasebe Yetkilisi',
                    eski_veri: { rapor_durumu: rapor.rapor_durumu, model_kodu: rapor.model_kodu }
                }]);
<<<<<<< HEAD
            } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: MuhasebeMainContainer.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }
=======
            } catch (e) { console.error('[B0 LOG HATASI] Muhasebe Silme:', e); }
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            const { error } = await supabase.from('b1_muhasebe_raporlari').delete().eq('id', rapor.id);
            if (error) throw error;
            goster('Rapor silindi.');
            if (secilenRapor?.id === rapor.id) setSecilenRapor(null);
            yukle();
            telegramBildirim(`🗑️ MUHASEBE RAPORU SİLİNDİ\nModel: ${rapor.model_kodu || '-'}`);
        } catch (error) { goster('Silme hatası: ' + error.message, 'error'); }
        finally { setIslemdeId(null); }
    };

    const isAR = lang === 'ar';


    const DURUM_RENK = { taslak: '#94a3b8', sef_onay_bekliyor: '#f59e0b', onaylandi: '#10b981', kilitlendi: '#0f172a' };
    const DURUM_LABEL = { taslak: '📄 Taslak', sef_onay_bekliyor: '⏳ Şef Onayı', onaylandi: '✅ Onaylı', kilitlendi: '🔒 Kilitli' };
    const MALIYET_LABEL = { personel_iscilik: '👷 Personel', isletme_gideri: '🏭 İşletme', sarf_malzeme: '🧵 Sarf', fire_kaybi: '🔥 Fire' };

    const birimMaliyet = (r) => {
        const net = parseInt(r.net_uretilen_adet) || 0;
        if (net === 0) return '—';
        return (parseFloat(r.gerceklesen_maliyet_tl) / net).toFixed(4);
    };
    const asimPct = (r) => {
        const h = parseFloat(r.hedeflenen_maliyet_tl);
        if (!h) return 0;
        return (((parseFloat(r.gerceklesen_maliyet_tl) - h) / h) * 100).toFixed(1);
    };

    // Arama filtresi
    const filtreliRaporlar = raporlar.filter(r =>
        !aramaMetni ||
        r.model_kodu?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        r.model_adi?.toLowerCase().includes(aramaMetni.toLowerCase())
    );

    const istatistik = {
        toplam: raporlar.length,
        bekleyen: raporlar.filter(r => r.rapor_durumu === 'sef_onay_bekliyor').length,
        onaylandi: raporlar.filter(r => r.rapor_durumu === 'onaylandi').length,
        kilitli: raporlar.filter(r => r.rapor_durumu === 'kilitlendi').length,
    };

<<<<<<< HEAD
    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #1e4a43', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
=======
    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

    if (!yetkiliMi) {
        return (
            <div className="p-12 text-center bg-rose-950/20 border-2 border-rose-900/50 rounded-2xl m-8 shadow-2xl" dir={isAR ? 'rtl' : 'ltr'}>
                <Lock size={48} className="mx-auto mb-4 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
                <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest">YETKİSİZ GİRİŞ ENGELLENDİ</h2>
                <p className="text-rose-300 font-bold mt-2">Muhasebe Raporu gizlidir. Görüntülemek için Üretim PİN girişi zorunludur.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={isAR ? 'rtl' : 'ltr'}>
            {/* BAŞLIK */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                        <FileCheck size={24} className="text-emerald-50" />
                    </div>
                    <div>
<<<<<<< HEAD
                        <h1 className="text-2xl font-black text-white tracking-tight m-0">
                            {isAR ? 'المحاسبة والتقارير النهائية' : 'Muhasebe & Final Rapor'}
                        </h1>
                        <p className="text-xs font-bold text-emerald-200 mt-1 uppercase tracking-wider">
=======
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight m-0">
                            {isAR ? 'المحاسبة والتقارير النهائية' : 'Muhasebe & Final Rapor'}
                        </h1>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                            {isAR ? 'مراجعة → موافقة الشيف → قفل → تحويل إلى الوحدة الثانية' : 'İncele → Şef onayı → Kilitle → 2. Birime devir'}
                        </p>
                    </div>
                </div>
                <div className="ml-auto">
                    <Link href="/" className="no-underline">
                        <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-emerald-500/20 border-b-4 border-emerald-800 transition-all">
                            Ana Sayfaya Dön
                        </button>
                    </Link>
                </div>
            </div>

            {/* İSTATİSTİK KARTLARI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Toplam Rapor', val: istatistik.toplam, colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50 border-emerald-200' },
                    { label: '⏳ Onay Bekl.', val: istatistik.bekleyen, colorClass: 'text-amber-600', bgClass: 'bg-amber-50 border-amber-200' },
                    { label: '✅ Onaylı', val: istatistik.onaylandi, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50 border-emerald-200' },
<<<<<<< HEAD
                    { label: '🔒 Kilitli', val: istatistik.kilitli, colorClass: 'text-white', bgClass: 'bg-[#0d1117] text-white border-[#1e4a43]' },
                ].map((s, i) => (
                    <div key={i} className={`${s.bgClass} border-2 rounded-2xl p-4 shadow-sm`}>
                        <div className="text-[10px] text-emerald-200 font-black uppercase mb-1 tracking-widest">{s.label}</div>
=======
                    { label: '🔒 Kilitli', val: istatistik.kilitli, colorClass: 'text-slate-800', bgClass: 'bg-slate-50 border-slate-200' },
                ].map((s, i) => (
                    <div key={i} className={`${s.bgClass} border-2 rounded-2xl p-4 shadow-sm`}>
                        <div className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">{s.label}</div>
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                        <div className={`font-black text-2xl ${s.colorClass}`}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* ARAMA */}
            <div className="relative max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)}
                    placeholder="Model kodu veya adına göre ara..."
<<<<<<< HEAD
                    className="w-full pl-10 pr-4 py-2.5 bg-[#122b27] border-2 border-[#1e4a43] rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
=======
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
            </div>

            {mesaj.text && (
                <div className={`p-4 rounded-xl font-bold flex items-center shadow-sm border-2 ${mesaj.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {mesaj.text}
                </div>
            )}

            {/* ÜRETİMDEN OTOMATIK RAPOR OLUŞTUR */}
            {raporsizemOrders.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-400 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">⚡</span>
                        <span className="font-black text-amber-900 text-sm uppercase tracking-wider">
                            {raporsizemOrders.length} Tamamlanmış Üretim — Muhasebe Raporu Bekliyor!
                        </span>
                    </div>
                    <div className="flex flex-col gap-2">
                        {raporsizemOrders.map(o => (
<<<<<<< HEAD
                            <div key={o.id} className="flex justify-between items-center bg-[#122b27] rounded-xl p-3 border-2 border-amber-200 shadow-sm">
                                <div>
                                    <span className="text-xs font-black bg-amber-200 text-amber-900 px-2 py-1 rounded inline-block mr-2 uppercase">{o.model_kodu}</span>
                                    <span className="font-bold text-white text-sm uppercase">{o.model_adi || 'Model'}</span>
=======
                            <div key={o.id} className="flex justify-between items-center bg-white rounded-xl p-3 border-2 border-amber-200 shadow-sm">
                                <div>
                                    <span className="text-xs font-black bg-amber-200 text-amber-900 px-2 py-1 rounded inline-block mr-2 uppercase">{o.model_kodu}</span>
                                    <span className="font-bold text-slate-800 text-sm uppercase">{o.model_adi || 'Model'}</span>
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                    <span className="text-xs font-bold text-slate-400 ml-2">{o.hedef_adet} adet</span>
                                </div>
                                <button onClick={() => uretimdenRaporOlustur(o)} disabled={loading}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-white rounded-xl font-black text-xs uppercase transition-all whitespace-nowrap">
                                    📋 Rapor Oluştur
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* [KRİTİK EKSİK] M8  BÜTÇE vs GERÇEK DASHBOARD */}
            {raporlar.length > 0 && (() => {
                const toplamHedef = raporlar.reduce((s, r) => s + parseFloat(r.hedeflenen_maliyet_tl || 0), 0);
                const toplamGercek = raporlar.reduce((s, r) => s + parseFloat(r.gerceklesen_maliyet_tl || 0), 0);
                const fark = toplamGercek - toplamHedef;
                const pct = toplamHedef > 0 ? ((fark / toplamHedef) * 100).toFixed(1) : 0;
                return (
                    <div className={`border-2 rounded-2xl p-5 shadow-sm ${fark > 0 ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">{fark > 0 ? '⚠️' : '✅'}</span>
                            <span className={`font-black uppercase tracking-widest text-sm ${fark > 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                                BÜTÇE vs GERÇEK ANALİZİ — {raporlar.length} Rapor
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
<<<<<<< HEAD
                            <div className="bg-[#122b27] rounded-xl p-4 text-center border-2 border-slate-100 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Hedef</div>
                                <div className="font-black text-slate-700 text-xl mt-1">₺{toplamHedef.toFixed(0)}</div>
                            </div>
                            <div className="bg-[#122b27] rounded-xl p-4 text-center border-2 border-slate-100 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Gerçek</div>
                                <div className={`font-black text-xl mt-1 ${fark > 0 ? 'text-red-600' : 'text-emerald-600'}`}>₺{toplamGercek.toFixed(0)}</div>
                            </div>
                            <div className="bg-[#122b27] rounded-xl p-4 text-center border-2 border-slate-100 shadow-sm">
=======
                            <div className="bg-white rounded-xl p-4 text-center border-2 border-slate-100 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Hedef</div>
                                <div className="font-black text-slate-700 text-xl mt-1">₺{toplamHedef.toFixed(0)}</div>
                            </div>
                            <div className="bg-white rounded-xl p-4 text-center border-2 border-slate-100 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Gerçek</div>
                                <div className={`font-black text-xl mt-1 ${fark > 0 ? 'text-red-600' : 'text-emerald-600'}`}>₺{toplamGercek.toFixed(0)}</div>
                            </div>
                            <div className="bg-white rounded-xl p-4 text-center border-2 border-slate-100 shadow-sm">
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sapma</div>
                                <div className={`font-black text-xl mt-1 ${fark > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{/** @type {any} */ (fark) > 0 ? '+' : ''}{fark.toFixed(0)} ₺ ({/** @type {any} */ (pct) > 0 ? '+' : ''}{pct}%)</div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* DEVİR GEÇİŞ KAPISI */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 shadow-lg border border-slate-700 flex items-center gap-4">
                <div className="text-3xl">🚪</div>
                <div className="flex-1">
                    <div className="font-black text-white text-sm tracking-wide">2. Birime Geçiş Kapısı</div>
                    <div className="text-xs text-slate-400 font-bold mt-1">Sadece KİLİTLİ raporlar 2. Birime geçer. Yönetici onayı gereklidir.</div>
                </div>
                <div className="text-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">Kilitli Rapor</div>
                    <div className="font-black text-emerald-400 text-3xl leading-none">{istatistik.kilitli}</div>
                </div>
            </div>

            <div className="flex flex-wrap lg:flex-nowrap gap-6 items-start">
                {/* RAPOR LİSTESİ */}
                <div className="w-full lg:w-1/2 xl:w-5/12 shrink-0">
                    <div className="flex flex-col gap-3">
                        {!loading && filtreliRaporlar.length === 0 && (
<<<<<<< HEAD
                            <div className="text-center p-12 bg-[#0d1117] text-white rounded-2xl border-2 border-dashed border-[#1e4a43]">
=======
                            <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                <FileCheck size={40} className="text-slate-200 mb-3 mx-auto" />
                                <p className="text-slate-400 font-bold">
                                    {aramaMetni ? 'Arama sonucu bulunamadı.' : 'Final rapor yok. M6 Üretim Bandından devir başlatın.'}
                                </p>
                            </div>
                        )}
                        {filtreliRaporlar.map(r => {
                            const pct = parseFloat(/** @type {any} */(asimPct(r)));
                            const kilitli = r.rapor_durumu === 'kilitlendi';
                            const isSelected = secilenRapor?.id === r.id;

                            return (
                                <div key={r.id}
                                    onClick={() => raporSec(r)}
<<<<<<< HEAD
                                    className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-emerald-50 border-emerald-600 shadow-md shadow-emerald-600/10' : kilitli ? 'bg-[#122b27] border-slate-800 hover:border-slate-800 shadow-sm' : 'bg-[#122b27] border-slate-100 hover:border-emerald-300 hover:shadow-sm'}`}>
=======
                                    className={`relative border-2 rounded-2xl p-4 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-emerald-50 border-emerald-600 shadow-md shadow-emerald-600/10' : kilitli ? 'bg-white border-slate-800 hover:border-slate-800 shadow-sm' : 'bg-white border-slate-100 hover:border-emerald-300 hover:shadow-sm'}`}>
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex gap-2 mb-2">
                                                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {r.model_kodu || r.id?.slice(0, 8) || 'Rapor'}
                                                </span>
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase" style={{ background: `${DURUM_RENK[r.rapor_durumu]}20`, color: DURUM_RENK[r.rapor_durumu] }}>
                                                    {DURUM_LABEL[r.rapor_durumu]}
                                                </span>
                                            </div>
<<<<<<< HEAD
                                            <div className="font-black text-white text-sm tracking-tight uppercase">
=======
                                            <div className="font-black text-slate-800 text-sm tracking-tight uppercase">
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                                {r.model_adi || r.model_kodu || 'Model'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 items-end">
                                            <div className={`font-black text-sm flex items-center gap-1 ${pct > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} %{Math.abs(pct)}
                                            </div>
                                            {/* Eylem butonları */}
                                            {!kilitli ? (
                                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => duzenleAc(r)}
                                                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-lg flex items-center justify-center transition-colors">
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button disabled={islemdeId === 'sil_' + r.id} onClick={() => raporSil(r)}
                                                        className={`bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-lg flex items-center justify-center transition-colors ${islemdeId === 'sil_' + r.id ? 'opacity-50 cursor-wait' : ''}`}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => zeyilnameAc(r)}
                                                        className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors">
                                                        ➕ Zeyilname (Ek)
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
<<<<<<< HEAD
                                        <div className="bg-[#0d1117] text-white rounded-xl p-2.5 border border-slate-100">
=======
                                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Hedef</div>
                                            <div className="font-black text-slate-700 text-sm">₺{parseFloat(r.hedeflenen_maliyet_tl || 0).toFixed(2)}</div>
                                        </div>
                                        <div className={`rounded-xl p-2.5 border ${pct > 10 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${pct > 10 ? 'text-red-500' : 'text-emerald-600'}`}>Gerçek Toplam</div>
                                            <div className={`font-black text-sm ${pct > 10 ? 'text-red-600' : 'text-emerald-700'}`}>₺{parseFloat(r.gerceklesen_maliyet_tl || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SEÇİLEN RAPOR DETAY */}
                {secilenRapor && (
<<<<<<< HEAD
                    <div className="w-full lg:w-1/2 xl:w-7/12 shrink-0 bg-[#122b27] border-4 border-emerald-600 rounded-3xl p-6 lg:sticky lg:top-6 shadow-2xl shadow-emerald-900/10">
                        <div className="flex justify-between items-center mb-6 border-b-2 border-slate-100 pb-4">
                            <h2 className="font-black text-white text-lg uppercase tracking-wider flex items-center gap-2 m-0"><span className="text-xl">📊</span> Rapor Detayı (Z-Raporu)</h2>
                            <button onClick={() => setSecilenRapor(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-emerald-200 rounded-lg transition-colors">✕</button>
=======
                    <div className="w-full lg:w-1/2 xl:w-7/12 shrink-0 bg-white border-4 border-emerald-600 rounded-3xl p-6 lg:sticky lg:top-6 shadow-2xl shadow-emerald-900/10">
                        <div className="flex justify-between items-center mb-6 border-b-2 border-slate-100 pb-4">
                            <h2 className="font-black text-slate-800 text-lg uppercase tracking-wider flex items-center gap-2 m-0"><span className="text-xl">📊</span> Rapor Detayı (Z-Raporu)</h2>
                            <button onClick={() => setSecilenRapor(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors">✕</button>
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                            {[
                                { label: 'Hedef Maliyet', val: `₺${parseFloat(secilenRapor.hedeflenen_maliyet_tl || 0).toFixed(2)}`, colorClass: 'text-slate-700' },
                                { label: 'Gerçekleşen', val: `₺${(parseFloat(secilenRapor.gerceklesen_maliyet_tl || 0) + parseFloat(secilenRapor.ek_maliyet_tl || 0)).toFixed(2)}`, colorClass: (parseFloat(secilenRapor.gerceklesen_maliyet_tl || 0) - parseFloat(secilenRapor.hedeflenen_maliyet_tl || 0)) > 0 ? 'text-red-600' : 'text-emerald-600' },
                                { label: 'Zeyilname (Ek)', val: `₺${parseFloat(secilenRapor.ek_maliyet_tl || 0).toFixed(2)}`, colorClass: 'text-amber-700' },
                                { label: 'Birim Adet Mal.', val: `₺${birimMaliyet(secilenRapor)}`, colorClass: 'text-amber-500' },
                                { label: 'Üretilen Adet', val: secilenRapor.net_uretilen_adet, colorClass: 'text-emerald-600' },
                                { label: 'Zayiat', val: `${secilenRapor.zayiat_adet} adet`, colorClass: 'text-red-500' },
                            ].map((m, i) => (
<<<<<<< HEAD
                                <div key={i} className="bg-[#0d1117] text-white border border-slate-100 rounded-xl p-3">
=======
                                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{m.label}</div>
                                    <div className={`font-black text-base ${m.colorClass}`}>{m.val}</div>
                                </div>
                            ))}
                        </div>

                        {secilenRapor.notlar && (
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6 text-sm font-bold text-amber-900 shadow-inner">
                                <span className="mr-2">📝</span> {secilenRapor.notlar}
                            </div>
                        )}

                        {ilgiliMaliyetler.length > 0 && (() => {
                            const uMaliyetData = ilgiliMaliyetler.reduce((acc, curr) => {
                                const tip = curr.maliyet_tipi || 'diger';
                                acc[tip] = (acc[tip] || 0) + parseFloat(curr.tutar_tl || 0);
                                return acc;
                            }, {});
                            const totalUI = Object.values(uMaliyetData).reduce((a, b) => a + b, 0);
                            const mRenkBg = { personel_iscilik: 'bg-blue-500', isletme_gideri: 'bg-amber-500', fason_islem: 'bg-purple-500', hammadde: 'bg-emerald-500', diger: 'bg-slate-400' };
                            const mRenkBorder = { personel_iscilik: 'border-blue-500', isletme_gideri: 'border-amber-500', fason_islem: 'border-purple-500', hammadde: 'border-emerald-500', diger: 'border-slate-400' };

                            return (
<<<<<<< HEAD
                                <div className="mb-6 bg-[#0d1117] text-white p-5 border-2 border-[#1e4a43] rounded-2xl">
                                    <div className="font-black text-emerald-300 text-[11px] mb-4 uppercase tracking-widest">💰 Cerrahi Dağılım (Maliyet Breakdown)</div>
=======
                                <div className="mb-6 bg-slate-50 p-5 border-2 border-slate-200 rounded-2xl">
                                    <div className="font-black text-slate-600 text-[11px] mb-4 uppercase tracking-widest">💰 Cerrahi Dağılım (Maliyet Breakdown)</div>
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552

                                    {/* M8 Stratejik Zırh: Pie Bar Breakdown */}
                                    <div className="flex h-5 rounded-lg overflow-hidden mb-4 shadow-inner">
                                        {Object.entries(uMaliyetData).map(([tip, miktar]) => {
                                            const w = Math.max((miktar / (totalUI || 1)) * 100, 1); // min 1% for visibility
                                            return <div key={tip} style={{ width: `${w}%` }} className={`${mRenkBg[tip] || mRenkBg.diger} opacity-95 hover:opacity-100 transition-opacity cursor-help`} title={`${MALIYET_LABEL[tip] || tip}: ₺${miktar.toFixed(2)}`} />;
                                        })}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {Object.entries(uMaliyetData).map(([tip, miktar]) => {
                                            const yuzdeUi = ((miktar / (totalUI || 1)) * 100).toFixed(1);
                                            return (
<<<<<<< HEAD
                                                <div key={tip} className="text-xs text-emerald-300 font-bold bg-[#122b27] px-3 py-1.5 rounded-lg border border-[#1e4a43] shadow-sm flex items-center gap-2">
=======
                                                <div key={tip} className="text-xs text-slate-600 font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${mRenkBg[tip] || mRenkBg.diger}`} />
                                                    {MALIYET_LABEL[tip] || tip}: ₺{miktar.toFixed(0)} <span className="text-slate-400 text-[10px]">(%{yuzdeUi})</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="h-0.5 bg-slate-200 my-4" />
<<<<<<< HEAD
                                    <h5 className="my-3 text-white text-xs font-black uppercase tracking-wider">Maliyet Detay Dökümü</h5>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
                                        {ilgiliMaliyetler.map((m, idx) => (
                                            <div key={m.id || idx} className={`flex justify-between items-center p-3 rounded-xl bg-[#122b27] border-l-4 border-r border-y border-slate-100 shadow-sm hover:shadow-md transition-shadow ${mRenkBorder[m.maliyet_tipi] || mRenkBorder.diger}`}>
                                                <span className="text-xs text-slate-700 font-bold">{m.kalem_aciklama}</span>
                                                <span className="font-black text-white text-sm">₺{parseFloat(m.tutar_tl).toFixed(2)}</span>
=======
                                    <h5 className="my-3 text-slate-800 text-xs font-black uppercase tracking-wider">Maliyet Detay Dökümü</h5>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
                                        {ilgiliMaliyetler.map((m, idx) => (
                                            <div key={m.id || idx} className={`flex justify-between items-center p-3 rounded-xl bg-white border-l-4 border-r border-y border-slate-100 shadow-sm hover:shadow-md transition-shadow ${mRenkBorder[m.maliyet_tipi] || mRenkBorder.diger}`}>
                                                <span className="text-xs text-slate-700 font-bold">{m.kalem_aciklama}</span>
                                                <span className="font-black text-slate-800 text-sm">₺{parseFloat(m.tutar_tl).toFixed(2)}</span>
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex flex-col gap-3">
                            {secilenRapor.rapor_durumu === 'taslak' && (
                                <button disabled={islemdeId === secilenRapor.id} onClick={() => durumGuncelle(secilenRapor.id, 'sef_onay_bekliyor')}
                                    className={`p-3 bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-white rounded-xl font-black transition-all ${islemdeId === secilenRapor.id ? 'opacity-50 cursor-wait' : ''}`}>
                                    {islemdeId === secilenRapor.id ? 'İşleniyor...' : '📤 Şef Onayına Gönder'}
                                </button>
                            )}
                            {secilenRapor.rapor_durumu === 'sef_onay_bekliyor' && (
                                <button disabled={islemdeId === secilenRapor.id} onClick={() => durumGuncelle(secilenRapor.id, 'onaylandi')}
                                    className={`p-3 bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 text-white rounded-xl font-black transition-all ${islemdeId === secilenRapor.id ? 'opacity-50 cursor-wait' : ''}`}>
                                    {islemdeId === secilenRapor.id ? 'İşleniyor...' : '✅ Şef Onayı Ver'}
                                </button>
                            )}
                            {secilenRapor.rapor_durumu === 'onaylandi' && (
                                <button disabled={islemdeId === 'devir_' + secilenRapor.id} onClick={() => devirKapat(secilenRapor)}
                                    className={`p-4 bg-slate-900 hover:bg-black border-l-8 border-emerald-500 text-white rounded-xl font-black flex items-center justify-center gap-3 transition-all ${islemdeId === 'devir_' + secilenRapor.id ? 'opacity-50 cursor-wait' : ''}`}>
                                    <Lock size={18} /> {islemdeId === 'devir_' + secilenRapor.id ? 'Kilitleniyor...' : 'Kilitle & 2. Birime Devret'}
                                </button>
                            )}
                            {secilenRapor.rapor_durumu === 'kilitlendi' && (
                                <div className="p-4 bg-slate-900 border-l-8 border-emerald-500 text-emerald-400 rounded-xl font-black text-center flex items-center justify-center gap-3 shadow-inner">
                                    <Lock size={18} /> KİLİTLİ — 2. BİRİMDE
                                </div>
                            )}
                            {secilenRapor.rapor_durumu !== 'kilitlendi' && (
                                <button onClick={() => duzenleAc(secilenRapor)}
                                    className="p-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors">
                                    <Edit2 size={16} /> Zayiat / Hedef / Not Düzenle
                                </button>
                            )}
                            {/* [A-04] Yazdır / PDF */}
                            <button
                                onClick={() => window.print()}
<<<<<<< HEAD
                                className="p-3 bg-[#0d1117] text-white hover:bg-slate-100 border-2 border-[#1e4a43] text-slate-700 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors mt-2">
=======
                                className="p-3 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-700 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors mt-2">
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                🖨️ Raporu Yazdır / PDF
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DÜZENLE MODAL */}
            {duzenleModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
<<<<<<< HEAD
                    <div className="bg-[#122b27] rounded-[2rem] p-8 w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-[#1e4a43]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-white text-xl m-0 flex items-center gap-2">✏️ Rapor Düzenle</h3>
                            <button onClick={() => setDuzenleModal(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-emerald-200 rounded-lg transition-colors">✕</button>
=======
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-800 text-xl m-0 flex items-center gap-2">✏️ Rapor Düzenle</h3>
                            <button onClick={() => setDuzenleModal(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors">✕</button>
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                        </div>
                        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl p-3 mb-6 text-sm font-black text-emerald-800 flex items-center flex-wrap gap-2 uppercase tracking-wide">
                            📁 {duzenleModal.model_kodu || duzenleModal.id?.slice(0, 8)}
                            {duzenleModal.zeyilname_modu && <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded ml-2 text-xs">M8 Zeyilname Ek Fatura</span>}
                        </div>
                        <div className="flex flex-col gap-5">
                            {!duzenleModal.zeyilname_modu ? (
                                <>
                                    <div>
<<<<<<< HEAD
                                        <label className="block text-[11px] font-black text-emerald-200 mb-2 uppercase tracking-widest">Zayiat Adet</label>
                                        <input type="number" min="0" value={duzenleForm.zayiat_adet}
                                            onChange={e => setDuzenleForm({ ...duzenleForm, zayiat_adet: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#0d1117] text-white border-2 border-[#1e4a43] rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-[#122b27] transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-emerald-200 mb-2 uppercase tracking-widest">Bütçelenen Hedef Maliyet Kapasitesi</label>
                                        <div className="relative">
                                            <input type="number" min="0" step="100" value={duzenleForm.hedeflenen_maliyet_tl}
                                                onChange={e => setDuzenleForm({ ...duzenleForm, hedeflenen_maliyet_tl: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-[#0d1117] text-white border-2 border-[#1e4a43] rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-[#122b27] transition-all" />
=======
                                        <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">Zayiat Adet</label>
                                        <input type="number" min="0" value={duzenleForm.zayiat_adet}
                                            onChange={e => setDuzenleForm({ ...duzenleForm, zayiat_adet: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">Bütçelenen Hedef Maliyet Kapasitesi</label>
                                        <div className="relative">
                                            <input type="number" min="0" step="100" value={duzenleForm.hedeflenen_maliyet_tl}
                                                onChange={e => setDuzenleForm({ ...duzenleForm, hedeflenen_maliyet_tl: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all" />
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₺</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
                                    <label className="block text-[11px] font-black text-amber-800 mb-2 uppercase tracking-widest">Ek Maliyet Farkı (Zeyilname)</label>
                                    <div className="relative">
                                        <input type="number" min="0" step="10" value={duzenleForm.ek_maliyet_tl}
                                            onChange={e => setDuzenleForm({ ...duzenleForm, ek_maliyet_tl: e.target.value })} placeholder="Fason fiyat farkı, kargo vb.."
<<<<<<< HEAD
                                            className="w-full pl-10 pr-4 py-3 bg-[#122b27] border-2 border-amber-300 rounded-xl font-black text-amber-900 outline-none focus:border-amber-500 transition-all placeholder:text-amber-300 placeholder:font-medium" />
=======
                                            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-amber-300 rounded-xl font-black text-amber-900 outline-none focus:border-amber-500 transition-all placeholder:text-amber-300 placeholder:font-medium" />
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-amber-600">₺</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-amber-700/70 mt-3 leading-relaxed">Devri yapılmış ve kilidi açılmayan rapordaki maliyet sızıntısını legal şekilde ekler.</p>
                                </div>
                            )}

                            <div>
<<<<<<< HEAD
                                <label className="block text-[11px] font-black text-emerald-200 mb-2 uppercase tracking-widest">Notlar / Zayiat Nedeni / {duzenleModal.zeyilname_modu ? 'Fatura/İtiraz Özeti' : ''}</label>
                                <textarea rows={3} maxLength={300} value={duzenleForm.notlar}
                                    onChange={e => setDuzenleForm({ ...duzenleForm, notlar: e.target.value })}
                                    placeholder="İç not, açıklama..." className="w-full px-4 py-3 bg-[#0d1117] text-white border-2 border-[#1e4a43] rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-[#122b27] transition-all resize-y custom-scrollbar" />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-8 border-t-2 border-slate-100 pt-6">
                            <button onClick={() => setDuzenleModal(null)} className="px-6 py-2.5 border-2 border-[#1e4a43] hover:border-slate-300 hover:bg-[#0d1117] text-white rounded-xl font-bold text-emerald-300 transition-all">İptal</button>
=======
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">Notlar / Zayiat Nedeni / {duzenleModal.zeyilname_modu ? 'Fatura/İtiraz Özeti' : ''}</label>
                                <textarea rows={3} maxLength={300} value={duzenleForm.notlar}
                                    onChange={e => setDuzenleForm({ ...duzenleForm, notlar: e.target.value })}
                                    placeholder="İç not, açıklama..." className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all resize-y custom-scrollbar" />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-8 border-t-2 border-slate-100 pt-6">
                            <button onClick={() => setDuzenleModal(null)} className="px-6 py-2.5 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl font-bold text-slate-600 transition-all">İptal</button>
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
                            <button onClick={duzenleKaydet} disabled={loading}
                                className={`px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 border-b-4 border-emerald-800 text-white rounded-xl font-black transition-all flex items-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}>
                                {loading ? '...' : '✅ Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
