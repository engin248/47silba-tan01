'use client';
/**
 * features/uretim/components/UretimSayfasi.js
 * Üretim Bandı Sayfası — Tüm UI burada, logic useIsEmri hook'unda
 */
import { LayoutList, Play, Square, Pause, FileCheck, RefreshCw, AlertTriangle, Plus, Trash2, StopCircle, Clock, Save, DollarSign, Activity, Factory, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { useIsEmri, DEPARTMANLAR, DURUS_KODLARI, MALIYET_TIPLERI, ST_RENK, ST_LABEL, getST_RENK, getST_LABEL } from '@/features/uretim/hooks/useIsEmri';
import { useUretimRecetesi } from '@/features/uretim/hooks/useUretimRecetesi';
import M6_KameraSayaci from '@/features/uretim/components/M6_KameraSayaci';
import YetkisizEkran from '@/components/shared/YetkisizEkran';
import MesajBanner from '@/components/shared/MesajBanner';
import SayfaBasligi from '@/components/ui/SayfaBasligi';
import DurumBadge from '@/components/ui/DurumBadge';
import Link from 'next/link';

export default function UretimSayfasi() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';

    // Tüm state ve fonksiyonlar hook'tan geliyor
    const {
        dept, setDept, orders, personel, maliyetler, raporlar, modeller,
        formOrder, setFormOrder, formAcik, setFormAcik, loading, mesaj,
        kronometer, sure, maliyetForm, setMaliyetForm, maliyetFormAcik, setMaliyetFormAcik,
        aramaMetni, setAramaMetni, filtreDurum, setFiltreDurum,
        barkodOkutulanIsId, setBarkodOkutulanIsId, seciliSiparisler, barkodInputRef,
        durumGuncelle, baslat, duraklat, durdur, formatSure, ciftBarkodOtonomIslem,
        yeniIsEmri, duzenleIsEmri, silIsEmri, maliyetKaydet, devirYap,
        toggleSiparisSec, tumunuSec, topluDurumGuncelleAction,
        islemdeId, setIslemdeId, // ÇİFT TIKLAMA KORUMASI
        aktifPersonel, setAktifPersonel, aktifOperasyonlar, // [ÇİFT BARKOD]
    } = useIsEmri(kullanici);

    const {
        makineler, operasyonlar, receteMesaj, receteLoading, islemdeId: rIslemdeId,
        frmMakine, setFrmMakine, makineFormAcik, setMakineFormAcik,
        makineKaydet, makineDuzenle, makineSil,
        frmOperasyon, setFrmOperasyon, opFormAcik, setOpFormAcik,
        operasyonKaydet, operasyonDuzenle, operasyonSil
    } = useUretimRecetesi(kullanici, modeller, dept);

    // Yetki kontrolü
    let yetkiliMi = false;
    try {
        if (typeof window !== 'undefined') {
            yetkiliMi = kullanici?.grup === 'tam' || !!atob(sessionStorage.getItem('sb47_uretim_pin') || '');
        }
    } catch { yetkiliMi = typeof window !== 'undefined' && !!sessionStorage.getItem('sb47_uretim_pin'); }

    const inp = { width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
    const lbl = { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase' };

    if (!yetkiliMi) {
        return <YetkisizEkran isAR={isAR} mesaj="M6 Üretim Bandı verileri için Üretim PİN girişi zorunludur." />;
    }

    return (
        <div>
            {/* BAŞLIK — SayfaBasligi shared bileşeni */}
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

            {/* İSTATİSTİK KARTLARI */}
            {dept === 'is_emri' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {[
                        { label: 'Toplam İş Emri', val: orders.length, color: '#047857', bg: '#ecfdf5' },
                        { label: '⏳ Bekliyor', val: orders.filter(o => o.status === 'pending').length, color: '#d97706', bg: '#fffbeb' },
                        { label: '⚡ Üretimde', val: orders.filter(o => o.status === 'in_progress').length, color: '#2563eb', bg: '#eff6ff' },
                        { label: '✅ Tamamlandı', val: orders.filter(o => o.status === 'completed').length, color: '#059669', bg: '#f0fdf4' },
                        { label: '⚙️ Kapasite (UR-03)', val: orders.filter(o => ['pending', 'in_progress'].includes(o.status)).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0) + ' Adet', color: '#8b5cf6', bg: '#f5f3ff' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '0.875rem' }}>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: s.color, whiteSpace: 'nowrap' }}>{s.val}</div>
                        </div>
                    ))}
                </div>
            )}

            <MesajBanner mesaj={mesaj} />

            {/* SEKMELER */}
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

            {/* ─── D-A-YENI: REÇETELER (M6) ─────────────────────────────────────────────── */}
            {dept === 'receteler' && (
                <div>
                    {receteMesaj.text && <MesajBanner mesaj={receteMesaj} />}

                    {/* MAKİNE FORMU */}
                    {makineFormAcik && (
                        <div style={{ background: 'white', border: `2px solid #1e293b`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(30,41,59,0.08)' }}>
                            <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Makine Ekle / Düzenle</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                                <div><label style={lbl}>Makine Kodu *</label><input value={frmMakine.makine_kodu} onChange={e => setFrmMakine({ ...frmMakine, makine_kodu: e.target.value })} placeholder="Örn: OVL-01" style={inp} /></div>
                                <div><label style={lbl}>Makine Adı *</label><input value={frmMakine.makine_adi} onChange={e => setFrmMakine({ ...frmMakine, makine_adi: e.target.value })} placeholder="Örn: 4 İplik Overlok" style={inp} /></div>
                                <div><label style={lbl}>Durum</label>
                                    <select value={frmMakine.durum} onChange={e => setFrmMakine({ ...frmMakine, durum: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                        <option value="aktif">Aktif</option>
                                        <option value="arizali">Arızalı</option>
                                        <option value="bakimda">Bakımda</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setMakineFormAcik(false)} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                                <button onClick={makineKaydet} disabled={receteLoading} style={{ padding: '9px 24px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{receteLoading ? '...' : 'Kaydet'}</button>
                            </div>
                        </div>
                    )}

                    {/* OPERASYON FORMU */}
                    {opFormAcik && (
                        <div style={{ background: 'white', border: `2px solid #047857`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.08)' }}>
                            <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>Üretim Operasyonu (Reçete Adımı) Ekle / Düzenle</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={lbl}>Model (Hangi Ürün) *</label>
                                    <select value={frmOperasyon.model_id} onChange={e => setFrmOperasyon({ ...frmOperasyon, model_id: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                        <option value="">— Model Seçiniz —</option>
                                        {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} — {m.model_adi}</option>)}
                                    </select>
                                </div>
                                <div><label style={lbl}>Operasyon / İşlem Adı *</label><input value={frmOperasyon.operasyon_adi} onChange={e => setFrmOperasyon({ ...frmOperasyon, operasyon_adi: e.target.value })} placeholder="Örn: Yaka Çatma" style={inp} /></div>
                                <div><label style={lbl}>Sıra No (Örn: 1, 2, 3)</label><input type="number" min="1" value={frmOperasyon.sira_no} onChange={e => setFrmOperasyon({ ...frmOperasyon, sira_no: e.target.value })} style={inp} /></div>
                                <div>
                                    <label style={lbl}>Hangi Makinede (Opsiyonel)</label>
                                    <select value={frmOperasyon.makine_id} onChange={e => setFrmOperasyon({ ...frmOperasyon, makine_id: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                                        <option value="">— Herhangi / El İşi —</option>
                                        {makineler.map(m => <option key={m.id} value={m.id}>{m.makine_kodu} - {m.makine_adi}</option>)}
                                    </select>
                                </div>
                                <div><label style={lbl}>Zorluk Endeksi (1-10)</label><input type="number" min="1" max="10" value={frmOperasyon.zorluk_derecesi} onChange={e => setFrmOperasyon({ ...frmOperasyon, zorluk_derecesi: e.target.value })} style={inp} /></div>
                                <div><label style={lbl}>Aparat Değişim vs (Sn)</label><input type="number" min="0" value={frmOperasyon.hazirlik_suresi_sn} onChange={e => setFrmOperasyon({ ...frmOperasyon, hazirlik_suresi_sn: e.target.value })} placeholder="Saniye" style={inp} /></div>
                                <div><label style={lbl}>Parça Başı Prim / Değer (TL)</label><input type="number" step="0.01" min="0" value={frmOperasyon.parca_basi_deger_tl} onChange={e => setFrmOperasyon({ ...frmOperasyon, parca_basi_deger_tl: e.target.value })} placeholder="Örn: 2.50" style={inp} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setOpFormAcik(false)} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                                <button onClick={operasyonKaydet} disabled={receteLoading} style={{ padding: '9px 24px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{receteLoading ? '...' : 'Kaydet'}</button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 2fr)', gap: '1.5rem', alignItems: 'start' }}>
                        {/* Sol Kolon: MAKİNELER */}
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 16 }}>
                            <h4 style={{ fontWeight: 800, margin: '0 0 1rem 0', color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
                                FİZİKSEL MAKİNELER ({makineler.length})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {makineler.map(m => (
                                    <div key={m.id} style={{ background: 'white', padding: '0.75rem', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                                                <span style={{ fontSize: '0.65rem', background: '#1e293b', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>{m.makine_kodu}</span>
                                                <span style={{ fontSize: '0.65rem', background: m.durum === 'aktif' ? '#ecfdf5' : '#fef2f2', color: m.durum === 'aktif' ? '#047857' : '#ef4444', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>{m.durum.toUpperCase()}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{m.makine_adi}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => makineDuzenle(m)} style={{ background: '#fefce8', border: '1px solid #fde68a', color: '#d97706', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem' }}>✏️</button>
                                            <button disabled={rIslemdeId === 'mak_sil_' + m.id} onClick={() => makineSil(m.id)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                                {makineler.length === 0 && <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Kayıtlı makine yok.</span>}
                            </div>
                        </div>

                        {/* Sağ Kolon: OPERASYON ROTALARI */}
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 16 }}>
                            <h4 style={{ fontWeight: 800, margin: '0 0 1rem 0', color: '#334155' }}>
                                ÜRETİM REÇETELERİ (Model Rotaları)
                            </h4>
                            {/* Modelleri Grup Halinde Gösteriyoruz */}
                            {(() => {
                                const gruplu = operasyonlar.reduce((acc, curr) => {
                                    const mAdi = curr.b1_model_taslaklari?.model_kodu + ' - ' + curr.b1_model_taslaklari?.model_adi;
                                    if (!acc[mAdi]) acc[mAdi] = [];
                                    acc[mAdi].push(curr);
                                    return acc;
                                }, {});

                                return Object.keys(gruplu).map(modelAd => (
                                    <div key={modelAd} style={{ marginBottom: '1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: 12, overflow: 'hidden' }}>
                                        <div style={{ background: '#0f172a', padding: '0.75rem 1rem', display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <span style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>{modelAd}</span>
                                            <span style={{ background: '#047857', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>{gruplu[modelAd].length} Adım</span>
                                        </div>
                                        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {gruplu[modelAd].map(op => (
                                                <div key={op.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ background: '#cbd5e1', color: '#334155', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>{op.sira_no}</div>
                                                        <div>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{op.operasyon_adi}</div>
                                                            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                                                                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>⚙️ {op.b1_makineler?.makine_kodu || 'Yok (El İşi)'}</span>
                                                                <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700 }}>Zorluk: {op.zorluk_derecesi}/10</span>
                                                                <span style={{ fontSize: '0.65rem', color: '#047857', fontWeight: 700 }}>💰 {op.parca_basi_deger_tl} TL/Adet</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button onClick={() => operasyonDuzenle(op)} style={{ background: 'white', border: '1px solid #fde68a', color: '#d97706', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem' }}>✏️</button>
                                                        <button disabled={rIslemdeId === 'op_sil_' + op.id} onClick={() => operasyonSil(op.id)} style={{ background: 'white', border: '1px solid #fecaca', color: '#dc2626', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ));
                            })()}
                            {operasyonlar.length === 0 && <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Hiç reçete (operasyon) tanımlanmamış.</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── D-A: İŞ EMRİ ─────────────────────────────────────────────── */}
            {dept === 'is_emri' && (
                <div>
                    {formAcik && (
                        <div style={{ background: 'white', border: `2px solid #047857`, borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.08)' }}>
                            <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>Yeni Üretim İş Emri</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>Model *</label>
                                    <select value={formOrder.model_id} onChange={e => setFormOrder({ ...formOrder, model_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                        <option value="">— Model Seçiniz —</option>
                                        {modeller.map(m => <option key={m.id} value={m.id}>{m.model_kodu} — {m.model_adi}</option>)}
                                    </select>
                                </div>
                                <div><label style={lbl}>Adet *</label><input type="number" min="1" value={formOrder.quantity} onChange={e => setFormOrder({ ...formOrder, quantity: e.target.value })} placeholder="1000" style={inp} /></div>
                                <div><label style={lbl}>Başlangıç</label><input type="date" value={formOrder.planned_start_date} onChange={e => setFormOrder({ ...formOrder, planned_start_date: e.target.value })} style={inp} /></div>
                                <div><label style={lbl}>Hedef Bitiş</label><input type="date" value={formOrder.planned_end_date} onChange={e => setFormOrder({ ...formOrder, planned_end_date: e.target.value })} style={inp} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setFormAcik(false)} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                                <button onClick={yeniIsEmri} disabled={loading} style={{ padding: '9px 24px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{loading ? '...' : 'Oluştur'}</button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                            <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} placeholder="Model kodu veya adına göre ara..." style={{ ...inp, paddingLeft: 36 }} />
                        </div>
                        {[['hepsi', 'Tümü', '#374151'], ['pending', '⏳ Bekliyor', '#d97706'], ['in_progress', '⚡ Üretimde', '#2563eb'], ['completed', '✅ Tamamlandı', '#047857'], ['cancelled', '❌ İptal', '#dc2626']].map(([v, l, c]) => (
                            <button key={v} onClick={() => setFiltreDurum(v)}
                                style={{ padding: '7px 12px', border: '2px solid', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', borderColor: filtreDurum === v ? c : '#e5e7eb', background: filtreDurum === v ? c : 'white', color: filtreDurum === v ? 'white' : '#374151' }}>
                                {l}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(() => {
                            const gorunenler = orders.filter(o =>
                                (filtreDurum === 'hepsi' || o.status === filtreDurum) &&
                                (!aramaMetni || [o.b1_model_taslaklari?.model_kodu, o.b1_model_taslaklari?.model_adi].some(v => v?.toLowerCase().includes(aramaMetni.toLowerCase())))
                            );
                            return (
                                <>
                                    {gorunenler.length > 0 && (
                                        <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <input type="checkbox" checked={seciliSiparisler.length > 0 && seciliSiparisler.length === gorunenler.length} onChange={() => tumunuSec(gorunenler)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#047857' }} />
                                                <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.85rem' }}>{seciliSiparisler.length > 0 ? `${seciliSiparisler.length} Seçili` : 'Tümünü Seç'}</span>
                                            </div>
                                            {seciliSiparisler.length > 0 && (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button disabled={islemdeId === 'toplu_guncelle'} onClick={() => topluDurumGuncelleAction('in_progress')} style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: islemdeId === 'toplu_guncelle' ? 'wait' : 'pointer', fontSize: '0.75rem', opacity: islemdeId === 'toplu_guncelle' ? 0.5 : 1 }}>⚡ Toplu Başlat</button>
                                                    <button disabled={islemdeId === 'toplu_guncelle'} onClick={() => topluDurumGuncelleAction('completed')} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: islemdeId === 'toplu_guncelle' ? 'wait' : 'pointer', fontSize: '0.75rem', opacity: islemdeId === 'toplu_guncelle' ? 0.5 : 1 }}>✅ Toplu Bitti</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {gorunenler.map(o => {
                                        const isGecikmeli = o.planned_end_date && new Date(o.planned_end_date) < new Date(); // UR-01
                                        const pt = maliyetler.filter(m => m.order_id === o.id).reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0); // UR-04
                                        const asama = o.status === 'pending' ? 1 : o.status === 'in_progress' ? 2 : 4; // UR-02 (kalite vs eksikse 1/2/4 diye geçici eşleşme)
                                        return (
                                            <div key={o.id} style={{ background: 'white', border: '2px solid', borderColor: o.status === 'completed' ? '#10b981' : seciliSiparisler.includes(o.id) ? '#34d399' : (isGecikmeli ? '#fca5a5' : '#f1f5f9'), borderRadius: 14, padding: '1.25rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                                        <input type="checkbox" checked={seciliSiparisler.includes(o.id)} onChange={() => toggleSiparisSec(o.id)} style={{ width: 22, height: 22, cursor: 'pointer', accentColor: '#047857', marginTop: 4 }} />
                                                        <div>
                                                            <div style={{ display: 'flex', gap: 6, marginBottom: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>{o.b1_model_taslaklari?.model_kodu}</span>
                                                                <span style={{ fontSize: '0.65rem', background: '#0f172a', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>{o.quantity} adet</span>
                                                                <DurumBadge durum={o.status} renkMap={ST_RENK} etiketMap={ST_LABEL} kucuk />
                                                                {/* [UR-01] Termin Alarmı */}
                                                                {isGecikmeli && <span style={{ fontSize: '0.65rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }} className="animate-pulse">🚨 GECİKME!</span>}
                                                                {/* [UR-04] Gerçek Maliyet Takibi */}
                                                                <span style={{ fontSize: '0.65rem', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>💰 MLT: ₺{pt.toFixed(2)}</span>
                                                            </div>
                                                            <h3 style={{ fontWeight: 800, margin: 0, color: '#0f172a' }}>{o.b1_model_taslaklari?.model_adi}</h3>

                                                            {/* [UR-02] Aşama Bazlı İlerleme Çubuğu */}
                                                            <div style={{ display: 'flex', gap: 4, marginTop: 12, width: '200px' }}>
                                                                {['Kesim', 'İmalat', 'Kalite', 'Sevk'].map((adim, idx) => (
                                                                    <div key={idx} style={{ flex: 1, height: 6, borderRadius: 3, background: asama >= (idx + 1) ? '#10b981' : '#e2e8f0', position: 'relative' }} title={adim} />
                                                                ))}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 24, fontSize: '0.6rem', color: '#94a3b8', fontWeight: 800, marginTop: 4, textTransform: 'uppercase' }}>
                                                                <span>Kes</span><span>İml</span><span>Klt</span><span>Svk</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexDirection: 'column' }}>
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            {o.status === 'pending' && <button disabled={islemdeId === 'durum_' + o.id} onClick={() => durumGuncelle(o.id, 'in_progress')} style={{ padding: '6px 14px', background: '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: islemdeId === 'durum_' + o.id ? 'wait' : 'pointer', fontSize: '0.78rem', opacity: islemdeId === 'durum_' + o.id ? 0.5 : 1 }}>▶ Başlat</button>}
                                                            {o.status === 'in_progress' && <button disabled={islemdeId === 'durum_' + o.id} onClick={() => durumGuncelle(o.id, 'completed')} style={{ padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: islemdeId === 'durum_' + o.id ? 'wait' : 'pointer', fontSize: '0.78rem', opacity: islemdeId === 'durum_' + o.id ? 0.5 : 1 }}>✅ Tamamla</button>}
                                                            <button onClick={() => duzenleIsEmri(o)} style={{ background: '#fefce8', border: '1px solid #fde68a', color: '#d97706', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>✏️</button>
                                                        </div>
                                                        <button disabled={islemdeId === 'sil_' + o.id} onClick={() => silIsEmri(o.id)} style={{ width: '100%', background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 8px', borderRadius: 8, cursor: islemdeId === 'sil_' + o.id ? 'wait' : 'pointer', opacity: islemdeId === 'sil_' + o.id ? 0.5 : 1 }}><Trash2 size={12} className="mx-auto" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {orders.length === 0 && <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: 16 }}><Factory size={48} style={{ color: '#e5e7eb', marginBottom: '1rem' }} /><p style={{ color: '#94a3b8', fontWeight: 700 }}>İş emri yok.</p></div>}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* ─── D-B: BAND & MONTAJ ──────────────────────────────────────── */}
            {dept === 'kesim' && (
                <div>
                    <div style={{ background: '#0f172a', border: `2px solid ${aktifPersonel ? '#10b981' : '#334155'}`, borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: 12, alignItems: 'center', transition: 'all 0.3s' }}>
                        <div style={{ padding: 10, background: aktifPersonel ? '#064e3b' : '#1e293b', borderRadius: 8 }}><Play size={24} color="#34d399" /></div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ color: 'white', margin: '0 0 6px', fontWeight: 800 }}>Otonom Performans Terminali (Çift Barkod)</h4>
                            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.75rem', fontWeight: 600 }}>1. Önce personel kartını okutun. 2. Sonra sepet/iş barkodunu okutarak işi başlatın veya bitirin.</p>
                            {aktifPersonel && (
                                <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800 }}>👨‍🔧 İşleme Hazır: {aktifPersonel.ad_soyad}</div>
                                    <button onClick={() => setIsReworkMod(!isReworkMod)} style={{ padding: '6px 12px', background: isReworkMod ? 'rgba(239, 68, 68, 0.15)' : 'rgba(51, 65, 85, 0.5)', border: `1px solid ${isReworkMod ? '#ef4444' : '#475569'}`, color: isReworkMod ? '#f87171' : '#94a3b8', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isReworkMod ? '#ef4444' : '#64748b', boxShadow: isReworkMod ? '0 0 8px #ef4444' : 'none' }}></div>
                                        {isReworkMod ? '🔧 TAMİR (REWORK)' : 'Normal Üretim'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input ref={barkodInputRef} type="text" value={barkodOkutulanIsId} onChange={e => setBarkodOkutulanIsId(e.target.value)}
                                placeholder={aktifPersonel ? "SEPET Barkodunu Okut..." : "YAKA Barkodunu Okut..."} style={{ ...inp, width: 220, border: `2px solid ${aktifPersonel ? '#10b981' : '#3b82f6'}`, background: '#1e293b', color: 'white', fontWeight: 700 }}
                                onKeyDown={e => { if (e.key === 'Enter') ciftBarkodOtonomIslem(barkodOkutulanIsId); }} />
                            <Link href="/uretim-kiosk" target="_blank">
                                <button style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '0 16px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s', height: '100%' }}>
                                    📱 TAM EKRAN KİOSK
                                </button>
                            </Link>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>📋 Aktif İş Emirleri</div>
                            {orders.filter(o => ['pending', 'in_progress'].includes(o.status)).map(o => (
                                <div key={o.id} style={{ background: 'white', border: `2px solid ${getST_RENK(o.status)}40`, borderRadius: 10, padding: '0.875rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.62rem', background: '#ecfdf5', color: '#047857', padding: '2px 7px', borderRadius: 4, fontWeight: 800 }}>{o.b1_model_taslaklari?.model_kodu}</span>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', marginTop: 4 }}>{o.b1_model_taslaklari?.model_adi}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{o.quantity} adet</div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>👥 Aktif Personel ({personel.length})</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 400, overflowY: 'auto' }}>
                                {personel.map(p => (
                                    <div key={p.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.ad_soyad}</div>
                                        <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#059669', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>✅ Aktif</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── D-C: KALİTE & KRONOMETRE ───────────────────────────────── */}
            {dept === 'kalite' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                    {orders.filter(o => o.status === 'in_progress').map(o => (
                        <div key={o.id} style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: 14, padding: '1.25rem' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>{o.b1_model_taslaklari?.model_adi}</div>
                            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', color: kronometer[o.id]?.aktif ? '#f97316' : '#0f172a' }}>
                                    {formatSure(sure[o.id] || 0)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {!kronometer[o.id]?.aktif ? (
                                    <button onClick={() => baslat(o.id)} style={{ flex: 1, padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        <Play size={14} /> {sure[o.id] > 0 ? 'Devam Et' : 'Başla'}
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => duraklat(o.id)} style={{ flex: 1, padding: '8px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                            <Pause size={14} /> Mola
                                        </button>
                                        <button onClick={() => durdur(o.id)} style={{ flex: 1, padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                            <Square size={14} /> Bitir & Yaz
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {orders.filter(o => o.status === 'in_progress').length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
                            <p style={{ color: '#94a3b8', fontWeight: 700 }}>Aktif üretim yok. D-A'da iş emri başlatın.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ─── D-D-K: KAMERALAR (M6 LOKAL EDGE) ───────────────────────── */}
            {dept === 'kameralar' && (
                <M6_KameraSayaci />
            )}

            {/* ─── D-D: MALİYET ───────────────────────────────────────────── */}
            {dept === 'maliyet' && (
                <div>
                    {maliyetFormAcik && (
                        <div style={{ background: 'white', border: '2px solid #047857', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(4,120,87,0.08)' }}>
                            <h3 style={{ fontWeight: 800, color: '#065f46', marginBottom: '1rem' }}>Maliyet Girişi</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>İş Emri *</label>
                                    <select value={maliyetForm.order_id} onChange={e => setMaliyetForm({ ...maliyetForm, order_id: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                        <option value="">— İş Emri Seçiniz —</option>
                                        {orders.map(o => <option key={o.id} value={o.id}>{o.b1_model_taslaklari?.model_kodu} | {o.quantity} adet</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Maliyet Tipi *</label>
                                    <select value={maliyetForm.maliyet_tipi} onChange={e => setMaliyetForm({ ...maliyetForm, maliyet_tipi: e.target.value })} style={{ ...inp, cursor: 'pointer', background: 'white' }}>
                                        {MALIYET_TIPLERI.map(t => <option key={t.deger} value={t.deger}>{t.etiket}</option>)}
                                    </select>
                                </div>
                                <div><label style={lbl}>Tutar (₺) *</label><input type="number" step="0.01" min="0" value={maliyetForm.tutar_tl} onChange={e => setMaliyetForm({ ...maliyetForm, tutar_tl: e.target.value })} placeholder="0.00" style={inp} /></div>
                                <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Açıklama *</label><input maxLength={200} value={maliyetForm.kalem_aciklama} onChange={e => setMaliyetForm({ ...maliyetForm, kalem_aciklama: e.target.value })} placeholder="örn: 3 personel × 4 saat" style={inp} /></div>
                                <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button onClick={() => setMaliyetFormAcik(false)} style={{ padding: '9px 18px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                                    <button onClick={maliyetKaydet} disabled={loading} style={{ padding: '9px 24px', background: loading ? '#94a3b8' : '#047857', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>{loading ? '...' : 'Kaydet'}</button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {maliyetler.map(m => (
                            <div key={m.id} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '0.68rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{m.maliyet_tipi?.replace(/_/g, ' ')}</span>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginTop: 3 }}>{m.kalem_aciklama}</div>
                                </div>
                                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1.1rem' }}>₺{parseFloat(m.tutar_tl).toFixed(2)}</div>
                            </div>
                        ))}
                        {maliyetler.length > 0 && (
                            <div style={{ background: '#0f172a', borderRadius: 10, padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: 'white' }}>TOPLAM</span>
                                <span style={{ fontWeight: 900, color: '#34d399', fontSize: '1.3rem' }}>₺{maliyetler.reduce((s, m) => s + parseFloat(m.tutar_tl || 0), 0).toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── D-E: DEVİR KAPISI ──────────────────────────────────────── */}
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

            {/* ─── D-F: CANLI TAKİP ───────────────────────────────────────── */}
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
