import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Activity, ShieldCheck, AlertTriangle, Eye, Server } from 'lucide-react';

export default function M6_KameraSayaci() {
    const [olaylar, setOlaylar] = useState(/** @type {any[]} */([]));
    const [stats, setStats] = useState({ basarili: 0, hatali: 0, sonGuncelleme: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const veriCek = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('b1_kamera_olaylari')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data && isMounted) {
                setOlaylar(data);
                hesaplaStats(data);
            }
            if (isMounted) setLoading(false);
        };

        veriCek();

        // CANLI AKIŞ (Supabase Realtime)
        const kanal = supabase.channel('m4_kamera_kanal')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_kamera_olaylari' }, (payload) => {
                if (isMounted) {
                    setOlaylar(prev => {
                        const yeniListe = [payload.new, ...prev].slice(0, 50);
                        hesaplaStats(yeniListe);
                        return yeniListe;
                    });
                }
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(kanal);
        };
    }, []);

    const hesaplaStats = (liste) => {
        const basarili = liste.filter(o => o.olay_tipi?.includes('basari')).length;
        const hatali = liste.filter(o => o.olay_tipi?.includes('hata') || o.olay_tipi?.includes('anomali')).length;
        setStats({ basarili, hatali, sonGuncelleme: new Date().toLocaleTimeString('tr-TR') });
    };

    return (
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Camera size={24} color="#047857" />
                        M6 Otonom Edge Kameralar (Canlı)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                        Lokal ağdaki kameralardan ve AI Vision (YOLO) modellerinden gelen anlık üretim hattı analizleri sıfır gecikme ile buraya yansır.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {loading ? (
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 800 }}>Bağlanıyor...</span>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ecfdf5', padding: '6px 14px', borderRadius: 20, border: '1px solid #10b981' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }}></div>
                            <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 900 }}>SENSÖRLER AKTİF</span>
                        </div>
                    )}
                </div>
            </div>

            {/* İSTATİSTİKLER */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Olay Hacmi (Son 50)</span>
                        <Activity size={16} color="#3b82f6" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>{olaylar.length} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>Tarama</span></div>
                </div>

                <div style={{ background: 'white', padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Başarılı İmalat Tespiti</span>
                        <ShieldCheck size={16} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#064e3b' }}>{stats.basarili}</div>
                </div>

                <div style={{ background: 'white', padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', borderLeft: '4px solid #ef4444', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Hata / Anomali (Fire)</span>
                        <AlertTriangle size={16} color="#ef4444" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#7f1d1d' }}>{stats.hatali}</div>
                </div>

                <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: 12, border: '1px solid #334155', borderLeft: '4px solid #f59e0b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Kurye Senkronizasyonu</span>
                        <Server size={16} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginTop: 10 }}>{stats.sonGuncelleme || '--:--:--'}</div>
                </div>
            </div>

            {/* LOG TABLOSU */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Eye size={18} color="#64748b" /> Radar (Akan Veri Kayıtları)
                </div>
                {olaylar.length === 0 && !loading && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                        <Camera size={48} style={{ opacity: 0.2, margin: '0 auto 10px' }} />
                        Henüz kameradan herhangi bir otonom sayım veya anomali verisi gelmedi.
                    </div>
                )}
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {olaylar.map((o, i) => {
                        const isHata = o.olay_tipi?.includes('hata') || o.olay_tipi?.includes('anomali');
                        const guvenSkorYuzdesi = Math.round((o.guven_skoru || 1) * 100);
                        return (
                            <div key={o.id || i} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s', ':hover': { background: '#f8fafc' }, animation: i === 0 ? 'highlightFlash 2s ease-out' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: isHata ? '#ef4444' : '#10b981' }}></div>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                                            {o.olay_tipi.replace(/_/g, ' ').toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginTop: 4, display: 'flex', gap: 10 }}>
                                            <span>📷 {o.kamera_adi || o.kamera_ip}</span>
                                            <span>({new Date(o.created_at).toLocaleTimeString('tr-TR')})</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: guvenSkorYuzdesi > 90 ? '#10b981' : '#f59e0b' }}>
                                        %{guvenSkorYuzdesi} Doğruluk
                                    </div>
                                    {o.ek_bilgi && Object.keys(o.ek_bilgi).length > 0 && (
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginTop: 2, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {JSON.stringify(o.ek_bilgi)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes highlightFlash {
                    0% { background: rgba(52, 211, 153, 0.4); }
                    100% { background: transparent; }
                }
            `}</style>
        </div>
    );
}
