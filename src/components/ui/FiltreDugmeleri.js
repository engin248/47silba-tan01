export default function FiltreDugmeleri({ /** @type {any} */ secenekler, /** @type {any} */ aktifDeger, /** @type {any} */ onClickSecenegi, /** @type {any} */ renkler = {} }) {
    // secenekler: { v: 'beklemede', l: '⏳ Beklemede', r: '#f59e0b' } array
    return (
        <>
            {secenekler.map((s, idx) => {
                if (s === '|') return <div key={`sep-${idx}`} style={{ width: 1, background: '#e5e7eb', margin: '0 4px' }} />;

                const aktif = aktifDeger === s.v || s.isBooleanActive;
                const r = s.r || (/** @type {any} */ (renkler))?.aktifBg || '#3b82f6';

                return (
                    <button
                        key={s.v || idx}
                        onClick={() => onClickSecenegi(s.v)}
                        style={{
                            padding: '5px 12px',
                            border: '2px solid',
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            borderColor: aktif ? r : '#e5e7eb',
                            background: aktif ? r : 'white',
                            color: aktif ? 'white' : '#374151'
                        }}
                    >
                        {s.l}
                    </button>
                );
            })}
        </>
    );
}
