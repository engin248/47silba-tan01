/**
 * features/imalat/services/imalatApi.js
 * Tablo: b1_imalat_emirleri, b1_model_taslaklari
 */
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function imalatEmirleriGetir() {
    const [emirRes, modelRes] = await Promise.allSettled([
        supabase.from('b1_imalat_emirleri').select('*, b1_model_taslaklari:model_id(model_kodu,model_adi)').order('created_at', { ascending: false }).limit(200),
        supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').eq('durum', 'onaylandi').order('model_kodu'),
    ]);
    return {
        emirler: emirRes.status === 'fulfilled' ? emirRes.value.data || [] : [],
        modeller: modelRes.status === 'fulfilled' ? modelRes.value.data || [] : [],
    };
}

export async function imalatEmriKaydet(payload) {
    if (!navigator.onLine) { await cevrimeKuyrugaAl('b1_imalat_emirleri', 'INSERT', payload); return { offline: true }; }
    const { error } = await supabase.from('b1_imalat_emirleri').insert([payload]);
    if (error) throw error;
    telegramBildirim(`🏭 YENİ İMALAT EMRİ\nModel: ${payload.model_kodu || '-'}\nHedef: ${payload.hedef_adet || 0} adet`);
    return { offline: false };
}

export async function imalatDurumGuncelle(id, durum) {
    const { error } = await supabase.from('b1_imalat_emirleri').update({ durum, ...(durum === 'tamamlandi' ? { bitis_tarihi: new Date().toISOString() } : {}) }).eq('id', id);
    if (error) throw error;
}

export async function imalatEmriSil(id, kullaniciLabel) {
    await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b1_imalat_emirleri', islem_tipi: 'SILME', kullanici_adi: kullaniciLabel || 'İmalat Sorumlusu', eski_veri: { id } }]);
    const { error } = await supabase.from('b1_imalat_emirleri').delete().eq('id', id);
    if (error) throw error;
}

export function imalatKanaliKur(onChange) {
    return supabase.channel('imalat-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'b1_imalat_emirleri' }, onChange).subscribe();
}

export function imalatKanaliKapat(kanal) {
    if (kanal) {
        supabase.removeChannel(kanal);
    }
}

export const DURUMLAR = ['bekliyor', 'uretimde', 'tamamlandi', 'iptal'];
export const DURUM_RENK = { bekliyor: '#f59e0b', uretimde: '#3b82f6', tamamlandi: '#10b981', iptal: '#ef4444' };
export const BOSH_FORM = { model_id: '', hedef_adet: '', oncelik: 'normal', baslangic_tarihi: '', notlar: '' };
