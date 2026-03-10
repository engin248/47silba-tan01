'use client';
import { Lock } from 'lucide-react';
/**
 * 📌 YetkisizEkrani — Paylaşılan Bileşen
 * Her sayfada yetkisiz giriş durumunda gösterilecek tam ekran kilitli panel.
 * page.js içinde "if (!yetkiliMi) return <YetkisizEkrani />" ile kullanılır.
 */
export default function YetkisizEkrani({ mesaj }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-red-50 border-2 border-red-200 rounded-2xl m-6">
            <Lock size={48} className="text-red-400" />
            <h2 className="text-lg font-black text-red-700 uppercase tracking-wide">
                YETKİSİZ GİRİŞ ENGELLENDİ
            </h2>
            <p className="text-sm text-red-600 font-semibold text-center max-w-xs">
                {mesaj || 'Bu bölüme erişim için gerekli yetki bulunmuyor.'}
            </p>
        </div>
    );
}
