'use client';
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
};

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
