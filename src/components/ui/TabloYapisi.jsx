'use client';
/**
 * components/ui/TabloYapisi.jsx
 * FAZ 4 Shared UI — Ortak tablo bileşeni
 *
 * Props:
 *   sutunlar  – Array<{ baslik: string, alan: string | (satir) => ReactNode, genislik?: string }>
 *   satirlar  – Array<object>  (veri dizisi)
 *   yukleniyor– boolean (yükleniyor skeleton gösterimi)
 *   bosText   – string (veri yok mesajı)
 *   satirStil – (satir, index) => style object (opsiyonel satır stili)
 */
export default function TabloYapisi({
    sutunlar = [],
    satirlar = [],
    yukleniyor = false,
    bosText = 'Kayıt bulunamadı.',
    satirStil,
}) {
    const thStil = {
        padding: '10px 14px',
        textAlign: 'left',
        fontSize: '0.68rem',
        fontWeight: 800,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        borderBottom: '2px solid #e5e7eb',
        background: '#f8fafc',
        whiteSpace: 'nowrap',
    };

    const tdStil = {
        padding: '10px 14px',
        fontSize: '0.84rem',
        color: '#1e293b',
        borderBottom: '1px solid #f1f5f9',
        verticalAlign: 'middle',
    };

    if (yukleniyor) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                Yükleniyor...
            </div>
        );
    }

    return (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                    <tr>
                        {sutunlar.map((s, i) => (
                            <th key={i} style={{ ...thStil, width: s.genislik }}>
                                {s.baslik}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {satirlar.length === 0 ? (
                        <tr>
                            <td colSpan={sutunlar.length} style={{ ...tdStil, textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 700 }}>
                                {bosText}
                            </td>
                        </tr>
                    ) : (
                        satirlar.map((satir, idx) => (
                            <tr
                                key={satir.id ?? idx}
                                style={{
                                    transition: 'background 0.15s',
                                    ...(satirStil ? satirStil(satir, idx) : {}),
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}
                            >
                                {sutunlar.map((s, i) => (
                                    <td key={i} style={tdStil}>
                                        {typeof s.alan === 'function'
                                            ? s.alan(satir)
                                            : satir[s.alan] ?? '—'}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
