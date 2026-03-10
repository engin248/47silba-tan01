// ─── ROOT LAYOUT — SERVER COMPONENT ──────────────────────────
// 'use client' BURADA YOK — Next.js metadata API çalışsın diye
// Tüm client mantığı (sidebar, auth, offline, realtime) → ClientLayout.js içinde
import './globals.css';
import ClientLayout from './ClientLayout';

// ─── NEXT.JS METADATA API (Doğru Kullanım) ───────────────────
export const metadata = {
    title: '47 Sil Baştan — Üretim & Mağaza Sistemi',
    description: 'THE ORDER NIZAM — Adil Düzen, Şeffaf Maliyet, Adaletli Dağıtım. Fason ve Ürün Yönetim Sistemi.',
    manifest: '/manifest.json',
    keywords: ['üretim', 'fason', 'tekstil', 'stok', 'muhasebe', 'nizam'],
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
        title: '47 Sil Baştan — THE ORDER NIZAM',
        description: 'Adil Düzen · Şeffaf Maliyet · Adaletli Dağıtım',
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

// ─── ROOT LAYOUT ──────────────────────────────────────────────
export default function RootLayout({ children }) {
    return (
        <html lang="tr" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <ClientLayout>
                    {children}
                </ClientLayout>
            </body>
        </html>
    );
}
// force hmr
