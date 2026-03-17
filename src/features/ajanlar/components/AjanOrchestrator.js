'use client';
import { useState, useCallback } from 'react';
import { Bot, Play, CheckCircle2, AlertTriangle, Loader2, Zap, ShieldCheck, RefreshCw, ChevronRight, Users } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
//  PARÇA 2 — UI
//  AjanOrchestrator.js
//  3-Worker Sekme: Koordinatör + Worker A + Worker B
// ═══════════════════════════════════════════════════════════

const ASAMALAR = ['bekleme', 'taraniyor', 'dagitiliyor', 'dogrulanıyor', 'tamamlandi'];

function WorkerKart({ workerId, ikon, renk, gorevler, tamamlanan, durum, hata }) {
    const total = gorevler?.length || 0;
    const done = tamamlanan || 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const durumRenk = {
        bekliyor: '#94a3b8',
        calisıyor: '#f59e0b',
        tamamlandi: '#10b981',
        hata: '#ef4444',
    }[durum] || '#94a3b8';

    const durumLabel = {
        bekliyor: 'Bekliyor',
        calisıyor: '▶ Aktif',
        tamamlandi: '✅ Bitti',
        hata: '❌ Hata',
    }[durum] || 'Bekliyor';

    return (
        <div style={{
            background: '#0d1117',
            border: `2px solid ${durum === 'calisıyor' ? renk : '#1e2d3d'}`,
            borderRadius: 16,
            padding: '1.25rem',
            flex: 1,
            minWidth: 200,
            transition: 'border-color 0.3s',
            boxShadow: durum === 'calisıyor' ? `0 0 20px ${renk}30` : 'none',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${renk}20`, border: `2px solid ${renk}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    {ikon}
                </div>
                <div>
                    <div style={{ fontWeight: 900, color: 'white', fontSize: '0.85rem' }}>{workerId}</div>
                    <div style={{ fontSize: '0.7rem', color: durumRenk, fontWeight: 700 }}>{durumLabel}</div>
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: '#1e2d3d', borderRadius: 8, height: 8, marginBottom: 8, overflow: 'hidden' }}>
                <div style={{
                    width: `${pct}%`, height: '100%',
                    background: durum === 'hata' ? '#ef4444' : renk,
                    borderRadius: 8,
                    transition: 'width 0.5s ease',
                }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                {done}/{total} görev — %{pct}
            </div>

            {hata && (
                <div style={{ marginTop: 8, padding: '6px 10px', background: '#fef2f2', borderRadius: 8, fontSize: '0.7rem', color: '#b91c1c', fontWeight: 700 }}>
                    ⚠️ {hata}
                </div>
            )}

            {/* Görev listesi */}
            {gorevler && gorevler.length > 0 && (
                <div style={{ marginTop: 10, maxHeight: 120, overflowY: 'auto' }}>
                    {gorevler.slice(0, 6).map((g, i) => (
                        <div key={i}
                            onClick={() => navigator.clipboard?.writeText(g.baslik || '').catch(() => null)}
                            title="Kopyalamak için tıkla"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid #1e2d3d', fontSize: '0.68rem', color: '#94a3b8', cursor: 'copy' }}>
                            <span style={{ color: g.oncelik === 'kritik' ? '#ef4444' : '#f59e0b' }}>
                                {g.oncelik === 'kritik' ? '🔴' : '🟡'}
                            </span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.baslik}</span>
                        </div>
                    ))}
                    {gorevler.length > 6 && (
                        <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 4 }}>+{gorevler.length - 6} görev daha...</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AjanOrchestrator() {
    const [asama, setAsama] = useState('bekleme');
    const [gorevler, setGorevler] = useState(/** @type {any[]} */([]));
    const [dagitimSonucu, setDagitimSonucu] = useState(/** @type {any} */(null));
    const [dogrulamaSonucu, setDogrulamaSonucu] = useState(/** @type {any} */(null));
    const [workerAGorev, setWorkerAGorev] = useState(/** @type {any[]} */([]));
    const [workerBGorev, setWorkerBGorev] = useState(/** @type {any[]} */([]));
    const [workerADurum, setWorkerADurum] = useState('bekliyor');
    const [workerBDurum, setWorkerBDurum] = useState('bekliyor');
    const [workerATamamlanan, setWorkerATamamlanan] = useState(0);
    const [workerBTamamlanan, setWorkerBTamamlanan] = useState(0);
    const [workerAHata, setWorkerAHata] = useState(null);
    const [workerBHata, setWorkerBHata] = useState(null);
    const [mesaj, setMesaj] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);
    const [log, setLog] = useState(/** @type {any[]} */([]));

    const logEkle = (text, tip = 'info') => {
        setLog(prev => [{ text, tip, zaman: new Date().toLocaleTimeString('tr-TR') }, ...prev].slice(0, 20));
    };

    // ── ADIM 1: TARA ───────────────────────────────────────
    const tara = useCallback(async () => {
        setYukleniyor(true);
        setAsama('taraniyor');
        setGorevler([]);
        setDagitimSonucu(null);
        setDogrulamaSonucu(null);
        setWorkerAGorev([]); setWorkerBGorev([]);
        setWorkerADurum('bekliyor'); setWorkerBDurum('bekliyor');
        setWorkerATamamlanan(0); setWorkerBTamamlanan(0);
        setWorkerAHata(null); setWorkerBHata(null);
        setLog([]);
        logEkle('👑 Koordinatör başladı — tüm modüller taranıyor...');

        try {
            const res = await fetch('/api/ajan-orkestrator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mod: 'tara' }),
            });
            const data = await res.json();
            if (data.basarili) {
                setGorevler(data.gorevler || []);
                setMesaj(`✅ Tarama tamamlandı — ${data.toplam} görev tespit edildi`);
                logEkle(`✅ ${data.toplam} görev bulundu`, 'success');
            } else {
                setMesaj('❌ Tarama başarısız');
                logEkle('❌ Tarama hatası', 'error');
            }
        } catch (e) {
            setMesaj('❌ Bağlantı hatası: ' + e.message);
            logEkle('❌ ' + e.message, 'error');
        }
        setAsama('taramaTamam');
        setYukleniyor(false);
    }, []);

    // ── ADIM 2: DAĞIT ve ÇALIŞTIR ───────────────────────────
    const dagitVeCalistir = useCallback(async () => {
        if (gorevler.length === 0) return;
        setYukleniyor(true);
        setAsama('dagitiliyor');

        // Görevleri lokalde böl (UI gösterimi için)
        const kritikler = gorevler.filter(g => g.oncelik === 'kritik');
        const digerler = gorevler.filter(g => g.oncelik !== 'kritik');
        const aGorev = [...kritikler, ...digerler.slice(0, Math.ceil(digerler.length / 2))].map(g => ({ ...g, atanan: 'Worker_A' }));
        const bGorev = digerler.slice(Math.ceil(digerler.length / 2)).map(g => ({ ...g, atanan: 'Worker_B' }));
        setWorkerAGorev(aGorev);
        setWorkerBGorev(bGorev);
        setWorkerADurum('calisıyor');
        setWorkerBDurum('calisıyor');

        logEkle(`🤖 Worker A → ${aGorev.length} görev | Worker B → ${bGorev.length} görev`);

        try {
            const res = await fetch('/api/ajan-orkestrator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mod: 'dagit', gorevler }),
            });
            const data = await res.json();
            if (data.basarili) {
                setDagitimSonucu(data);

                const aTam = (data.workerA?.sonuc || []).filter(s => s.durum === 'ok').length;
                const bTam = (data.workerB?.sonuc || []).filter(s => s.durum === 'ok').length;
                setWorkerATamamlanan(aTam);
                setWorkerBTamamlanan(bTam);
                setWorkerADurum(data.workerA?.hata ? 'hata' : 'tamamlandi');
                setWorkerBDurum(data.workerB?.hata ? 'hata' : 'tamamlandi');
                if (data.workerA?.hata) setWorkerAHata(data.workerA.hata);
                if (data.workerB?.hata) setWorkerBHata(data.workerB.hata);

                setMesaj(`🚀 Dağıtım tamamlandı — A: ${aTam} ✅ | B: ${bTam} ✅`);
                logEkle(`✅ Worker A: ${aTam}/${aGorev.length} | Worker B: ${bTam}/${bGorev.length}`, 'success');
            } else {
                setWorkerADurum('hata'); setWorkerBDurum('hata');
                setMesaj('❌ Dağıtım hatası');
                logEkle('❌ Dağıtım başarısız', 'error');
            }
        } catch (e) {
            setWorkerADurum('hata'); setWorkerBDurum('hata');
            logEkle('❌ ' + e.message, 'error');
        }
        setAsama('dagitimTamam');
        setYukleniyor(false);
    }, [gorevler]);

    // ── ADIM 3: DOĞRULA ─────────────────────────────────────
    const dogrula = useCallback(async () => {
        if (!dagitimSonucu) return;
        setYukleniyor(true);
        setAsama('dogrulanıyor');
        logEkle('👑 Koordinatör doğruluyor...');

        try {
            const res = await fetch('/api/ajan-orkestrator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mod: 'dogrula', dagitim_sonucu: dagitimSonucu }),
            });
            const data = await res.json();
            if (data.basarili) {
                setDogrulamaSonucu(data);
                setMesaj(`✅ Doğrulama tamamlandı — ${data.istatistik?.toplam} görev, ${data.istatistik?.hata} hata`);
                logEkle(`✅ Tüm işlemler doğrulandı`, 'success');
            } else {
                setMesaj('❌ Doğrulama hatası');
                logEkle('❌ Doğrulama başarısız', 'error');
            }
        } catch (e) {
            logEkle('❌ ' + e.message, 'error');
        }
        setAsama('tamamlandi');
        setYukleniyor(false);
    }, [dagitimSonucu]);

    const sifirla = () => {
        setAsama('bekleme'); setGorevler([]); setDagitimSonucu(null);
        setDogrulamaSonucu(null); setMesaj(''); setLog([]);
        setWorkerAGorev([]); setWorkerBGorev([]);
        setWorkerADurum('bekliyor'); setWorkerBDurum('bekliyor');
        setWorkerATamamlanan(0); setWorkerBTamamlanan(0);
        setWorkerAHata(null); setWorkerBHata(null);
    };

    const asamaIndex = ASAMALAR.indexOf(asama.replace('Tamam', '').replace('Tamam', ''));

    return (
        <div style={{ fontFamily: 'inherit', padding: '1.5rem 0', color: 'white' }}>

            {/* BAŞLIK */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={22} color="white" />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>3-Worker Otonom Orkestrator</h2>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                        Koordinatör tarar → Worker A+B paralel çalışır → Doğrulama → Sistem güncellenir
                    </p>
                </div>
                <button onClick={sifirla} style={{ marginLeft: 'auto', background: '#1e2d3d', border: '1px solid #334155', color: '#94a3b8', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                    <RefreshCw size={14} /> Sıfırla
                </button>
            </div>

            {/* ADIM BAR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: '1.5rem', background: '#0d1117', padding: '12px 16px', borderRadius: 12, border: '1px solid #1e2d3d' }}>
                {[
                    { label: '1. Tara', icon: '🔍' },
                    { label: '2. Dağıt', icon: '⚡' },
                    { label: '3. Doğrula', icon: '✅' },
                ].map((step, i) => {
                    const aktif = asama === ['taraniyor', 'dagitiliyor', 'dogrulanıyor'][i];
                    const tamam = ['taramaTamam', 'dagitimTamam', 'tamamlandi'].slice(i).some(s => asama === s || asama === 'tamamlandi');
                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                            <div style={{
                                padding: '6px 12px', borderRadius: 8, flex: 1, textAlign: 'center',
                                background: tamam ? '#059669' : aktif ? '#7c3aed' : '#1e2d3d',
                                fontSize: '0.72rem', fontWeight: 800,
                                color: (tamam || aktif) ? 'white' : '#475569',
                                transition: 'all 0.3s',
                                boxShadow: aktif ? '0 0 12px #7c3aed60' : 'none',
                            }}>
                                {step.icon} {step.label}
                            </div>
                            {i < 2 && <ChevronRight size={14} color="#334155" style={{ flexShrink: 0 }} />}
                        </div>
                    );
                })}
            </div>

            {/* 3 WORKER KARTLARI */}
            <div style={{ display: 'flex', gap: 16, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {/* Koordinatör */}
                <div style={{
                    background: '#0d1117',
                    border: `2px solid ${asama.includes('taraniyor') || asama.includes('dogrulanıyor') ? '#7c3aed' : '#1e2d3d'}`,
                    borderRadius: 16, padding: '1.25rem', flex: 1, minWidth: 200,
                    boxShadow: (asama === 'taraniyor' || asama === 'dogrulanıyor') ? '0 0 20px #7c3aed30' : 'none',
                    transition: 'all 0.3s',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7c3aed20', border: '2px solid #7c3aed40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                            👑
                        </div>
                        <div>
                            <div style={{ fontWeight: 900, color: 'white', fontSize: '0.85rem' }}>Koordinatör (Ben)</div>
                            <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 700 }}>
                                {asama === 'taraniyor' ? '▶ Taranıyor' :
                                    asama === 'dogrulanıyor' ? '▶ Doğrulanıyor' :
                                        asama === 'tamamlandi' ? '✅ Tamamlandı' :
                                            asama === 'bekleme' ? 'Bekliyor' : '✅ Hazır'}
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>
                        {gorevler.length > 0 ? `${gorevler.length} görev tespit edildi` : 'Henüz taranmadı'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {['Tara', 'Dağıt', 'Doğrula'].map(m => (
                            <span key={m} style={{ background: '#1e2d3d', color: '#6366f1', padding: '2px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700 }}>
                                {m}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Worker A */}
                <WorkerKart
                    workerId="Worker A"
                    ikon="🤖"
                    renk="#f59e0b"
                    gorevler={workerAGorev}
                    tamamlanan={workerATamamlanan}
                    durum={workerADurum}
                    hata={workerAHata}
                />

                {/* Worker B */}
                <WorkerKart
                    workerId="Worker B"
                    ikon="🤖"
                    renk="#3b82f6"
                    gorevler={workerBGorev}
                    tamamlanan={workerBTamamlanan}
                    durum={workerBDurum}
                    hata={workerBHata}
                />
            </div>

            {/* AKSİYON BUTONLARI */}
            <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                    onClick={tara}
                    disabled={yukleniyor}
                    style={{
                        flex: 1, padding: '12px 20px', background: asama === 'taraniyor' ? '#1e2d3d' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        color: 'white', border: 'none', borderRadius: 12, fontWeight: 900, cursor: yukleniyor ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.875rem',
                        opacity: yukleniyor && asama !== 'taraniyor' ? 0.5 : 1,
                        boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                    }}
                >
                    {asama === 'taraniyor' ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Bot size={18} />}
                    {asama === 'taraniyor' ? 'Taranıyor...' : '🔍 Sistemei Tara'}
                </button>

                <button
                    onClick={dagitVeCalistir}
                    disabled={yukleniyor || gorevler.length === 0}
                    style={{
                        flex: 1, padding: '12px 20px',
                        background: gorevler.length === 0 ? '#1e2d3d' : 'linear-gradient(135deg, #d97706, #b45309)',
                        color: 'white', border: 'none', borderRadius: 12, fontWeight: 900,
                        cursor: (yukleniyor || gorevler.length === 0) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.875rem',
                        opacity: (yukleniyor || gorevler.length === 0) ? 0.5 : 1,
                        boxShadow: gorevler.length > 0 ? '0 4px 14px rgba(217,119,6,0.35)' : 'none',
                    }}
                >
                    {asama === 'dagitiliyor' ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={18} />}
                    {asama === 'dagitiliyor' ? 'Worker\'lar Çalışıyor...' : '🚀 Dağıt & Çalıştır'}
                </button>

                <button
                    onClick={dogrula}
                    disabled={yukleniyor || !dagitimSonucu}
                    style={{
                        flex: 1, padding: '12px 20px',
                        background: !dagitimSonucu ? '#1e2d3d' : 'linear-gradient(135deg, #059669, #047857)',
                        color: 'white', border: 'none', borderRadius: 12, fontWeight: 900,
                        cursor: (yukleniyor || !dagitimSonucu) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.875rem',
                        opacity: (yukleniyor || !dagitimSonucu) ? 0.5 : 1,
                        boxShadow: dagitimSonucu ? '0 4px 14px rgba(5,150,105,0.35)' : 'none',
                    }}
                >
                    {asama === 'dogrulanıyor' ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={18} />}
                    {asama === 'dogrulanıyor' ? 'Doğrulanıyor...' : '✅ Doğrula & Bitir'}
                </button>
            </div>

            {/* SONUÇ MESAJI */}
            {mesaj && (
                <div style={{
                    padding: '12px 16px', marginBottom: '1rem', borderRadius: 10,
                    background: mesaj.includes('❌') ? '#fef2f2' : '#ecfdf5',
                    border: `2px solid ${mesaj.includes('❌') ? '#fecaca' : '#a7f3d0'}`,
                    color: mesaj.includes('❌') ? '#b91c1c' : '#065f46',
                    fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    {mesaj.includes('❌') ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                    {mesaj}
                </div>
            )}

            {/* DOĞRULAMA ÖZET KUTUSU */}
            {dogrulamaSonucu && (
                <div style={{ background: '#0d1117', border: '2px solid #059669', borderRadius: 16, padding: '1.25rem', marginBottom: '1rem' }}>
                    <h4 style={{ margin: '0 0 8px', color: '#34d399', fontWeight: 900, fontSize: '0.875rem' }}>
                        ✅ Orkestrasyon Tamamlandı
                    </h4>
                    <pre style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                        {dogrulamaSonucu.ozet}
                    </pre>
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        {Object.entries(dogrulamaSonucu.istatistik || {}).map(([k, v]) => (
                            <div key={k} style={{ background: '#1e2d3d', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{k}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: k === 'hata' ? '#ef4444' : '#34d399' }}>{v}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CANLI LOG */}
            {log.length > 0 && (
                <div style={{ background: '#0d1117', border: '1px solid #1e2d3d', borderRadius: 12, padding: '1rem', maxHeight: 200, overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        📡 Canlı Log
                    </div>
                    {log.map((l, i) => (
                        <div key={i} style={{
                            fontSize: '0.72rem', padding: '3px 0', borderBottom: '1px solid #1e2d3d',
                            color: l.tip === 'error' ? '#f87171' : l.tip === 'success' ? '#34d399' : '#94a3b8',
                            fontFamily: 'monospace',
                        }}>
                            <span style={{ color: '#475569', marginRight: 8 }}>[{l.zaman}]</span>
                            {l.text}
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
