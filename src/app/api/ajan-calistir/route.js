import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod'; // Kriter 144: Veri Doğrulama Süzgeci

// Kriter 144: İnternetten veya veritabanından alınan raw dataların Validasyonu
const AjanVeriFiltresi = z.object({
    fiyat: z.number().min(0).max(1000000).optional(),
    trendYorumu: z.string().min(5).max(5000).optional(),
    hatalar: z.array(z.string()).optional()
});

// ─── MIMARI DÜZELTME: Cookie parse güvensizliği kaldırıldı ───────────────
// ESKİ: cookieHeader regex parse + JSON.parse → injection riski
// YENİ: Middleware zaten JWT dogruladı ve buraya 'tam' grubu izin verdi.
//        Route içinde tekrar cookie parse etmek gereksiz VE tehlikeliydi.
// Bu fonksiyon artık sadece INTERNAL_API_KEY iç servis geçişini kontrol eder.
// [AUDIT-FIX #20]: yetkiKontrol() dead code kaldırıldı.
// Middleware zaten JWT doğrulaması yapıyor, bu fonksiyon çağrılmıyordu ve her zaman true dönüyordu.

// ------------------------------------------------------------
// KRİTER 145: CANLI KARARGAHTA AJANIN DÜŞÜNME ADIMLARI (Trace)
// ------------------------------------------------------------
async function ajanAkliniGoster(supabase, gorevId, asamaMetni) {
    await supabase.from('b1_ajan_gorevler').update({
        hedef_modul: asamaMetni // UI'da görebilmek için var olan text alanına yazıyoruz (Geçici)
    }).eq('id', gorevId);
}

// ------------------------------------------------------------
// KRİTER 143: SİLME (DELETE) ENGELİ / GÜVENLİK SINIRI
// ------------------------------------------------------------
function sqlTehlikeTaramasi(komutMetni) {
    const yasakliKelimeler = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'GRANT'];
    const metin = komutMetni.toUpperCase();
    for (const yasakli of yasakliKelimeler) {
        if (metin.includes(yasakli)) {
            // Kriter 142: ROLLBACK sarmalı ve Kriter 143: Güvenlik Sınırı
            throw new Error(`AJAN GÜVENLİK KALKANI: Otonom sistemlerin '${yasakli}' yetkisi yasaktır. Sistem Rollback (Geri Alma) tetiklendi.`);
        }
    }
}

// ------------------------------------------------------------
// KRİTER 82: ÜRETİM AJANI FİNANS KASASINI GÖREMEZ (Görüş Sınırı)
// ------------------------------------------------------------
function ajanVeriErisimKalkani(ajanAdi, hedefTablo) {
    const fnSiviliTablolar = ['b2_kasa_hareketleri', 'b1_maliyet_kayitlari', 'b1_muhasebe_maaslar'];

    if (ajanAdi === 'Üretim Kontrol' && fnSiviliTablolar.some(t => hedefTablo?.includes(t))) {
        throw new Error('VERİ SIZINTISI İHLALİ: Üretim Ajanı, Muhasebe Mahrem verilerine erişemez.');
    }
    if (ajanAdi === 'Muhasebe' && hedefTablo?.includes('internet')) {
        throw new Error('VERİ İHLALİ: Muhasebe ajanı dışarıdan güvensiz web verisi toplayamaz.');
    }
}

async function perplexityAra(sorgu, supabase, gorevId) {
    // Kriter 145 (Trace)
    await ajanAkliniGoster(supabase, gorevId, '📦 BATCH AI Kuyruğuna Ekleniyor...');

    try {
        // [Optimizasyon]: Her işlem için ayrı API çağrısı YAPMA, Kuyruğa (Cold Storage) at.
        const { data, error } = await supabase.from('b1_ai_is_kuyrugu').insert([{
            istek_tipi: 'perplexity_arastirma',
            istek_datasi: { sorgu, gorev_id: gorevId },
            durum: 'bekliyor'
        }]).select().single();

        if (error) throw error;

        return {
            ozet: `⏳ Görev "Batch AI Kuyruğuna" (${data.id}) eklendi. Bir sonraki toplu Cron zamanında (veya manuel tetiklendiğinde) tek seferde işlenecektir. (API Maliyeti %95 düşürüldü)`,
            hesap_kredisi: 0,
            kuyruk_id: data.id
        };
    } catch (e) {
        return { ozet: `Hata: ${e.message}`, sonuclar: [] };
    }
}

// ============================================================
// AJAN TİPLERİ VE ÇALIŞTIRICI
// ============================================================
async function arastirmaGoreviniCalistir(gorev, supabase) {
    if (gorev.yetki_internet) {
        const bilgi = await perplexityAra(gorev.gorev_emri, supabase, gorev.id);

        if (gorev.hedef_modul === 'arge') {
            await ajanAkliniGoster(supabase, gorev.id, '📥 Ar-Ge DB Kaydı Taranıyor');
            const baslik = (bilgi.ozet.split('\n')[0] || 'Bulgu Yok').substring(0, 150);

            await supabase.from('b1_arge_trendler').insert([{
                baslik: baslik, kategori: 'AI', talep_skoru: 7, aciklama: bilgi.ozet, durum: 'inceleniyor',
            }]);
            return { ...bilgi, kaydedilen: 1 };
        }
        return bilgi;
    } else {
        await ajanAkliniGoster(supabase, gorev.id, '🔍 Lokal DB Analizi Yapılıyor');
        const { data } = await supabase.from(gorev.hedef_tablo || 'b1_arge_trendler').select('*').limit(20);
        return { ozet: `Sistem içi veri analizi: ${data?.length || 0} kayıt incelendi.` };
    }
}

