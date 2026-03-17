/**
 * features/denetmen/services/denetmenApi.js
 * Tablolar: b1_sistem_uyarilari, b1_agent_loglari, b2_urun_katalogu, b1_muhasebe_raporlari
 * (MainContainer'dan doğrulanan gerçek tablo adları)
 */
import { supabase } from '@/lib/supabase';

export async function denetimLoglariniGetir() {
    const [uyRes, agRes] = await Promise.allSettled([
        supabase.from('b1_sistem_uyarilari')
            .select('id, baslik, aciklama, tip, kritik, durum, olusturma')
            .eq('durum', 'aktif')
            .order('olusturma', { ascending: false })
            .limit(25),
        supabase.from('b1_agent_loglari')
            .select('id, ajan_adi, islem_tipi, mesaj, sonuc, created_at')
            .order('created_at', { ascending: false })
            .limit(10),
    ]);
    return {
        denetimLoglari: uyRes.status === 'fulfilled' ? (uyRes.value.data || []) : [],
        sistemLoglari: agRes.status === 'fulfilled' ? (agRes.value.data || []) : [],
    };
}

export async function denetimKaydi(payload) {
    const { error } = await supabase.from('b1_sistem_uyarilari').insert([{
        baslik: payload.baslik,
        aciklama: payload.aciklama || null,
        tip: payload.tip || 'uretim_kalite',
        kritik: payload.kritik || false,
        durum: 'aktif',
        kullanici_adi: payload.kullanici_adi || 'Denetmen',
        olusturma: new Date().toISOString(),
    }]);
    if (error) throw error;
}

export async function denetimDurumGuncelle(id, durum) {
    const guncelleme = { durum };
    if (durum === 'cozuldu') guncelleme.cozum_tarihi = new Date().toISOString();
    const { error } = await supabase.from('b1_sistem_uyarilari').update(guncelleme).eq('id', id);
    if (error) throw error;
}

export function denetmenKanaliKur(onChange) {
    return supabase.channel('denetmen-kanal')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_sistem_uyarilari' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b1_agent_loglari' }, onChange)
        .subscribe();
}

export const KONTROL_TIPLERI = ['uretim_kalite', 'stok_eksik', 'musteri_sikayet', 'makina_arizasi', 'guvenlik', 'finans'];
