'use client';
// @ts-nocheck
import { useState } from 'react';
import { CheckCircle2, Lock, ArrowRight, Loader2 } from 'lucide-react';

/**
 * M2_FizikselMuhendislikFormu.js
 * Modalistin fiziksel numuneden yola çıkarak doldurması zorunlu form.
 * DUVAR 2: Tüm alanlar dolmadan M3 (Finans/Satınalma) butonu açılmaz.
 */
const BOSH_FORM = {
    gercek_kumas: '',
    gercek_gramaj: '',
    fire_orani: '',
    zorluk_derecesi: 5,
    ek_notlar: '',
    // [MH-01] Metraj hesabı
    urun_eni_cm: '150',  // kumaş eni (cm) — standart 150cm
    urun_boyu_cm: '',    // ürün boyu (cm)
    model_adeti: '1',    // kaç adet üretilecek
};

// [MH-01] Metraj Hesap Formülü
// Net metraj = (ürün boyu cm / 100) * (1 + fire/100) * adet
// SAM tahmini = zorluk_derecesi * 8 dakika (empirik)
function metrajHesapla(form) {
    const boy = parseFloat(form.urun_boyu_cm) || 0;
    const fire = parseFloat(form.fire_orani) || 0;
    const adet = parseInt(form.model_adeti) || 1;
    if (boy <= 0) return null;
    const netMetraj = ((boy / 100) * (1 + fire / 100) * adet).toFixed(2);
    const toplamKg = (parseFloat(netMetraj) * (parseFloat(form.urun_eni_cm) / 100) * (parseFloat(form.gercek_gramaj) || 0) / 1000).toFixed(2);
    const sam = (parseFloat(form.zorluk_derecesi) * 8).toFixed(0);
    return { netMetraj, toplamKg, sam };
}