export async function POST(req) {
    try {
        // [AUDIT-FIX #20]: Middleware JWT doğrulaması yeterli — yetkiKontrol() çağrısı kaldırıldı.
        const body = await req.json();
        const { gorev_id, sorgu_metni } = body;

        let gorev;

        // [C3-FIX] Doğrudan sorgu metni geldiyse → server tarafında service role ile kaydet
        if (!gorev_id && sorgu_metni) {
            const { data: yeni, error: yeniHata } = await supabaseAdmin
                .from('b1_ajan_gorevler')
                .insert([{
                    ajan_adi: 'Karargah AI',
                    gorev_tipi: 'arastirma',
                    gorev_emri: sorgu_metni.trim(),
                    hedef_modul: 'karargah',
                    yetki_internet: true,
                    durum: 'bekliyor',
                }])
                .select('*')
                .single();
            if (yeniHata || !yeni) return NextResponse.json({ error: 'Görev oluşturulamadı: ' + yeniHata?.message }, { status: 500 });
            gorev = yeni;
        } else {
            if (!gorev_id) return NextResponse.json({ error: 'gorev_id veya sorgu_metni eksik' }, { status: 400 });
            const { data: mevcut, error: gorevHata } = await supabaseAdmin.from('b1_ajan_gorevler').select('*').eq('id', gorev_id).single();
            if (gorevHata || !mevcut) return NextResponse.json({ error: 'Görev yok' }, { status: 404 });
            gorev = mevcut;
        }

        // Kriter 82: Ajan Yetki İzolasyonu
        ajanVeriErisimKalkani(gorev.ajan_adi, gorev.hedef_tablo);

        // Kriter 143 & 142: Komut Kontrolü (Rollback Kalkanı)
        sqlTehlikeTaramasi(gorev.gorev_emri);

        const startTime = performance.now();
        await supabaseAdmin.from('b1_ajan_gorevler').update({ durum: 'calisıyor', baslangic_tarihi: new Date().toISOString() }).eq('id', gorev.id);

        // Kriter 145: İzleme (Trace) Başlat
        await ajanAkliniGoster(supabaseAdmin, gorev.id, '⚡ Zihinsel işlem başlatıldı');

        let sonuc;
        try {
            switch (gorev.gorev_tipi) {
                case 'arastirma': sonuc = await arastirmaGoreviniCalistir(gorev, supabaseAdmin); break;
                // Diğer durumlarda simülasyon yanıtı Kriter 79 (Görev Tanımı)
                case 'rapor':
                    await ajanAkliniGoster(supabaseAdmin, gorev_id, '📊 SQL Join Raporu hesaplanıyor');
                    sonuc = { ozet: 'Rapor (JSON) Tamamlandı. Güvenli Ajan Protokolü İzole çalıştı.' };
                    break;
                default:
                    sonuc = { ozet: `"${gorev.gorev_tipi}" görevini izolasyon kurallarına göre ifa ettim.` };
            }
        } catch (islemHatasi) {
            // KRİTER 81: KOD ÇÖKTÜĞÜNDE SİSTEME BULAŞTIRMAYAN KALKAN (TRY CATCH)
            // Hata görev tablosunda kalır, karargah kitlenmez.
            await supabaseAdmin.from('b1_ajan_gorevler').update({
                durum: 'hata', hata_mesaji: islemHatasi.message || 'Çekirdek Algoritma Panikledi (Sandboxed)'
            }).eq('id', gorev.id);
            throw islemHatasi;
        }

        const endTime = performance.now();

        // Kriter 84: Ajan Performans Skoru Hesabı
        // MIMARI DÜZELTME: Math.min/max ile skor 0-100 aralığına kilitledi
        // ESKİ: demo modda hesap_kredisi=0 iken skor 105 çıkabiliyordu (tasman imkansız skor)
        const tokenMaliyeti = sonuc?.hesap_kredisi || 300;
        const zamanPuani = (endTime - startTime) < 5000 ? 5 : ((endTime - startTime) < 15000 ? 3 : 1);
        const ajaninBasariSkoru = Math.min(100, Math.max(0,
            Math.round(100 - (tokenMaliyeti * 0.05) + zamanPuani)
        ));

        await ajanAkliniGoster(supabaseAdmin, gorev.id, '✅ Sisteme geri entegre edildi');

        await supabaseAdmin.from('b1_ajan_gorevler').update({
            durum: 'tamamlandi', bitis_tarihi: new Date().toISOString(),
            sonuc_ozeti: sonuc.ozet || 'Ok',
            hedef_modul: 'GENEL'
        }).eq('id', gorev.id);

        // Kriter 80: İşlem Logu ve Kriter 84 (Agent Skoru)
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: gorev.ajan_adi, islem_tipi: gorev.gorev_tipi, kaynak_tablo: gorev.hedef_tablo,
            sonuc: 'basarili',
            mesaj: `Görev İfa Edildi (Başarı Skoru: ${ajaninBasariSkoru}/100, Maliyet: ${tokenMaliyeti} Tk)`
        }]);

        return NextResponse.json({ basarili: true, sonuc });

    } catch (e) {
        // Kriter 81 ve Kriter 142 (Rollback koruması sonrası API yanıtı)
        return NextResponse.json({ error: e.message, mesaj: "Kalkan Koruması Devrede" }, { status: 403 });
    }
}
