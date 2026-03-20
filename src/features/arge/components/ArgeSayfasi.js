/**
<<<<<<< HEAD
 * app/arge/page.js — SADECE GİRİŞ NOKTASI (9 satır)
 * Logic  → features/arge/hooks/useArge.js
 * UI     → mevcut arge/page.js'deki JSX (geçici olarak aynı dosyada kalıyor)
 * NOT: UI bileşeni bir sonraki fazda features/arge/components/ArgeSayfasi.js'e taşınacak
 */
export { default } from '@/features/arge/components/ArgeSayfasi';
=======
 * ArgeSayfasi — Ar-Ge & Trend modülü giriş noktası
 * Circular import düzeltildi: Doğru hedef ArgeMainContainer.js
 */
export { default } from '@/features/arge/components/ArgeMainContainer';
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
