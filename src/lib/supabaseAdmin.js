import { createClient } from '@supabase/supabase-js';

<<<<<<< HEAD
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

// ─── MİMARİ ZİRH: Mock fallback kaldırıldı — tutarsızlık giderildi ──────
// ESKİ: Boşsa sessizce 'mock-key' ile çalışıyordu (kör uçuş riski)
// YENİ: supabase.js ile tutarlı — eksikse açık hata ver
if (!supabaseUrl || !serviceRoleKey) {
    console.error(
        '[MİMARİ ALARM] SUPABASE_SERVICE_ROLE_KEY veya SUPABASE_URL eksik!\n' +
        'Service Role gerektiren tüm işlemler (ajan, cron, admin) başarısız olacak.\n' +
        'Vercel Dashboard → Settings → Environment Variables düzeltilmeli.'
    );
}

export const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder-mimari-alarm.supabase.co',
    serviceRoleKey || 'placeholder-service-role-key-set-env',
    {
        auth: { autoRefreshToken: false, persistSession: false }
    }
);
=======
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://mock.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || 'mock-key';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});
>>>>>>> 00caa2c7edc776b4729700b66de9c773e83bf552
