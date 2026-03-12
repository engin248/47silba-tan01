import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://mock.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || 'mock-key';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});
