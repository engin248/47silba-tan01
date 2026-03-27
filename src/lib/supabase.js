import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// ─── MIMARI ZİRH: Sessiz başarısızlık engellendi ─────────────────
// ENV boşsa mock'a gizlice bağlanmak yerine açık uyarı ver.
// Bu sayede kör uçuş (veri yazılmıyor ama sistem çalışıyor sanılıyor) önlenir.
if (!supabaseUrl || !supabaseKey) {
    if (typeof window === 'undefined') {
        // Server-side: build/deploy sırasında net hata ver
        console.error(
            '[MİMARİ ALARM] NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY eksik!\n' +
            'Vercel Dashboard → Settings → Environment Variables kısmına ekleyin.\n' +
            'Tüm veritabanı işlemleri başarısız olacak.'
        );
    }
}

export const supabase = createClient(
    supabaseUrl || '', // [FIX] placeholder fallback kaldırıldı — ENV boşsa hata açık çıkar
    supabaseKey || ''  // [FIX] aynı
);

// ─── Bağlantı durum tespiti (client-side) ───────────────────────
export const supabaseBagliMi = !!(supabaseUrl && supabaseKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseKey.includes('placeholder'));
