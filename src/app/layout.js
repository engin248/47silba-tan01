//  ROOT LAYOUT — SERVER COMPONENT 
// 'use client' BURADA YOK — Next.js metadata API alışsın diye
// Tm client mantığı (sidebar, auth, offline, realtime) → ClientLayout.js iinde
import './globals.css';
import ClientLayout from './ClientLayout';

//  NEXT.JS METADATA API (Doğru Kullanım) 
export const metadata = {
    title: 'Mizanet — retim & Mağaza Sistemi',
    description: 'THE ORDER NIZAM — Adil Dzen, Şeffaf Maliyet, Adaletli Dağıtım. Fason ve rn Ynetim Sistemi.',
    manifest: '/manifest.json',
    keywords: ['retim', 'fason', 'tekstil', 'stok', 'muhasebe', 'nizam'],
    icons: {
        icon: '/icon.png',
        apple: '/icon.png',
        shortcut: '/icon.png',
    },
    robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
    },
    openGraph: {
        title: 'Mizanet — THE ORDER NIZAM',
        description: 'Adil Dzen  Şeffaf Maliyet  Adaletli Dağıtım',
        locale: 'tr_TR',
        type: 'website',
    },
};

//  VIEWPORT (Next.js 14+ ayrı export olmalı) 
export const viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#0f172a',
};

export default function RootLayout({ children }) {
    return (
        <html lang="tr" suppressHydrationWarning translate="no" className="notranslate">
            <body suppressHydrationWarning className="notranslate">
                <ClientLayout>
                    {children}
                </ClientLayout>
            </body>
        </html>
    );
}
// force hmr
