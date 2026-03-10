/**
 * features/ajanlar/services/ajanlarApi.js
 * M19 AI Ajanlar — Supabase Servis Katmanı
 * Kapsam: Görev oluştur, çalıştır, sil, logla
 * KAPSAM DIŞI: e-Fatura (GİB), SSK/SGK otomasyonu
 */
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';

// ── Veri Çekme ───────────────────────────────────────────────────────────────
export async function fetchGorevler() {
    const { data, error } = await supabase
        .from('b1_ajan_gorevler')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) throw error;
    return data || [];
}

// ── Görev Oluştur ──────────────────────────────────────────────────────────
export async function gorevOlustur(form) {
    // Mükerrer Ajan Görevi Engeli (U Kriteri)
    const { data: mevcut } = await supabase
        .from('b1_ajan_gorevler')
        .select('id')
        .ilike('gorev_adi', form.gorev_adi.trim())
        .eq('durum', 'bekliyor');
    if (mevcut && mevcut.length > 0) throw new Error('Bu görev adıyla bekleyen kayıt zaten var!');

    const { data, error } = await supabase
        .from('b1_ajan_gorevler')
        .insert([{ ...form, durum: 'bekliyor' }])
        .select()
        .single();
    if (error) throw error;

    // [BLOK 5] Ajan log: görev açılışı kaydedilir
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b1_ajan_gorevler', islem_tipi: 'INSERT',
        kullanici_adi: 'Koordinatör',
        eski_veri: { gorev_adi: form.gorev_adi, ajan: form.ajan_adi },
    }]).catch(() => { });

    telegramBildirim(`🤖 YENİ OTONOM GÖREV\nAjan: ${form.ajan_adi}\nGörev: ${form.gorev_adi}`);
    return data;
}

// ── Görev Çalıştır (API route) ────────────────────────────────────────────
export async function gorevCalistir(gorevId) {
    const res = await fetch('/api/ajan-calistir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gorev_id: gorevId }),
    });
    const d = await res.json();
    if (!d.basarili) throw new Error(d.error || 'Görev başarısız');
    return d;
}

// ── Görev Sil ────────────────────────────────────────────────────────────
export async function gorevSil(id, kullaniciLabel = '') {
    // Kara kutu log (Kriter 25)
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b1_ajan_gorevler', islem_tipi: 'SILME',
        kullanici_adi: kullaniciLabel || 'Yetkilendirilmiş Kullanıcı',
        eski_veri: { id, mesaj: 'Silindi' },
    }]).catch(() => { });
    const { error } = await supabase.from('b1_ajan_gorevler').delete().eq('id', id);
    if (error) throw error;
}

// ── Ajan Konfigürasyon (localStorage + Supabase) ─────────────────────────
export function konfigurasyonOku() {
    if (typeof window === 'undefined') return null;
    const k = localStorage.getItem('ajan_konfig');
    return k ? JSON.parse(k) : null;
}

export function konfigurasyonKaydet(konfig) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('ajan_konfig', JSON.stringify(konfig));
    }
}

// ── İstatistik ──────────────────────────────────────────────────────────
export function istatistikHesapla(gorevler) {
    return {
        toplam: gorevler.length,
        tamamlandi: gorevler.filter(g => g.durum === 'tamamlandi').length,
        calisıyor: gorevler.filter(g => g.durum === 'calisıyor').length,
        hata: gorevler.filter(g => g.durum === 'hata').length,
        bekliyor: gorevler.filter(g => g.durum === 'bekliyor').length,
    };
}

// ── Sabitler ──────────────────────────────────────────────────────────────
export const AJAN_LISTESI = [
    { ad: 'Trend Kâşifi', ikon: '🔍', renk: '#3b82f6', modul: 'arge', aciklama: 'Trendyol, Amazon araştırır' },
    { ad: 'Üretim Kontrol', ikon: '⚙️', renk: '#f59e0b', modul: 'uretim', aciklama: 'Üretim takibi' },
    { ad: 'Muhasebe', ikon: '📊', renk: '#6366f1', modul: 'muhasebe', aciklama: 'Raporlar üretir' },
    { ad: 'Stok Kontrol', ikon: '📦', renk: '#ef4444', modul: 'stok', aciklama: 'Stok alarmları' },
    { ad: 'Personel', ikon: '👤', renk: '#f97316', modul: 'personel', aciklama: 'Personel analizi' },
    { ad: 'Genel', ikon: '🤖', renk: '#64748b', modul: 'genel', aciklama: 'Genel analiz' },
];

export const GOREV_TIPLERI = [
    { deger: 'arastirma', etiket: 'Araştırma', ikon: '🔍' },
    { deger: 'analiz', etiket: 'Analiz', ikon: '📊' },
    { deger: 'kontrol', etiket: 'Kontrol', ikon: '✅' },
    { deger: 'rapor', etiket: 'Rapor', ikon: '📄' },
];

export const ONCELIK = [
    { deger: 'acil', etiket: 'Acil', renk: '#ef4444', bg: '#fef2f2' },
    { deger: 'yuksek', etiket: 'Yüksek', renk: '#f59e0b', bg: '#fffbeb' },
    { deger: 'normal', etiket: 'Normal', renk: '#3b82f6', bg: '#eff6ff' },
    { deger: 'dusuk', etiket: 'Düşük', renk: '#94a3b8', bg: '#f8fafc' },
];

export const BOS_FORM = {
    gorev_adi: '', gorev_tipi: 'arastirma', oncelik: 'normal',
    gorev_emri: '', hedef_modul: 'arge', hedef_tablo: 'b1_arge_trendler',
    ajan_adi: 'Trend Kâşifi', yetki_internet: true, yetki_supabase_yaz: true,
    yetki_supabase_oku: true, yetki_ai_kullan: true, yetki_dosya_olustur: false,
    koordinator_notu: '',
};

export const SURE_HESAPLA = (bas, bit) => {
    if (!bas || !bit) return null;
    const ms = new Date(bit) - new Date(bas);
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}dk`;
};
