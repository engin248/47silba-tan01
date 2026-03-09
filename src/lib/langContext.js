'use client';
// =========================================================================
// DİL CONTEXT — Tüm sayfalara dil seçimini anlık iletir
// Kullanım: import { useLang } from '@/lib/langContext'
// =========================================================================
import { createContext, useContext, useState, useEffect } from 'react';

const LangContext = createContext({ lang: 'tr', setLang: () => { } });

export function LangProvider({ children }) {
    const [lang, setLang] = useState('tr');
    return (
        <LangContext.Provider value={{ lang, setLang }}>
            {children}
        </LangContext.Provider>
    );
}

// Hook — sayfa componentlerinde kullanılır
export function useLang() {
    return useContext(LangContext);
}
