'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, Package, Clock, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const TIP_IKON = {
    risk_ihlali: { ikon: ShieldAlert, renk: '#ef4444', bg: '#fef2f2' },
    stok_kritik: { ikon: Package, renk: '#f59e0b', bg: '#fffbeb' },
    siparis_gecikti: { ikon: Clock, renk: '#f97316', bg: '#fff7ed' },
    odeme_vadesi: { ikon: AlertTriangle, renk: '#dc2626', bg: '#fef2f2' },
    sistem: { ikon: Bell, renk: '#6366f1', bg: '#eef2ff' },
    bilgi: { ikon: Bell, renk: '#64748b', bg: '#f8fafc' },
};

export default function BildirimZili() {
    const { kullanici } = useAuth();
    const [acik, setAcik] = useState(false);
    const [bildirimler, setBildirimler] = useState([]);
    const [okunmamis, setOkunmamis] = useState(0);

    const yukle = useCallback(async () => {
        if (!kullanici) return;
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .or(`alici_id.eq.${kullanici.id},alici_id.eq.admin`)
            .order('created_at', { ascending: false })
            .limit(30);
        if (data) {
            setBildirimler(data);
            setOkunmamis(data.filter(b => !b.okundu).length);
        }
    }, [kullanici]);

    useEffect(() => {
        yukle();
        const kanal = supabase.channel('bildirim-kanal')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => yukle())
            .subscribe();
        return () => supabase.removeChannel(kanal);
    }, [yukle]);

    const tumunuOku = async () => {
        const okunmamisIds = bildirimler.filter(b => !b.okundu).map(b => b.id);
        if (okunmamisIds.length === 0) return;
        await supabase.from('notifications').update({ okundu: true }).in('id', okunmamisIds);
        yukle();
    };

    const tekOku = async (id) => {
        await supabase.from('notifications').update({ okundu: true }).eq('id', id);
        yukle();
    };

    const formatZaman = (ts) => {
        const d = new Date(ts);
        const simdi = new Date();
        const fark = Math.floor((simdi - d) / 60000);
        if (fark < 1) return 'Az önce';
        if (fark < 60) return `${fark} dk önce`;
        if (fark < 1440) return `${Math.floor(fark / 60)} saat önce`;
        return d.toLocaleDateString('tr-TR');
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setAcik(v => !v)}
                style={{
                    position: 'relative', background: 'transparent', border: 'none',
                    cursor: 'pointer', padding: '6px', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: okunmamis > 0 ? '#f59e0b' : '#94a3b8',
                    transition: 'color 0.2s',
                }}
                title="Bildirimler"
            >
                <Bell size={20} />
                {okunmamis > 0 && (
                    <span style={{
                        position: 'absolute', top: 0, right: 0,
                        background: '#ef4444', color: 'white',
                        fontSize: '0.6rem', fontWeight: 900,
                        width: 16, height: 16, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #0f172a',
                    }}>
                        {okunmamis > 9 ? '9+' : okunmamis}
                    </span>
                )}
            </button>

            {acik && (
                <>
                    <div
                        onClick={() => setAcik(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                    />
                    <div style={{
                        position: 'absolute', top: 36, right: 0,
                        width: 340, maxHeight: 480, overflowY: 'auto',
                        background: '#1e293b', border: '1px solid #334155',
                        borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        zIndex: 999,
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 16px', borderBottom: '1px solid #334155',
                        }}>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f1f5f9' }}>
                                🔔 Bildirimler {okunmamis > 0 && (
                                    <span style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '1px 6px', borderRadius: 10, marginLeft: 6 }}>
                                        {okunmamis} yeni
                                    </span>
                                )}
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {okunmamis > 0 && (
                                    <button onClick={tumunuOku} title="Tümünü okundu işaretle"
                                        style={{ background: '#065f46', border: 'none', color: '#34d399', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <CheckCheck size={12} /> Tümünü Oku
                                    </button>
                                )}
                                <button onClick={() => setAcik(false)}
                                    style={{ background: '#334155', border: 'none', color: '#94a3b8', padding: '3px 8px', borderRadius: 6, cursor: 'pointer' }}>
                                    <X size={12} />
                                </button>
                            </div>
                        </div>

                        {bildirimler.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontSize: '0.8rem', fontWeight: 700 }}>
                                🎉 Tüm bildirimler okundu
                            </div>
                        ) : (
                            bildirimler.map(b => {
                                const tip = TIP_IKON[b.tip] || TIP_IKON.bilgi;
                                const Ikon = tip.ikon;
                                return (
                                    <div key={b.id}
                                        onClick={() => !b.okundu && tekOku(b.id)}
                                        style={{
                                            display: 'flex', gap: 10, padding: '10px 14px',
                                            borderBottom: '1px solid #1e293b',
                                            background: b.okundu ? 'transparent' : 'rgba(59,130,246,0.06)',
                                            cursor: b.okundu ? 'default' : 'pointer',
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                            background: tip.bg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Ikon size={15} color={tip.renk} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.78rem', color: b.okundu ? '#64748b' : '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {b.baslik}
                                            </div>
                                            {b.mesaj && (
                                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                                                    {b.mesaj.length > 80 ? b.mesaj.slice(0, 80) + '…' : b.mesaj}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: 4, fontWeight: 600 }}>
                                                {formatZaman(b.created_at)}
                                            </div>
                                        </div>
                                        {!b.okundu && (
                                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 4 }} />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
