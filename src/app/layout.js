// ─── ROOT LAYOUT — SERVER COMPONENT ──────────────────────────
// 'use client' BURADA YOK — Next.js metadata API çalışsın diye
// Tüm client mantığı (sidebar, auth, offline, realtime) → ClientLayout.js içinde
import './globals.css';
import ClientLayout from './ClientLayout';

// ─── NEXT.JS METADATA API ────────────────────────────────────
export const metadata = {
    title: 'Mizanet',
    description: 'Mizanet — Entegre İşletme Yönetim Sistemi',
    manifest: '/manifest.json',
    keywords: ['mizanet', 'üretim', 'tekstil', 'stok', 'muhasebe'],
    alternates: {
        canonical: 'https://mizanet.com',
    },
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/icon.png', type: 'image/png' },
        ],
        apple: '/icon.png',
        shortcut: '/favicon.ico',
    },
    robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
    },
    openGraph: {
        title: 'Mizanet',
        description: 'Mizanet — Entegre İşletme Yönetim Sistemi',
        url: 'https://mizanet.com',
        siteName: 'Mizanet',
        locale: 'tr_TR',
        type: 'website',
    },
};

// ─── VIEWPORT (Next.js 14+ ayrı export olmalı) ───────────────
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
