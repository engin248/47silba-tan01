/**
 * 47-SB Paylaşılan Yardımcı Fonksiyonlar
 * Tüm sayfalar buradan import eder — tek yerden güncellenir
 */

// ── MESAJ GÖSTERİCİ ─────────────────────────────────────────────────────────
/**
 * createGoster(setMesaj) → goster(text, type)
 * Kullanım: const goster = createGoster(setMesaj);
 */
export const createGoster = (setMesaj, timeout = 5000) =>
    (text, type = 'success') => {
        setMesaj({ text, type });
        setTimeout(() => setMesaj({ text: '', type: '' }), timeout);
    };

// ── TELEGRAM BİLDİRİM ────────────────────────────────────────────────────────
/**
 * Kullanım: telegramBildirim('Mesaj metni');
 */
export const telegramBildirim = (mesaj) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    fetch('/api/telegram-bildirim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesaj }),
        signal: ctrl.signal,
    })
        .finally(() => clearTimeout(t))
        .catch(() => null);
};

// ── TARİH FORMATLAYICI ────────────────────────────────────────────────────────
/**
 * Kullanım: formatTarih('2026-03-10T08:00:00Z') → '10.03.2026 11:00'
 */
export const formatTarih = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return (
        d.toLocaleDateString('tr-TR') +
        ' ' +
        d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    );
};

// ── YETKİ KONTROLÜ YARDIMCISI ─────────────────────────────────────────────────
/**
 * Üretim veya tam yetkisi olup olmadığını kontrol eder
 * Kullanım: const yetkili = yetkiKontrol(kullanici);
 */
export const yetkiKontrol = (kullanici) => {
    if (kullanici?.grup === 'tam') return true;
    try {
        return !!atob(sessionStorage.getItem('sb47_uretim_pin') || '');
    } catch {
        return !!sessionStorage.getItem('sb47_uretim_pin');
    }
};

// ── SAYISAL FORMAT ────────────────────────────────────────────────────────────
/**
 * Kullanım: paraCevir(1234.5) → '1.234,50 ₺'
 */
export const paraCevir = (sayi, para = '₺') => {
    if (sayi === null || sayi === undefined) return `0,00 ${para}`;
    return parseFloat(sayi).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }) + ` ${para}`;
};

// ── KARAKTERSİNİRİ KISALTICI ─────────────────────────────────────────────────
/**
 * Kullanım: kisalt('Uzun metin...', 50)
 */
export const kisalt = (str, max = 80) => {
    if (!str) return '';
    return str.length > max ? str.substring(0, max) + '…' : str;
};
