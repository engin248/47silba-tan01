export default function IstatistikKutulari({ kartlar }) {
    if (!kartlar || kartlar.length === 0) return null;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {kartlar.map((k, i) => (
                <div key={i} style={{ background: k.bg || '#f8fafc', border: `1px solid ${k.color || '#cbd5e1'}25`, borderRadius: 12, padding: '0.875rem' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                        {k.label}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.2rem', color: k.color || '#334155' }}>
                        {k.val}
                    </div>
                </div>
            ))}
        </div>
    );
}
