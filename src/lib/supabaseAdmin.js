import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
    console.error(
        '[MİMARİ ALARM] SUPABASE_SERVICE_ROLE_KEY veya NEXT_PUBLIC_SUPABASE_URL eksik!\n' +
        'Sunucu tarafı veritabanı işlemleri başarısız olacak.'
    );
}

// Service Role Client — sadece sunucu tarafı (RLS bypass)
export const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    serviceRoleKey || 'placeholder-service-role-key',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
