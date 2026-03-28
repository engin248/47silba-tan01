// @ts-nocheck
import { Plus, FileCheck, Factory } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/context/langContext';
import { useIsEmri, DEPARTMANLAR } from '@/features/uretim/hooks/useIsEmri';
import { useUretimRecetesi } from '@/features/uretim/hooks/useUretimRecetesi';
import M6_KameraSayaci from '@/features/uretim/components/M6_KameraSayaci';
import YetkisizEkran from '@/components/shared/YetkisizEkran';
import MesajBanner from '@/components/shared/MesajBanner';
import SayfaBasligi from '@/components/ui/SayfaBasligi';
import Link from 'next/link';
import { formatSure } from '@/features/uretim/hooks/useIsEmri';

import UretimIsEmriListesi from './UretimIsEmriListesi';
import UretimBandMontaj from './UretimBandMontaj';
import UretimKalite from './UretimKalite';
import UretimMaliyet from './UretimMaliyet';
import UretimRecete from './UretimRecete';
import { useState } from 'react';

export default function UretimSayfasi() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [isReworkMod, setIsReworkMod] = useState(false);

    const {
        dept, setDept, orders, personel, maliyetler, raporlar, modeller,
        formOrder, setFormOrder, formAcik, setFormAcik, loading, mesaj,
        kronometer, sure, maliyetForm, setMaliyetForm, maliyetFormAcik, setMaliyetFormAcik,
        aramaMetni, setAramaMetni, filtreDurum, setFiltreDurum,
        barkodOkutulanIsId, setBarkodOkutulanIsId, seciliSiparisler, barkodInputRef,
        durumGuncelle, baslat, duraklat, durdur, ciftBarkodOtonomIslem, // removed formatSure
        yeniIsEmri, duzenleIsEmri, silIsEmri, maliyetKaydet, devirYap,
        toggleSiparisSec, tumunuSec, topluDurumGuncelleAction,
        islemdeId, setIslemdeId,
        aktifPersonel, setAktifPersonel, aktifOperasyonlar
    } = useIsEmri(kullanici);

    const {
        makineler, operasyonlar, receteMesaj, receteLoading, islemdeId: rIslemdeId,
        frmMakine, setFrmMakine, makineFormAcik, setMakineFormAcik,
        makineKaydet, makineDuzenle, makineSil,
        frmOperasyon, setFrmOperasyon, opFormAcik, setOpFormAcik,
        operasyonKaydet, operasyonDuzenle, operasyonSil
    } = useUretimRecetesi(kullanici, modeller, dept);

    let yetkiliMi = false;
    try {
        if (typeof window !== 'undefined') {
            yetkiliMi = kullanici?.grup === 'tam' || !!atob(sessionStorage.getItem('sb47_uretim_pin') || '');
        }
    } catch { yetkiliMi = typeof window !== 'undefined' && !!sessionStorage.getItem('sb47_uretim_pin'); }

    if (!yetkiliMi) {
        return <YetkisizEkran isAR={isAR} mesaj="M6 Üretim Bandı verileri için Üretim PİN girişi zorunludur." />;
    }

    return (
        <div>
            <SayfaBasligi
                icon={<Factory size={24} color="white" />}
                baslik={isAR ? 'خط الإنتاج — إدارة سير العمل' : 'Üretim Bandı — İş Akışı Yönetimi'}
                altBaslik={isAR ? 'أمر العمل → الخط والتجميع → الجودة → التكلفة → الشحن' : 'İş Emri → Bant & Montaj → Kalite → Maliyet → Mağazaya Sevk'}
                islemler={<>
                    {dept === 'is_emri' && (
                        <button onClick={() => setFormAcik(!formAcik)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                            <Plus size={18} /> Yeni İş Emri
                        </button>
                    )}
                    {dept === 'maliyet' && (
                        <button onClick={() => setMaliyetFormAcik(!maliyetFormAcik)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                            <Plus size={18} /> Maliyet Ekle
                        </button>
                    )}
                    {dept === 'receteler' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { setOpFormAcik(false); setMakineFormAcik(!makineFormAcik); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                                <Plus size={18} /> Yeni Makine
                            </button>
                            <button onClick={() => { setMakineFormAcik(false); setOpFormAcik(!opFormAcik); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(4,120,87,0.35)' }}>
                                <Plus size={18} /> Yeni Operasyon
                            </button>
                        </div>
                    )}
                </>}
            />

            {dept === 'is_emri' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {[
                        { label: 'Toplam', val: orders.length, color: '#047857', bg: '#ecfdf5' },
                        { label: '⏳ Bekliyor', val: orders.filter(o => o.status === 'pending').length, color: '#d97706', bg: '#fffbeb' },
                        { label: '⚡ Üretimde', val: orders.filter(o => o.status === 'in_progress').length, color: '#2563eb', bg: '#eff6ff' },
                        { label: '✅ Tamamlandı', val: orders.filter(o => o.status === 'completed').length, color: '#059669', bg: '#f0fdf4' },
                        { label: '⚙️ Kapasite', val: orders.filter(o => ['pending', 'in_progress'].includes(o.status)).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0) + ' Adet', color: '#8b5cf6', bg: '#f5f3ff' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '0.875rem' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: s.color, whiteSpace: 'nowrap' }}>{s.val}</div>
                        </div>
                    ))}
                </div>
            )}

            <MesajBanner mesaj={mesaj} />

            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.5rem', alignItems: 'center' }}>
                {DEPARTMANLAR.map(d => (
                    <button key={d.id} onClick={() => { setDept(d.id); setFormAcik(false); setMaliyetFormAcik(false); }}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', borderColor: dept === d.id ? '#047857' : '#e5e7eb', background: dept === d.id ? '#047857' : 'white', color: dept === d.id ? 'white' : '#374151' }}>
                        {d.ad}
                    </button>
                ))}
                <div style={{ marginLeft: 'auto', paddingLeft: '1rem', borderLeft: '2px solid #e5e7eb' }}>
                    <Link href="/raporlar" style={{ textDecoration: 'none' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#d97706', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
                            <FileCheck size={16} /> Muhasebe Raporu (M8)
                        </button>
                    </Link>
                </div>
            </div>

            {dept === 'receteler' && <UretimRecete receteMesaj={receteMesaj} receteLoading={receteLoading} rIslemdeId={rIslemdeId} frmMakine={frmMakine} setFrmMakine={setFrmMakine} makineFormAcik={makineFormAcik} setMakineFormAcik={setMakineFormAcik} makineKaydet={makineKaydet} makineDuzenle={makineDuzenle} makineSil={makineSil} frmOperasyon={frmOperasyon} setFrmOperasyon={setFrmOperasyon} opFormAcik={opFormAcik} setOpFormAcik={setOpFormAcik} operasyonKaydet={operasyonKaydet} operasyonDuzenle={operasyonDuzenle} operasyonSil={operasyonSil} makineler={makineler} operasyonlar={operasyonlar} modeller={modeller} />}
            {dept === 'is_emri' && <UretimIsEmriListesi orders={orders} modeller={modeller} formAcik={formAcik} setFormAcik={setFormAcik} formOrder={formOrder} setFormOrder={setFormOrder} loading={loading} yeniIsEmri={yeniIsEmri} aramaMetni={aramaMetni} setAramaMetni={setAramaMetni} filtreDurum={filtreDurum} setFiltreDurum={setFiltreDurum} seciliSiparisler={seciliSiparisler} tumunuSec={tumunuSec} topluDurumGuncelleAction={topluDurumGuncelleAction} islemdeId={islemdeId} toggleSiparisSec={toggleSiparisSec} durumGuncelle={durumGuncelle} duzenleIsEmri={duzenleIsEmri} silIsEmri={silIsEmri} maliyetler={maliyetler} />}
            {dept === 'kesim' && <UretimBandMontaj aktifPersonel={aktifPersonel} isReworkMod={isReworkMod} setIsReworkMod={setIsReworkMod} barkodOkutulanIsId={barkodOkutulanIsId} setBarkodOkutulanIsId={setBarkodOkutulanIsId} barkodInputRef={barkodInputRef} ciftBarkodOtonomIslem={ciftBarkodOtonomIslem} orders={orders} personel={personel} />}
            {dept === 'kalite' && <UretimKalite orders={orders} kronometer={kronometer} sure={sure} formatSure={formatSure} baslat={baslat} duraklat={duraklat} durdur={durdur} />}
            {dept === 'kameralar' && <M6_KameraSayaci />}
            {dept === 'maliyet' && <UretimMaliyet maliyetFormAcik={maliyetFormAcik} setMaliyetFormAcik={setMaliyetFormAcik} maliyetForm={maliyetForm} setMaliyetForm={setMaliyetForm} loading={loading} maliyetKaydet={maliyetKaydet} maliyetler={maliyetler} orders={orders} />}

            {dept === 'devir' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orders.filter(o => o.status === 'completed').map(o => {
                        const pt = maliyetler.filter(m => m.order_id === o.id).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0);
                        const raporVar = raporlar.find(r => r.order_id === o.id);
                        return (
                            <div key={o.id} style={{ background: 'white', border: '2px solid', borderColor: raporVar?.devir_durumu ? '#10b981' : '#e5e7eb', borderRadius: 14, padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{o.b1_model_taslaklari?.model_adi}</div>
                                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>Adet: {o.quantity} | Maliyet: <strong>₺{pt.toFixed(2)}</strong></div>
                                    </div>
                                    {!raporVar
                                        ? <button disabled={islemdeId === 'devir_' + o.id} onClick={() => devirYap(o.id)} style={{ padding: '8px 16px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: islemdeId === 'devir_' + o.id ? 'wait' : 'pointer', opacity: islemdeId === 'devir_' + o.id ? 0.5 : 1 }}>Mağazaya Sevket</button>
                                        : <span style={{ fontWeight: 800, color: '#10b981' }}>✅ M8 Raporunda</span>
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {dept === 'takip' && (
                <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: 16, color: 'white' }}>
                    <h3 style={{ margin: '0 0 1rem', fontWeight: 800 }}>📡 OTONOM ÜRETİM RADARI</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {orders.filter(o => o.status === 'in_progress').length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Şu an aktif iş emri yok.</div>
                        ) : (
                            orders.filter(o => o.status === 'in_progress').map(o => {
                                const bitisGectimi = o.planned_end_date && new Date(o.planned_end_date) < new Date();
                                return (
                                    <div key={o.id} style={{ background: '#1e293b', border: `2px solid ${bitisGectimi ? '#ef4444' : '#334155'}`, borderRadius: 12, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 800 }}>{o.b1_model_taslaklari?.model_adi}</div>
                                            {bitisGectimi && <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 900 }}>🚨 DARBOĞAZ TESPİTİ</div>}
                                        </div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace', color: bitisGectimi ? '#ef4444' : '#10b981' }}>
                                            {formatSure(sure[o.id] || 0)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
