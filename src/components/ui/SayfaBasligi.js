export default function SayfaBasligi({ ikon: Ikon, icon: Icon, renkler = {}, baslik, altBaslik, islemler, islemButonlari }) {
    const IkonComponent = Ikon || Icon || null;
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, background: renkler.bg || 'linear-gradient(135deg,#047857,#065f46)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {IkonComponent}
                </div>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{baslik}</h1>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>{altBaslik}</p>
                </div>
            </div>
            {(islemButonlari || islemler) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {islemButonlari || islemler}
                </div>
            )}
        </div>
    );
}
