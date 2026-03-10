'use client';
import { Lock } from 'lucide-react';

/**
 * YetkisizEkran — Tüm sayfalardaki "Yetkisiz Giriş Engellendi" ekranı
 * Kullanım: <YetkisizEkran mesaj="..." />
 */
export default function YetkisizEkran({ mesaj, isAR }) {
    return (
        <div style={{
            padding: '3rem',
            textAlign: 'center',
            background: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: 16,
            margin: '2rem',
        }}>
            <Lock size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#b91c1c', fontWeight: 900 }}>
                {isAR ? 'تم حظر الوصول غير المصرح' : 'YETKİSİZ GİRİŞ ENGELLENDİ'}
            </h2>
            <p style={{ color: '#7f1d1d', fontWeight: 600, marginTop: 8 }}>
                {mesaj || (isAR
                    ? 'هذه البيانات سرية. يلزم تسجيل دخول مصرح به.'
                    : 'Bu veriler gizlidir. Yetkili giriş zorunludur.')}
            </p>
        </div>
    );
}
