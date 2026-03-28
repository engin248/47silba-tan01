import { supabase } from '@/lib/supabase';

export async function kameraOlaylariGetir(limit = 50) {
    const { data, error } = await supabase
        .from('b1_kamera_olaylari')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    return { data, error };
}

export function kameraKanaliKur(onInsert) {
    return supabase.channel('m4_kamera_kanal')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'b1_kamera_olaylari' }, onInsert)
        .subscribe();
}
