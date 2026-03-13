'use client';
/**
 * ModelMesajGecmisi.js
 * Bir model/ürün koduna ait tüm iç mesajları gösteren widget.
 * Modelhane, Arge ve diğer üretim modüllerinde kullanılır.
 *
 * AMAÇ  : Aynı modeli ilerleyen dönemlerde üretime alındığında
 *          geçmişteki sorunlar, çözümler ve kararlar referans olarak görünsün.
 *
 * ERİŞİM MATRİSİ:
 *   - Koordinatör / Yönetim: TÜM mesajlar (gizlenenler dahil)
 *   - Üretim birimleri      : Modele ait açık mesajlar
 *   - Diğerleri             : Yalnızca "hepse" gönderilen mesajlar
 */
import { useState, useEffect } from 'react';
import { MessageSquare, Hash, Clock, User, ChevronDown, ChevronUp, ExternalLink, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { formatTarih } from '@/lib/utils';

const ONCELIK_RENK = {
    normal: { bg: '#f0f9ff', border: '#0ea5e9', badge: '#0ea5e9' },
    acil: { bg: '#fffbeb', border: '#f59e0b', badge: '#f59e0b' },
    kritik: { bg: '#fef2f2', border: '#ef4444', badge: '#ef4444' },
};

// Yetkili gruplar
const TAM_ARŞİV = ['tam', 'yonetim', 'koordinator', 'isletme'];

export function ModelMesajGecmisi({ modelKodu, modelId, modelAdi }) {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const isAR = lang === 'ar';
    const [mesajlar, setMesajlar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [acik, setAcik] = useState(false);       // widget kapalı başlar, tıklayınca açılır
    const [acikMesajId, setAcikMesajId] = useState(null);

    const tamArsiv = TAM_ARŞİV.includes(kullanici?.grup);

    useEffect(() => {
        if (!acik) return;          // widget kapalıyken sorgu yapma
        yukle();
    }, [acik, modelKodu, modelId]);

    const yukle = async () => {
        if (!modelKodu && !modelId) return;
        setLoading(true);
        try {
            let query = supabase
                .from('b1_ic_mesajlar')
                .select('id,konu,icerik,oncelik,tip,gonderen_adi,gonderen_modul,alici_grup,created_at,okundu_at,mesaj_hash,durum,onay_durumu,urun_kodu,urun_id,urun_adi,ilgili_modul')
                .order('created_at', { ascending: false })
                .limit(50);

            if (modelKodu && modelId) {
                query = query.or(`urun_kodu.eq.${modelKodu},urun_id.eq.${modelId}`);
            } else if (modelKodu) {
                query = query.eq('urun_kodu', modelKodu);
            } else {
                query = query.eq('urun_id', modelId);
            }

            const { data, error } = await query;
            if (error) throw error;
            setMesajlar(data || []);
        } catch (err) {
            console.error('Model mesaj yükleme hatası:', err.message);
        }
        setLoading(false);
    };

    if (!modelKodu && !modelId) return null;

    const acikOlanMesaj = mesajlar.find(m => m.id === acikMesajId);

    return (
        <div style={{
            marginTop: '1.5rem',
            border: `2px solid ${acik ? '#1e1b4b' : '#e2e8f0'}`,
            borderRadius: 14,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
        }}>
            {/* BAŞLIK / TOGGLE */}
            <button
                onClick={() => setAcik(!acik)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1.25rem',
                    background: acik ? '#1e1b4b' : '#f8fafc',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MessageSquare size={18} color={acik ? '#a5b4fc' : '#64748b'} />
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 900, fontSize: '0.9rem', color: acik ? '#e0e7ff' : '#0f172a' }}>
                            {isAR ? 'سجل الرسائل — التاريخ' : 'Model Mesaj Geçmişi'}
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: acik ? '#6366f1' : '#94a3b8' }}>
                            {modelKodu && <span style={{ fontFamily: 'monospace', background: acik ? '#312e81' : '#f1f5f9', padding: '1px 6px', borderRadius: 4, marginRight: 6 }}>{modelKodu}</span>}
                            {isAR
                                ? 'جميع المشاكل والقرارات المرتبطة بهذا الموديل'
                                : 'Bu modele ait tüm sorunlar, kararlar ve notlar'}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {acik && mesajlar.length > 0 && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, background: '#6366f1', color: 'white', borderRadius: 20, padding: '2px 10px' }}>
                            {mesajlar.length}
                        </span>
                    )}
                    {acik ? <ChevronUp size={18} color="#a5b4fc" /> : <ChevronDown size={18} color="#94a3b8" />}
                </div>
            </button>

            {/* İÇERİK */}
            {acik && (
                <div style={{ padding: '1rem 1.25rem', background: 'white' }}>

                    {/* YETKİ DURUMU */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: tamArsiv ? '#1e1b4b' : '#f0f9ff', borderRadius: 8, marginBottom: '1rem', fontSize: '0.68rem', fontWeight: 700, color: tamArsiv ? '#a5b4fc' : '#0369a1' }}>
                        {tamArsiv ? '👑 Koordinatör Görünümü — Gizlenenler dahil tüm mesajlar' : '🔍 Üretim Görünümü — Bu modele ait mesajlar'}
                        {tamArsiv && <Lock size={10} style={{ marginLeft: 4 }} />}
                    </div>

                    {/* HABERLEŞME SAYFASINA LINK */}
                    <a href="/haberlesme" target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textDecoration: 'none', marginBottom: '0.875rem' }}>
                        <ExternalLink size={12} />
                        {isAR ? 'الذهاب إلى صفحة المراسلات ← إرسال رسالة جديدة' : 'Haberleşme Sayfası → Yeni Mesaj Gönder'}
                    </a>

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontWeight: 700 }}>
                            {isAR ? '...جاري التحميل' : 'Yükleniyor...'}
                        </div>
                    )}

                    {!loading && mesajlar.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: 12, border: '2px dashed #e5e7eb' }}>
                            <MessageSquare size={32} style={{ color: '#cbd5e1', marginBottom: 8 }} />
                            <div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>
                                {isAR ? 'لا توجد رسائل مرتبطة بهذا الموديل بعد.' : 'Bu modele ait kayıtlı mesaj yok.'}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.68rem', marginTop: 4 }}>
                                {isAR
                                    ? 'عند إرسال رسالة مع كود الموديل، ستظهر هنا تلقائياً.'
                                    : 'Haberleşme sayfasından mesaj gönderirken model kodunu girin — otomatik burada görünür.'}
                            </div>
                        </div>
                    )}

                    {!loading && mesajlar.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {mesajlar.map(m => {
                                const renk = ONCELIK_RENK[m.oncelik] || ONCELIK_RENK.normal;
                                const acikMi = acikMesajId === m.id;
                                return (
                                    <div key={m.id}
                                        style={{
                                            background: acikMi ? '#f8f7ff' : renk.bg,
                                            border: `2px solid ${acikMi ? '#1e1b4b' : renk.border}`,
                                            borderRadius: 10, padding: '0.875rem',
                                            cursor: 'pointer', transition: 'border-color 0.15s',
                                        }}
                                        onClick={() => setAcikMesajId(acikMi ? null : m.id)}
                                    >
                                        {/* BAŞLIK SATIRI */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                                                    <span style={{ fontSize: '0.62rem', fontWeight: 900, padding: '2px 7px', borderRadius: 4, background: renk.badge, color: 'white' }}>
                                                        {m.oncelik === 'kritik' ? '🔴' : m.oncelik === 'acil' ? '🟡' : '🔵'} {m.oncelik}
                                                    </span>
                                                    {m.mesaj_hash && (
                                                        <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f0fdf4', color: '#166534', display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Hash size={8} /> SHA-256
                                                        </span>
                                                    )}
                                                    {m.onay_durumu && m.onay_durumu !== 'None' && (
                                                        <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: m.onay_durumu === 'onaylandi' ? '#dcfce7' : m.onay_durumu === 'reddedildi' ? '#fee2e2' : '#fef9c3', color: m.onay_durumu === 'onaylandi' ? '#166534' : m.onay_durumu === 'reddedildi' ? '#991b1b' : '#713f12' }}>
                                                            {m.onay_durumu === 'onaylandi' ? '✅' : m.onay_durumu === 'reddedildi' ? '❌' : '⏳'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0f172a' }}>{m.konu}</div>
                                                <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', gap: 8, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={10} />{m.gonderen_adi} ({m.gonderen_modul})</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{formatTarih(m.created_at)}</span>
                                                </div>
                                            </div>
                                            {acikMi ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#94a3b8" />}
                                        </div>

                                        {/* DETAY */}
                                        {acikMi && (
                                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.875rem', fontSize: '0.85rem', lineHeight: 1.7, color: '#1e293b', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                                                    {m.icerik}
                                                </div>
                                                {tamArsiv && m.mesaj_hash && (
                                                    <div style={{ marginTop: 6, padding: '5px 10px', background: '#f0fdf4', borderRadius: 6, fontSize: '0.58rem', color: '#166534', fontWeight: 700, wordBreak: 'break-all', display: 'flex', gap: 4 }}>
                                                        <Hash size={9} style={{ flexShrink: 0, marginTop: 1 }} /> {m.mesaj_hash}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ModelMesajGecmisi;
