'use client';
import { useState } from 'react';
import { TrendingUp, Plus, ExternalLink, Bot, Zap, AlertTriangle, CheckCircle2, Search } from 'lucide-react';

/**
 * M1_TrendSonucKarti.js
 * Hermes V2'nin döndürdüğü tek bir trend sonucunu gösterir.
 * Kaşif butonu: /api/agent/kasif üzerinden "Satar mı?" analizi tetikler.
 */
/**
 * @param {{ sonuc: any, onKaydet: any, isAR: any, key?: any }} props
 */
export default function M1_TrendSonucKarti({ sonuc, onKaydet, isAR }) {
    const [kasifYukleniyor, setKasifYukleniyor] = useState(false);
    const [kasifSonucu, setKasifSonucu] = useState(/** @type {any} */(null));
    const [kasifAcik, setKasifAcik] = useState(false);

    const skorRenk = (/** @type {any} */ s) => s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444';
    const skor = sonuc.trend_skoru ?? sonuc.talep_skoru ?? 50;

    const kasifAnaliz = async () => {
        if (kasifYukleniyor) return;
        setKasifYukleniyor(true);
        setKasifSonucu(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s Timeout

        try {
            const res = await fetch('/api/agent/kasif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    urunAdi: sonuc.satilacak_urun || sonuc.baslik,
                    kumasCinsi: sonuc.kumas_turu,
                    hedefKitle: sonuc.hedef_musteri || 'genel',
                    sezon: sonuc.sezon || 'genel',
                    hermesSkoru: skor,
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const data = await res.json();
            setKasifSonucu(data);
            setKasifAcik(true);
        } catch (e) {
            clearTimeout(timeoutId);
            if (e.name === 'AbortError') {
                setKasifSonucu({ error: 'Kaşif bağlantısı zaman aşımına uğradı. Veri boyutu büyük olabilir veya ajan meşgul.' });
            } else {
                setKasifSonucu({ error: 'Kaşif bağlantı hatası: ' + e.message });
            }
        } finally {
            setKasifYukleniyor(false);
        }
    };

    return (
        <div style={{
            background: 'white', border: '2px solid #e2e8f0', borderRadius: 14,
            overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s',
        }}>
            {/* Üst şerit — Skor */}
            <div style={{
                background: `linear-gradient(135deg, ${skorRenk(skor)}15, ${skorRenk(skor)}05)`,
                borderBottom: `3px solid ${skorRenk(skor)}`,
                padding: '0.875rem 1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={16} color={skorRenk(skor)} />
                    <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>
                        {sonuc.satilacak_urun || sonuc.baslik || 'Trend Ürünü'}
                    </span>
                </div>
                <div style={{
                    background: skorRenk(skor), color: 'white',
                    fontWeight: 900, fontSize: '0.8rem',
                    padding: '3px 10px', borderRadius: 20,
                }}>
                    {skor}/100
                </div>
            </div>

            {/* İçerik */}
            <div style={{ padding: '0.875rem 1rem', fontSize: '0.78rem', color: '#475569' }}>
                {sonuc.kumas_turu && (
                    <div style={{ marginBottom: 6 }}>
                        🧵 <strong>Kumaş:</strong> {sonuc.kumas_turu}
                    </div>
                )}
                {sonuc.fiyat_araligi && (
                    <div style={{ marginBottom: 6 }}>
                        💰 <strong>Fiyat:</strong> {sonuc.fiyat_araligi}
                    </div>
                )}
                {sonuc.hedef_musteri && (
                    <div style={{ marginBottom: 6 }}>
                        🎯 <strong>Hedef Kitle:</strong> {sonuc.hedef_musteri}
                    </div>
                )}
                {sonuc.pazar_uyumu && (
                    <div style={{ marginBottom: 6, color: '#3b82f6' }}>
                        🌍 <strong>Pazar Uyumu:</strong> {sonuc.pazar_uyumu}
                    </div>
                )}
                {sonuc.kategori && (
                    <div style={{ marginBottom: 6, color: '#8b5cf6', textTransform: 'capitalize' }}>
                        🏷️ <strong>Kategori:</strong> {sonuc.kategori}
                    </div>
                )}
                {sonuc.risk_seviyesi && (
                    <div style={{ marginBottom: 6, color: sonuc.risk_seviyesi === 'Yüksek' ? '#ef4444' : '#f59e0b' }}>
                        ⚠️ <strong>Risk:</strong> {sonuc.risk_seviyesi}
                    </div>
                )}
                {sonuc.aciklama && (
                    <div style={{ marginTop: 8, padding: '8px', background: '#f8fafc', borderRadius: 8, lineHeight: 1.5, color: '#334155', fontSize: '0.75rem' }}>
                        {sonuc.aciklama}
                    </div>
                )}

                {/* Kaşif Sonucu */}
                {kasifAcik && kasifSonucu && !(/** @type {any} */ (kasifSonucu).error) && (
                    <div style={{ marginTop: '0.75rem', background: /** @type {any} */ (kasifSonucu).satarMi ? '#f0fdf4' : '#fef2f2', border: `2px solid ${/** @type {any} */ (kasifSonucu).satarMi ? '#10b981' : '#ef4444'}`, borderRadius: 10, padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            {/** @type {any} */ (kasifSonucu).satarMi
                                ? <CheckCircle2 size={14} color="#10b981" />
                                : <AlertTriangle size={14} color="#ef4444" />}
                            <span style={{ fontWeight: 900, fontSize: '0.8rem', color: /** @type {any} */ (kasifSonucu).satarMi ? '#065f46' : '#991b1b' }}>
                                {/** @type {any} */ (kasifSonucu).satarMi ? '✅ KAŞİF: SATAR' : '❌ KAŞİF: SATMAZ'}
                                {/** @type {any} */ (kasifSonucu).kararGuven && ` (Güven: ${/** @type {any} */ (kasifSonucu).kararGuven}/10)`}
                            </span>
                        </div>
                        {/** @type {any} */ (kasifSonucu).piyasaOzeti && (
                            <p style={{ fontSize: '0.72rem', color: '#374151', margin: '0 0 6px' }}>{/** @type {any} */ (kasifSonucu).piyasaOzeti}</p>
                        )}
                        {/** @type {any} */ (kasifSonucu).tavsiye && (
                            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', margin: 0, fontStyle: 'italic' }}>
                                → {/** @type {any} */ (kasifSonucu).tavsiye}
                            </p>
                        )}
                        <button onClick={() => setKasifAcik(false)} style={{ marginTop: 6, fontSize: '0.65rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Kapat
                        </button>
                    </div>
                )}

                {/** @type {any} */ (kasifSonucu)?.error && (
                    <div style={{ marginTop: 8, color: '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>
                        ⚠️ {/** @type {any} */ (kasifSonucu).error}
                    </div>
                )}
            </div>

            {/* Butonlar */}
            <div style={{ padding: '0 1rem 0.875rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Kaşif Butonu */}
                <button
                    onClick={kasifAnaliz}
                    disabled={kasifYukleniyor}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: kasifYukleniyor ? '#f1f5f9' : '#4f46e5',
                        color: kasifYukleniyor ? '#94a3b8' : 'white',
                        border: 'none', padding: '7px 12px', borderRadius: 8,
                        fontWeight: 700, fontSize: '0.72rem', cursor: kasifYukleniyor ? 'wait' : 'pointer',
                        flex: 1,
                    }}
                    title="Kaşif: İnternette araştırıp bu ürün satar mı? analizi yapar"
                >
                    <Search size={12} />
                    {kasifYukleniyor ? 'Kaşif Araştırıyor...' : isAR ? 'رأي الكاشف' : 'Kaşif: Satar mı?'}
                </button>

                {/* Kaydet Butonu */}
                <button
                    onClick={onKaydet}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: '#047857', color: 'white',
                        border: 'none', padding: '7px 12px', borderRadius: 8,
                        fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                    }}
                >
                    <Plus size={12} />
                    {isAR ? 'حفظ' : 'Kaydet'}
                </button>

                {/* Kaynak Linki */}
                {sonuc.kaynak && sonuc.kaynak.startsWith('http') && (
                    <a href={sonuc.kaynak} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0284c7', fontSize: '0.68rem', fontWeight: 700, textDecoration: 'none' }}>
                        <ExternalLink size={11} /> Kaynak
                    </a>
                )}
            </div>
        </div>
    );
}
