'use client';
import { createContext, useContext, useState, useEffect } from 'react';

// ─── ERİŞİM GRUPLARI ──────────────────────────────────────────
// PIN'ler artık .env.local içinde COORDINATOR_PIN, URETIM_PIN, GENEL_PIN
// olarak saklanır. Bu dosyada ASLA düz metin PIN bulunmaz.
export const ERISIM_GRUPLARI = {
    tam: {
        label: 'Sistem',
        gosterge: '🔑',
    },
    uretim: {
        label: 'Üretim',
        gosterge: '⚙️',
    },
    genel: {
        label: 'Genel',
        gosterge: '👤',
    },
};

// PIN → Grup eşleştirmesi (server-side API'ye delege edilir)
// ─── MİMARİ DÜZELTME: localStorage bypass kaldırıldı ───────────────────
// ESKİ: localStorage.getItem('sb47_uretim_token') === 'true' → yetki verilişi
// BU KATİYEN YANLIŞTI: Tarayıcı konsolundan localStorage.setItem('sb47_uretim_token','true')
// yazan herkes üretim yetkisi kazanıyordu. Artık bu fonksiyon sadece null döndürür.
// Gerçek yetki kaynağı: /api/pin-dogrula → JWT token → middleware dogrulama.
export function pindenGrupBul(pin) {
    if (!pin) return null;
    // Yetki belirleme tamamen server-side — client bu işi yapamaz
    return null;
}

// ─── SAYFA ERİŞİM MATRİSİ ────────────────────────────────────
export const ERISIM_MATRISI = {
    '/': { tam: 'full', uretim: 'read', genel: 'read' },
    '/ajanlar': { tam: 'full', uretim: null, genel: null },   // SADECE KOORDİNATÖR
    '/arge': { tam: 'full', uretim: 'full', genel: 'read' },
    '/kumas': { tam: 'full', uretim: 'full', genel: 'read' },
    '/kalip': { tam: 'full', uretim: 'full', genel: 'read' },
    '/modelhane': { tam: 'full', uretim: 'full', genel: 'read' },
    '/kesim': { tam: 'full', uretim: 'full', genel: 'read' },
    '/uretim': { tam: 'full', uretim: 'full', genel: 'read' },
    '/maliyet': { tam: 'full', uretim: 'read', genel: 'read' },
    '/muhasebe': { tam: 'full', uretim: 'read', genel: 'read' },
    '/katalog': { tam: 'full', uretim: 'full', genel: 'read' },
    '/siparisler': { tam: 'full', uretim: 'full', genel: 'read' },
    '/stok': { tam: 'full', uretim: 'full', genel: 'read' },
    '/kasa': { tam: 'full', uretim: null, genel: null },
    '/musteriler': { tam: 'full', uretim: 'full', genel: 'read' },
    '/personel': { tam: 'full', uretim: 'read', genel: 'read' },
    '/guvenlik': { tam: 'full', uretim: null, genel: null },
    '/raporlar': { tam: 'full', uretim: 'read', genel: 'read' },
    '/denetmen': { tam: 'full', uretim: null, genel: null },
    '/ayarlar': { tam: 'full', uretim: null, genel: null },
    '/gorevler': { tam: 'full', uretim: 'full', genel: 'read' },
    '/kameralar': { tam: 'full', uretim: 'full', genel: 'read' },
    '/tasarim': { tam: 'full', uretim: null, genel: null },
    '/haberlesme': { tam: 'full', uretim: 'full', genel: 'read' },  // YENİ: Haberleşme modülü erişim tanımı eklendi

};

