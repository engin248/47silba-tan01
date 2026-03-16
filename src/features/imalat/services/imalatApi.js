/**
 * features/imalat/services/imalatApi.js
 * Tablo: b1_imalat_emirleri, b1_model_taslaklari
 */
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function imalatEmirleriGetir() {
    const [emirRes, modelRes] = await Promise.allSettled([
        supabase.from('production_orders').select('*, b1_model_taslaklari:model_id(model_kodu,model_adi)').order('created_at', { ascending: false }).limit(200),
        supabase.from('b1_model_taslaklari').select('id,model_kodu,model_adi').eq('durum', 'onaylandi').order('model_kodu'),
    ]);
    return {
        emirler: emirRes.status === 'fulfilled' ? emirRes.value.data || [] : [],
        modeller: modelRes.status === 'fulfilled' ? modelRes.value.data || [] : [],
    };
}

export async function imalatEmriKaydet(payload) {
    if (!navigator.onLine) { await cevrimeKuyrugaAl('production_orders', 'INSERT', payload); return { offline: true }; }
    const { error } = await supabase.from('production_orders').insert([payload]);
    if (error) throw error;
    telegramBildirim(`🏭 YENİ İMALAT EMRİ\nModel: ${payload.model_kodu || '-'}\nHedef: ${payload.quantity || 0} adet`);
    return { offline: false };
}

export async function imalatDurumGuncelle(id, durum) {
    const { error } = await supabase.from('production_orders').update({ status: durum, ...(durum === 'completed' ? { updated_at: new Date().toISOString() } : {}) }).eq('id', id); // [M1 FIX] end_time sütunu yok, updated_at kullanıldı
    if (error) throw error;

    // 🚨 EKİP GAMMA: Üretim-Stok Entegrasyonu (Otomasyon Pınarı)
    // Eğer üretim bittiyse (completed -> Devir/Mağazaya Sevk) stoklardan otomatik düşüş ve giriş yap
    if (durum === 'completed') {
        try {
            // 1. İş Emrine ait Model/Ürün Kodunu Çek
            const { data: emir } = await supabase.from('production_orders').select('model_id, quantity').eq('id', id).single();
            if (emir && emir.model_id) {
                const islemTarihi = new Date().toISOString();
                // 2. b2_stok_hareketleri Tablosuna Otonom İşlemleri Yaz (Transaction simülasyonu)
                await supabase.from('b2_stok_hareketleri').insert([
                    // ÇIKIŞ: İmalata Sevk Edilen Kumaş / Hammadde (Formülasyon: Adet x 1.5m kumaş varsayımı veya revize edilebilir)
                    { urun_kodu: 'HAMMADDE-KUMAS', hareket_yonu: 'cikis', miktar: emir.quantity * 1.5, birim: 'Metre', islem_tarihi: islemTarihi, aciklama: `[OTONOM] ${emir.model_id} kodlu imalat için kumaş çıkışı`, referans_tipi: 'imalat', referans_id: id },
                    // GİRİŞ: Üretimden Gelen Bitmiş Ürün Stoğu
                    { urun_kodu: emir.model_id, hareket_yonu: 'giris', miktar: emir.quantity, birim: 'Adet', islem_tarihi: islemTarihi, aciklama: `[OTONOM] ${emir.model_id} kodlu imalat tamamlandı (Mağazaya M4 Sevk)`, referans_tipi: 'imalat', referans_id: id }
                ]);

                // Ekstra Otonom Log
                await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'b2_stok_hareketleri', islem_tipi: 'OTOMATIK_STOK_GUNCELLEME', kullanici_adi: 'SİSTEM (GAMMA AJAN)', eski_veri: { durum: 'imalat_bitti', emir_id: id, miktar: emir.quantity } }]);
            }
        } catch (stokErr) {
            console.error("Otomatik stok güncellenirken hata oluştu (Sessiz Fallback):", stokErr);
        }
    }
}

export async function imalatEmriSil(id, kullaniciLabel) {
    await supabase.from('b0_sistem_loglari').insert([{ tablo_adi: 'production_orders', islem_tipi: 'SILME', kullanici_adi: kullaniciLabel || 'İmalat Sorumlusu', eski_veri: { id } }]);
    const { error } = await supabase.from('production_orders').delete().eq('id', id);
    if (error) throw error;
}

export function imalatKanaliKur(onChange) {
    return supabase.channel('imalat-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders' }, onChange).subscribe();
}

export const DURUMLAR = ['pending', 'in_progress', 'completed', 'cancelled'];
export const DURUM_RENK = { pending: '#f59e0b', in_progress: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' };
export const BOSH_FORM = { model_id: '', quantity: '', oncelik: 'normal', planned_start_date: '', notlar: '' };
