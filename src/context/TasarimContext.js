'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

const TasarimContext = createContext();

export function TasarimProvider({ children }) {
    const pathname = usePathname();
    const [tema, setTema] = useState({
        ana_renk: '#047857',
        ikincil_renk: '#0f172a',
        arkaplan_renk: '#f8fafc',
        kutu_arka_plan: '#ffffff',
        yazi_tipi: 'Inter, sans-serif',
        kose_radius: '12px',
        golge_stili: 'yumusak',
        yukleniyor: true
    });

    useEffect(() => {
        const temayiGetir = async () => {
            if (!pathname) return;

            try {
                // 1. Ã–nce bulunduÄŸumuz sayfanÄ±n Ã¶zel tasarÄ±mÄ± var mÄ± (Ã–rn: '/musteriler')
                const { data: sayfaTasarimi } = await supabase
                    .from('b0_tasarim_ayarlari')
                    .select('*')
                    .eq('ayar_anahtari', pathname)
                    .maybeSingle();

                if (sayfaTasarimi) {
                    uygula(sayfaTasarimi);
                    return;
                }

                // 2. Ã–zel sayfa tasarÄ±mÄ± yoksa Global TemayÄ± Ã§ek
                const { data: globalTasarim } = await supabase
                    .from('b0_tasarim_ayarlari')
                    .select('*')
                    .eq('ayar_anahtari', 'global_tema')
                    .maybeSingle();

                if (globalTasarim) {
                    uygula(globalTasarim);
                } else {
                    // HiÃ§biri yoksa varsayÄ±lan
                    uygula({
                        ana_renk: '#047857', ikincil_renk: '#0f172a',
                        arkaplan_renk: '#f8fafc', kutu_arka_plan: '#ffffff',
                        yazi_tipi: 'Inter, sans-serif', kose_radius: '12px', golge_stili: 'yumusak'
                    });
                }
            } catch (error) {
                // Hata durumunda varsayÄ±lan temada kal
                setTema(prev => ({ ...prev, yukleniyor: false }));
            }
        };

        temayiGetir();
    }, [pathname]);

    const uygula = (veri) => {
        const yeniTema = {
            ana_renk: veri.ana_renk || '#047857',
            ikincil_renk: veri.ikincil_renk || '#0f172a',
            arkaplan_renk: veri.arkaplan_renk || '#f8fafc',
            kutu_arka_plan: veri.kutu_arka_plan || '#ffffff',
            yazi_tipi: veri.yazi_tipi || 'Inter, sans-serif',
            kose_radius: veri.kose_radius || '12px',
            golge_stili: veri.golge_stili || 'yumusak',
            yukleniyor: false
        };
        setTema(yeniTema);

        // CSS Variable'larÄ± root nesnesine (HTML elemanÄ±na) enjekte et
        if (typeof document !== 'undefined') {
            const root = document.documentElement;
            root.style.setProperty('--c-ana', yeniTema.ana_renk);
            root.style.setProperty('--c-ikincil', yeniTema.ikincil_renk);
            // Sayfa zemin rengi %10 aÃ§Ä±lÄ±yor
            root.style.setProperty('--c-arka', `color-mix(in srgb, ${yeniTema.arkaplan_renk} 90%, white)`);
            root.style.setProperty('--c-kutu', yeniTema.kutu_arka_plan);
            root.style.setProperty('--f-yazi', yeniTema.yazi_tipi);
            root.style.setProperty('--b-radius', yeniTema.kose_radius);

            // GÃ¶lge Stili
            if (yeniTema.golge_stili === 'yok') root.style.setProperty('--s-golge', 'none');
            else if (yeniTema.golge_stili === 'sert') root.style.setProperty('--s-golge', '4px 4px 0px rgba(0,0,0,1)');
            else root.style.setProperty('--s-golge', '0 8px 24px -8px rgba(0,0,0,0.08)');
        }
    };

    return (
        <TasarimContext.Provider value={{ tema }}>
            {/* Arka plan ve fontFamily burada enjekte ediliyor */}
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: 'var(--c-arka)',
                    fontFamily: 'var(--f-yazi)',
                    transition: 'background-color 0.3s ease'
                }}
            >
                {children}
            </div>
        </TasarimContext.Provider>
    );
}

export const useTasarim = () => useContext(TasarimContext);
