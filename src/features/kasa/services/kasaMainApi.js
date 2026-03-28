import { supabase } from '@/lib/supabase';
import { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';
import { idb } from '@/lib/idbKalkan';

export const kasaVerileriniGetir = async (timeoutPromise) => {
    // 1. Önce IDB (Local DB) üzerinden anında (0ms) verileri çekiyoruz
    const localKasa = await idb.getAllWithLimit('m9_kasa', 500, 0);

    // 2. Arka planda Supabase'den güncel verileri çekip Local DB'yi sync ediyoruz (Otonom)
    const otonomSync = async () => {
        const reqs = Promise.allSettled([
            supabase.from('b2_kasa_hareketleri')
                .select('*, b2_musteriler:musteri_id(ad_soyad, musteri_kodu), b1_personel:personel_id(ad_soyad, personel_kodu)')
                .order('created_at', { ascending: false }).limit(300),
            supabase.from('b2_musteriler').select('id,musteri_kodu,ad_soyad').eq('aktif', true).limit(500),
            supabase.from('b1_personel').select('id,personel_kodu,ad_soyad').eq('durum', 'aktif').limit(300),
        ]);
        const res = await Promise.race([reqs, timeoutPromise]);

        // Gelen güncel verileri IndexedDB'ye göm
        if (res[0]?.status === 'fulfilled' && res[0].value.data) {
            await idb.bulkUpsert('m9_kasa', res[0].value.data);
        }
        return res;
    };

    // 3. Eğer Local DB boşsa (ilk giriş) veya internet hızımız çok iyiyse senkronu bekle
    // Aksi halde anında Local veriyi dön, UI renderlansın!
    if (!localKasa || localKasa.length === 0) {
        return await otonomSync();
    } else {
        otonomSync(); // Arkada asenkron bırak, UI'ı bloklama
        // Uyumlu formatta (Promise.allSettled pattern) dönüyoruz. Personel ve Müşteri dropdownları için de mock dönüyoruz.
        return [
            { status: 'fulfilled', value: { data: localKasa } },
            { status: 'fulfilled', value: { data: [] } }, // Gerçek uygulamada Müşteri'leri de IDB'den çekebilirsiniz
            { status: 'fulfilled', value: { data: [] } }
        ];
    }
};

export const kasaGercekZamanliKur = (onDegisiklik) => {
    return supabase.channel('kasa-gercek-zamanli-optimize')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b2_kasa_hareketleri' }, onDegisiklik)
        .subscribe();
};

export const kasaKanaliniKapat = (kanal) => {
    if (kanal) supabase.removeChannel(kanal);
};

export const kasaHareketiEkle = async (veri) => {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b2_kasa_hareketleri', 'INSERT', veri);
        return { offline: true };
    }
    const { error } = await supabase.from('b2_kasa_hareketleri').insert([veri]);
    if (error) throw error;
    return { offline: false };
};

export const kasaHareketiOnayDegistir = async (id, yeniOnay) => {
    if (!navigator.onLine) {
        await cevrimeKuyrugaAl('b2_kasa_hareketleri', 'UPDATE', { id, onay_durumu: yeniOnay });
        return { offline: true };
    }
    const { error } = await supabase.from('b2_kasa_hareketleri').update({ onay_durumu: yeniOnay }).eq('id', id);
    if (error) throw error;
    return { offline: false };
};

export const kasaHareketiSil = async (id, kullanici) => {
    // SİSTEM OPTİMİZASYONU: B0 Kara Kutu silme logu
    try {
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: 'b2_kasa_hareketleri', islem_tipi: 'SILME',
            kullanici_adi: kullanici?.label || 'Kasa Yetkilisi',
            eski_veri: { mesaj: `Kasa hareketi silindi. ID: ${id}` }
        }]);
    } catch (e) {
        console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ]', e);
    }

    const { error } = await supabase.from('b2_kasa_hareketleri').delete().eq('id', id);
    if (error) throw error;
};

export const kasaCsvIndir = (hareketler, filtreTip, filtreOnay) => {
    const filtreli = hareketler.filter(h => {
        const tipOk = filtreTip === 'hepsi' || h.hareket_tipi === filtreTip;
        const onayOk = filtreOnay === 'hepsi' || h.onay_durumu === filtreOnay;
        return tipOk && onayOk;
    });

    const baslik = ['Tarih', 'Tip', 'Ödeme Yöntemi', 'Açıklama', 'Tutar (TL)', 'Onay Durumu', 'Müşteri', 'Vade Tarihi'];
    const satirlar = filtreli.map(h => [
        h.created_at ? new Date(h.created_at).toLocaleDateString('tr-TR') : '',
        h.hareket_tipi || '',
        h.odeme_yontemi || '',
        h.aciklama || '',
        parseFloat(h.tutar_tl || 0).toFixed(2),
        h.onay_durumu || '',
        h.b2_musteriler?.ad_soyad || '',
        h.vade_tarihi ? new Date(h.vade_tarihi).toLocaleDateString('tr-TR') : '',
    ]);

    const encodeField = (val) => {
        const s = String(val ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const icerik = [baslik, ...satirlar].map(r => r.map(encodeField).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + icerik], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kasa_hareketleri_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
};
