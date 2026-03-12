'use client';
import { Search, Zap, Globe, Tag } from 'lucide-react';

/**
 * M1_AramaMotoru.js
 * Hermes V2 AI arama kutusu — Perplexity Sonar tetikleyicisi
 * Hızlı arama butonları (Rakip Analizi, Kumaş Segmenti vb.)
 */
export default function M1_AramaMotoru({ aiSorgu, setAiSorgu, trendAra, aiAraniyor, isAR }) {
    const HIZLI_ARAMALAR = isAR
        ? ['قمصان كتان صيفية 2026', 'سراويل بوجاتي', 'فساتين عباءة', 'ملابس رياضية نسائية']
        : ['2026 Yazlık Keten Gömlek', 'Baggy Pantolon Erkek', 'Elbise Vintage', 'Kadın Spor Giyim'];

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !aiAraniyor) trendAra();
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            border: '2px solid #334155',
            borderRadius: 16,
            padding: '1.25rem',
            marginBottom: '1.5rem',
        }}>
            {/* Başlık */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <div style={{ width: 32, height: 32, background: '#047857', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={16} color="white" />
                </div>
                <div>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>
                        {isAR ? 'محرك البحث عن الاتجاهات (Hermes V2)' : 'Hermes V2 — Trend Arama Motoru'}
                    </span>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                        {isAR ? 'Perplexity Sonar · تحليل السوق' : 'Perplexity Sonar · Piyasa Analizi · 4 Metrik'}
                    </div>
                </div>
            </div>

            {/* Ana arama kutusu */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={aiSorgu}
                        onChange={(e) => setAiSorgu(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isAR ? 'ابحث عن منتج... (مثال: قميص كتان صيفي)' : 'Ürün ara... (Örn: Yazlık keten gömlek serisi)'}
                        maxLength={150}
                        style={{
                            width: '100%',
                            paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
                            background: '#0f172a',
                            border: '2px solid #334155',
                            borderRadius: 10,
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            outline: 'none',
                            boxSizing: 'border-box',
                            direction: isAR ? 'rtl' : 'ltr',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#047857'}
                        onBlur={(e) => e.target.style.borderColor = '#334155'}
                    />
                </div>
                <button
                    onClick={trendAra}
                    disabled={aiAraniyor || !aiSorgu.trim()}
                    style={{
                        background: aiAraniyor ? '#374151' : '#047857',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 10,
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: aiAraniyor || !aiSorgu.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap',
                        opacity: !aiSorgu.trim() ? 0.5 : 1,
                        transition: 'all 0.2s',
                    }}
                >
                    {aiAraniyor ? (
                        <>
                            <div style={{ width: 14, height: 14, border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            {isAR ? 'جارٍ البحث...' : 'Analiz...'}
                        </>
                    ) : (
                        <>
                            <Globe size={14} />
                            {isAR ? 'تحليل' : 'Analiz Et'}
                        </>
                    )}
                </button>
            </div>

            {/* Hızlı arama butonları */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {HIZLI_ARAMALAR.map((sorgu, i) => (
                    <button
                        key={i}
                        onClick={() => { setAiSorgu(sorgu); }}
                        style={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            color: '#94a3b8',
                            padding: '5px 12px',
                            borderRadius: 20,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            transition: 'all 0.15s',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#047857'; e.currentTarget.style.color = '#10b981'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
                    >
                        <Tag size={10} />
                        {sorgu}
                    </button>
                ))}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
