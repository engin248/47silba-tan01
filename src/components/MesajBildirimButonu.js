'use client';
/**
 * MesajBildirimButonu
 * • Polling YOK — sadece Realtime WebSocket (HTTP quota tüketmez)
 * • İlk yüklemede COUNT(*) head:true — satır verisi çekmez
 * • Detay yalnızca popup açılınca yüklenir (lazy)
 * • AR modunda buton sola geçer — sidebar çakışması önlenir
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/langContext';
import { MessageSquare, X, ChevronRight, AlertTriangle } from 'lucide-react';

export default function MesajBildirimButonu() {
    const { kullanici } = useAuth();
    const { lang } = useLang();
    const router = useRouter();
    const isAR = lang === 'ar';

    const [okunmamis, setOkunmamis] = useState(0);
    const [popupAcik, setPopupAcik] = useState(false);
    const [sonMesajlar, setSonMesajlar] = useState([]);
    const [alarmMesajlar, setAlarmMesajlar] = useState([]);
    const [alarmAcik, setAlarmAcik] = useState(false);
    const kanalRef = useRef(null);

    const kGrup = kullanici?.modul || kullanici?.grup || 'genel';

    // Sadece SAYI — head:true ile 0 bant genişliği
    const sayiGetir = useCallback(async () => {
        if (!kullanici) return;
        try {
            const { count } = await supabase
                .from('b1_ic_mesajlar')
                .select('id', { count: 'exact', head: true })
                .or(`alici_grup.eq.${kGrup},alici_grup.eq.hepsi`)
                .is('okundu_at', null)
                .is('copte', false); // Çöpteki mesajları sayma
            setOkunmamis(count || 0);
        } catch { /* sessiz */ }
    }, [kullanici, kGrup]);

    // Detay — yalnızca popup açılınca (lazy)
    const detayGetir = useCallback(async () => {
        if (!kullanici) return;
        try {
            const { data } = await supabase
                .from('b1_ic_mesajlar')
                .select('id, konu, oncelik, tip, created_at, gonderen_adi')
                .or(`alici_grup.eq.${kGrup},alici_grup.eq.hepsi`)
                .is('okundu_at', null)
                .is('copte', false) // Çöpteki mesajların detaylarını gösterme
                .order('created_at', { ascending: false })
                .limit(10);
            const mesajlar = data || [];
            setSonMesajlar(mesajlar);
            const kritik = mesajlar.filter(m => m.oncelik === 'kritik' || m.oncelik === 'acil');
            if (kritik.length > 0) { setAlarmMesajlar(kritik); setAlarmAcik(true); }
        } catch { /* sessiz */ }
    }, [kullanici, kGrup]);

    // İlk yükleme
    useEffect(() => { sayiGetir(); }, [sayiGetir]);

    // Realtime — WebSocket, HTTP quota tüketmez
    useEffect(() => {
        if (!kullanici) return;
        const kanal = supabase.channel(`mbtn-${kGrup}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_ic_mesajlar' },
                () => sayiGetir())
            .subscribe();
        kanalRef.current = kanal;
        return () => supabase.removeChannel(kanal);
    }, [kullanici, kGrup, sayiGetir]);

    // Popup açılınca detay getir
    useEffect(() => { if (popupAcik) detayGetir(); }, [popupAcik, detayGetir]);

    if (!kullanici) return null;

    const formatSure = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    const git = () => { router.push('/haberlesme'); setPopupAcik(false); };

    // RTL: buton sola, popup sola
    const yan = isAR ? { left: 20, right: 'auto' } : { right: 20, left: 'auto' };
    const popupYan = isAR ? { left: 20, right: 'auto' } : { right: 20, left: 'auto' };

    return (
        <>
            {/* KRİTİK ALARM PANELİ */}
            {alarmAcik && alarmMesajlar.length > 0 && (
                <div style={{
                    position: 'fixed', bottom: 82, zIndex: 99990, ...popupYan,
                    background: 'linear-gradient(135deg,#7f1d1d,#b91c1c)',
                    border: '2px solid #fca5a5', borderRadius: 12, padding: '10px 14px',
                    width: 272, boxShadow: '0 6px 24px rgba(239,68,68,.7)',
                    animation: 'brzTitres 1.4s ease-in-out infinite',
                    direction: isAR ? 'rtl' : 'ltr',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <span style={{ color: 'white', fontWeight: 900, fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <AlertTriangle size={14} /> {alarmMesajlar.length} ACİL / KRİTİK
                        </span>
                        <button onClick={() => setAlarmAcik(false)}
                            style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: 'white', borderRadius: 5, padding: '1px 5px', cursor: 'pointer' }}>
                            <X size={11} />
                        </button>
                    </div>
                    {alarmMesajlar.slice(0, 2).map(m => (
                        <div key={m.id} onClick={git}
                            style={{ background: 'rgba(0,0,0,.35)', borderRadius: 7, padding: '5px 8px', marginBottom: 4, cursor: 'pointer' }}>
                            <div style={{ fontSize: '.7rem', fontWeight: 800, color: 'white' }}>
                                {m.oncelik === 'kritik' ? '🔴' : '🟡'} {(m.konu || '').slice(0, 38)}{m.konu?.length > 38 ? '…' : ''}
                            </div>
                            <div style={{ fontSize: '.6rem', color: '#fca5a5' }}>{m.gonderen_adi} · {formatSure(m.created_at)}</div>
                        </div>
                    ))}
                    <button onClick={git}
                        style={{ width: '100%', marginTop: 5, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: 'white', borderRadius: 7, padding: '5px', cursor: 'pointer', fontSize: '.7rem', fontWeight: 700 }}>
                        Haberleşme'ye Git <ChevronRight size={12} style={{ verticalAlign: 'middle' }} />
                    </button>
                </div>
            )}

            {/* MİNİ POPUP */}
            {popupAcik && (
                <div style={{
                    position: 'fixed', bottom: 82, zIndex: 99989, ...popupYan,
                    background: '#1e293b', border: '1px solid #334155',
                    borderRadius: 12, padding: '10px', width: 270,
                    boxShadow: '0 6px 24px rgba(0,0,0,.6)',
                    animation: 'brzSlideUp .18s ease-out',
                    direction: isAR ? 'rtl' : 'ltr',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '.76rem' }}>📬 Okunmamış Mesajlar</span>
                        <button onClick={() => setPopupAcik(false)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                            <X size={13} />
                        </button>
                    </div>
                    {sonMesajlar.length === 0
                        ? <div style={{ color: '#475569', fontSize: '.7rem', textAlign: 'center', padding: '10px 0' }}>✅ Temiz — okunmamış yok</div>
                        : sonMesajlar.map(m => (
                            <div key={m.id} onClick={git}
                                style={{
                                    background: m.oncelik === 'kritik' ? '#450a0a' : m.oncelik === 'acil' ? '#451a03' : '#0f172a',
                                    border: `1px solid ${m.oncelik === 'kritik' ? '#ef4444' : m.oncelik === 'acil' ? '#f59e0b' : '#334155'}`,
                                    borderRadius: 7, padding: '6px 9px', marginBottom: 4, cursor: 'pointer',
                                }}>
                                <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#f1f5f9' }}>
                                    {m.oncelik === 'kritik' ? '🔴' : m.oncelik === 'acil' ? '🟡' : '🔵'} {(m.konu || '').slice(0, 38)}…
                                </div>
                                <div style={{ fontSize: '.58rem', color: '#94a3b8' }}>{m.gonderen_adi} · {formatSure(m.created_at)}</div>
                            </div>
                        ))
                    }
                    <button onClick={git}
                        style={{ width: '100%', marginTop: 5, background: '#1d4ed8', border: 'none', color: 'white', borderRadius: 7, padding: '6px', cursor: 'pointer', fontSize: '.7rem', fontWeight: 700 }}>
                        Tümünü Gör →
                    </button>
                </div>
            )}

            {/* ANA YÜZER BUTON */}
            <button id="mesaj-bildirim-btn" onClick={() => setPopupAcik(v => !v)}
                title={okunmamis > 0 ? `${okunmamis} okunmamış mesaj` : 'Haberleşme'}
                style={{
                    position: 'fixed', bottom: 20, zIndex: 99999, ...yan,
                    width: 50, height: 50, borderRadius: '50%',
                    background: okunmamis > 0 ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#1e40af,#3b82f6)',
                    border: okunmamis > 0 ? '2px solid #fca5a5' : '2px solid #93c5fd',
                    color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: okunmamis > 0 ? '0 4px 18px rgba(239,68,68,.65)' : '0 4px 14px rgba(59,130,246,.4)',
                    animation: okunmamis > 0 ? 'brzTitres 1.4s ease-in-out infinite' : 'none',
                    transition: 'background .3s, box-shadow .3s',
                }}>
                <MessageSquare size={20} />
                {okunmamis > 0 && (
                    <span style={{
                        position: 'absolute', top: -5, right: -5,
                        background: '#fbbf24', color: '#1c1917',
                        borderRadius: '50%', width: 19, height: 19,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.62rem', fontWeight: 900, border: '2px solid white',
                    }}>
                        {okunmamis > 99 ? '99+' : okunmamis}
                    </span>
                )}
            </button>

            <style>{`
                @keyframes brzTitres {
                    0%,100% { transform:scale(1); }
                    50%      { transform:scale(1.1); }
                }
                @keyframes brzSlideUp {
                    from { transform:translateY(8px); opacity:0; }
                    to   { transform:translateY(0);   opacity:1; }
                }
            `}</style>
        </>
    );
}
