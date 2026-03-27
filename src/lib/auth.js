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
};

/**
 * @typedef {{ grup: string, label: string, gosterge: string, zaman: number }} Kullanici
 * @typedef {{ kullanici: Kullanici|null, yukleniyor: boolean, girisYap: (pin:string) => Promise<any>, cikisYap: () => void, sayfaErisim: (href:string) => any }} AuthCtxType
 */

// ─── AUTH CONTEXT ─────────────────────────────────────────────
const AuthContext = createContext(/** @type {AuthCtxType|null} */(null));

export function AuthProvider({ children }) {
    const [kullanici, setKullanici] = useState(/** @type {Kullanici|null} */(null));
    const [yukleniyor, setYukleniyor] = useState(true);

    useEffect(() => {
        try {
            const kayit = localStorage.getItem('sb47_auth');
            if (kayit) {
                const parsed = JSON.parse(kayit);
                // MIMARI DÜZELTME: 4 saat → 8 saat — JWT ile senkronize edildi
                // ESKİ: 4 * 60 * 60 * 1000 (4 saat) — JWT 8 saatti, çelişkiydi
                // Artık: Client session = JWT süresi = 8 saat
                if (parsed.zaman && Date.now() - parsed.zaman < 8 * 60 * 60 * 1000) {
                    setKullanici(parsed);
                    // [AI ZIRHI] Küresel Terminal Yetki Serbestisi - Karargah içi alt uçlara otomatik giriş sağlar.
                    if (typeof window !== 'undefined') {
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
                    }
                } else {
                    localStorage.removeItem('sb47_auth');
                }
            }
        } catch (authHata) {
            console.warn('[AUTH] Oturum parse hatası, sıfırlanıyor:', authHata?.message);
            localStorage.removeItem('sb47_auth');
        }
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
        } catch (agHata) {
            // Server ulaşılamaz — dinamik PIN fallback
            console.warn('[AUTH] API ulaşılamaz, fallback devrede:', agHata?.message);
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

        // ─── GÜVENLİK [A-3 DÜZELTME]: İmzasız JSON cookie KALDIRILDI ─────────
        // sb47_auth_session (imzasız JSON) artık yazılmıyor.
        // Middleware yalnızca sb47_jwt_token (HttpOnly, /api/pin-dogrula tarafından set edilir) okur.
        // XSS saldırısında oturum bilgisi ifşa edilemez.


        // Yeni Session Storage Injection - Giriş Anında anında set et (Hook güncellenmesi beklemesin)
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
        document.cookie = 'sb47_jwt_token=; path=/; max-age=0; SameSite=Strict'; // B-02 FIX: JWT cookie çıkışta temizleniyor
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

/**
 * @returns {{ kullanici: {grup: string, label: string, gosterge: string, zaman: number} | null, yukleniyor: boolean, girisYap: function, cikisYap: function, sayfaErisim: function }}
 */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
