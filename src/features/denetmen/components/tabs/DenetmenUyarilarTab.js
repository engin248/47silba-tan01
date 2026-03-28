import { CheckCircle, Clock } from 'lucide-react';
import { formatTarih } from '@/lib/utils';

const SEVİYE_RENK = {
    kritik: { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', badge: '#ef4444' },
    uyari: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', badge: '#f59e0b' },
    bilgi: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', badge: '#3b82f6' },
};

export default function DenetmenUyarilarTab({
    uyarilar, kritikSayisi, uyariSayisi, loglar, loading, mesaj,
    aiAnaliz, setAiAnaliz, filtre, setFiltre, TIP_İKON, coz, gozArd
}) {
    const filtrelendi = filtre === 'hepsi' ? uyarilar : uyarilar.filter(u => u.seviye === filtre || u.uyari_tipi === filtre);

    return (
        <div>
            {/* ÖZET KARTLAR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Aktif Uyarı', val: uyarilar.length, color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Kritik', val: kritikSayisi, color: '#ef4444', bg: '#fef2f2' },
                    { label: 'Uyarı', val: uyariSayisi, color: '#f59e0b', bg: '#fffbeb' },
                ].map((k, i) => (
                    <div key={i} style={{ background: k.bg, border: `1px solid ${k.color}25`, borderRadius: 12, padding: '0.875rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{k.label}</div>
                        <div style={{ fontWeight: 900, fontSize: '1.6rem', color: k.color }}>{k.val}</div>
                    </div>
                ))}
            </div>

            {/* MESAJ */}
            {mesaj && (
                <div style={{ padding: '10px 16px', marginBottom: '1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #bbf7d0' }}>
                    {mesaj}
                </div>
            )}

            {/* AI ANALİZ SONUCU */}
            {aiAnaliz && (
                <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🤖</span>
                    <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 6 }}>Gemini Otonom Karargâh Zekası</div>
                        <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.7 }}>{aiAnaliz}</div>
                        <button onClick={() => setAiAnaliz(null)} style={{ marginTop: 8, fontSize: '0.68rem', color: '#a7f3d0', background: 'none', border: 'none', cursor: 'pointer' }}>Kapat</button>
                    </div>
                </div>
            )}

            {/* FİLTRE */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['hepsi', 'kritik', 'uyari', 'bilgi', 'dusuk_stok', 'maliyet_asimi', 'video_eksik', 'diger'].map(f => (
                    <button key={f} onClick={() => setFiltre(f)}
                        style={{
                            padding: '5px 12px', borderRadius: 6, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
                            borderColor: filtre === f ? '#7c3aed' : '#e5e7eb',
                            background: filtre === f ? '#7c3aed' : 'white',
                            color: filtre === f ? 'white' : '#374151'
                        }}>
                        {f === 'hepsi' ? 'Tümü' : f === 'dusuk_stok' ? 'Stok' : f === 'maliyet_asimi' ? 'Maliyet' : f === 'video_eksik' ? 'Video' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* UYARI LİSTESİ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Yükleniyor...</div>}
                {!loading && filtrelendi.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', background: '#0b1d1a', borderRadius: 12, border: '2px dashed #e5e7eb' }}>
                        <CheckCircle size={40} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                        <p style={{ color: '#10b981', fontWeight: 800 }}>Aktif uyarı yok</p>
                    </div>
                )}
                {filtrelendi.map(u => {
                    const r = SEVİYE_RENK[u.seviye] || SEVİYE_RENK.bilgi;
                    const tip = TIP_İKON[u.uyari_tipi] || TIP_İKON.diger;
                    return (
                        <div key={u.id} style={{ background: r.bg, border: `2px solid ${r.border}`, borderRadius: 12, padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, background: r.badge, color: 'white', padding: '2px 7px', borderRadius: 4 }}>{u.seviye?.toUpperCase()}</span>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: r.text, display: 'flex', alignItems: 'center', gap: 3 }}>{tip.ikon} {tip.etiket}</span>
                                </div>
                                <div style={{ fontWeight: 800, color: '#1f2937', fontSize: '0.9rem' }}>{u.baslik}</div>
                                {u.mesaj && <div style={{ fontSize: '0.78rem', color: '#4b5563', marginTop: 3, fontWeight: 600 }}>{u.mesaj}</div>}
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 4 }}>{formatTarih(u.olusturma)}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <button onClick={() => coz(u.id, u.baslik)} title="Çözüldü"
                                    style={{ padding: '5px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle size={12} /> Çözüldü
                                </button>
                                <button onClick={() => gozArd(u.id)} title="Göz Ardı"
                                    style={{ padding: '5px 10px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>
                                    Yoksay
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* AGENT LOG */}
            {loglar.length > 0 && (
                <div style={{ background: '#0f172a', borderRadius: 12, padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} /> Son Ajan Hareketleri
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {loglar.slice(0, 10).map(l => (
                            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', padding: '3px 0', borderBottom: '1px solid #1e293b' }}>
                                <span style={{ color: l.sonuc === 'hata' ? '#f87171' : '#34d399', fontWeight: 700 }}>{l.ajan_adi}</span>
                                <span style={{ color: '#94a3b8' }}>{l.mesaj}</span>
                                <span style={{ color: '#a7f3d0' }}>{formatTarih(l.created_at)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
