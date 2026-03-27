import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

// ¦¦¦ MÝMARÝ ZÝRH: Mock fallback kaldýrýldý — tutarsýzlýk giderildi ¦¦¦¦¦¦
// ESKÝ: Boþsa sessizce 'mock-key' ile çalýþýyordu (kör uçuþ riski)
// YENÝ: supabase.js ile tutarlý — eksikse açýk hata ver
if (!supabaseUrl || !serviceRoleKey) {
    console.error(
        '[MÝMARÝ ALARM] SUPABASE_SERVICE_ROLE_KEY veya SUPABASE_URL eksik!\n' +
        'Service Role gerektiren tüm iþlemler (ajan, cron, admin) baþarýsýz olacak.\n' +
        'Vercel Dashboard › Settings › Environment Variables düzeltilmeli.'
    );
}

export const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder-mimari-alarm.supabase.co',
    serviceRoleKey || 'placeholder-service-role-key-set-env',
    {
        auth: { autoRefreshToken: false, persistSession: false }
    }
);
