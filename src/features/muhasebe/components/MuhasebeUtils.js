export function birimMaliyet(r) {
    const net = parseInt(r.net_uretilen_adet) || 0;
    if (net === 0) return '—';
    return (parseFloat(r.gerceklesen_maliyet_tl) / net).toFixed(4);
}

export function asimPct(r) {
    const h = parseFloat(r.hedeflenen_maliyet_tl);
    if (!h) return 0;
    return (((parseFloat(r.gerceklesen_maliyet_tl) - h) / h) * 100).toFixed(1);
}

export const DURUM_RENK = { taslak: '#94a3b8', sef_onay_bekliyor: '#f59e0b', onaylandi: '#10b981', kilitlendi: '#0f172a' };
export const DURUM_LABEL = { taslak: '📄 Taslak', sef_onay_bekliyor: '⏳ Şef Onayı', onaylandi: '✅ Onaylı', kilitlendi: '🔒 Kilitli' };
export const MALIYET_LABEL = { personel_iscilik: '👷 Personel', isletme_gideri: '🏭 İşletme', sarf_malzeme: '🧵 Sarf', fire_kaybi: '🔥 Fire' };

