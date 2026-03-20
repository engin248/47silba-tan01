export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseAdmin';

// ============================================================
// MEVSÄ°MSEL MÃœNECCÄ°M â€” THE ORDER / NIZAM
// /api/rapor/mevsimsel-muneccim
//
// GET  â†’ Son 3 yÄ±lÄ±n aynÄ± dÃ¶nemi satÄ±ÅŸ + trend analizi
//        "GeÃ§en yÄ±l bu ay X fÄ±rladÄ±, Ã¶nceden hazÄ±rlan" uyarÄ±sÄ±
// ============================================================

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const tarihStr = url.searchParams.get('tarih');
        const hedefTarih = tarihStr ? new Date(tarihStr) : new Date();
        const hedefAy = hedefTarih.getMonth() + 1; // 1-12
        const hedefYil = hedefTarih.getFullYear();
        const ilerideGun = parseInt(url.searchParams.get('ileri') || '30'); // KaÃ§ gÃ¼n Ã¶ncesinden uyar

        // â”€ Son 3 yÄ±lÄ±n aynÄ± ayÄ± verisi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const yillar = [hedefYil - 1, hedefYil - 2, hedefYil - 3];
        const gecmisAnaliz = [];

        for (const yil of yillar) {
            const ayBasi = `${yil}-${String(hedefAy).padStart(2, '0')}-01`;
            const aySonu = `${yil}-${String(hedefAy).padStart(2, '0')}-31`;

            // Trend/talep verileri
            const { data: trendler } = await sb
                .from('b1_arge_trendler')
                .select('id, baslik, talep_skoru, kategori, created_at')
                .gte('created_at', ayBasi)
                .lte('created_at', aySonu)
                .limit(50);

            // SipariÅŸ verileri
            const { data: siparisler } = await sb
                .from('b2_siparisler')
                .select('id, toplam_tutar, durum, created_at')
                .gte('created_at', ayBasi)
                .lte('created_at', aySonu)
                .limit(200);

            const siparisToplam = (siparisler || []).reduce((s, o) => s + (Number(o.toplam_tutar) || 0), 0);

            gecmisAnaliz.push({
                yil,
                ay: hedefAy,
                trend_sayisi: (trendler || []).length,
                ortalama_talep_skoru: (trendler || []).length > 0
                    ? parseFloat(((trendler || []).reduce((s, t) => s + (t.talep_skoru || 0), 0) / (trendler || []).length).toFixed(1))
                    : 0,
                siparis_adedi: (siparisler || []).length,
                siparis_ciro: parseFloat(siparisToplam.toFixed(2)),
                en_cok_talep: (trendler || []).sort((a, b) => (b.talep_skoru || 0) - (a.talep_skoru || 0))[0]?.baslik || null,
            });
        }

        // â”€ Tahmin motoru â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const ciroOrtalama = gecmisAnaliz.length > 0
            ? gecmisAnaliz.reduce((s, a) => s + a.siparis_ciro, 0) / gecmisAnaliz.length
            : 0;

        const enYuksekCiro = gecmisAnaliz.reduce((maks, a) => a.siparis_ciro > maks ? a.siparis_ciro : maks, 0);
        const enYuksekYil = gecmisAnaliz.find(a => a.siparis_ciro === enYuksekCiro);

        const trendArtis = gecmisAnaliz.length >= 2 &&
            gecmisAnaliz[0].siparis_ciro > gecmisAnaliz[1].siparis_ciro * 1.1; // %10+ artÄ±ÅŸ trendi

        // Trend kategorisi tespiti
        const kategoriBirikimleri = {};
        for (const a of gecmisAnaliz) {
            // Placeholder â€” gerÃ§ek kategori verisi trend tablosundaki kategori alanÄ±ndan
        }

        // â”€ UyarÄ± mesajÄ± â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const uyarilar = [];
        if (enYuksekYil) {
            uyarilar.push(`ğŸ“… GeÃ§en ${enYuksekYil.yil} yÄ±lÄ± ${hedefAy}. ay'da ${enYuksekYil.siparis_ciro.toLocaleString('tr-TR')} TL ciro gerÃ§ekleÅŸti.`);
        }
        if (trendArtis) {
            uyarilar.push(`ğŸ“ˆ Son yÄ±l bu ay Ã¶n yÄ±la gÃ¶re %${Math.round(((gecmisAnaliz[0].siparis_ciro - gecmisAnaliz[1].siparis_ciro) / Math.max(gecmisAnaliz[1].siparis_ciro, 1)) * 100)} artÄ±ÅŸ yaÅŸandÄ±.`);
        }
        if (ciroOrtalama > 0) {
            uyarilar.push(`ğŸ’¡ Tahmin: Bu ay yaklaÅŸÄ±k ${Math.round(ciroOrtalama * 1.05).toLocaleString('tr-TR')} TL ciro beklenmektedir.`);
        }
        uyarilar.push(`â° ${ilerideGun} gÃ¼n Ã¶ncesinden hammadde ve Ã¼retim kapasitesini hazÄ±rlayÄ±n.`);

        // â”€ Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (ciroOrtalama > 0) {
            await sb.from('b1_agent_loglari').insert([{
                ajan_adi: 'Mevsimsel MÃ¼neccim',
                islem_tipi: 'mevsim_tahmini',
                kaynak_tablo: 'b1_arge_trendler + b2_siparisler',
                sonuc: 'basarili',
                mesaj: `${hedefAy}. ay iÃ§in son 3 yÄ±l analizi tamamlandÄ±. Tahmini ciro: ${Math.round(ciroOrtalama).toLocaleString('tr-TR')} TL`,
            }]);
        }

        return NextResponse.json({
            basarili: true,
            hedef_ay: { yil: hedefYil, ay: hedefAy },
            tahmin: {
                tahmini_ciro_tl: Math.round(ciroOrtalama),
                en_yuksek_gecmis_yil: enYuksekYil?.yil || null,
                en_yuksek_ciro: enYuksekCiro,
                yukselen_trend: trendArtis,
            },
            son_3_yil_analiz: gecmisAnaliz,
            uyarilar,
            tarih: new Date().toISOString(),
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
