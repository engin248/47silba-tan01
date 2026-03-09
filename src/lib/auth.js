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
// Client-side PIN'ler ARTIK BU DOSYADA YOK — /api/pin-dogrula endpoint'i kullanılır
export function pindenGrupBul(pin) {
    if (!pin) return null;
    const p = pin.trim();

    // Dinamik PIN'ler (Koordinatör tarafından Karargah'tan atananlar)
    if (typeof window !== 'undefined') {
        const dinamikUretim = localStorage.getItem('sb47_uretim_pin');
        if (dinamikUretim && dinamikUretim === p) return 'uretim';

        const dinamikGenel = localStorage.getItem('sb47_genel_pin');
        if (dinamikGenel && dinamikGenel === p) return 'genel';
    }

    // PIN doğrulaması artık /api/pin-dogrula endpoint'i üzerinden yapılır
    // Bu fonksiyon sadece dinamik PIN eşleşmesi için kullanılır
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
};

// ─── AUTH CONTEXT ─────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [kullanici, setKullanici] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);

    useEffect(() => {
        try {
            const kayit = localStorage.getItem('sb47_auth');
            if (kayit) {
                const parsed = JSON.parse(kayit);
                // 8 saatlik oturum
                if (parsed.zaman && Date.now() - parsed.zaman < 8 * 60 * 60 * 1000) {
                    setKullanici(parsed);
                } else {
                    localStorage.removeItem('sb47_auth');
                }
            }
        } catch { localStorage.removeItem('sb47_auth'); }
        setYukleniyor(false);
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
                const veri = await res.json();
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
                localStorage.setItem('sb47_kilit', JSON.stringify({ kilitBitisTarihi: Date.now() + 30 * 1000 }));
                localStorage.setItem('sb47_yanlis_pin', JSON.stringify({ sayi: 0 }));
                return { basarili: false, mesaj: 'Çok fazla hatalı deneme! 30 saniye kilitlendikten sonra tekrar deneyin.' };
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

        // Cookie'ye de yaz (middleware katmanı için)
        const cookieValue = encodeURIComponent(JSON.stringify(kayit));
        document.cookie = `sb47_auth_session=${cookieValue}; path=/; max-age=${8 * 60 * 60}; SameSite=Strict`;

        // Middleware için grup bazlı ek cookie'ler
        if (grup === 'uretim') {
            document.cookie = `sb47_uretim_pin=1; path=/; max-age=${8 * 60 * 60}; SameSite=Strict`;
        } else if (grup === 'genel') {
            document.cookie = `sb47_genel_pin=1; path=/; max-age=${8 * 60 * 60}; SameSite=Strict`;
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
        document.cookie = 'sb47_auth_session=; path=/; max-age=0; SameSite=Strict';
        document.cookie = 'sb47_uretim_pin=; path=/; max-age=0; SameSite=Strict';
        document.cookie = 'sb47_genel_pin=; path=/; max-age=0; SameSite=Strict';
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
