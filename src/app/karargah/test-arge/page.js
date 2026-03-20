import React from 'react';

export default function TestArgeGorevTimi() {
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
            <h1 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                THE ORDER - Kum Havuzu (Gelişmiş Ar-Ge 3 Ajan Testi)
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                Bu alan NİZAM ana sisteminden izole edilmiştir. 3 Kişilik Araştırma Timi algoritmaları burada test edilecektir.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>

                {/* Ajan 1 */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1.5rem', background: '#f8fafc' }}>
                    <h2 style={{ fontSize: '1.1rem', color: '#334155', margin: '0 0 1rem 0' }}>🕵️‍♂️ Ajan 1: İstihbaratçı (Ham Veri)</h2>
                    <div style={{ fontSize: '0.85rem', color: '#475569', background: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <em>Sistem Bekleniyor... Trendyol/Web verisi kazıma motoru (Scraper API) entegrasyonu hazırlığında.</em>
                    </div>
                </div>

                {/* Ajan 2 */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1.5rem', background: '#f8fafc' }}>
                    <h2 style={{ fontSize: '1.1rem', color: '#334155', margin: '0 0 1rem 0' }}>⚙️ Ajan 2: Analist (119 Kriter Süzgeci)</h2>
                    <div style={{ fontSize: '0.85rem', color: '#475569', background: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <em>Ajan 1 bekleniyor... Gelen veriyi maliyet/risk/kalite ekseninde puanlama algoritması inşa edilecek.</em>
                    </div>
                </div>

                {/* Ajan 3 */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1.5rem', background: '#f8fafc' }}>
                    <h2 style={{ fontSize: '1.1rem', color: '#334155', margin: '0 0 1rem 0' }}>👑 Ajan 3: Stratejist (Patron Onayı)</h2>
                    <div style={{ fontSize: '0.85rem', color: '#475569', background: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <em>Analiz bekleniyor... Sadece &gt;85 Puan olan "Üretilebilir Fırsat" dosyaları bu ekrana düşecek.</em>
                    </div>
                </div>

            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#b45309', fontSize: '0.95rem' }}>🛠️ Sistem Güvenlik Durumu</h3>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e', fontSize: '0.85rem' }}>
                    <li>Taslak (Test) veritabanı ayarlandı.</li>
                    <li>Ana <b>b1_arge_trendler</b> tablosu yalıtımlı ve güvende.</li>
                    <li>API hız limitörü (Rate-limit) koruması aktif edilecek.</li>
                </ul>
            </div>

        </div>
    );
}
