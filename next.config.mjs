import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        const isDev = process.env.NODE_ENV === 'development';

        // CORS başlıkları
        const corsHeaders = [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ];

        return [
            {
                source: '/api/:path*',
                headers: corsHeaders
            },
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            // 'unsafe-eval' sadece dev'de (Turbopack zorunlu kılıyor)
                            isDev
                                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.sentry.io"
                                : "script-src 'self' 'unsafe-inline' https://*.sentry.io",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
                            "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
                            "img-src 'self' data: blob: https://api.qrserver.com https://cauptlsnqieegdrgotob.supabase.co https://*.supabase.co",
                            "connect-src 'self' http://localhost:1984 ws://localhost:1984 https://kamera.demirtekstiltheonder.com wss://kamera.demirtekstiltheonder.com https://kamera.demirtekstiltheondercom.com wss://kamera.demirtekstiltheondercom.com https://cauptlsnqieegdrgotob.supabase.co https://*.supabase.co wss://*.supabase.co https://api.perplexity.ai https://api.telegram.org https://api1.telegram.org https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://o4511011107700736.ingest.de.sentry.io",
                            "media-src 'self' blob: http://localhost:1984 https://kamera.demirtekstiltheonder.com https://kamera.demirtekstiltheondercom.com https://cauptlsnqieegdrgotob.supabase.co",
                            "frame-src 'self' http://localhost:1984 https://kamera.demirtekstiltheonder.com https://kamera.demirtekstiltheondercom.com",
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

    eslint: {
        ignoreDuringBuilds: true,
    },

    // ─── SCRAPER BAĞIMLILIKLAR — Webpack Bundle'dan Dışla ─────────────────
    // puppeteer, puppeteer-extra ve cheerio Next.js bundle'ına girmez.
    // Bu paketler sadece VPS/Node.js ortamında çalışır.
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals = [
                ...(config.externals || []),
                'puppeteer',
                'puppeteer-extra',
                'puppeteer-extra-plugin-stealth',
                'cheerio',
            ];
        }
        return config;
    },

    reactStrictMode: true,
};

// Sentry wrapper — App Router ile aktif
export default withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: true,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
    tunnelRoute: '/monitoring',
});
