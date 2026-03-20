'use client';
/**
 * 📌 SayfaBasligi — Paylaşılan Başlık Bileşeni
 * Her sayfa üstünde standart başlık satırı.
 *
 * Kullanım:
 *   <SayfaBasligi baslik="Kumaş Arşivi" ikon="🧵" aciklama="Tüm kumaş kayıtları" />
 */
import { LucideInfo } from 'lucide-react';

export default function SayfaBasligi({ baslik, ikon, aciklama, sagIcerik }) {
    return (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
                {ikon && (
                    <span className="text-2xl">{ikon}</span>
                )}
                <div>
                    <h1 className="text-xl font-bold text-white">
                        {baslik}
                    </h1>
                    {aciklama && (
                        <p className="text-sm text-slate-400 mt-0.5">{aciklama}</p>
                    )}
                </div>
            </div>
            {sagIcerik && (
                <div className="flex items-center gap-2">
                    {sagIcerik}
                </div>
            )}
        </div>
    );
}
