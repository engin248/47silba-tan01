export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { M1GelistirilmisTrendMotoru } from '@/services/M1TrendAnalizMotoru';

export async function POST(req) {
    try {
        const body = await req.json();

        // Gelen test/simÃ¼lasyon verisi, yoksa varsayÄ±lan rastgele bir Ã¼rÃ¼n profili atayalÄ±m
        const rawData = body.rawData || {
            veriGecikmesiSaat: 2,
            toplamIzlenme: 1250000,
            yorumSayisi: 850,
            sepetTotal: 12000,
            satisSinyali: 11500, // DÃ¶nÃ¼ÅŸÃ¼m yÃ¼ksek

            sepetDeltasi: 400,
            yorumDeltasi: 35,
            favoriDeltasi: 800,

            izlenmeHizi_Gunluk: 45000,
            baskaHesaptaKopyaSikligi: 4,

            saticiSayisi: 2,
            ilkSayfaDoygunlugu_Yuzde: 10,
            pazarTamamenDoymus: false,

            pozitifYorumOrani: 85,
            ayniKelimelerTekrarliyorMu: false,

            trendKategorisi: 'hizli_moda',
            trendEgrisi: 'yukselis',
            asilisGunu: 5,
            sezonBitiyorMu: false,

            ilk10RakiplerinFiyatOrtalamasi: 420,
            fiyatSon3GundeCokDegisti: false,
            mevcutMarj: 25,

            viralHizi_Zirvede_Mi: true,
            yorumDeltasi_Artis_Trendi: true,

            enCokSatanIcerikTipi: 'Kutu Acilisi',

            platformSayisi: 3,
            veriGecmisiGun: 7,

            benzerVaryantSayisi: 1,

            // Makro Katmanlar
            ayinGunu: 15,          // MaaÅŸ gÃ¼nÃ¼ (Tetikleyici)
            ozelGunAdi: null,
            ozelGuneKalanGun: null,
            urunPiyasadaKacGundurVar: 5,
            yorumKelimeleri: "",
            birYildizOrani: 2,

            // Hava KatmanÄ±
            gelecek15GunHavaTahmini: "ani_soguma",
            urunIklimTipi: "soguk",
            urunHavaIhtiyaci: "ani_soguma" // CUK OTURDU
        };

        const result = M1GelistirilmisTrendMotoru.trendiKoklaVeriEle(rawData);

        // UI iÃ§in ham verileri ve logu geri dÃ¶nÃ¼yoruz
        return NextResponse.json({
            basarili: true,
            motorSonucu: result,
            islenenVeri: rawData
        });

    } catch (e) {
        return NextResponse.json({ basarili: false, error: e.message }, { status: 500 });
    }
}
