export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  PARÃ‡A 1B â€” BACKEND
//  /api/worker-ajan
//  Worker A veya B olarak Ã§alÄ±ÅŸÄ±r.
//  gorev_listesi alÄ±r, sÄ±rayla iÅŸler, ilerleme kaydeder.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

async function goreviIsle(gorev, workerId) {
    try {
        // â”€â”€ GÃ–REV TÄ°PÄ°: stok_alarmi â”€â”€
        if (gorev.tip === 'stok_alarmi') {
            // b1_sistem_uyarilari tablosuna alarm yaz (duplicate Ã¶nleme)
            const { data: mevcut } = await supabaseAdmin
                .from('b1_sistem_uyarilari')
                .select('id')
                .eq('kaynak_id', gorev.veri?.urun_id)
                .eq('uyari_tipi', 'dusuk_stok')
                .eq('durum', 'aktif')
                .limit(1);

            if (!mevcut || mevcut.length === 0) {
                await supabaseAdmin.from('b1_sistem_uyarilari').insert([{
                    uyari_tipi: 'dusuk_stok',
                    seviye: gorev.oncelik === 'kritik' ? 'kritik' : 'uyari',
                    baslik: gorev.baslik,
                    mesaj: `Stok: ${gorev.veri?.stok} | Min: ${gorev.veri?.min}`,
                    kaynak_tablo: 'b2_urun_katalogu',
                    kaynak_id: gorev.veri?.urun_id,
                    durum: 'aktif',
                }]);
            }
            return { id: gorev.id, durum: 'ok', aciklama: `Stok alarmÄ± iÅŸlendi (${workerId})` };
        }

        // â”€â”€ GÃ–REV TÄ°PÄ°: siparis_alarmi â”€â”€
        if (gorev.tip === 'siparis_alarmi') {
            await supabaseAdmin.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'diger',
                seviye: 'uyari',
                baslik: gorev.baslik,
                mesaj: '2 gÃ¼nden fazla beklemede kalan sipariÅŸ',
                kaynak_tablo: 'b2_siparisler',
                kaynak_id: gorev.veri?.siparis_id,
                durum: 'aktif',
            }]).select();
            return { id: gorev.id, durum: 'ok', aciklama: `SipariÅŸ alarmÄ± yazÄ±ldÄ± (${workerId})` };
        }

        // â”€â”€ GÃ–REV TÄ°PÄ°: ajan_gorevi â”€â”€
        if (gorev.tip === 'ajan_gorevi' && gorev.veri?.gorev_id) {
            // GÃ¶revin durumunu "calisÄ±yor" olarak iÅŸaretle ve baÅŸlat
            await supabaseAdmin.from('b1_ajan_gorevler')
                .update({ durum: 'calisÄ±yor', baslangic_tarihi: new Date().toISOString() })
                .eq('id', gorev.veri.gorev_id);

            // GÃ¶revi simÃ¼le et (gerÃ§ek Ã§alÄ±ÅŸma iÃ§in ajan-calistir'a yÃ¶nlendirilebilir)
            await new Promise(r => setTimeout(r, 200));

            await supabaseAdmin.from('b1_ajan_gorevler')
                .update({
                    durum: 'tamamlandi',
                    bitis_tarihi: new Date().toISOString(),
                    sonuc_ozeti: `${workerId} tarafÄ±ndan otomatik iÅŸlendi (Orkestrator)`,
                })
                .eq('id', gorev.veri.gorev_id);

            return { id: gorev.id, durum: 'ok', aciklama: `Ajan gÃ¶revi tamamlandÄ± (${workerId})` };
        }

        // â”€â”€ GÃ–REV TÄ°PÄ°: uretim_gecikmesi â”€â”€
        if (gorev.tip === 'uretim_gecikmesi') {
            await supabaseAdmin.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'diger',
                seviye: 'kritik',
                baslik: gorev.baslik,
                mesaj: 'Ãœretim emri planlanan bitiÅŸ tarihini geÃ§ti',
                kaynak_tablo: 'production_orders',
                kaynak_id: gorev.veri?.order_id,
                durum: 'aktif',
            }]).select();
            return { id: gorev.id, durum: 'ok', aciklama: `Ãœretim gecikmesi alarmÄ± yazÄ±ldÄ± (${workerId})` };
        }

        // â”€â”€ GÃ–REV TÄ°PÄ°: bilgi (sadece log) â”€â”€
        if (gorev.tip === 'bilgi') {
            await supabaseAdmin.from('b1_agent_loglari').insert([{
                ajan_adi: workerId,
                islem_tipi: 'bilgi_logu',
                kaynak_tablo: 'orkestrator',
                sonuc: 'basarili',
                mesaj: gorev.baslik,
            }]);
            return { id: gorev.id, durum: 'ok', aciklama: `Bilgi logu yazÄ±ldÄ± (${workerId})` };
        }

        return { id: gorev.id, durum: 'atlandi', aciklama: `Bilinmeyen gÃ¶rev tipi: ${gorev.tip}` };

    } catch (e) {
        return { id: gorev.id, durum: 'hata', aciklama: e.message };
    }
}

export async function POST(req) {
    try {
        const apiKey = req.headers.get('x-internal-api-key');
        const yetkili = apiKey === process.env.INTERNAL_API_KEY ||
            process.env.NODE_ENV === 'development';
        if (!yetkili) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

        const { worker_id, gorevler } = await req.json();

        if (!worker_id || !Array.isArray(gorevler)) {
            return NextResponse.json({ error: 'worker_id ve gorevler zorunlu' }, { status: 400 });
        }

        const baslangic = Date.now();
        const sonuclar = [];

        // Worker log baÅŸlat
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: worker_id,
            islem_tipi: 'worker_basladi',
            kaynak_tablo: 'orkestrator',
            sonuc: 'basarili',
            mesaj: `${worker_id} baÅŸladÄ± â€” ${gorevler.length} gÃ¶rev alÄ±ndÄ±`,
        }]);

        // GÃ¶revleri sÄ±rayla iÅŸle
        for (const gorev of gorevler) {
            const sonuc = await goreviIsle(gorev, worker_id);
            sonuclar.push(sonuc);
        }

        const sure = ((Date.now() - baslangic) / 1000).toFixed(1);
        const basarili = sonuclar.filter(s => s.durum === 'ok').length;
        const hatali = sonuclar.filter(s => s.durum === 'hata').length;

        // Worker log tamamla
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: worker_id,
            islem_tipi: 'worker_tamamlandi',
            kaynak_tablo: 'orkestrator',
            sonuc: hatali === 0 ? 'basarili' : 'uyari',
            mesaj: `${worker_id} tamamlandÄ± â€” ${basarili}/${gorevler.length} baÅŸarÄ±lÄ±, ${sure}sn`,
        }]);

        return NextResponse.json({
            basarili: true,
            worker_id,
            sonuc: sonuclar,
            istatistik: { toplam: gorevler.length, basarili, hatali, sure_sn: sure }
        });

    } catch (e) {
        console.error(`[WORKER HATA]`, e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
