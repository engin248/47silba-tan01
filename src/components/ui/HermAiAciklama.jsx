'use client';
/**
 * src/components/ui/HermAiAciklama.jsx — HermAI Açıklama Kartı Bileşeni
 *
 * HermAI çıktısını kullanıcıya gösterir.
 * Sadece sonuç varsa render edilir, yoksa null döner.
 *
 * Kullanım:
 *   import HermAiAciklama from '@/components/ui/HermAiAciklama';
 *   <HermAiAciklama sonuc={hermSonuc} />
 */

export default function HermAiAciklama({ sonuc, baslik = 'AI Açıklama' }) {
    if (!sonuc) return null;

    // Reddedilmiş / gerçek dışı senaryo
    if (sonuc.status === 'rejected') {
        return (
            <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid #ef4444',
                borderRadius: 8,
                padding: '12px 16px',
                marginTop: 12,
            }}>
                <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, margin: 0 }}>
                    ⛔ Gerçek Dışı Senaryo Engellendi
                </p>
                <p style={{ color: '#fca5a5', fontSize: 12, margin: '4px 0 0' }}>
                    {sonuc.sebep}
                </p>
            </div>
        );
    }

    const renkMap = {
        explained: 'rgba(16,185,129,0.08)',
        risk: 'rgba(245,158,11,0.08)',
    };
    const cercevRenk = {
        explained: '#10b981',
        risk: '#f59e0b',
    };

    return (
        <div style={{
            background: renkMap[sonuc.status] || 'rgba(100,116,139,0.08)',
            border: `1px solid ${cercevRenk[sonuc.status] || '#64748b'}`,
            borderRadius: 8,
            padding: '14px 16px',
            marginTop: 12,
        }}>
            {/* Başlık */}
            <p style={{ color: cercevRenk[sonuc.status], fontSize: 12, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                🧠 {baslik}
                {sonuc.guvenskoru !== undefined && (
                    <span style={{ fontWeight: 400, marginLeft: 8, opacity: 0.7 }}>
                        Güven: %{sonuc.guvenskoru}
                    </span>
                )}
            </p>

            {/* Ana açıklama */}
            {sonuc.aciklamaTR && (
                <p style={{ color: '#e2e8f0', fontSize: 13, margin: '0 0 6px', lineHeight: 1.6 }}>
                    {sonuc.aciklamaTR}
                </p>
            )}

            {/* Karşı-olgusal */}
            {sonuc.karsiOlgu && (
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 6px', fontStyle: 'italic' }}>
                    💡 {sonuc.karsiOlgu}
                </p>
            )}

            {/* Risk uyarısı */}
            {sonuc.uyari && (
                <p style={{ color: '#f59e0b', fontSize: 12, margin: '6px 0 0', fontWeight: 600 }}>
                    {sonuc.uyari}
                </p>
            )}

            {/* Genel kurallar */}
            {sonuc.genelKurallar && sonuc.genelKurallar.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 4px', fontWeight: 600 }}>
                        SİSTEM KURALLARI
                    </p>
                    {sonuc.genelKurallar.map((kural, i) => (
                        <p key={i} style={{ color: '#94a3b8', fontSize: 11, margin: '2px 0' }}>
                            • {kural}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}
