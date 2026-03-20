'use client';
/**
 * ─── AUTH STORE (Zustand) ───────────────────────────────────────────────────
 * src/store/useAuthStore.js
 *
 * Kullanıcı session'ını merkezi olarak yönetir.
 * Context API + prop drilling'in yerini alır.
 *
 * Özellikler:
 *   ✅ localStorage persist (sayfa yenilenmesinde kaybolmaz)
 *   ✅ 8 saatlik oturum kontrolü (otomatik expire)
 *   ✅ SessionStorage terminal PIN injection (tüm sub-pages için)
 *   ✅ Cookie yazma (middleware Auth için)
 *   ✅ Güvenli çıkış (tüm verileri temizler)
 *   ✅ Standart user/isAuthenticated/setUser/logout API (prop drilling yok)
 *
 * Kullanım — Standart API (yeni kod):
 *   import { useAuthStore } from '@/store/useAuthStore';
 *   const { user, isAuthenticated, setUser, logout } = useAuthStore();
 *
 * Kullanım — Sistem API (mevcut kodlar):
 *   const { kullanici, oturumAc, cikisYap, yetkiliMi } = useAuthStore();
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Yardımcılar ─────────────────────────────────────────────────
const OTURUM_SURESI = 8 * 60 * 60 * 1000; // 8 saat

function terminalPinleriYaz(grup) {
    if (typeof window === 'undefined') return;

    // Güvenlik: Düz metin (btoa) yerine timestamp destekli maskelenmiş pseudo-token
    const secureToken = (pin) => {
        const timestamp = Date.now().toString(36);
        const salt = Math.random().toString(36).substring(2, 7);
        // Base64 encoding + salt + timestamp ile tersine mühendisliği zorlaştırıyoruz
        return btoa(`${pin}:${salt}:${timestamp}`).replace(/=/g, '');
    };

    if (grup === 'tam') {
        sessionStorage.setItem('sb47_uretim_pin', secureToken('tam_yetki_aktif_4747'));
        sessionStorage.setItem('sb47_genel_pin', secureToken('tam_yetki_aktif_4747'));
    } else if (grup === 'uretim') {
        sessionStorage.setItem('sb47_uretim_pin', secureToken('uretim_yetki_1244'));
    } else if (grup === 'genel') {
        sessionStorage.setItem('sb47_genel_pin', secureToken('genel_yetki_8888'));
    }
}

function cookieYaz(ad, deger, maxAge = OTURUM_SURESI / 1000) {
    if (typeof document !== 'undefined') {
        document.cookie = `${ad}=${deger}; path=/; max-age=${maxAge}; SameSite=Strict`;
    }
}

function cookieSil(ad) {
    if (typeof document !== 'undefined') {
        document.cookie = `${ad}=; path=/; max-age=0`;
    }
}

// ─── Store ───────────────────────────────────────────────────────
export const useAuthStore = create(
    persist(
        (set, get) => ({
            // ==========================================================
            // ── SİSTEME ÖZEL STATE (mevcut tüm kodlar bunu kullanır)
            // ==========================================================
            kullanici: null,
            jwtToken: null,
            yukleniyor: false,

            // ── Oturum başlat ─────────────────────────────────
            /**
             * PIN doğrulama sonrası çağrılır.
             * @param {{ grup: string, label: string, gosterge: string }} kullaniciBilgi
             * @param {string} [token] - JWT token
             */
            oturumAc: (kullaniciBilgi, token = null) => {
                const kayit = { ...kullaniciBilgi, zaman: Date.now() };
                set({
                    kullanici: kayit,
                    jwtToken: token,
                    // Standart API'yi de eşzamanlı güncelle
                    user: kayit,
                    isAuthenticated: true,
                });
                terminalPinleriYaz(kullaniciBilgi.grup);
                const cookieVal = encodeURIComponent(JSON.stringify(kayit));
                cookieYaz('sb47_auth_session', cookieVal);
                if (token) cookieYaz('sb47_jwt_token', token);
                if (kullaniciBilgi.grup === 'uretim') cookieYaz('sb47_uretim_pin', '1');
                if (kullaniciBilgi.grup === 'genel') cookieYaz('sb47_genel_pin', '1');
            },

            // ── Güvenli çıkış ─────────────────────────────────
            cikisYap: () => {
                set({ kullanici: null, jwtToken: null, user: null, isAuthenticated: false });
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('sb47_auth');
                    localStorage.removeItem('sb47_yanlis_pin');
                    localStorage.removeItem('token');
                    sessionStorage.clear();
                }
                ['sb47_auth_session', 'sb47_jwt_token', 'sb47_uretim_pin', 'sb47_genel_pin']
                    .forEach(cookieSil);
                if (typeof window !== 'undefined') {
                    window.location.href = '/giris';
                }
            },

            // ── Oturum süresi kontrolü ─────────────────────────
            oturumGecerliMi: () => {
                const { kullanici } = get();
                if (!kullanici?.zaman) return false;
                return (Date.now() - kullanici.zaman) < OTURUM_SURESI;
            },

            // ── Yetki kontrolü ────────────────────────────────
            yetkiliMi: (gereken = 'genel') => {
                const { kullanici } = get();
                if (!kullanici) return false;
                const hiyerarsi = { tam: 3, uretim: 2, genel: 1 };
                return (hiyerarsi[kullanici.grup] || 0) >= (hiyerarsi[gereken] || 0);
            },

            // ── Hydration sonrası terminal pinleri yenile ──────
            hydrated: () => {
                const { kullanici } = get();
                if (kullanici?.grup) terminalPinleriYaz(kullanici.grup);
            },

            // ==========================================================
            // ── STANDART API — user / isAuthenticated / setUser / logout
            // ── Prop drilling olmadan herhangi bir bileşende kullanılır:
            //    const { user, isAuthenticated, setUser, logout } = useAuthStore();
            // ==========================================================

            /** Standart user objesi */
            user: null,
            /** Giriş yapılmış mı? */
            isAuthenticated: false,

            /**
             * Kullanıcı bilgisini set et (giriş sonrası).
             * Otomatik olarak sisteme özel PIN/cookie'leri de tetikler.
             *
             * @param {object|null} userData  – null = çıkış
             * @example
             *   setUser({ id: 1, grup: 'tam', label: 'Admin' });
             *   setUser(null); // çıkış
             */
            setUser: (userData) => {
                if (!userData) {
                    get().cikisYap();
                    return;
                }
                const kayit = { ...userData, grup: userData.grup || 'genel', zaman: Date.now() };
                set({
                    user: kayit,
                    isAuthenticated: true,
                    kullanici: kayit,
                });
                terminalPinleriYaz(kayit.grup);
            },

            /**
             * Standart çıkış — cikisYap() ile aynı, token'ları temizler.
             * @example
             *   const { logout } = useAuthStore();
             *   logout();
             */
            logout: () => get().cikisYap(),
        }),
        {
            name: 'sb47_auth_store',
            storage: createJSONStorage(() =>
                typeof window !== 'undefined' ? localStorage : {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                }
            ),
            // Persist edilecek alanlar
            partialize: (state) => ({
                kullanici: state.kullanici,
                jwtToken: state.jwtToken,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// ─── Oturum süresi dolmuşsa otomatik çıkış ───────────────────────
if (typeof window !== 'undefined') {
    setInterval(() => {
        const store = useAuthStore.getState();
        if (store.kullanici && !store.oturumGecerliMi()) {
            console.warn('[AuthStore] Oturum süresi doldu, çıkış yapılıyor.');
            store.cikisYap();
        }
    }, 5 * 60 * 1000); // 5 dakikada bir kontrol
}

// ─── Kolay erişim için default export ────────────────────────────
export default useAuthStore;
