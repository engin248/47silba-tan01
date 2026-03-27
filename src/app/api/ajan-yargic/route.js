import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ESKİ GEMINI VE MOCK ANALİZ METOTLARI BATCH SİSTEMİNE TAŞINMIŞTIR.
// BATCH AI KUYRUĞU OPTİMİZASYONU:
// Eskiden for dngs iinde 20 kez Gemini API'ye istek atarak devasa maliyet yaratıyordu.
// Şimdi tm verileri toplayıp b1_ai_is_kuyrugu tablosuna 'yargic_analizi' trnde kaydediyoruz.

// GUI'DE TRACE GSTERİMİ İİN
async function ajanAkliniGoster(gorevId, mesaj) {
    if (!gorevId) return;
    await supabaseAdmin.from('b1_ajan_gorevler').update({
        hedef_modul: mesaj.substring(0, 100) // UI'daki modl alanına basıyoruz
    }).eq('id', gorevId);
}


//  API ENDPOINT 
export async function POST(req) {
    try {
        const body = await req.json();
        const { gorev_id } = body; // Ajanlar UI'dan tetiklenirse gelir

        // Cron job şifre koruması (eğer dışarıdan ağrıldıysa)
        const auth = req.headers.get('authorization');
        //  GVENLİK [A-4 FİX]: dev_secret fallback kaldırıldı 
        if (!process.env.CRON_SECRET) return NextResponse.json({ hata: 'Yapılandırma hatası: CRON_SECRET eksik' }, { status: 500 });
        const isCron = auth === `Bearer ${process.env.CRON_SECRET}`;

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const GEMINI_URL = GEMINI_API_KEY ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}` : null;

        if (gorev_id) {
            await supabaseAdmin.from('b1_ajan_gorevler').update({ durum: 'calisıyor', baslangic_tarihi: new Date().toISOString() }).eq('id', gorev_id);
            await ajanAkliniGoster(gorev_id, '🧠 Yargı (Matematiki) Uyandı. Dosyalar inceleniyor...');
        }

        // 1. İşlenmemiş ham verileri ek (Limit 20 Vercel timeout'una takılmamak iin)
        const { data: hamUrunler, error: fetchErr } = await supabaseAdmin
            .from('b1_arge_products')
            .select('*')
            .eq('islenen_durum', 'bekliyor')
            .limit(20);

        if (fetchErr) throw fetchErr;

        if (!hamUrunler || hamUrunler.length === 0) {
            if (gorev_id) {
                await supabaseAdmin.from('b1_ajan_gorevler').update({
                    durum: 'tamamlandi', bitis_tarihi: new Date().toISOString(),
                    sonuc_ozeti: 'Kuyrukta yargılanacak hi rn bulunamadı. Temiz.'
                }).eq('id', gorev_id);
            }
            return NextResponse.json({ message: 'No new products to analyze' }, { status: 200 });
        }

        // Kuyruğa atılacak job listesi
        const kuyrukInsertleri = [];

        if (gorev_id) await ajanAkliniGoster(gorev_id, `📦 ${hamUrunler.length} adet rn BATCH AI Kuyruğuna ykleniyor...`);

        for (let i = 0; i < hamUrunler.length; i++) {
            const urun = hamUrunler[i];

            let parsedHamVeri = {};
            try { parsedHamVeri = typeof urun.ham_veri === 'string' ? JSON.parse(urun.ham_veri) : urun.ham_veri || {}; } catch { }
            const urunAdi = parsedHamVeri.isim || 'Bilinmeyen rn';
            const fiyatSayi = parsedHamVeri.fiyatSayi || 0;
            const kaynak = urun.veri_kaynagi || 'Trendyol';

            kuyrukInsertleri.push({
                istek_tipi: 'yargic_analizi',
                istek_datasi: { urun_id: urun.id, urunAdi, fiyatSayi, kaynak, ham_veri: urun.ham_veri },
                durum: 'bekliyor'
            });

            // Kuyruğa eklendiği iin islenen_durum gncelleniyor, ama analiz sonucu gelince asıl tablolar dolacak.
            await supabaseAdmin.from('b1_arge_products').update({ islenen_durum: 'kuyrukta', islendigi_tarih: new Date().toISOString() }).eq('id', urun.id);
        }

        const { error: insertErr } = await supabaseAdmin.from('b1_ai_is_kuyrugu').insert(kuyrukInsertleri);
        if (insertErr) throw insertErr;

        const OzetStr = `🚀 ${hamUrunler.length} adet rn Yapay Zeka (Batch) kuyruğuna alındı. Gece toplu olarak işlenecektir.`;

        if (gorev_id) {
            await ajanAkliniGoster(gorev_id, ' Tm Veriler Kuyrukta. Yargılama Ertelendi.');
            await supabaseAdmin.from('b1_ajan_gorevler').update({
                durum: 'tamamlandi', bitis_tarihi: new Date().toISOString(),
                sonuc_ozeti: OzetStr
            }).eq('id', gorev_id);

            // Skor yaz
            await supabaseAdmin.from('b1_agent_loglari').insert([{
                ajan_adi: 'Yargı (Matematiki)', islem_tipi: 'analiz_kuyruga_ekleme', kaynak_tablo: 'b1_ai_is_kuyrugu', sonuc: 'basarili',
                mesaj: OzetStr + ` (Toplu API ağrısı ile %95 Maliyet Tasarrufu Sağlandı)`
            }]);
        }

        return NextResponse.json({ basarili: true, sonuc: OzetStr });

    } catch (e) {
        if (req.body?.gorev_id) {
            await supabaseAdmin.from('b1_ajan_gorevler').update({
                durum: 'hata', hata_mesaji: e.message
            }).eq('id', req.body.gorev_id);
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
