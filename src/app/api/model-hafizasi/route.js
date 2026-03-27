/**
 * NIZAM MODEL HAFIZASI API
 * Endpoint: /api/model-hafizasi?model_id=xxx&model_kodu=MODEL-47-A
 *
 * Mimarisi: Ajan ğrenmesi Altyapısı
 * 
 * M5 (Kesim bitti) → Zincirci Ajan → modelHafizasiOku(model_id)
 * → "Kritik not var mı?" → EVET → retim bandına ALERT
 * → "️ Bu modelde dikiş sorunu yaşanmış — gemiş notları oku"
 *
 * Not bırakan bir kez yazar → tm sistem sonsuz kez faydalanır.
 * 
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {

    const { searchParams } = new URL(request.url);
    const model_id = searchParams.get('model_id');
    const model_kodu = searchParams.get('model_kodu');
    const sadece_kritik = searchParams.get('sadece_kritik') === 'true';

    if (!model_id && !model_kodu) {
        return Response.json(
            { hata: 'model_id veya model_kodu parametresi gerekli.' },
            { status: 400 }
        );
    }

    try {
        //  SORGU: Bu modele ait tm mesajlar 
        let query = supabaseAdmin
            .from('b1_ic_mesajlar')
            .select('id, konu, icerik, tip, oncelik, gonderen_adi, gonderen_modul, created_at, urun_kodu, urun_adi, mesaj_hash')
            .order('created_at', { ascending: false })
            .limit(500);

        if (model_id) {
            query = query.eq('urun_id', model_id);
        } else if (model_kodu) {
            query = query.eq('urun_kodu', model_kodu.toUpperCase());
        }

        // Sadece kritik/sikayet/rapor filtreleme (ajan iin hızlı tarama)
        if (sadece_kritik) {
            query = query.or("oncelik.eq.kritik,tip.eq.sikayet,tip.eq.rapor");
        }

        const { data: mesajlar, error } = await query;
        if (error) throw error;

        //  HAFIZA ANALİZİ 
        const kritikNotlar = mesajlar.filter(m =>
            m.oncelik === 'kritik' || ['sikayet', 'rapor'].includes(m.tip)
        );
        const uyariVar = kritikNotlar.length > 0;

        // Modl bazında not sayıları — hangi aşamada sorun yaşandı
        const modulOzeti = mesajlar.reduce((acc, m) => {
            acc[m.gonderen_modul] = (acc[m.gonderen_modul] || 0) + 1;
            return acc;
        }, {});

        // ğrenme zeti — ajan bu metni retim bandına iletir
        let ogrenmeMesaji = null;
        if (uyariVar) {
            const konular = kritikNotlar
                .slice(0, 3)
                .map(m => `• ${m.konu}`)
                .join('\n');

            ogrenmeMesaji =
                `️ MODEL GEMİŞ UYARISI — ${model_kodu || model_id}\n\n` +
                `Bu modelde gemiş retim dnglerinde ${kritikNotlar.length} kritik not kaydedilmiştir:\n` +
                konular +
                (kritikNotlar.length > 3 ? `\n... ve ${kritikNotlar.length - 3} kritik not daha` : '') +
                `\n\nretim ncesi gemiş notları okuyunuz.`;
        }

        //  YANIT 
        return Response.json({
            model_id,
            model_kodu: mesajlar[0]?.urun_kodu || model_kodu,
            model_adi: mesajlar[0]?.urun_adi || null,
            ozet: {
                toplam_not: mesajlar.length,
                kritik_not_sayisi: kritikNotlar.length,
                uyari_var: uyariVar,
                modul_dagilimi: modulOzeti,
            },
            // Ajan akışı iin anahtar alan
            ogrenme: {
                uyari_var: uyariVar,
                mesaj: ogrenmeMesaji,
                kritik_notlar: kritikNotlar.map(m => ({
                    konu: m.konu,
                    tip: m.tip,
                    oncelik: m.oncelik,
                    kaynak: m.gonderen_modul,
                    tarih: m.created_at,
                })),
            },
            // Tam gemiş (istenirse)
            mesajlar: mesajlar.map(m => ({
                id: m.id,
                konu: m.konu,
                icerik: m.icerik,
                tip: m.tip,
                oncelik: m.oncelik,
                kaynak: m.gonderen_modul,
                yazan: m.gonderen_adi,
                tarih: m.created_at,
                hash: m.mesaj_hash, // btnlk doğrulama iin
            })),
        });

    } catch (err) {
        return Response.json(
            { hata: 'Sorgu hatası: ' + err.message },
            { status: 500 }
        );
    }
}
