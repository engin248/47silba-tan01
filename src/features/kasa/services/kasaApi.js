/**
 * features/kasa/services/kasaApi.js
 * Tablo: b2_kasa_hareketleri (MainContainer'dan doğrulanan ad)
 */
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

export async function kasaHareketleriGetir() {
    const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı')), 10000));
    const [harRes, musRes] = await Promise.race([
        Promise.allSettled([
            supabase.from('b2_kasa_hareketleri')
                .select('*, b2_musteriler:musteri_id(ad_soyad,musteri_kodu)')
                .order('created_at', { ascending: false }).limit(300),
            supabase.from('b2_musteriler').select('id,musteri_kodu,ad_soyad').eq('aktif', true).limit(500),
        ]),
        timeout,
    ]);
    return {
        hareketler: harRes.status === 'fulfilled' ? (harRes.value.data || []) : [],
        musteriler: musRes.status === 'fulfilled' ? (musRes.value.data || []) : [],
    };
}

export async function kasaHareketiKaydet(payload) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b2_kasa_hareketleri', 'INSERT', payload);
        return { offline: true };
    }
    const { error } = await supabase.from('b2_kasa_hareketleri').insert([{ ...payload, onay_durumu: 'bekliyor' }]);
    if (error) throw error;
    telegramBildirim(`💰 KASA HAREKETİ\nTip: ${payload.hareket_tipi?.toUpperCase()}\nTutar: ₺${parseFloat(payload.tutar_tl || 0).toFixed(2)}`);
    return { offline: false };
}

export async function kasaHareketiSil(id, kullaniciLabel) {
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b2_kasa_hareketleri', islem_tipi: 'SILME',
        kullanici_adi: kullaniciLabel || 'Kasa Yetkilisi',
        eski_veri: { id }
    }]);
    const { error } = await supabase.from('b2_kasa_hareketleri').delete().eq('id', id);
    if (error) throw error;
}

export function kasaBakiyeHesapla(hareketler) {
    const tahsilat = hareketler.filter(h => h.hareket_tipi === 'tahsilat' && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    const iade = hareketler.filter(h => h.hareket_tipi === 'iade_odeme' && h.onay_durumu === 'onaylandi').reduce((s, h) => s + parseFloat(h.tutar_tl || 0), 0);
    return tahsilat - iade;
}

export function kasaKanaliKur(onChange) {
    return supabase.channel('kasa-kanal')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_kasa_hareketleri' }, onChange)
        .subscribe();
}

export const BOSH_HAREKET = { hareket_tipi: 'tahsilat', odeme_yontemi: 'nakit', tutar_tl: '', aciklama: '', vade_tarihi: '', musteri_id: '' };
export const KATEGORILER = ['tahsilat', 'iade_odeme', 'cek', 'senet', 'avans', 'diger'];
