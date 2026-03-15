'use client';
/**
 * components/ui/SayfaBasligi.js
 * FAZ 4 Shared UI — Tüm sayfaların ortak başlık bileşeni
 * [FIX] renkler undefined geldiğinde TypeError: Cannot read '.bg' of undefined — ENGELLENDİ
 */
/**
 * @param {Object} props
 * @param {any} [props.ikon]
 * @param {any} [props.icon]
 * @param {any} [props.renkler]
 * @param {any} [props.iconColor]
 * @param {any} [props.iconColor2]
 * @param {any} [props.baslik]
 * @param {any} [props.altBaslik]
 * @param {any} [props.altbaslik]
 * @param {any} [props.islemler]
 * @param {any} [props.islemButonlari]
 * @param {any} [props.sagIcerik]
 */
export default function SayfaBasligi({
    ikon: Ikon,
    icon = null,
    renkler = {},
    iconColor = '#047857',
    iconColor2 = '#065f46',
    baslik = '',
    altBaslik = null,
    altbaslik = null,
    islemler = null,
    islemButonlari = null,
    sagIcerik = null,
}) {
    // icon prop'u React element olabilir (örn: <Factory size={24} color="white" />)
    // ikon prop'u ise component type olabilir (eski kullanım)
    const ikonArkaplan = (/** @type {any} */ (renkler))?.bg
        || (iconColor ? `linear-gradient(135deg,${iconColor},${iconColor2})` : 'linear-gradient(135deg,#047857,#065f46)');

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, background: ikonArkaplan, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {/* icon: React element (yeni kullanım) */}
                    {icon && icon}
                    {/* ikon: Component type (eski kullanım) */}
                    {Ikon && !icon && <Ikon size={24} color={(/** @type {any} */ (renkler))?.ikon || 'white'} />}
                </div>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{baslik}</h1>
                    {(altBaslik || altbaslik) && (
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>{altBaslik || altbaslik}</p>
                    )}
                </div>
            </div>
            {(islemler || islemButonlari || sagIcerik) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {islemler || islemButonlari || sagIcerik}
                </div>
            )}
        </div>
    );
}