export default function M2_FizikselMuhendislikFormu({ onKaydet, islemde }) {
    const [form, setForm] = useState(BOSH_FORM);
    const [hatalar, setHatalar] = useState({});

    const zorunluDolu = form.gercek_kumas.trim() && form.gercek_gramaj && form.fire_orani;

    const validasyon = () => {
        const h = {};
        if (!form.gercek_kumas.trim()) h.gercek_kumas = 'Gerçek kumaş cinsi zorunlu';
        if (!form.gercek_gramaj) h.gercek_gramaj = 'Gramaj zorunlu';
        if (!form.fire_orani) h.fire_orani = 'Fire oranı zorunlu';
        if (form.gercek_gramaj && (form.gercek_gramaj < 50 || form.gercek_gramaj > 800)) h.gercek_gramaj = 'Geçerli gramaj: 50-800';
        if (form.fire_orani && (form.fire_orani < 0 || form.fire_orani > 50)) h.fire_orani = 'Fire oranı: 0-50%';
        setHatalar(h);
        return Object.keys(h).length === 0;
    };

    const handleKaydet = () => {
        if (!validasyon()) return;
        onKaydet(form);
    };

    const inputStil = (hata) => ({
        width: '100%',
        padding: '10px 14px',
        border: `2px solid ${hata ? '#ef4444' : '#e2e8f0'}`,
        borderRadius: 8,
        fontSize: '0.875rem',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        outline: 'none',
        background: hata ? '#fef2f2' : 'white',
    });

    return (
        <div style={{
            background: 'white',
            border: '2px solid #d1fae5',
            borderRadius: 16,
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #047857, #065f46)',
                padding: '0.875rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <CheckCircle2 size={16} color="white" />
                <div>
                    <div style={{ color: 'white', fontWeight: 900, fontSize: '0.85rem' }}>
                        🧱 DUVAR 2 — Fiziksel Mühendislik Formu (Zorunlu)
                    </div>
                    <div style={{ color: '#a7f3d0', fontSize: '0.65rem', fontWeight: 600 }}>
                        AI tahminine değil, elinizde tuttuğunuz numuneye bakarak doldurun
                    </div>
                </div>
            </div>

            <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                    {/* 1. Gerçek Kumaş Cinsi */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                            1. Gerçek Kumaş Cinsi <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            value={form.gercek_kumas}
                            onChange={(e) => setForm({ ...form, gercek_kumas: e.target.value })}
                            placeholder="Örn: %100 Pamuk Poplin, Viskon Keten Karışım..."
                            style={inputStil(hatalar.gercek_kumas)}
                            onFocus={(e) => e.target.style.borderColor = '#047857'}
                            onBlur={(e) => e.target.style.borderColor = hatalar.gercek_kumas ? '#ef4444' : '#e2e8f0'}
                        />
                        {hatalar.gercek_kumas && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: 3, fontWeight: 700 }}>{hatalar.gercek_kumas}</div>}
                    </div>

                    {/* 2. Gerçek Gramaj */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                            2. Gramaj (gr/m²) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="number"
                            value={form.gercek_gramaj}
                            onChange={(e) => setForm({ ...form, gercek_gramaj: e.target.value })}
                            placeholder="Örn: 135"
                            min="50" max="800"
                            style={inputStil(hatalar.gercek_gramaj)}
                        />
                        {hatalar.gercek_gramaj && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: 3, fontWeight: 700 }}>{hatalar.gercek_gramaj}</div>}
                    </div>

                    {/* 3. Fire Oranı */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                            3. Fire Oranı (%) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="number"
                            value={form.fire_orani}
                            onChange={(e) => setForm({ ...form, fire_orani: e.target.value })}
                            placeholder="Örn: 8"
                            min="0" max="50" step="0.5"
                            style={inputStil(hatalar.fire_orani)}
                        />
                        {hatalar.fire_orani && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: 3, fontWeight: 700 }}>{hatalar.fire_orani}</div>}
                    </div>

                    {/* 4. Zorluk Derecesi */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                            <span>4. Dikim Zorluk Derecesi</span>
                            <span style={{ color: form.zorluk_derecesi >= 8 ? '#ef4444' : '#047857', fontWeight: 900 }}>{form.zorluk_derecesi}/10</span>
                        </label>
                        <input
                            type="range" min="1" max="10"
                            value={form.zorluk_derecesi}
                            onChange={(e) => setForm({ ...form, zorluk_derecesi: parseInt(e.target.value) })}
                            style={{ width: '100%', accentColor: form.zorluk_derecesi >= 8 ? '#ef4444' : '#047857' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#9ca3af', marginTop: 2 }}>
                            <span>Çok Kolay</span><span>Çok Zor</span>
                        </div>
                    </div>

                    {/* 5. Ek Notlar */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>
                            5. Modelane Notu (İsteğe Bağlı)
                        </label>
                        <textarea
                            value={form.ek_notlar}
                            onChange={(e) => setForm({ ...form, ek_notlar: e.target.value })}
                            placeholder="Özel dikkat gerektiren noktalar, kalıp notu..."
                            rows={3}
                            style={{ ...inputStil(false), resize: 'vertical', fontFamily: 'inherit' }}
                        />
                    </div>

                    {/* [MH-01] Metraj Hesabı */}
                    <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 10, padding: '1rem', marginTop: 4 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#047857', marginBottom: 10, textTransform: 'uppercase' }}>
                            📏 MH-01 — Metraj & SAM Hesabı (Otomatik)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#065f46', marginBottom: 4 }}>Ürün Boyu (cm) *</label>
                                <input type="number" min="30" max="200" value={form.urun_boyu_cm}
                                    onChange={e => setForm({ ...form, urun_boyu_cm: e.target.value })}
                                    placeholder="Örn: 90" style={{ ...inputStil(false), border: '1.5px solid #6ee7b7' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#065f46', marginBottom: 4 }}>Kumaş Eni (cm)</label>
                                <input type="number" min="90" max="300" value={form.urun_eni_cm}
                                    onChange={e => setForm({ ...form, urun_eni_cm: e.target.value })}
                                    placeholder="150" style={{ ...inputStil(false), border: '1.5px solid #6ee7b7' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#065f46', marginBottom: 4 }}>Üretim Adeti</label>
                                <input type="number" min="1" value={form.model_adeti}
                                    onChange={e => setForm({ ...form, model_adeti: e.target.value })}
                                    placeholder="1" style={{ ...inputStil(false), border: '1.5px solid #6ee7b7' }} />
                            </div>
                        </div>
                        {(() => {
                            const h = metrajHesapla(form);
                            if (!h) return <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 8 }}>Ürün boyunu girin → Metraj otomatik hesaplanır</div>;
                            return (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
                                    <div style={{ background: '#047857', color: 'white', borderRadius: 8, padding: '0.625rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.8 }}>NET METRAJ</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{h.netMetraj} m</div>
                                    </div>
                                    <div style={{ background: '#1d4ed8', color: 'white', borderRadius: 8, padding: '0.625rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.8 }}>TOPLAM KG</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{h.toplamKg} kg</div>
                                    </div>
                                    <div style={{ background: '#7c3aed', color: 'white', borderRadius: 8, padding: '0.625rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.8 }}>SAM (dk/adet)</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{h.sam} dk</div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>


                    {/* DUVAR 3 — Kilidi Aç Butonu */}
                    <div style={{ marginTop: '1.25rem', borderTop: '2px dashed #d1fae5', paddingTop: '1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: 8 }}>
                            🧱 DUVAR 3 — M3 (Finans/Satınalma) Kapısı
                        </div>
                        <button
                            onClick={handleKaydet}
                            disabled={!zorunluDolu || islemde}
                            style={{
                                width: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                background: zorunluDolu && !islemde ? '#047857' : '#e2e8f0',
                                color: zorunluDolu && !islemde ? 'white' : '#94a3b8',
                                border: 'none',
                                padding: '12px 20px',
                                borderRadius: 10,
                                fontWeight: 900,
                                fontSize: '0.875rem',
                                cursor: zorunluDolu && !islemde ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                            }}
                        >
                            {islemde ? (
                                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> İşleniyor...</>
                            ) : zorunluDolu ? (
                                <><CheckCircle2 size={16} /> Kilidi Aç — M3'e (Finans/Satınalma) Gönder <ArrowRight size={14} /></>
                            ) : (
                                <><Lock size={16} /> Tüm Zorunlu Alanları Doldurun</>
                            )}
                        </button>
                        {!zorunluDolu && (
                            <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 6, textAlign: 'center', fontWeight: 600 }}>
                                Kumaş Cinsi + Gramaj + Fire Oranı zorunludur
                            </p>
                        )}
                    </div>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
            );
}
