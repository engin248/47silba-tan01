export const dynamic = 'force-dynamic'
/**
 * NIZAM MODEL HAFIZASI API
 * Endpoint: /api/model-hafizasi?model_id=xxx&model_kodu=MODEL-47-A
 *
 * Mimarisi: Ajan Ã–ÄŸrenmesi AltyapÄ±sÄ±
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * M5 (Kesim bitti) â†’ Zincirci Ajan â†’ modelHafizasiOku(model_id)
 * â†’ "Kritik not var mÄ±?" â†’ EVET â†’ Ãœretim bandÄ±na ALERT
 * â†’ "âš ï¸ Bu modelde dikiÅŸ sorunu yaÅŸanmÄ±ÅŸ â€” geÃ§miÅŸ notlarÄ± oku"
 *
 * Not bÄ±rakan bir kez yazar â†’ tÃ¼m sistem sonsuz kez faydalanÄ±r.
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */

import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key')) {
        return Response.json({ hata: 'Supabase yapÄ±landÄ±rmasÄ± eksik!' }, { status: 500 });
    }

    const supabase = createClient(
        (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'),
        (process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key')
    );

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
        // â”€â”€ SORGU: Bu modele ait tÃ¼m mesajlar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        let query = supabase
            .from('b1_ic_mesajlar')
            .select('id, konu, icerik, tip, oncelik, gonderen_adi, gonderen_modul, created_at, urun_kodu, urun_adi, mesaj_hash')
            .order('created_at', { ascending: false })
            .limit(500);

        if (model_id) {
            query = query.eq('urun_id', model_id);
        } else if (model_kodu) {
            query = query.eq('urun_kodu', model_kodu.toUpperCase());
        }

        // Sadece kritik/sikayet/rapor filtreleme (ajan iÃ§in hÄ±zlÄ± tarama)
        if (sadece_kritik) {
            query = query.or("oncelik.eq.kritik,tip.eq.sikayet,tip.eq.rapor");
        }

        const { data: mesajlar, error } = await query;
        if (error) throw error;

        // â”€â”€ HAFIZA ANALÄ°ZÄ° â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const kritikNotlar = mesajlar.filter(m =>
            m.oncelik === 'kritik' || ['sikayet', 'rapor'].includes(m.tip)
        );
        const uyariVar = kritikNotlar.length > 0;

        // ModÃ¼l bazÄ±nda not sayÄ±larÄ± â€” hangi aÅŸamada sorun yaÅŸandÄ±
        const modulOzeti = mesajlar.reduce((acc, m) => {
            acc[m.gonderen_modul] = (acc[m.gonderen_modul] || 0) + 1;
            return acc;
        }, {});

        // Ã–ÄŸrenme Ã¶zeti â€” ajan bu metni Ã¼retim bandÄ±na iletir
        let ogrenmeMesaji = null;
        if (uyariVar) {
            const konular = kritikNotlar
                .slice(0, 3)
                .map(m => `â€¢ ${m.konu}`)
                .join('\n');

            ogrenmeMesaji =
                `âš ï¸ MODEL GEÃ‡MÄ°Å UYARISI â€” ${model_kodu || model_id}\n\n` +
                `Bu modelde geÃ§miÅŸ Ã¼retim dÃ¶ngÃ¼lerinde ${kritikNotlar.length} kritik not kaydedilmiÅŸtir:\n` +
                konular +
                (kritikNotlar.length > 3 ? `\n... ve ${kritikNotlar.length - 3} kritik not daha` : '') +
                `\n\nÃœretim Ã¶ncesi geÃ§miÅŸ notlarÄ± okuyunuz.`;
        }

        // â”€â”€ YANIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            // Ajan akÄ±ÅŸÄ± iÃ§in anahtar alan
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
            // Tam geÃ§miÅŸ (istenirse)
            mesajlar: mesajlar.map(m => ({
                id: m.id,
                konu: m.konu,
                icerik: m.icerik,
                tip: m.tip,
                oncelik: m.oncelik,
                kaynak: m.gonderen_modul,
                yazan: m.gonderen_adi,
                tarih: m.created_at,
                hash: m.mesaj_hash, // bÃ¼tÃ¼nlÃ¼k doÄŸrulama iÃ§in
            })),
        });

    } catch (err) {
        return Response.json(
            { hata: 'Sorgu hatasÄ±: ' + err.message },
            { status: 500 }
        );
    }
}
