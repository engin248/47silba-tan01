import { NextResponse } from 'next/server';
import { TheOrderYargic } from '@/services/TheOrderYargic';

export async function POST(req) {
    try {
        const body = await req.json();

        // UI'dan gelen veya simüle edilen veriler
        const pazarVerisi = body.pazarVerisi || {
            sepetArtisi: true,
            yorumArtisi: true,
            favoriArtisi: true,
            viralIcerik: true,
            trendEgrisi: 'yukselis'
        };

        const stratejiVerisi = body.stratejiVerisi || {
            gorselDikkatCekici: true,
            fiyatEsigiPsikolojikMi: true,
            pazardaBoslukVar: true
        };

        const teknikVeri = body.teknikVeri || {
            zorKalipMi: false,
            hataRiskiYuksek: false,
            ozelMakineSartMi: false
        };

        const operasyonVerisi = body.operasyonVerisi || {
            darbogazVar: false,
            kumasTedarikSuresiKritikMi: false
        };

        const uretimMaliyetVerisi = body.uretimMaliyetVerisi || {
            beklenenMarjYuzdesi: 35 // İyi marj
        };

        const riskVerisi = body.riskVerisi || {
            tekrarEdenSikayetOrani: 5,
            tekTedarikciMi: false,
            alternatifTedarikciYok: false
        };

        const result = TheOrderYargic.analizEt(
            pazarVerisi,
            stratejiVerisi,
            teknikVeri,
            operasyonVerisi,
            uretimMaliyetVerisi,
            riskVerisi
        );

        return NextResponse.json({
            basarili: true,
            motorSonucu: result,
            islenenVeriler: {
                pazarVerisi, stratejiVerisi, teknikVeri, operasyonVerisi, uretimMaliyetVerisi, riskVerisi
            }
        });

    } catch (e) {
        return NextResponse.json({ basarili: false, error: e.message }, { status: 500 });
    }
}
