'use client';
// =========================================================================
// DÄ°L CONTEXT â€” TÃ¼m sayfalara dil seÃ§imini anlÄ±k iletir
// KullanÄ±m: import { useLang } from '@/context/langContext'
// =========================================================================
import { createContext, useContext, useState, useEffect } from 'react';

const LangContext = createContext({ lang: 'tr', setLang: /** @type {any} */ (() => { }) });

export function LangProvider({ children }) {
    const [lang, setLang] = useState('tr');
    return (
        <LangContext.Provider value={{ lang, setLang }}>
            {children}
        </LangContext.Provider>
    );
}

// Hook â€” sayfa componentlerinde kullanÄ±lÄ±r
export function useLang() {
    return useContext(LangContext);
}