// ─── AUTH CONTEXT ─────────────────────────────────────────────
/** @type {any} */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    /** @type {[any, any]} */
    const [kullanici, setKullanici] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);

    useEffect(() => {
        try {
            const kayit = localStorage.getItem('sb47_auth');
            if (kayit) {
                const parsed = JSON.parse(kayit);
                if (parsed.zaman && Date.now() - parsed.zaman < 8 * 60 * 60 * 1000) {
                    setKullanici(parsed);
                    if (typeof window !== 'undefined') {
                        if (parsed.grup === 'tam') {
                            sessionStorage.setItem('sb47_uretim_token', 'true');
                            sessionStorage.setItem('sb47_genel_token', 'true');
                        } else if (parsed.grup === 'uretim') {
                            sessionStorage.setItem('sb47_uretim_token', 'true');
                        } else if (parsed.grup === 'genel') {
                            sessionStorage.setItem('sb47_genel_token', 'true');
                        }
                    }
                } else {
                    localStorage.removeItem('sb47_auth');
                }
            }
        } catch (err) {
            console.error('Auth yükleme hatası:', err);
            try { localStorage.removeItem('sb47_auth'); } catch (e) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: auth.js | Hata:', e ? e.message || e : 'Bilinmiyor'); }
        } finally {
            setYukleniyor(false);
        }
    }, []);

    const girisYap = async (pin) => {
        // ─── BRUTE FORCE KORUMASI ─────────────────────────────────────────
        const kilit = JSON.parse(localStorage.getItem('sb47_kilit') || 'null');
        if (kilit && Date.now() < kilit.kilitBitisTarihi) {
            const kalanSn = Math.ceil((kilit.kilitBitisTarihi - Date.now()) / 1000);
            return { basarili: false, mesaj: `${kalanSn} saniye bekleyin. (Çok fazla hatalı giriş)` };
        }

        // ─── SERVER-SIDE PIN DOĞRULAMA ────────────────────────────────────
        let grup = null;
        let veri = null; // B-01 FIX: try dışında tanımla — scope hatası giderildi
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const res = await fetch('/api/pin-dogrula', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pin.trim() }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (res.ok) {
                veri = await res.json(); // artık dış scope'a atanıyor
                grup = veri.grup || null;
            }
        } catch {
            // Server ulaşılamaz — dinamik PIN fallback
            grup = pindenGrupBul(pin);
        }

        if (!grup) {
            // Başarısız giriş sayıcısı
            const deneme = JSON.parse(localStorage.getItem('sb47_yanlis_pin') || '{"sayi":0}');
            const yeniSayi = deneme.sayi + 1;
            if (yeniSayi >= 5) {
                localStorage.setItem('sb47_kilit', JSON.stringify({ kilitBitisTarihi: Date.now() + 15 * 60 * 1000 }));
                localStorage.setItem('sb47_yanlis_pin', JSON.stringify({ sayi: 0 }));
                return { basarili: false, mesaj: 'Çok fazla hatalı deneme! 15 dakika kilitlendikten sonra tekrar deneyin.' };
            } else {
                localStorage.setItem('sb47_yanlis_pin', JSON.stringify({ sayi: yeniSayi }));
            }
            return false;
        }

        // Başarılı giriş — sayaçları sıfırla
        localStorage.removeItem('sb47_yanlis_pin');
        localStorage.removeItem('sb47_kilit');

        const bilgi = ERISIM_GRUPLARI[grup];
        const kayit = { grup, label: bilgi.label, gosterge: bilgi.gosterge, zaman: Date.now() };
        setKullanici(kayit);
        localStorage.setItem('sb47_auth', JSON.stringify(kayit));

        // ─── GÜVENLİK YAMASI: Cookie atama artık SERVER-SIDE (pin-dogrula route) ───
        // ESKİ: document.cookie ile JWT ve session cookie'leri atanıyordu
        //        → HttpOnly flag'i yoktu → XSS saldırısında JS ile çalınabilirdi
        // YENİ: /api/pin-dogrula response'u Set-Cookie header ile atar
        //        → HttpOnly + Secure + SameSite=Strict → JS ERİŞEMEZ
        // Client-side sadece localStorage'a UI bilgisini yazar.

        // Session Storage — UI tarafı için (güvenlik kritik değil, sadece menü visibility)
        if (typeof window !== 'undefined') {
            if (grup === 'tam') {
                sessionStorage.setItem('sb47_uretim_token', 'true');
                sessionStorage.setItem('sb47_genel_token', 'true');
            } else if (grup === 'uretim') {
                sessionStorage.setItem('sb47_uretim_token', 'true');
            } else if (grup === 'genel') {
                sessionStorage.setItem('sb47_genel_token', 'true');
            }
        }

        const loglar = JSON.parse(localStorage.getItem('sb47_giris_log') || '[]');
        loglar.unshift({ grup, saat: new Date().toISOString(), islem: 'giris' });
        localStorage.setItem('sb47_giris_log', JSON.stringify(loglar.slice(0, 50)));
        return true;
    };

    const cikisYap = () => {
        if (kullanici) {
            const loglar = JSON.parse(localStorage.getItem('sb47_giris_log') || '[]');
            loglar.unshift({ grup: kullanici.grup, saat: new Date().toISOString(), islem: 'cikis' });
            localStorage.setItem('sb47_giris_log', JSON.stringify(loglar.slice(0, 50)));
        }
        setKullanici(null);
        localStorage.removeItem('sb47_auth');
        sessionStorage.removeItem('sb47_uretim_token');
        sessionStorage.removeItem('sb47_genel_token');

        // ─── Server-side HttpOnly cookie temizleme ───
        // HttpOnly cookie'ler JS ile silinemez → /api/cikis endpoint'i expire eder
        fetch('/api/cikis', { method: 'POST' }).catch(() => { });
    };

    const sayfaErisim = (href) => {
        if (!kullanici) return null;
        const matris = ERISIM_MATRISI[href];
        if (!matris) return 'read';
        return matris[kullanici.grup] || null;
    };

    return (
        <AuthContext.Provider value={{ kullanici, yukleniyor, girisYap, cikisYap, sayfaErisim }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
