'use client';
import { Eye, Tag, TrendingUp, Globe, BarChart3 } from 'lucide-react';

/**
 * M2_GelenIlhamKarti.js
 * M1'den gelen onaylı trendin READ-ONLY görüntüsü.
 * Modelist bu veriyi değiştiremez — sadece okur.
 * DUVAR 1: AI hayal ürünü, fiziksel üretim değil.
 */
export default function M2_GelenIlhamKarti({ trendVerisi }) {
    if (!trendVerisi) return null;

    const skor = trendVerisi.talep_skoru ?? 5;
    const skorRenk = skor >= 8 ? '#10b981' : skor >= 5 ? '#f59e0b' : '#ef4444';

    // Hermes Notunu parse et (aciklama sütununda gömülü)
    const parseHermesNot = (aciklama) => {
        if (!aciklama) return {};
        const lines = aciklama.split('\n');
        const result = {};
        lines.forEach(line => {
            if (line.includes('MODEL TÜRÜ:')) result.modelTuru = line.split('MODEL TÜRÜ:')[1]?.trim();
            if (line.includes('KUMAŞ TÜRÜ:')) result.kumasTuru = line.split('KUMAŞ TÜRÜ:')[1]?.trim();
            if (line.includes('AKSESUAR:')) result.aksesuar = line.split('AKSESUAR:')[1]?.trim();
            if (line.includes('FİYAT ARALIĞI:')) result.fiyat = line.split('FİYAT ARALIĞI:')[1]?.trim();
            if (line.includes('HERMES NOTU:')) result.hermesNot = line.split('HERMES NOTU:')[1]?.trim();
        });
        return result;
    };

    const hermes = parseHermesNot(trendVerisi.aciklama);

    return (
        <div style={{
            background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
            border: '2px solid #bfdbfe',
            borderRadius: 16,
            overflow: 'hidden',
        }}>
            {/* Header — Salt Okunur Uyarısı */}
            <div style={{
                background: 'linear-gradient(135deg, #1e40af, #1d4ed8)',
                padding: '0.75rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <Eye size={16} color="white" />
                <div>
                    <div style={{ color: 'white', fontWeight: 900, fontSize: '0.85rem' }}>
                        🧱 DUVAR 1 — M1 Ar-Ge İlham Verisi (Salt Okunur)
                    </div>
                    <div style={{ color: '#bfdbfe', fontSize: '0.65rem', fontWeight: 600 }}>
                        Bu veri AI tahminidir. Fiziksel numuneden bağımsız değerlendirin.
                    </div>
                </div>
            </div>

            {/* Ürün Başlığı */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #dbeafe' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1e3a8a' }}>
                    {trendVerisi.baslik}
                </h2>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 700, fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20 }}>
                        {trendVerisi.platform}
                    </span>
                    <span style={{ background: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20 }}>
                        {trendVerisi.kategori}
                    </span>
                    <span style={{
                        background: `${skorRenk}20`, color: skorRenk,
                        fontWeight: 900, fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20,
                    }}>
                        Talep Skoru: {skor}/10
                    </span>
                </div>
            </div>

            {/* Hermes Tahmin Verileri */}
            <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
                    🤖 Hermes AI Tahminleri — Doğrulanmamış
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {hermes.modelTuru && (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.6rem' }}>
                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>MODEL TÜRÜ (TAHMİN)</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginTop: 2 }}>{hermes.modelTuru}</div>
                        </div>
                    )}
                    {hermes.kumasTuru && (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.6rem' }}>
                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>KUMAŞ (TAHMİN)</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginTop: 2 }}>{hermes.kumasTuru}</div>
                        </div>
                    )}
                    {hermes.fiyat && (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.6rem' }}>
                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>FİYAT ARALIĞI (TAHMİN)</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginTop: 2 }}>{hermes.fiyat}</div>
                        </div>
                    )}
                    {(trendVerisi.hedef_kitle) && (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.6rem' }}>
                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>HEDEF KİTLE</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginTop: 2 }}>{trendVerisi.hedef_kitle}</div>
                        </div>
                    )}
                </div>

                {hermes.hermesNot && (
                    <div style={{ marginTop: 10, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '0.6rem', fontSize: '0.75rem', color: '#78350f', lineHeight: 1.5 }}>
                        💡 <strong>Hermes Notu:</strong> {hermes.hermesNot}
                    </div>
                )}

                <div style={{ marginTop: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.6rem', fontSize: '0.7rem', color: '#991b1b', fontWeight: 700 }}>
                    ⚠️ Bu bilgiler AI analiz tahminidir. Gerçek numune ve fiziksel ölçüme dayanmaz. Aşağıdaki formda kendi tespitlerinizi girin.
                </div>
            </div>
        </div>
    );
}
