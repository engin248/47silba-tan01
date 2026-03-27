'use client';
// [FIX] 'server-only' kaldırıldı — bu dosya client-side React Context + Hook
/**
 * src/lib/yetki.js
 * Granüler Yetki Sistemi — React Context + Hook
 *
 * Kaynaklar:
 *   maliyet_tutar    → Maliyet TL/USD rakamlar
 *   kasa_bakiye      → Kasa tutarları
 *   maas_detay       → Maaş/prim rakamları
 *   urun_maliyet     → Ürün maliyet/kâr
 *   musteri_iletisim → Müşteri telefon, email
 *   rapor_tam        → Raporlarda tam detay
 *   muhasebe_detay   → Muhasebe kalemleri
 *   ajan_komuta      → Ajan çalıştırma paneli
 *   siparis_fiyat    → Sipariş fiyat kolonları
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// ─── VARSAYILAN YETKİLER (Supabase yoksa fallback) ─────────────
const VARSAYILAN_YETKILER = {
    uretim: {
        maliyet_tutar: false,
        kasa_bakiye: false,
        maas_detay: false,
        urun_maliyet: true,
        musteri_iletisim: true,
        rapor_tam: false,
        muhasebe_detay: false,
        ajan_komuta: false,
        siparis_fiyat: true,
    },
    genel: {
        maliyet_tutar: false,
        kasa_bakiye: false,
        maas_detay: false,
        urun_maliyet: false,
        musteri_iletisim: false,
        rapor_tam: false,
        muhasebe_detay: false,
        ajan_komuta: false,
        siparis_fiyat: false,
    },
};

const YetkiContext = createContext({
    yetkiMap: {},
    yetkiVar: (_k) => true,
    yukleniyor: false,
    yetkiGuncelle: async () => { },
    tumYetkiler: VARSAYILAN_YETKILER,
});

// ─── PROVIDER ────────────────────────────────────────────────
export function YetkiProvider({ children }) {
    const { kullanici } = useAuth();
    const [yetkiMap, setYetkiMap] = useState({});
    const [yukleniyor, setYukleniyor] = useState(false);
    const [tumYetkiler, setTumYetkiler] = useState(VARSAYILAN_YETKILER);

    const yukle = useCallback(async () => {
        setYukleniyor(true);
        try {
            const { data, error } = await supabase
                .from('b0_yetki_ayarlari')
                .select('grup, kaynak, izin_var');

            if (error || !data?.length) {
                // Fallback: varsayılan yetkiler
                setTumYetkiler(VARSAYILAN_YETKILER);
                const grup = kullanici?.grup;
                if (grup && grup !== 'tam') {
                    setYetkiMap(VARSAYILAN_YETKILER[grup] || {});
                } else {
                    setYetkiMap({});
                }
                return;
            }

            // Tüm yetkiler haritası (koordinatör paneli için)
            const yeni = { uretim: {}, genel: {} };
            for (const row of data) {
                if (yeni[row.grup]) yeni[row.grup][row.kaynak] = row.izin_var;
            }
            setTumYetkiler(yeni);

            // Giriş yapan kullanıcının yetki haritası
            const grup = kullanici?.grup;
            if (grup && grup !== 'tam') {
                setYetkiMap(yeni[grup] || VARSAYILAN_YETKILER[grup] || {});
            } else {
                setYetkiMap({});
            }
        } catch (yetkiHata) {
            console.error('[H1 YETKİ HATASI] Supabase yetki tablosu okunamadı:', yetkiHata?.message);
            setTumYetkiler(VARSAYILAN_YETKILER);
        }
        setYukleniyor(false);
    }, [kullanici?.grup]);

    useEffect(() => { yukle(); }, [yukle]);

    // tam grubu her şeyi görebilir, diğerleri haritaya bakar
    const yetkiVar = useCallback((kaynak) => {
        if (!kullanici) return false;
        if (kullanici.grup === 'tam') return true;
        if (kaynak in yetkiMap) return yetkiMap[kaynak];
        return false; // tanımsız kaynaklar varsayılan gizli
    }, [kullanici, yetkiMap]);

    // Koordinatör bir yetkiyi değiştirir → Supabase upsert → yeniden yükle
    const yetkiGuncelle = useCallback(async (grup, kaynak, izinVar) => {
        const { error } = await supabase
            .from('b0_yetki_ayarlari')
            .upsert({ grup, kaynak, izin_var: izinVar, guncellendi_at: new Date().toISOString() },
                { onConflict: 'grup,kaynak' });
        if (error) throw error;
        await yukle();
    }, [yukle]);

    return (
        <YetkiContext.Provider value={{ yetkiMap, yetkiVar, yukleniyor, yetkiGuncelle, tumYetkiler }}>
            {children}
        </YetkiContext.Provider>
    );
}

// ─── HOOK ────────────────────────────────────────────────────
export function useYetki(kaynak) {
    const { yetkiVar, yukleniyor, yetkiGuncelle, tumYetkiler } = useContext(YetkiContext);
    return {
        yetkiVar: yetkiVar(kaynak),
        yukleniyor,
        yetkiGuncelle,
        tumYetkiler,
    };
}

// useYetki'yi kaynak belirtmeden (panel için tüm bağlamı almak)
export function useYetkiPanel() {
    const { yetkiGuncelle, tumYetkiler, yukleniyor } = useContext(YetkiContext);
    return { yetkiGuncelle, tumYetkiler, yukleniyor };
}

// ─── GİZLİ VERİ BİLEŞENİ ────────────────────────────────────
export function GizliVeri({ kaynak, children, yedek = '—' }) {
    const { yetkiVar } = useYetki(kaynak);
    if (!yetkiVar) {
        return (
            <span style={{
                background: '#e2e8f0',
                color: '#94a3b8',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
            }}>
                {yedek === '—' ? '🔒 Gizli' : yedek}
            </span>
        );
    }
    return children;
}
