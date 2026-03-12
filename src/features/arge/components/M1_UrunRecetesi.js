'use client';
import { Package, ChevronRight, AlertTriangle, CheckCircle2, ExternalLink, ArrowRight } from 'lucide-react';
import NextLink from 'next/link';

/**
 * M1_UrunRecetesi.js
 * Onaylanmış bir trendin 6 bloklu ürün reçetesini gösterir.
 * Gateway Butonu: Skor normalse M2'ye fiziksel onay gönderir.
 */
export default function M1_UrunRecetesi({ trend, onDurumGuncelle, onSil, isAR, islemdeId }) {
    const skor = trend.talep_skoru ?? 5;
    const zorluk = trend.zorluk_derecesi ?? 5;
    const skorRenk = (s) => s >= 8 ? '#10b981' : s >= 5 ? '#f59e0b' : '#ef4444';

    // Gateway koşulu: Skor 7+ ve zorluk 8 altı ise M2'ye buton açık
    const gatewayAcik = skor >= 7 && zorluk <= 8;

    return (
        <div style={{
            background: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: 16,
            overflow: 'hidden',
        }}>
            {/* Başlık şeridi */}
            <div style={{
                background: 'linear-gradient(135deg, #047857, #065f46)',
                padding: '0.875rem 1.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Package size={16} color="white" />
                    <span style={{ color: 'white', fontWeight: 900, fontSize: '0.9rem' }}>
                        {isAR ? trend.baslik_ar || trend.baslik : trend.baslik}
                    </span>
                </div>
                <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: 20,
                }}>
                    {isAR ? 'مُعتمد' : 'Onaylandı'}
                </div>
            </div>

            {/* 6 Blok Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#f1f5f9' }}>
                {[
                    { label: isAR ? 'رمز المنتج' : 'Kimlik', value: trend.id?.slice(0, 8) + '...', icon: '🆔' },
                    { label: isAR ? 'النقاط' : 'Skor', value: `${skor}/10`, icon: '📊', renk: skorRenk(skor) },
                    { label: isAR ? 'الفئة' : 'Kategori', value: isAR ? (trend.kategori || '-') : (trend.kategori || '-'), icon: '🏷️' },
                    { label: isAR ? 'الجمهور' : 'Hedef Kitle', value: isAR ? (trend.hedef_kitle === 'kadın' ? 'نسائي' : trend.hedef_kitle) : trend.hedef_kitle, icon: '👤' },
                    { label: isAR ? 'صعوبة الإنتاج' : 'Zorluk', value: `${zorluk}/10`, icon: '⚙️', renk: zorluk >= 8 ? '#ef4444' : '#f59e0b' },
                    { label: isAR ? 'المنصة' : 'Platform', value: trend.platform, icon: '🌐' },
                ].map((blok, i) => (
                    <div key={i} style={{ background: 'white', padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{blok.icon}</div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{blok.label}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: blok.renk || '#0f172a' }}>{blok.value}</div>
                    </div>
                ))}
            </div>

            {/* Açıklama */}
            {trend.aciklama && (
                <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#475569', lineHeight: 1.6 }}>
                    {trend.aciklama.slice(0, 200)}{trend.aciklama.length > 200 ? '...' : ''}
                </div>
            )}

            {/* Gateway Butonu — M2'ye Aktar */}
            <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {gatewayAcik ? (
                    <NextLink href={`/modelhane?trend_id=${trend.id}`} style={{ textDecoration: 'none' }}>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: '#047857', color: 'white',
                            border: 'none', padding: '8px 16px', borderRadius: 8,
                            fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
                        }}>
                            <CheckCircle2 size={14} />
                            {isAR ? 'إرسال إلى M2 (الموديست)' : 'Fiziksel Onay Ver → M2\'ye Aktar'}
                            <ArrowRight size={12} />
                        </button>
                    </NextLink>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>
                        <AlertTriangle size={13} color="#f59e0b" />
                        {isAR ? 'يتطلب نقاط ≥7 وصعوبة ≤8 للإرسال' : 'M2 kilidi: Skor ≥7 ve Zorluk ≤8 gerekli'}
                    </div>
                )}

                {trend.referans_linkler?.[0] && (
                    <a href={trend.referans_linkler[0]} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0284c7', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none', marginLeft: 'auto' }}>
                        <ExternalLink size={11} /> {isAR ? 'مصدر' : 'Kaynak'}
                    </a>
                )}
            </div>
        </div>
    );
}
