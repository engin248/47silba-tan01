'use client';
/**
 * YetkisizEkran — Üretim ve diğer sayfalar için erişim engel ekranı.
 * Mevcut YetkisizEkrani.jsx'ten farklı prop imzası: { isAR, mesaj }
 */
import { Lock } from 'lucide-react';

export default function YetkisizEkran({ mesaj, isAR }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-red-50 border-2 border-red-200 rounded-2xl m-6" dir={isAR ? 'rtl' : 'ltr'}>
            <Lock size={48} className="text-red-400" />
            <h2 className="text-lg font-black text-red-700 uppercase tracking-wide">
                {isAR ? 'تم رفض الوصول' : 'YETKİSİZ GİRİŞ ENGELLENDİ'}
            </h2>
            <p className="text-sm text-red-600 font-semibold text-center max-w-sm">
                {mesaj || (isAR ? 'ليس لديك صلاحية الوصول.' : 'Bu bölüme erişim yetkiniz bulunmuyor.')}
            </p>
        </div>
    );
}
