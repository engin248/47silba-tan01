import { NextResponse } from 'next/server';
import { M1GelistirilmisTrendMotoru } from '@/services/M1TrendAnalizMotoru';

export async function POST(req) {
    try {
        const body = await req.json();

        // Gelen test/simlasyon verisi, yoksa varsayılan rastgele bir rn profili atayalım
        const rawData = body.rawData || {
            veriGecikmesiSaat: 2,
            toplamIzlenme: 1250000,
            yorumSayisi: 850,
            sepetTotal: 12000,
            satisSinyali: 11500, // Dnşm yksek

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
            ayinGunu: 15,          // Maaş gn (Tetikleyici)
            ozelGunAdi: null,
            ozelGuneKalanGun: null,
            urunPiyasadaKacGundurVar: 5,
            yorumKelimeleri: "",
            birYildizOrani: 2,

            // Hava Katmanı
            gelecek15GunHavaTahmini: "ani_soguma",
            urunIklimTipi: "soguk",
            urunHavaIhtiyaci: "ani_soguma" // CUK OTURDU
        };

        const result = M1GelistirilmisTrendMotoru.trendiKoklaVeriEle(rawData);

        // UI iin ham verileri ve logu geri dnyoruz
        return NextResponse.json({
            basarili: true,
            motorSonucu: result,
            islenenVeri: rawData
        });

    } catch (e) {
        return NextResponse.json({ basarili: false, error: e.message }, { status: 500 });
    }
}
