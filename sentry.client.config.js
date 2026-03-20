import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Puan ve performans izleme
    tracesSampleRate: 0.1, // %10 işlemleri izle (production için yeterli)
    // Ortam bilgisi
    environment: process.env.NODE_ENV || 'production',
    // Hata filtreleme — önemsiz hataları Sentry'e gönderme
    beforeSend(event) {
        // Ağ hatalarını filtrele (kullanıcı internet kesin vs)
        if (event.exception?.values?.[0]?.value?.includes('NetworkError')) return null;
        if (event.exception?.values?.[0]?.value?.includes('Failed to fetch')) return null;
        if (event.exception?.values?.[0]?.value?.includes('Zaman aşımı')) return null;
        return event;
    },
});
