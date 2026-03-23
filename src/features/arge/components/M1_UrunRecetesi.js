'use client';
import { Package, ChevronRight, AlertTriangle, CheckCircle2, ExternalLink, ArrowRight } from 'lucide-react';
import NextLink from 'next/link';

/**
 * M1_UrunRecetesi.js
 * Onaylanmış bir trendin 6 bloklu ürün reçetesini gösterir.
 * Gateway Butonu: Skor normalse M2'ye fiziksel onay gönderir.
 */
/**
 * @param {{ trend: any, onDurumGuncelle: any, onSil: any, onDuzenle: any, isAR: any, yetkiliMi: any, islemdeId: any, key?: any }} props
 */
export default function M1_UrunRecetesi({ trend, onDurumGuncelle, onSil, onDuzenle, isAR, yetkiliMi, islemdeId }) {
    const skor = trend.talep_skoru ?? 5;
    const zorluk = trend.zorluk_derecesi ?? 5;
    const skorRenk = (s) => s >= 8 ? '#10b981' : s >= 5 ? '#f59e0b' : '#ef4444';

    // Gateway koşulu: Skor 7+ ve zorluk 8 altı ise M2'ye buton açık
    const gatewayAcik = skor >= 7 && zorluk <= 8;

    return (
        <div
            style={{
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.06)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateY(0)',
                margin: '0.25rem 0',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0,0,0,0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(0,0,0,0.06)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.65)';
            }}
        >
            {/* Başlık şeridi */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(4, 120, 87, 0.05), rgba(6, 78, 59, 0.1))',
                borderBottom: '1px solid rgba(4, 120, 87, 0.1)',
                padding: '1.25rem 1.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'linear-gradient(135deg, #34d399, #059669)', padding: '6px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}>
                        <Package size={18} color="white" />
                    </div>
                    <span style={{ color: '#064e3b', fontWeight: 900, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                        {isAR ? trend.baslik_ar || trend.baslik : trend.baslik}
                    </span>
                </div>
                <div style={{
                    background: 'rgba(5, 150, 105, 0.1)',
                    color: '#059669',
                    border: '1px solid rgba(5, 150, 105, 0.2)',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    boxShadow: '0 2px 10px rgba(5, 150, 105, 0.1)'
                }}>
                    {trend.durum === 'inceleniyor' ? (isAR ? 'قيد المراجعة' : 'İnceleniyor') : (isAR ? 'مُعتمد' : 'Onaylandı')}
                </div>
            </div>

            {/* 6 Blok Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '1px', background: 'rgba(241, 245, 249, 0.5)' }}>
                {[
                    { label: isAR ? 'رمز المنتج' : 'Kimlik', value: trend.id?.slice(0, 8), icon: '🆔' },
                    { label: isAR ? 'النقاط' : 'Skor', value: `${skor}/10`, icon: '📊', renk: skorRenk(skor) },
                    { label: isAR ? 'الفئة' : 'Kategori', value: isAR ? (trend.kategori || '-') : (trend.kategori || '-'), icon: '🏷️' },
                    { label: isAR ? 'الجمهور' : 'Hedef Kitle', value: isAR ? (trend.hedef_kitle === 'kadın' ? 'نسائي' : trend.hedef_kitle) : trend.hedef_kitle, icon: '👤' },
                    { label: isAR ? 'صعوبة الإنتاج' : 'Zorluk', value: `${zorluk}/10`, icon: '⚙️', renk: zorluk >= 8 ? '#ef4444' : '#f59e0b' },
                    { label: isAR ? 'المنصة' : 'Platform', value: trend.platform, icon: '🌐' },
                ].map((blok, i) => (
                    <div key={i} style={{ background: 'transparent', padding: '1rem', textAlign: 'center', transition: 'all 0.2s', position: 'relative', zIndex: 1 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ fontSize: '1.25rem', marginBottom: 4, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{blok.icon}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{blok.label}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: blok.renk || '#0f172a' }}>{blok.value}</div>
                    </div>
                ))}
            </div>

            {/* Açıklama */}
            {trend.aciklama && (
                <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(248, 250, 252, 0.4)', borderTop: '1px solid rgba(241, 245, 249, 0.8)', fontSize: '0.8rem', color: '#475569', lineHeight: 1.7 }}>
                    {trend.aciklama.slice(0, 200)}{trend.aciklama.length > 200 ? '...' : ''}
                </div>
            )}

            {/* Gateway Butonu — M2'ye Aktar */}
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(241, 245, 249, 0.8)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {gatewayAcik ? (
                    <NextLink href={`/kumas?trend_id=${trend.id}`} style={{ textDecoration: 'none' }}>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'linear-gradient(135deg, #059669, #047857)', color: 'white',
                            border: 'none', padding: '10px 20px', borderRadius: '12px',
                            fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(4,120,87,0.3)',
                            transition: 'all 0.3s ease',
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(4,120,87,0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(4,120,87,0.3)';
                            }}>
                            <CheckCircle2 size={16} />
                            {isAR ? 'إرسال إلى M2 (الموديست)' : 'Fiziksel Onay Ver → M2\'ye Aktar'}
                            <ArrowRight size={14} />
                        </button>
                    </NextLink>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.75rem', fontWeight: 800, background: '#f8fafc', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <AlertTriangle size={14} color="#f59e0b" />
                        {isAR ? 'يتطلب نقاط ≥7 وصعوبة ≤8 للإرسال' : 'M2 kilidi: Skor ≥7 ve Zorluk ≤8 gerekli'}
                    </div>
                )}

                {trend.referans_linkler?.[0] && (
                    <a href={trend.referans_linkler[0]} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3b82f6', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none', marginLeft: 'auto', padding: '8px 14px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    >
                        <ExternalLink size={14} /> {isAR ? 'مصدر' : 'Kaynak'}
                    </a>
                )}
            </div>
        </div>
    );
}
