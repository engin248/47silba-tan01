// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';
import { Scan, UserCheck, PackageOpen, CheckCircle, AlertTriangle, Clock, Hammer, X, Play, LogOut, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/langContext';
import { fetchIsEmriById } from '@/features/uretim/services/uretimApi';

export default function KioskTerminal() {
    const { lang } = useLang();
    const isAR = lang === 'ar';

    const [barkod, setBarkod] = useState('');
    const [personel, setPersonel] = useState(null);
    const [personelAylikPerformans, setPersonelAylikPerformans] = useState({ toplam_deger: 0, maliyet_hedefi: 0 });
    const [islemdekiIs, setIslemdekiIs] = useState(null);
    const [mesaj, setMesaj] = useState({ text: '', tur: '' });
    const [bekliyor, setBekliyor] = useState(false);

    // YENİ: Sipariş bulunduğunda reçete seçimi için
    const [seciliSiparis, setSeciliSiparis] = useState(null);
    const [modelOperasyonlari, setModelOperasyonlari] = useState([]);

    // Popup (İşi bitirme sırasında fire sormak için)
    const [bitisPopup, setBitisPopup] = useState(false);
    const [fireAdet, setFireAdet] = useState(0);
    const [uretimAdet, setUretimAdet] = useState(0);

    // Eğitim / SOP Modalı
    const [egitimModalAcik, setEgitimModalAcik] = useState(false);
    const [seciliEgitim, setSeciliEgitim] = useState(null);

    const inputRef = useRef(null);

    // Kiosk Modu: Her zaman input'a odaklan
    useEffect(() => {
        const interval = setInterval(() => {
            if (!bitisPopup && !seciliSiparis && inputRef.current) {
                inputRef.current.focus();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [bitisPopup, seciliSiparis]);

    const goster = (txt, t = 'info') => {
        setMesaj({ text: txt, tur: t });
        setTimeout(() => setMesaj({ text: '', tur: '' }), 6000);
    };

    const handleKesintiHesapla = (fAdet, islemAdet) => {
        if (!islemAdet || islemAdet <= 0) return 10;
        const oran = fAdet / islemAdet;
        let kalite = 10;
        if (oran > 0.05) kalite = 8;
        if (oran > 0.10) kalite = 5;
        if (oran > 0.20) kalite = 2;
        if (oran > 0.50) kalite = 1;
        return kalite;
    };

    const cikiSifirla = () => {
        setPersonel(null);
        setIslemdekiIs(null);
        setSeciliSiparis(null);
        setModelOperasyonlari([]);
        setBarkod('');
    };

    const barkodOkundu = async (e) => {
        e.preventDefault();
        const kod = barkod.trim();
        setBarkod('');
        if (!kod) return;
        setBekliyor(true);

        try {
            // DURUM 1: Henüz personel okutulmadı
            if (!personel) {
                const { data: pData, error: pErr } = await supabase
                    .from('b1_personel')
                    .select('*')
                    .or(`barkod_no.eq.${kod},personel_kodu.eq.${kod}`)
                    .single();

                if (pErr || !pData) {
                    goster('Personel kartı bulunamadı (Bilinmeyen Kullanıcı). Tekrar okutun.', 'error');
                } else {
                    setPersonel(pData);

                    // Personelin aylık performans ve maliyet durumunu çek (Maliyet/Amorti Sistemi)
                    // Önceki ayın 1'i (geçici basit hesap)
                    const date = new Date();
                    const ilkGun = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();

                    const { data: perfData } = await supabase
                        .from('b1_personel_performans')
                        .select('isletmeye_katilan_deger')
                        .eq('personel_id', pData.id)
                        .gte('created_at', ilkGun);

                    const t_deger = perfData ? perfData.reduce((acc, curr) => acc + (Number(curr.isletmeye_katilan_deger) || 0), 0) : 0;

                    setPersonelAylikPerformans({
                        toplam_deger: t_deger,
                        maliyet_hedefi: Number(pData.aylik_maliyet_tl) || 0
                    });

                    goster(`Hoşgeldin, ${pData.ad_soyad}. Şimdi ürün takım / sipariş barkodunu okutun.`, 'success');
                }
                setBekliyor(false);
                return;
            }

            // DURUM 2: Personel belli, işlem okunuyor
            // Önce Aktif bir işi (henüz bitmemiş, saati işleyen) var mı kontrol et
            const { data: aktifIs } = await supabase
                .from('b1_personel_performans')
                .select('*, b1_uretim_operasyonlari(*)')
                .eq('personel_id', personel.id)
                .is('bitis_saati', null)
                .single();

            // Eğer kod aktif işin ID'si, operasyon ID'si veya Sipariş ID'si ise, Bitirme Ekranı aç
            if (aktifIs && (aktifIs.id === kod || aktifIs.operasyon_id === kod || aktifIs.order_id === kod)) {
                setIslemdekiIs(aktifIs);
                setUretimAdet(aktifIs.hedef_adet || 1);
                setBitisPopup(true);
                setBekliyor(false);
                return;
            }

            // Başka aktif işi varken yeni barkod okutursa uyarı ver ve iptal et
            if (aktifIs) {
                goster('Zaten çalışan bir işiniz (Zamanlayıcınız) var. Önce onu bitirmelisiniz!', 'error');
                setIslemdekiIs(aktifIs);
                setBekliyor(false);
                return;
            }

            // YENİ UX: Yeni Bir İş Sepeti (Sipariş) Barkodu Okutuldu!
            // production_orders — uretimApi.fetchIsEmriById
            let ordData = null;
            let ordErr = null;
            try {
                ordData = await fetchIsEmriById(kod);
            } catch (e) {
                ordErr = e;
            }

            if (ordErr || !ordData) {
                // Alternatif (Belki operasyon barkodu okutmuştur diye)
                let { data: dirOp } = await supabase.from('b1_operasyon_tanimlari').select('id, operasyon_adi').eq('id', kod).single();
                if (dirOp) {
                    goster(`Ürün sepeti barkodu okutulmadan doğrudan ${dirOp.operasyon_adi} başlatılamaz! Lütfen sepeti okutun.`, 'error');
                } else {
                    goster('Geçersiz İş/Sepet Barkodu! Sistemde bulunamadı.', 'error');
                }
            } else {
                // Sipariş bulundu! Siparişe (Modele) ait reçeteleri bul ekrana yansıt:
                if (ordData.model_id) {
                    // YENİ: b1_operasyon_tanimlari kullanılarak reçete/SOP yüklenir
                    let { data: ops } = await supabase.from('b1_operasyon_tanimlari').select('*').order('sira_no', { ascending: true });
                    if (!ops || ops.length === 0) {
                        goster(`Bu modelin reçetesi (operasyonları) henüz tanımlanmamış. Devam edemezsiniz.`, 'error');
                    } else {
                        setSeciliSiparis({ ...ordData, is_barkodu: kod });
                        setModelOperasyonlari(ops);
                        goster('Sipariş Rotası Okundu! Lütfen yapmak istediğiniz parçayı (adımı) seçerek başlayın.', 'success');
                    }
                } else {
                    goster('Siparişe bağlı bir Model (Ürün) tanımlanmamış! Ar-Ge kaydı hatalı.', 'error');
                }
            }
        } catch (err) {
            console.error(err);
            goster('Hata: ' + err.message, 'error');
        }
        setBekliyor(false);
    };

    // DOKUNMATİK EKRANDAN OPERASYON SEÇİMİ
    const isEmriBaslat = async (op_id, ord_id, is_barkodu, miktar) => {
        setBekliyor(true);
        // İlgili operasyon bilgilerini modelOperasyonlari dizisinden bul (prim/maliyet hesaplaması için)
        const opData = modelOperasyonlari.find(o => o.id === op_id);

        const { data, error } = await supabase
            .from('b1_personel_performans')
            .insert([{
                personel_id: personel.id,
                operasyon_id: op_id,
                order_id: ord_id, // Geri uyumluluk için order_id
                imalat_id: ord_id, // Yeni sistem b1_imalat_emirleri referansı için imalat_id
                is_barkodu: is_barkodu,
                hedef_adet: miktar,
                uretilen_adet: 0,
                fire_adet: 0,
                baslangic_saati: new Date().toISOString(),
                otonom_tespit: false,
                kaynak_cihaz: 'M6-Tablet',
                // Değerler iş bittiğinde doldurulacak, şimdilik null/0
            }])
            .select('*, b1_operasyon_tanimlari(*)')
            .single();

        if (error) {
            goster('İş başlatılamadı: ' + error.message, 'error');
        } else {
            setIslemdekiIs(data);
            setSeciliSiparis(null); // Seçim ekranını kapat
            setModelOperasyonlari([]);
            goster(`İşlem Onaylandı! Zaman saati çalışmaya başladı.`, 'success');
        }
        setBekliyor(false);
    };

    const isiTamamla = async () => {
        setBekliyor(true);
        try {
            const kalitePuani = handleKesintiHesapla(fireAdet, uretimAdet);
            const sureSaniye = (new Date() - new Date(islemdekiIs.baslangic_saati)) / 1000;
            const zamanAsimi = sureSaniye > (8 * 3600);

            // MALIYET VE PRIM HESAPLAMASI (Akıllı MES Algoritması)
            let kazanilanDeğer = 0;
            let kazanilanPrimGuncel = 0;

            if (islemdekiIs.b1_operasyon_tanimlari) {
                const op = islemdekiIs.b1_operasyon_tanimlari;
                kazanilanDeğer = uretimAdet * (Number(op.isletmeye_kattigi_deger_tl) || 0);

                // Personel kotamızı aştıysa, prim dezenfekte moduna geçer.
                // Eğer {önceki toplam değer + bu işlemin değeri} > aylık maliyet ise prim hak eder.
                const yeniToplamDeger = personelAylikPerformans.toplam_deger + kazanilanDeğer;
                if (yeniToplamDeger > personelAylikPerformans.maliyet_hedefi) {
                    kazanilanPrimGuncel = uretimAdet * (Number(op.baz_prim_tl) || 0) * (Number(op.zorluk_derecesi) || 1.0);
                }
            } else {
                // Eski geri uyumluluk fallback
                kazanilanPrimGuncel = (islemdekiIs.b1_uretim_operasyonlari?.parca_basi_deger_tl || 0) * uretimAdet;
            }

            const { error } = await supabase
                .from('b1_personel_performans')
                .update({
                    bitis_saati: new Date().toISOString(),
                    fire_adet: fireAdet,
                    uretilen_adet: uretimAdet,
                    adet: uretimAdet, // Yeni sisteme compat
                    kalite_puani: kalitePuani,
                    hiza_gore_prim_tl: kazanilanPrimGuncel, // Geri uyumluluk alanı
                    kazanilan_prim: kazanilanPrimGuncel, // Yeni Akıllı MES alanı
                    isletmeye_katilan_deger: kazanilanDeğer,
                    zaman_asimi_durus: zamanAsimi,
                    onay_durumu: 'onaylandi'
                })
                .eq('id', islemdekiIs.id);

            if (error) throw error;

            if (kazanilanPrimGuncel > 0) {
                goster(`İşlem Bitti! Hedefinizi aştınız. +${kazanilanPrimGuncel} TL PRİM kazandınız! 🔥`, 'success');
            } else {
                goster(`İşlem Bitti! İşletmeye +${kazanilanDeğer} TL değer kattınız. Prim kotasına yaklaşıyorsunuz!`, 'success');
            }

            setBitisPopup(false);
            setFireAdet(0);
            setIslemdekiIs(null);

            // 5 Saniye sonra sonraki kişi için paneli sıfırla (Eğer kendi başka iş okutmazsa diye)
            setTimeout(() => {
                cikiSifirla();
            }, 5000);

        } catch (err) {
            goster('Kayıt Hatası: ' + err.message, 'error');
        }
        setBekliyor(false);
    };

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#020617', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
            {/* HER ZAMAN ODAKTA OLACAK GİZLİ İNPUT */}
            <form onSubmit={barkodOkundu} style={{ position: 'absolute', top: -1000 }}>
                <input ref={inputRef} value={barkod} onChange={e => setBarkod(e.target.value)} autoFocus />
                <button type="submit">Gönder</button>
            </form>

            {/* ÜST BAR */}
            <div style={{ padding: '20px 30px', background: '#0f172a', borderBottom: '2px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(16,185,129,0.3)' }}>
                        <Scan size={26} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.05em' }}>M6 ÜRETİM KİOSKU</h1>
                        <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Tesis Performans Yöneticisi</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {personel && personelAylikPerformans.maliyet_hedefi > 0 && (
                        <div style={{ marginRight: 20, textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, marginBottom: 4, textTransform: 'uppercase' }}>{isAR ? 'الهدف الشهري وقسط' : 'AYLIK AMORTİ / KOTA DURUMU'}</div>
                            <div style={{ width: 200, height: 12, background: '#1e293b', borderRadius: 6, overflow: 'hidden', position: 'relative', border: '1px solid #334155' }}>
                                <div style={{
                                    width: `${Math.min(100, (personelAylikPerformans.toplam_deger / personelAylikPerformans.maliyet_hedefi) * 100)}%`,
                                    height: '100%',
                                    background: personelAylikPerformans.toplam_deger > personelAylikPerformans.maliyet_hedefi ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #059669)',
                                    boxShadow: personelAylikPerformans.toplam_deger > personelAylikPerformans.maliyet_hedefi ? '0 0 10px rgba(239,68,68,0.8)' : 'none',
                                    transition: 'width 1s ease-in-out'
                                }}></div>
                            </div>
                            <div style={{ fontSize: '0.75rem', marginTop: 4, fontWeight: 900, color: personelAylikPerformans.toplam_deger > personelAylikPerformans.maliyet_hedefi ? '#fca5a5' : '#6ee7b7' }}>
                                %{((personelAylikPerformans.toplam_deger / personelAylikPerformans.maliyet_hedefi) * 100).toFixed(1)} ({personelAylikPerformans.toplam_deger}₺ / {personelAylikPerformans.maliyet_hedefi}₺)
                            </div>
                        </div>
                    )}
                    {mesaj.text && (
                        <div style={{ background: mesaj.tur === 'error' ? '#7f1d1d' : '#064e3b', color: mesaj.tur === 'error' ? '#fca5a5' : '#6ee7b7', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: '0.9rem', animation: 'fadeIn 0.3s' }}>
                            {mesaj.text}
                        </div>
                    )}
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e2e8f0', fontFamily: 'monospace', padding: '8px 16px', background: '#1e293b', borderRadius: 12 }}>
                        {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* ANA İÇERİK MASA */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ width: '100%', maxWidth: seciliSiparis ? 1000 : 800, background: '#0f172a', borderRadius: 24, padding: '40px', border: '2px solid #1e293b', animation: 'slideUp 0.4s ease-out', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>

                    {!personel ? (
                        // 1. ADIM: PERSONEL OKUMA
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ margin: '0 auto 30px', width: 140, height: 140, borderRadius: '50%', border: '6px dashed #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                <div style={{ position: 'absolute', width: '200%', height: 4, background: 'linear-gradient(90deg, transparent, #10b981, transparent)', animation: 'scanLine 2s linear infinite' }}></div>
                                <UserCheck size={60} color="#64748b" />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 15px', color: '#f8fafc' }}>
                                {isAR ? 'الرجاء مسح بطاقة الموظف الخاصة بك' : 'Lütfen Personel Kartınızı Okutun'}
                            </h2>
                            <p style={{ fontSize: '1.1rem', color: '#94a3b8', fontWeight: 600 }}>Devam etmek için barkod okuyucuyu (veya tablet kamerasını) kimliğinize tutun.</p>
                        </div>
                    ) : (
                        // PERSONEL OTURUMU AKTİF
                        <div>
                            {/* PROFİL BAŞLIĞI */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingBottom: 20, borderBottom: '2px solid #1e293b' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <div style={{ width: 60, height: 60, background: 'linear-gradient(to bottom right, #047857, #064e3b)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, border: '2px solid #10b981' }}>
                                        {personel.ad_soyad?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc' }}>{personel.ad_soyad}</h3>
                                        <span style={{ background: '#1e293b', color: '#94a3b8', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800, marginTop: 5, display: 'inline-block', border: '1px solid #334155' }}>
                                            {personel.birim || 'Atölye Çalışanı'}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={cikiSifirla} style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '10px 20px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <LogOut size={18} /> Çıkış
                                </button>
                            </div>

                            {/* EKRAN YÖNETİCİSİ */}
                            {islemdekiIs ? (
                                // A. DEVAM EDEN İŞ EKRANI
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))', border: '2px solid rgba(59, 130, 246, 0.5)', borderRadius: 20, padding: '40px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
                                        {/* Arka plan dalgası */}
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.1) 50%, transparent 100%)', animation: 'scanLine 3s infinite linear' }}></div>

                                        <Hammer size={50} color="#60a5fa" style={{ marginBottom: 15, position: 'relative', zIndex: 2 }} />
                                        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#93c5fd', position: 'relative', zIndex: 2 }}>
                                            {islemdekiIs.b1_operasyon_tanimlari?.operasyon_adi || islemdekiIs.b1_uretim_operasyonlari?.operasyon_adi || 'Bilinmeyen İşlem'}
                                        </h2>

                                        {/* EĞİTİM / NASIL YAPILIR MİMARİSİ */}
                                        {islemdekiIs.b1_operasyon_tanimlari && (
                                            <button
                                                onClick={() => { setSeciliEgitim(islemdekiIs.b1_operasyon_tanimlari); setEgitimModalAcik(true); }}
                                                style={{ marginTop: 15, background: '#1e293b', color: '#60a5fa', border: '1px solid #3b82f6', padding: '8px 16px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', zIndex: 2, position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                            >
                                                ℹ️ {isAR ? 'كيفية التطبيق (فيديو وتعليمات)' : 'NASIL YAPILIR? (SOP EĞİTİM DOSYASI)'}
                                            </button>
                                        )}

                                        <p style={{ margin: '15px 0 0', color: '#94a3b8', fontSize: '1.1rem', position: 'relative', zIndex: 2 }}>Şu anda makinede performansınız kaydediliyor...</p>

                                        <div style={{ marginTop: 30, display: 'inline-block', background: '#0f172a', padding: '15px 30px', borderRadius: 16, fontSize: '1.3rem', fontWeight: 900, border: '1px solid #1e293b', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', position: 'relative', zIndex: 2 }}>
                                            ⏱️ Başlama: {new Date(islemdekiIs.baslangic_saati).toLocaleTimeString('tr-TR')}
                                        </div>
                                    </div>
                                    <button disabled={bekliyor} onClick={() => setBitisPopup(true)} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', padding: '24px 40px', borderRadius: 20, fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer', width: '100%', boxShadow: '0 10px 30px rgba(16,185,129,0.3)', transition: 'transform 0.1s', ":active": { transform: "scale(0.98)" } }}>
                                        {bekliyor ? '...' : '✅ İŞLEM BİTTİ, TAMAMLA'}
                                    </button>
                                </div>
                            ) : seciliSiparis ? (
                                // B. SİPARİŞ BULUNDU -> DOKUNMATİK MENÜ (REÇETE SEÇİMİ)
                                <div>
                                    <div style={{ textAlign: 'center', marginBottom: 30 }}>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 10px' }}>
                                            Sepet Okundu: {seciliSiparis.order_code}
                                        </h2>
                                        <p style={{ fontSize: '1.1rem', color: '#cbd5e1', fontWeight: 600 }}>Hedef Adet: <span style={{ color: '#10b981', fontWeight: 900 }}>{seciliSiparis.quantity}</span>. Lütfen yapacağınız işlemi seçiniz:</p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', maxHeight: '50vh', overflowY: 'auto', paddingRight: 10 }}>
                                        {modelOperasyonlari.map(op => (
                                            <button
                                                key={op.id}
                                                disabled={bekliyor}
                                                onClick={() => isEmriBaslat(op.id, seciliSiparis.id, seciliSiparis.is_barkodu, seciliSiparis.quantity)}
                                                style={{ textAlign: 'left', background: '#1e293b', border: '2px solid #334155', borderRadius: 16, padding: '20px', cursor: bekliyor ? 'wait' : 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                                                onMouseOver={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#0f172a'; }}
                                                onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = '#1e293b'; }}
                                            >
                                                <div style={{ position: 'absolute', top: 0, right: 0, background: '#047857', color: 'white', fontWeight: 900, padding: '5px 15px', borderBottomLeftRadius: 16, fontSize: '0.85rem' }}>
                                                    Adım {op.sira_no}
                                                </div>
                                                <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800, color: 'white', paddingRight: '60px' }}>
                                                    {op.operasyon_adi}
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                    <span style={{ background: '#020617', color: '#94a3b8', fontSize: '0.8rem', padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>
                                                        ⚙️ İş Sırası: {op.sira_no || '-'}
                                                    </span>
                                                    {op.isletmeye_kattigi_deger_tl > 0 && (
                                                        <span style={{ background: '#166534', color: '#86efac', fontSize: '0.8rem', padding: '4px 10px', borderRadius: 8, fontWeight: 800 }}>
                                                            📈 +{op.isletmeye_kattigi_deger_tl}₺ Kota
                                                        </span>
                                                    )}
                                                    {op.zorluk_derecesi && (
                                                        <span style={{ background: '#450a0a', color: '#fca5a5', fontSize: '0.8rem', padding: '4px 10px', borderRadius: 8, fontWeight: 800 }}>
                                                            ⚔️ Zorluk: {op.zorluk_derecesi}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setSeciliSiparis(null)} style={{ marginTop: 25, width: '100%', padding: '15px', background: 'transparent', border: '2px dashed #475569', color: '#94a3b8', borderRadius: 16, fontWeight: 800, cursor: 'pointer', fontSize: '1.1rem' }}>
                                        İptal (Farklı Barkod Okut)
                                    </button>
                                </div>
                            ) : (
                                // C. YENİ İŞ BEKLEME EKRANI (Barkod Odaklı)
                                <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                                    <div style={{ background: '#020617', width: 100, height: 100, borderRadius: 24, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1e293b' }}>
                                        <Search size={50} color="#10b981" />
                                    </div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 15px' }}>
                                        {isAR ? 'مسح باركود العمل' : 'Şimdi Üretim (Sepet) Barkodunu Okutun'}
                                    </h2>
                                    <p style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: 600 }}>Sürenizin başlaması için işlem yapacağınız <b style={{ color: 'white' }}>Toplu Sepeti (Sipariş Föyü)</b> okuyucuya tutun.</p>
                                    <div style={{ position: 'relative', width: 400, height: 100, margin: '40px auto 0', background: 'rgba(30,41,59,0.5)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px dashed #334155' }}>
                                        <div style={{ position: 'absolute', width: '100%', height: 4, background: '#ef4444', animation: 'scanLine 1.5s linear infinite', boxShadow: '0 0 15px rgba(239,68,68,0.8)' }}></div>
                                        <span style={{ fontSize: '2rem', letterSpacing: 15, color: '#cbd5e1', fontWeight: 900, opacity: 0.6 }}>|||||||||||||</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* BİTİRME ONAY & ADET (FİRE) GİRİŞ POPUP */}
            {bitisPopup && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
                    <div style={{ background: '#0f172a', width: '100%', maxWidth: 700, borderRadius: 32, padding: '50px', border: '2px solid #334155', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
                        <h2 style={{ margin: '0 0 10px', fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', color: 'white' }}>İşi Tamamla</h2>
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem', marginBottom: 40, fontWeight: 600 }}>Sonuçları Tesis sistemine bildiriniz.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 40 }}>
                            {/* SAĞLAM ADET SETİ */}
                            <div style={{ background: '#1e293b', padding: 25, borderRadius: 24, border: '2px solid #334155' }}>
                                <div style={{ color: '#cbd5e1', fontSize: '1.1rem', fontWeight: 800, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle size={20} color="#10b981" /> Üretilen Sağlam Adet:
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={() => setUretimAdet(Math.max(1, uretimAdet - 1))} style={{ flex: 1, height: 70, fontSize: '2.5rem', background: '#334155', color: 'white', border: 'none', borderRadius: 16, cursor: 'pointer', fontWeight: 900 }}>-</button>
                                    <input type="number" value={uretimAdet} onChange={e => setUretimAdet(Number(e.target.value))} style={{ flex: 2, height: 70, fontSize: '2.5rem', textAlign: 'center', background: '#020617', color: 'white', border: '2px inset #475569', borderRadius: 16, fontWeight: 900 }} />
                                    <button onClick={() => setUretimAdet(uretimAdet + 1)} style={{ flex: 1, height: 70, fontSize: '2.5rem', background: '#334155', color: 'white', border: 'none', borderRadius: 16, cursor: 'pointer', fontWeight: 900 }}>+</button>
                                </div>
                            </div>

                            {/* FİRE ADET SETİ */}
                            <div style={{ background: '#450a0a', padding: 25, borderRadius: 24, border: '2px solid #7f1d1d' }}>
                                <div style={{ color: '#fca5a5', fontSize: '1.1rem', fontWeight: 800, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertTriangle size={20} color="#ef4444" /> Çıkan Hatalı / Fire:
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={() => setFireAdet(Math.max(0, fireAdet - 1))} style={{ flex: 1, height: 70, fontSize: '2.5rem', background: '#7f1d1d', color: '#fecaca', border: 'none', borderRadius: 16, cursor: 'pointer', fontWeight: 900 }}>-</button>
                                    <input type="number" min="0" value={fireAdet} onChange={e => setFireAdet(Number(e.target.value))} style={{ flex: 1.5, height: 70, fontSize: '2.5rem', textAlign: 'center', background: '#290303', color: '#fca5a5', border: 'none', borderRadius: 16, fontWeight: 900 }} />
                                    <button onClick={() => setFireAdet(fireAdet + 1)} style={{ flex: 1, height: 70, fontSize: '2.5rem', background: '#7f1d1d', color: '#fecaca', border: 'none', borderRadius: 16, cursor: 'pointer', fontWeight: 900 }}>+</button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 15 }}>
                            <button disabled={bekliyor} onClick={() => setBitisPopup(false)} style={{ flex: 1, padding: '24px', background: 'transparent', color: '#94a3b8', border: '2px solid #334155', borderRadius: 20, fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer' }}>
                                İptal Et, Geri Dön
                            </button>
                            <button disabled={bekliyor} onClick={isiTamamla} style={{ flex: 2, padding: '24px', background: 'linear-gradient(to right, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: 20, fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 25px rgba(37,99,235,0.4)' }}>
                                {bekliyor ? 'KAYDEDİLİYOR...' : 'ONAYLA, VERİTABANINA YAZ!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EĞİTİM MODALI (STANDART OPERASYON PROSEDÜRÜ) */}
            {egitimModalAcik && seciliEgitim && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.95)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s', padding: 20 }}>
                    <div style={{ background: '#0f172a', width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', borderRadius: 32, padding: '40px', border: '2px solid #3b82f6', boxShadow: '0 25px 50px rgba(0,0,0,0.8)', position: 'relative' }}>

                        <button onClick={() => setEgitimModalAcik(false)} style={{ position: 'absolute', top: 20, right: 20, background: '#1e293b', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={24} />
                        </button>

                        <h2 style={{ margin: '0 0 5px', fontSize: '2rem', fontWeight: 900, color: 'white' }}>{seciliEgitim.operasyon_adi}</h2>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                            <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.9rem', background: '#450a0a', padding: '4px 10px', borderRadius: 6 }}>Zorluk Çarpanı: {seciliEgitim.zorluk_derecesi}</span>
                            <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.9rem', background: '#064e3b', padding: '4px 10px', borderRadius: 6 }}>Operasyon Kotası: {seciliEgitim.isletmeye_kattigi_deger_tl} ₺</span>
                        </div>

                        {seciliEgitim.egitim_videosu_url ? (
                            <div style={{ width: '100%', height: 400, background: '#000', borderRadius: 16, marginBottom: 20, overflow: 'hidden', border: '2px solid #1e293b' }}>
                                <video src={seciliEgitim.egitim_videosu_url} controls autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'contain' }}></video>
                            </div>
                        ) : seciliEgitim.egitim_gorseli_url ? (
                            <div style={{ width: '100%', height: 300, background: '#020617', borderRadius: 16, marginBottom: 20, border: '2px solid #1e293b', backgroundImage: `url(${seciliEgitim.egitim_gorseli_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        ) : (
                            <div style={{ width: '100%', height: 200, background: '#1e293b', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 800, border: '2px dashed #475569' }}>
                                GÖRSEL KURUMA YÜKLENMEMİŞ
                            </div>
                        )}

                        <div style={{ background: '#1e293b', padding: 20, borderRadius: 16, border: '1px solid #334155' }}>
                            <h3 style={{ margin: '0 0 10px', color: '#60a5fa', fontSize: '1.2rem', fontWeight: 900 }}>Yazılı Talimat:</h3>
                            <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.6, fontSize: '1.1rem', fontWeight: 500 }}>
                                {seciliEgitim.egitim_metni || 'Bu operasyon için sistemde detaylı bir yazılı prosedür girilmemiş. Lütfen standart atölye/fabrika kurallarına uyarak işletimi tamamlayın.'}
                            </p>
                        </div>

                        <button onClick={() => setEgitimModalAcik(false)} style={{ width: '100%', marginTop: 20, padding: 15, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 16, fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer' }}>
                            OKUDUM, ANLADIM VE KAPAT
                        </button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scanLine { 0% { top: -20%; } 100% { top: 120%; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}} />
        </div>
    );
}
