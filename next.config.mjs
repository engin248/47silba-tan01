import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {

    // ─── GÜVENLİK: HTTP BAŞLIKLARI ────────────────────────────────────────
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.sentry.io https://*.sentry.io",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
                            "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
                            "img-src 'self' data: blob: https://api.qrserver.com https://cauptlsnqieegdrgotob.supabase.co https://*.supabase.co",
                            "connect-src 'self' https://cauptlsnqieegdrgotob.supabase.co https://*.supabase.co wss://*.supabase.co https://api.perplexity.ai https://api.telegram.org https://api1.telegram.org https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://o4511011107700736.ingest.de.sentry.io",
                            "media-src 'self' blob: https://cauptlsnqieegdrgotob.supabase.co",
                            "frame-ancestors 'none'",
                        ].join('; '),
                    },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
                ],
            },
        ];
    },

    // ─── GÖRSEL OPTİMİZASYON ──────────────────────────────────────────────
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'cauptlsnqieegdrgotob.supabase.co', pathname: '/storage/v1/object/public/**' },
            { protocol: 'https', hostname: 'api.qrserver.com', pathname: '/**' },
        ],
        formats: ['image/webp', 'image/avif'],
    },

    reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: true,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
});
