"use client";

import React from 'react';
import { AuthProvider } from '@/lib/auth';

/**
 * Mizanet (THE ORDER) Ana Client Layout Katmanı.
 * Server component olan 'layout.js' içinden çağrılır.
 * Ana uygulama State ve Kimlik sağlayıcıları burada sarmalanır.
 */
export default function ClientLayout({ children }) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}
