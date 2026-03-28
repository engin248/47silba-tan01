/**
 * features/stok/services/stokApi.js
 * Tablolar: b2_urun_katalogu, b2_stok_hareketleri
 */
import { supabase } from '@/lib/supabase';
import { telegramBildirim } from '@/lib/utils';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { idb } from '@/lib/idbKalkan';

// ─── OKUMA ────────────────────────────────────────────────────────
export async function stokVeriGetir() {
    const otonomSync = async () => {
        const [urunRes, hareketRes] = await Promise.allSettled([
            supabase.from('b2_urun_katalogu')
                .select('id,urun_kodu,urun_adi,urun_adi_ar,satis_fiyati_tl,stok_adeti,min_stok,b2_stok_hareketleri(adet,hareket_tipi)'),
            supabase.from('b2_stok_hareketleri')
                .select('id,urun_id,hareket_tipi,adet,aciklama,created_at,b2_urun_katalogu(urun_kodu,urun_adi)')
                .order('created_at', { ascending: false }).limit(200),
        ]);

        const urunler = urunRes.status === 'fulfilled' ? urunRes.value.data || [] : [];
        const stokEnvanteri = urunler.map(u => {
            let giris = 0, cikis = 0;
            (u.b2_stok_hareketleri || []).forEach(h => {
                if (h.hareket_tipi === 'giris' || h.hareket_tipi === 'iade') giris += h.adet;
                if (h.hareket_tipi === 'cikis' || h.hareket_tipi === 'fire') cikis += h.adet;
            });
            return { ...u, net_stok: (u.stok_adeti || 0) + giris - cikis };
        });

        if (stokEnvanteri.length > 0) await idb.bulkUpsert('m11_stok', stokEnvanteri);

        return {
            stokEnvanteri,
            hareketler: hareketRes.status === 'fulfilled' ? hareketRes.value.data || [] : [],
        };
    };

    const localStoklar = await idb.getAllWithLimit('m11_stok', 500, 0);

    if (!localStoklar || localStoklar.length === 0) {
        return await otonomSync();
    } else {
        otonomSync(); // UI'ı bloklamadan arka planda güncelle
        return {
            stokEnvanteri: localStoklar,
            hareketler: [], // Otonom sync sonrası dolacak
        };
    }
}

// ─── YAZMA ────────────────────────────────────────────────────────
export async function stokHareketiKaydet(payload) {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b2_stok_hareketleri', 'INSERT', payload);
        return { offline: true };
    }
    const res = await fetch('/api/stok-hareket-ekle', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const sonuc = await res.json().catch(() => ({}));
    if (res.status === 429) throw new Error('⏳ Çok fazla istek!');
    if (res.status === 422) throw new Error('📛 ZOD Kalkanı: Eksik/Hatalı veri engellendi!');
    if (!res.ok) throw new Error(sonuc.hata || 'Sunucu hatası');
    return { offline: false };
}

export async function stokHareketSil(id, urunKodu, kullaniciLabel) {
    await supabase.from('b0_sistem_loglari').insert([{
        tablo_adi: 'b2_stok_hareketleri', islem_tipi: 'SILME',
        kullanici_adi: kullaniciLabel || 'M11 Sorumlusu',
        eski_veri: { durum: `Ürün: ${urunKodu}, ID: ${id}` }
    }]);
    const { error } = await supabase.from('b2_stok_hareketleri').delete().eq('id', id);
    if (error) throw error;
    telegramBildirim(`🚨 KRİTİK: Stok hareketi silindi! Ürün: ${urunKodu}`);
}

// ─── ALARIM KONTROL ───────────────────────────────────────────────
export function kritikStokKontrol(urun, netSonrasi, payload) {
    const limit = urun.min_stok || 10;
    if (netSonrasi <= limit && (payload.hareket_tipi === 'cikis' || payload.hareket_tipi === 'fire')) {
        telegramBildirim(`🚨 KRİTİK STOK!\nÜrün: ${urun.urun_kodu} | ${urun.urun_adi}\nKalan: ${netSonrasi} adet\nSınır: ${limit}`);
    }
}

// ─── REALTIME ─────────────────────────────────────────────────────
export function stokKanaliKur(onChange) {
    return supabase.channel('stok-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_stok_hareketleri' }, onChange)
        .subscribe();
}

export const BOSH_HAREKET = { urun_id: '', hareket_tipi: 'giris', adet: '', aciklama: '' };
