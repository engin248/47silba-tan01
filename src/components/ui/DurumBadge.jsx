'use client';
/**
 * components/ui/DurumBadge.jsx
 * FAZ 4 Shared UI — Durum rozeti (Status Badge)
 *
 * Props:
 *   durum    – string key (örn: 'pending', 'in_progress', 'completed', 'cancelled')
 *   renkMap  – { [durum]: '#hexcolor' } — opsiyonel, default renkler kullanılır
 *   etiketMap– { [durum]: 'Türkçe Etiket' } — opsiyonel, default etiketler kullanılır
 *   kucuk    – boolean, daha küçük boyut (default: false)
 */

const VARSAYILAN_RENKLER = {
    pending: '#d97706',
    in_progress: '#2563eb',
    completed: '#059669',
    cancelled: '#dc2626',
    aktif: '#059669',
    pasif: '#6b7280',
    bekliyor: '#d97706',
    taslak: '#7c3aed',
    onaylandi: '#047857',
    red: '#dc2626',
};

const VARSAYILAN_ETIKETLER = {
    pending: '⏳ Bekliyor',
    in_progress: '⚡ Üretimde',
    completed: '✅ Tamamlandı',
    cancelled: '❌ İptal',
    aktif: '✅ Aktif',
    pasif: '⛔ Pasif',
    bekliyor: '⏳ Bekliyor',
    taslak: '📝 Taslak',
    onaylandi: '✅ Onaylı',
    red: '❌ Reddedildi',
};

export default function DurumBadge({ durum, renkMap = {}, etiketMap = {}, kucuk = false }) {
    const renkler = { ...VARSAYILAN_RENKLER, ...renkMap };
    const etiketler = { ...VARSAYILAN_ETIKETLER, ...etiketMap };

    const renk = renkler[durum] || '#6b7280';
    const etiket = etiketler[durum] || durum;

    return (
        <span style={{
            display: 'inline-block',
            fontSize: kucuk ? '0.62rem' : '0.68rem',
            padding: kucuk ? '1px 6px' : '2px 8px',
            borderRadius: 4,
            fontWeight: 700,
            background: `${renk}20`,
            color: renk,
            border: `1px solid ${renk}40`,
            lineHeight: 1.5,
            whiteSpace: 'nowrap',
        }}>
            {etiket}
        </span>
    );
}
