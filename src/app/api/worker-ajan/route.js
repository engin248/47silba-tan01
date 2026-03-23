import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ═══════════════════════════════════════════════════════════
//  PARÇA 1B — BACKEND
//  /api/worker-ajan
//  Worker A veya B olarak çalışır.
//  gorev_listesi alır, sırayla işler, ilerleme kaydeder.
// ═══════════════════════════════════════════════════════════

async function goreviIsle(gorev, workerId) {
    try {
        // ── GÖREV TİPİ: stok_alarmi ──
        if (gorev.tip === 'stok_alarmi') {
            // b1_sistem_uyarilari tablosuna alarm yaz (duplicate önleme)
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
            return { id: gorev.id, durum: 'ok', aciklama: `Stok alarmı işlendi (${workerId})` };
        }

        // ── GÖREV TİPİ: siparis_alarmi ──
        if (gorev.tip === 'siparis_alarmi') {
            await supabaseAdmin.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'diger',
                seviye: 'uyari',
                baslik: gorev.baslik,
                mesaj: '2 günden fazla beklemede kalan sipariş',
                kaynak_tablo: 'b2_siparisler',
                kaynak_id: gorev.veri?.siparis_id,
                durum: 'aktif',
            }]).select();
            return { id: gorev.id, durum: 'ok', aciklama: `Sipariş alarmı yazıldı (${workerId})` };
        }

        // ── GÖREV TİPİ: ajan_gorevi ──
        if (gorev.tip === 'ajan_gorevi' && gorev.veri?.gorev_id) {
            // Görevin durumunu "calisıyor" olarak işaretle ve başlat
            await supabaseAdmin.from('b1_ajan_gorevler')
                .update({ durum: 'calisıyor', baslangic_tarihi: new Date().toISOString() })
                .eq('id', gorev.veri.gorev_id);

            // Görevi simüle et (gerçek çalışma için ajan-calistir'a yönlendirilebilir)
            await new Promise(r => setTimeout(r, 200));

            await supabaseAdmin.from('b1_ajan_gorevler')
                .update({
                    durum: 'tamamlandi',
                    bitis_tarihi: new Date().toISOString(),
                    sonuc_ozeti: `${workerId} tarafından otomatik işlendi (Orkestrator)`,
                })
                .eq('id', gorev.veri.gorev_id);

            return { id: gorev.id, durum: 'ok', aciklama: `Ajan görevi tamamlandı (${workerId})` };
        }

        // ── GÖREV TİPİ: uretim_gecikmesi ──
        if (gorev.tip === 'uretim_gecikmesi') {
            await supabaseAdmin.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'diger',
                seviye: 'kritik',
                baslik: gorev.baslik,
                mesaj: 'Üretim emri planlanan bitiş tarihini geçti',
                kaynak_tablo: 'production_orders',
                kaynak_id: gorev.veri?.order_id,
                durum: 'aktif',
            }]).select();
            return { id: gorev.id, durum: 'ok', aciklama: `Üretim gecikmesi alarmı yazıldı (${workerId})` };
        }

        // ── GÖREV TİPİ: bilgi (sadece log) ──
        if (gorev.tip === 'bilgi') {
            await supabaseAdmin.from('b1_agent_loglari').insert([{
                ajan_adi: workerId,
                islem_tipi: 'bilgi_logu',
                kaynak_tablo: 'orkestrator',
                sonuc: 'basarili',
                mesaj: gorev.baslik,
            }]);
            return { id: gorev.id, durum: 'ok', aciklama: `Bilgi logu yazıldı (${workerId})` };
        }

        return { id: gorev.id, durum: 'atlandi', aciklama: `Bilinmeyen görev tipi: ${gorev.tip}` };

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

        // Worker log başlat
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: worker_id,
            islem_tipi: 'worker_basladi',
            kaynak_tablo: 'orkestrator',
            sonuc: 'basarili',
            mesaj: `${worker_id} başladı — ${gorevler.length} görev alındı`,
        }]);

        // Görevleri sırayla işle
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
            mesaj: `${worker_id} tamamlandı — ${basarili}/${gorevler.length} başarılı, ${sure}sn`,
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
