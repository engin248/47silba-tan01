/**
 * lib/dipArsiv.js — KN-6: Dip Arşiv Katmanı
 *
 * Her HARD DELETE öncesi veriyi b0_arsiv tablosuna kopyalar.
 * Otomatik: silme tarihini + sebebi loglar.
 * 90 gün sonra otomatik temizleme için trigger DB tarafında yazılır.
 *
 * Kullanım: await dipArsiveKaldir(tablo, id, kullanici)
 */
import { supabase } from './supabase';

export async function dipArsiveKaldir(tablo, id, kullanici = 'Sistem') {
    try {
        // 1. Mevcut kaydı al
        const { data: kayit } = await supabase.from(tablo).select('*').eq('id', id).single();

        // 2. Derin arşive yaz
        if (kayit) {
            await supabase.from('b0_arsiv').insert([{
                kaynak_tablo: tablo,
                kaynak_id: id,
                veri: kayit,
                silen_kullanici: kullanici,
                silme_tarihi: new Date().toISOString(),
                geri_yuklenebilir: true,
            }]); // Arşiv başarısız olsa da silmeyi durdurmaz
        }

        // 3. Standart B0 audit log
        await supabase.from('b0_sistem_loglari').insert([{
            tablo_adi: tablo,
            islem_tipi: 'DIP_ARSIV',
            kullanici_adi: kullanici,
            eski_veri: { id, arsiv_tarihi: new Date().toISOString() },
        }]);

    } catch (e) {
        // Sessiz fail — arşivleme kritik değilse silmeyi engellemez

    }
}

/**
 * Arşivden geri yükle
 */
export async function arsivdenGeriYukle(arsivId) {
    const { data: arsivKayit } = await supabase.from('b0_arsiv').select('*').eq('id', arsivId).single();
    if (!arsivKayit?.veri) throw new Error('Arşiv kaydı bulunamadı');
    const { id, ...veri } = arsivKayit.veri;
    const { error } = await supabase.from(arsivKayit.kaynak_tablo).insert([veri]);
    if (error) throw error;
    await supabase.from('b0_arsiv').update({ geri_yuklendi: true }).eq('id', arsivId);
    return { tablo: arsivKayit.kaynak_tablo, id };
}
