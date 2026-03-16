'use client';
import { useState, useEffect, useRef } from 'react';
import { Scan, UserCheck, PackageOpen, CheckCircle, AlertTriangle, Clock, Hammer, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/langContext';

export default function KioskTerminal() {
    const { lang } = useLang();
    const isAR = lang === 'ar';

    const [barkod, setBarkod] = useState('');
    const [personel, setPersonel] = useState(null);
    const [islemdekiIs, setIslemdekiIs] = useState(null);
    const [mesaj, setMesaj] = useState({ text: '', tur: '' }); // tur: success, error, info
    const [bekliyor, setBekliyor] = useState(false);

    // Popup (İşi bitirme sırasında fire sormak için)
    const [bitisPopup, setBitisPopup] = useState(false);
    const [fireAdet, setFireAdet] = useState(0);
    const [uretimAdet, setUretimAdet] = useState(0);

    const inputRef = useRef(null);

    // Kiosk Modu: Her zaman input'a odaklan
    useEffect(() => {
        const interval = setInterval(() => {
            if (!bitisPopup && inputRef.current) {
                inputRef.current.focus();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [bitisPopup]);

    const goster = (txt, t = 'info') => {
        setMesaj({ text: txt, tur: t });
        setTimeout(() => setMesaj({ text: '', tur: '' }), 5000);
    };

    const handleKesintiHesapla = (fAdet, islemAdet) => {
        if (!islemAdet || islemAdet <= 0) return 100;
        const oran = (fAdet / islemAdet) * 100;
        const kalite = 100 - (oran * 2); // 1 fire %2 ceza gibi (Örnek formül)
        return kalite < 0 ? 0 : kalite;
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
                    .or(`barkod_no.eq.${kod},id.eq.${kod}`)
                    .single();

                if (pErr || !pData) {
                    goster('Personel kartı bulunamadı. Lütfen tekrar okutun.', 'error');
                } else {
                    setPersonel(pData);
                    goster(`Hoşgeldin, ${pData.ad_soyad}. Şimdi iş/sepet barkodunu okutun.`, 'success');
                }
                setBekliyor(false);
                return;
            }

            // DURUM 2: Personel belli, işlem okunuyor
            // Aktif bir işi (henüz bitmemiş) var mı kontrol edelim
            const { data: aktifIs } = await supabase
                .from('b1_personel_performans')
                .select('*, b1_uretim_operasyonlari(*)')
                .eq('personel_id', personel.id)
                .is('bitis_saati', null)
                .single();

            // Eğer kod aktif işin ID'si veya operasyon ID'si ise, Bitirme Ekranı aç
            if (aktifIs && (aktifIs.id === kod || aktifIs.operasyon_id === kod || aktifIs.order_id === kod)) {
                setIslemdekiIs(aktifIs);
                setUretimAdet(aktifIs.islem_miktari || 1);
                setBitisPopup(true);
                setBekliyor(false);
                return;
            }

            // Başka aktif işi varsa uyarı ver ve iptal et
            if (aktifIs) {
                goster('Zaten devam eden bir işiniz var. Ekrandan seçip bitirin.', 'error');
                setIslemdekiIs(aktifIs);
                setBekliyor(false);
                return;
            }

            // Yeni İş Başlatma Olayı (Barkod yeni bir operasyona/siparişe ait)
            // Sistemde Operasyon/Order Barkodu eşleşmesi
            let { data: opData } = await supabase
                .from('b1_uretim_operasyonlari')
                .select('id, operasyon_adi, zorluk_derecesi, parca_basi_deger_tl')
                .eq('id', kod)
                .single();

            // Eğer sipariş bazlıysa (order_id)
            let { data: ordData } = kod ? await supabase.from('production_orders').select('id, quantity').eq('id', kod).single() : { data: null };

            // OP ve ORDER eşleşemezse fallback Test Datası eklenecek
            if (!opData && !ordData) {
                goster('Geçersiz iş/sepet barkodu. Test için "TEST-OP" kullanabilirsiniz.', 'error');
                if (kod === 'TEST-OP') {
                    // Test Simülasyonu
                    await isEmriBaslat(null, null, 100);
                }
            } else {
                await isEmriBaslat(opData?.id, ordData?.id, ordData?.quantity || 1);
            }

        } catch (err) {
            console.error(err);
            goster('Barkod okuma hatası: ' + err.message, 'error');
        }
        setBekliyor(false);
    };

    const isEmriBaslat = async (op_id, ord_id, miktar) => {
        const { data, error } = await supabase
            .from('b1_personel_performans')
            .insert([{
                personel_id: personel.id,
                operasyon_id: op_id,
                order_id: ord_id,
                islem_miktari: miktar,
                baslangic_saati: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            goster('İş başlatılırken hata oluştu: ' + error.message, 'error');
            return;
        }

        setIslemdekiIs(data);
        goster(`İş başlatıldı! Süreniz işliyor. İş bitiminde tekrar okutunuz.`, 'success');
    };

    const isiTamamla = async () => {
        setBekliyor(true);
        try {
            const kalitePuani = handleKesintiHesapla(fireAdet, uretimAdet);
            const sureSaniye = (new Date() - new Date(islemdekiIs.baslangic_saati)) / 1000;
            const primTL = (islemdekiIs.b1_uretim_operasyonlari?.parca_basi_deger_tl || 0) * uretimAdet;

            const { error } = await supabase
                .from('b1_personel_performans')
                .update({
                    bitis_saati: new Date().toISOString(),
                    fire_adet: fireAdet,
                    islem_miktari: uretimAdet, // Güncelleme ihtimaline karşı
                    kalite_puani_yuzde: kalitePuani,
                    hiza_gore_prim_tl: primTL
                })
                .eq('id', islemdekiIs.id);

            if (error) throw error;

            goster('Tebrikler! İş emri başarıyla tamamlandı.', 'success');
            setBitisPopup(false);
            setFireAdet(0);
            setIslemdekiIs(null);

            // 3 Saniye sonra sonraki kişi için paneli sıfırla
            setTimeout(() => {
                setPersonel(null);
            }, 3000);

        } catch (err) {
            goster('Hata: ' + err.message, 'error');
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
            <div style={{ padding: '20px 30px', background: '#0f172a', borderBottom: '2px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Scan size={26} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.05em' }}>M4 OTONOM KİOSK</h1>
                        <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Performans ve Barkod Terminali</p>
                    </div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e2e8f0', fontFamily: 'monospace' }}>
                    {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* ANA İÇERİK MASA */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>

                {!personel ? (
                    // 1. ADIM: PERSONEL OKUMA
                    <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                        <div style={{ margin: '0 auto 30px', width: 140, height: 140, borderRadius: '50%', border: '6px dashed #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            <div style={{ position: 'absolute', width: '200%', height: 4, background: 'linear-gradient(90deg, transparent, #10b981, transparent)', animation: 'scanLine 2s linear infinite' }}></div>
                            <UserCheck size={60} color="#64748b" />
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 15px', color: '#f8fafc' }}>
                            {isAR ? 'الرجاء مسح بطاقة الموظف الخاصة بك' : 'Lütfen Personel Kartınızı Okutun'}
                        </h2>
                        <p style={{ fontSize: '1.1rem', color: '#94a3b8', fontWeight: 600 }}>Devam etmek için barkod okuyucuyu kimliğinize tutun.</p>
                    </div>
                ) : (
                    // 2. ADIM: İŞ / SEPET OKUMA
                    <div style={{ width: '100%', maxWidth: 800, background: '#0f172a', borderRadius: 24, padding: '40px', border: '2px solid #1e293b', animation: 'slideUp 0.4s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingBottom: 20, borderBottom: '2px solid #1e293b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                <div style={{ width: 60, height: 60, background: '#047857', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 }}>
                                    {personel.ad_soyad?.charAt(0) || 'P'}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc' }}>{personel.ad_soyad}</h3>
                                    <span style={{ background: '#064e3b', color: '#34d399', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800, marginTop: 5, display: 'inline-block' }}>
                                        {personel.birim || 'Yetkili Personel'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => { setPersonel(null); setIslemdekiIs(null); }} style={{ background: 'transparent', border: '2px solid #334155', color: '#94a3b8', padding: '10px 20px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>
                                <X size={20} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Çıkış
                            </button>
                        </div>

                        {islemdekiIs ? (
                            // AKTİF İŞ EKRANI
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '2px solid #3b82f6', borderRadius: 16, padding: '30px', marginBottom: 20 }}>
                                    <Clock size={40} color="#3b82f6" style={{ marginBottom: 15 }} />
                                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#93c5fd' }}>İşlem Devam Ediyor...</h2>
                                    <p style={{ margin: '10px 0 0', color: '#94a3b8', fontSize: '1.1rem' }}>Bitirmek için <b>aynı sepet barkodunu</b> tekrar okutun.</p>
                                    <div style={{ marginTop: 20, background: '#1e293b', padding: '15px', borderRadius: 12, fontSize: '1.2rem', fontWeight: 800 }}>
                                        Başlangıç: {new Date(islemdekiIs.baslangic_saati).toLocaleTimeString('tr-TR')}
                                    </div>
                                </div>
                                <button onClick={() => setBitisPopup(true)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '20px 40px', borderRadius: 16, fontSize: '1.3rem', fontWeight: 900, cursor: 'pointer', width: '100%', boxShadow: '0 8px 30px rgba(16,185,129,0.3)' }}>
                                    ✅ EKRANDAN MANUEL BİTİR
                                </button>
                            </div>
                        ) : (
                            // YENİ İŞ BEKLEME EKRANI
                            <div style={{ textAlign: 'center' }}>
                                <PackageOpen size={60} color="#10b981" style={{ margin: '0 auto 20px' }} />
                                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 15px' }}>
                                    {isAR ? 'مسح باركود العمل' : 'Şimdi Üretim Barkodunu Okutun'}
                                </h2>
                                <p style={{ fontSize: '1.1rem', color: '#94a3b8', fontWeight: 600 }}>Sürenizin başlaması için işlem yapacağınız sepeti okuyucuya tutun.</p>
                                <div style={{ position: 'relative', width: 300, height: 80, margin: '30px auto 0', background: '#1e293b', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #475569' }}>
                                    <span style={{ fontSize: '2rem', letterSpacing: 10, color: '#64748b', opacity: 0.5 }}>||||||||||||</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* BİTİRME ONAY & FİRE POPUP (TABLET MODU BÜYÜK BUTONLAR) */}
            {bitisPopup && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#0f172a', width: '100%', maxWidth: 650, borderRadius: 24, padding: 40, border: '2px solid #334155', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
                        <h2 style={{ margin: '0 0 30px', fontSize: '2.2rem', fontWeight: 900, textAlign: 'center' }}>İşi Tamamla</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
                            <div style={{ background: '#1e293b', padding: 20, borderRadius: 16 }}>
                                <div style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>Üretilen Toplam Adet:</div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={() => setUretimAdet(Math.max(1, uretimAdet - 1))} style={{ flex: 1, height: 60, fontSize: '2rem', background: '#334155', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer' }}>-</button>
                                    <input type="number" value={uretimAdet} onChange={e => setUretimAdet(Number(e.target.value))} style={{ flex: 2, height: 60, fontSize: '2rem', textAlign: 'center', background: '#0f172a', color: 'white', border: '2px solid #475569', borderRadius: 12, fontWeight: 900 }} />
                                    <button onClick={() => setUretimAdet(uretimAdet + 1)} style={{ flex: 1, height: 60, fontSize: '2rem', background: '#334155', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer' }}>+</button>
                                </div>
                            </div>

                            <div style={{ background: '#450a0a', padding: 20, borderRadius: 16, border: '1px solid #7f1d1d' }}>
                                <div style={{ color: '#fca5a5', fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>🔥 Çıkan Fire / Zayiat Adeti:</div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={() => setFireAdet(Math.max(0, fireAdet - 1))} style={{ flex: 1, height: 60, fontSize: '2rem', background: '#7f1d1d', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer' }}>-</button>
                                    <input type="number" value={fireAdet} onChange={e => setFireAdet(Number(e.target.value))} style={{ flex: 2, height: 60, fontSize: '2rem', textAlign: 'center', background: '#2a0606', color: '#f87171', border: '2px solid #ef4444', borderRadius: 12, fontWeight: 900 }} />
                                    <button onClick={() => setFireAdet(fireAdet + 1)} style={{ flex: 1, height: 60, fontSize: '2rem', background: '#7f1d1d', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer' }}>+</button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 20 }}>
                            <button onClick={() => setBitisPopup(false)} style={{ flex: 1, padding: 20, background: 'transparent', border: '3px solid #334155', color: 'white', borderRadius: 16, fontSize: '1.4rem', fontWeight: 800, cursor: 'pointer' }}>İptal</button>
                            <button onClick={isiTamamla} disabled={bekliyor} style={{ flex: 2, padding: 20, background: '#10b981', border: 'none', color: 'white', borderRadius: 16, fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <CheckCircle size={28} /> {bekliyor ? 'KAYDEDİLİYOR...' : 'ONAYLA & BİTİR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MESAJ TOAST */}
            {mesaj.text && (
                <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: mesaj.tur === 'error' ? '#ef4444' : mesaj.tur === 'success' ? '#10b981' : '#3b82f6', color: 'white', padding: '15px 30px', borderRadius: 16, fontSize: '1.2rem', fontWeight: 800, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 99999, whiteSpace: 'nowrap' }}>
                    {mesaj.text}
                </div>
            )}

            <style>{`
                @keyframes scanLine { 0% { top: -10px; } 50% { top: 150px; } 100% { top: -10px; } }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
