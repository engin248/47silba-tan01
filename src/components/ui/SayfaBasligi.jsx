'use client';
/**
 * components/ui/SayfaBasligi.jsx
 * FAZ 4 Shared UI — Tüm sayfaların ortak başlık bileşeni
 *
 * Props:
 *   icon         – Lucide icon component (örn: <Factory />)
 *   iconColor    – Gradient başlangıç rengi (default: '#047857')
 *   iconColor2   – Gradient bitiş rengi (default: '#065f46')
 *   baslik       – Ana başlık metni
 *   altBaslik    – Küçük alt metin (opsiyonel)
 *   islemler     – Sağ tarafa konacak buton/element'ler (opsiyonel, ReactNode)
 */
export default function SayfaBasligi({
    icon,
    iconColor = '#047857',
    iconColor2 = '#065f46',
    baslik,
    altBaslik,
    islemler,
}) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: 12,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {icon && (
                    <div style={{
                        width: 44,
                        height: 44,
                        background: `linear-gradient(135deg,${iconColor},${iconColor2})`,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        {/* icon prop'u React element olarak geçilmeli: icon={<Factory size={24} color="white" />} */}
                        {icon}
                    </div>
                )}
                <div>
                    <h1 style={{
                        fontSize: '1.4rem',
                        fontWeight: 900,
                        color: '#0f172a',
                        margin: 0,
                        lineHeight: 1.2,
                    }}>
                        {baslik}
                    </h1>
                    {altBaslik && (
                        <p style={{
                            fontSize: '0.78rem',
                            color: '#64748b',
                            margin: '2px 0 0',
                            fontWeight: 600,
                        }}>
                            {altBaslik}
                        </p>
                    )}
                </div>
            </div>

            {islemler && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {islemler}
                </div>
            )}
        </div>
    );
}
