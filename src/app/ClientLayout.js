"use client";

import React from 'react';

/**
 * Mizanet (THE ORDER) Ana Client Layout Katmanı.
 * Server component olan 'layout.js' içinden çağrılır.
 * İleride eklenecek olan Bildirim (Toast), Sidebar, veya Gerçek Zamanlı (Realtime) 
 * provider'lar bu sarmalayıcı (wrapper) içerisine yerleştirilecektir.
 */
export default function ClientLayout({ children }) {
    return (
        <React.Fragment>
            {/* Bildirimler, Menüler veya Sentry ErrorBoundary buraya gelebilir */}
            {children}
        </React.Fragment>
    );
}
