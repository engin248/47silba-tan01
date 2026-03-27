/**
 * features/kasa/services/kasaApi.js
 * Tablo: b2_kasa_hareketleri (MainContainer'dan doğrulanan ad)
 */
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';

const SAYFA_BOYUTU = 50;

export async function kasaHareketleriGetir(sayfa = 0) {
    const from = sayfa * SAYFA_BOYUTU;
    const to = from + SAYFA_BOYUTU - 1;
    const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Zaman aşımı')), 10000));
    const [harRes, musRes] = await Promise.race([
        Promise.allSettled([
            supabase.from('b2_kasa_hareketleri')
                .select('*, b2_musteriler:musteri_id(ad_soyad,musteri_kodu)', { count: 'exact' })
                .order('created_at', { ascending: false }).range(from, to),
            supabase.from('b2_musteriler').select('id,musteri_kodu,ad_soyad').eq('aktif', true).limit(500),
        ]),
        timeout,
    ]);
    return {
        hareketler: harRes.status === 'fulfilled' ? (harRes.value.data || []) : [],
        toplamSayisi: harRes.status === 'fulfilled' ? (harRes.value.count || 0) : 0,
        musteriler: musRes.status === 'fulfilled' ? (musRes.value.data || []) : [],
        sayfaBoyutu: SAYFA_BOYUTU,
    };
}

export async function kasaHareketiKaydet(payload) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b2_kasa_hareketleri', 'INSERT', payload);
        return { offline: true };
    }
    // 🔒 Race Condition Koruması: Son 10 saniyede aynı tutarlı hareket var mı?
    const onSaniyeOnce = new Date(Date.now() - 10000).toISOString();
    const { data: mevcut } = await supabase
        .from('b2_kasa_hareketleri')
        .select('id')
        .eq('hareket_tipi', payload.hareket_tipi)
        .eq('tutar_tl', payload.tutar_tl)
        .gte('created_at', onSaniyeOnce)
        .limit(1);
    if (mevcut && mevcut.length > 0) {
        throw new Error('⚠️ Bu işlem 10 saniye içinde zaten kaydedilmiş. Çift kayıt engellendi.');
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
