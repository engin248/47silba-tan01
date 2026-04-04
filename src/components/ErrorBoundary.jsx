'use client';
/**
 * ─── ERROR BOUNDARY ────────────────────────────────────────────────────────
 * src/components/ErrorBoundary.jsx
 *
 * Bir modül patladığında TÜM ekranın kararmasını engeller.
 * Sadece hatalı bileşen kendi kutusunda "Hata" gösterir.
 *
 * Kullanım — bir sayfayı sar:
 *   import ErrorBoundary from '@/components/ErrorBoundary';
 *
 *   <ErrorBoundary modulAd="Üretim Bandı">
 *     <UretimSayfasi />
 *   </ErrorBoundary>
 *
 * Kullanım — layout.js içinde tüm uygulamayı sar:
 *   <ErrorBoundary modulAd="Sistem">
 *     {children}
 *   </ErrorBoundary>
 *
 * React'ın class Error Boundary yapısı zorunludur (hooks desteklemez).
 */

import React from 'react';

// ─── Hata Ekranı (Fallback UI) ────────────────────────────────────
function HataEkrani({ hata, modulAd, sifirla }) {
    return (
        <div
            role="alert"
            className="flex flex-col items-center justify-center gap-4 p-8 m-4 rounded-2xl border-2 border-red-200 bg-red-50"
        >
            {/* İkon */}
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-3xl">
                ⚠️
            </div>

            {/* Başlık */}
            <div className="text-center">
                <h2 className="text-lg font-black text-red-800">
                    {modulAd ? `"${modulAd}" modülünde hata` : 'Beklenmedik hata'}
                </h2>
                <p className="text-sm text-red-600 mt-1 font-medium">
                    Bu bölüm beklenmedik bir sorunla karşılaştı.
                    Diğer modüller etkilenmedi.
                </p>
            </div>

            {/* Hata detayı (development'ta görünür) */}
            {process.env.NODE_ENV === 'development' && hata && (
                <details className="w-full max-w-lg">
                    <summary className="text-xs text-red-500 cursor-pointer font-mono">
                        Teknik detay (sadece geliştirme modunda)
                    </summary>
                    <pre className="mt-2 p-3 bg-red-100 rounded-lg text-xs text-red-800 overflow-auto max-h-40 whitespace-pre-wrap">
                        {hata.message}
                        {'\n'}
                        {hata.stack}
                    </pre>
                </details>
            )}

            {/* Aksiyon butonları */}
            <div className="flex gap-3">
                <button
                    onClick={sifirla}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
                >
                    🔄 Tekrar Dene
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-white border-2 border-red-200 text-red-700 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors"
                >
                    🏠 Ana Sayfaya Dön
                </button>
            </div>
        </div>
    );
}

// ─── Error Boundary Class Component ──────────────────────────────
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hataVar: false,
            hata: null,
            hataInfo: null,
        };
        this.sifirla = this.sifirla.bind(this);
    }

    // Hata yakalandığında state'i güncelle
    static getDerivedStateFromError(hata) {
        return { hataVar: true, hata };
    }

    // Hata detaylarını logla
    componentDidCatch(hata, hataInfo) {
        this.setState({ hataInfo });

        // Production'da loglama sistemi (Sentry vb. buraya bağlanabilir)
        console.error(
            `[ErrorBoundary] "${this.props.modulAd || 'Bilinmeyen Modül'}" modülünde hata:`,
            hata,
            hataInfo
        );

        // Telegram'a kritik hata bildirimi (isteğe bağlı)
        if (typeof fetch !== 'undefined' && process.env.NODE_ENV === 'production') {
            fetch('/api/telegram-bildirim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mesaj: `🔴 SİSTEM HATASI\nModül: ${this.props.modulAd || '?'}\nHata: ${hata.message}`,
                }),
            }).catch(e => console.error('[ErrorBoundary] Telegram bildirim gönderilemedi:', e?.message));
        }
    }

    // Bileşeni sıfırla (retry)
    sifirla() {
        this.setState({ hataVar: false, hata: null, hataInfo: null });
    }

    render() {
        if (this.state.hataVar) {
            // Özel fallback varsa kullan, yoksa varsayılan hata ekranı
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <HataEkrani
                    hata={this.state.hata}
                    modulAd={this.props.modulAd}
                    sifirla={this.sifirla}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
