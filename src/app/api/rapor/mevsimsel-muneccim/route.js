import { NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseAdmin';

// ============================================================
// MEVSİMSEL MÜNECCİM — THE ORDER / NIZAM
// /api/rapor/mevsimsel-muneccim
//
// GET  → Son 3 yılın aynı dönemi satış + trend analizi
//        "Geçen yıl bu ay X fırladı, önceden hazırlan" uyarısı
// ============================================================

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const tarihStr = url.searchParams.get('tarih');
        const hedefTarih = tarihStr ? new Date(tarihStr) : new Date();
        const hedefAy = hedefTarih.getMonth() + 1; // 1-12
        const hedefYil = hedefTarih.getFullYear();
        const ilerideGun = parseInt(url.searchParams.get('ileri') || '30'); // Kaç gün öncesinden uyar

        // ─ Son 3 yılın aynı ayı verisi ───────────────────────
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

            // Sipariş verileri
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

        // ─ Tahmin motoru ──────────────────────────────────────
        const ciroOrtalama = gecmisAnaliz.length > 0
            ? gecmisAnaliz.reduce((s, a) => s + a.siparis_ciro, 0) / gecmisAnaliz.length
            : 0;

        const enYuksekCiro = gecmisAnaliz.reduce((maks, a) => a.siparis_ciro > maks ? a.siparis_ciro : maks, 0);
        const enYuksekYil = gecmisAnaliz.find(a => a.siparis_ciro === enYuksekCiro);

        const trendArtis = gecmisAnaliz.length >= 2 &&
            gecmisAnaliz[0].siparis_ciro > gecmisAnaliz[1].siparis_ciro * 1.1; // %10+ artış trendi

        // Trend kategorisi tespiti
        const kategoriBirikimleri = {};
        for (const a of gecmisAnaliz) {
            // Placeholder — gerçek kategori verisi trend tablosundaki kategori alanından
        }

        // ─ Uyarı mesajı ──────────────────────────────────────
        const uyarilar = [];
        if (enYuksekYil) {
            uyarilar.push(`📅 Geçen ${enYuksekYil.yil} yılı ${hedefAy}. ay'da ${enYuksekYil.siparis_ciro.toLocaleString('tr-TR')} TL ciro gerçekleşti.`);
        }
        if (trendArtis) {
            uyarilar.push(`📈 Son yıl bu ay ön yıla göre %${Math.round(((gecmisAnaliz[0].siparis_ciro - gecmisAnaliz[1].siparis_ciro) / Math.max(gecmisAnaliz[1].siparis_ciro, 1)) * 100)} artış yaşandı.`);
        }
        if (ciroOrtalama > 0) {
            uyarilar.push(`💡 Tahmin: Bu ay yaklaşık ${Math.round(ciroOrtalama * 1.05).toLocaleString('tr-TR')} TL ciro beklenmektedir.`);
        }
        uyarilar.push(`⏰ ${ilerideGun} gün öncesinden hammadde ve üretim kapasitesini hazırlayın.`);

        // ─ Log ───────────────────────────────────────────────
        if (ciroOrtalama > 0) {
            await sb.from('b1_agent_loglari').insert([{
                ajan_adi: 'Mevsimsel Müneccim',
                islem_tipi: 'mevsim_tahmini',
                kaynak_tablo: 'b1_arge_trendler + b2_siparisler',
                sonuc: 'basarili',
                mesaj: `${hedefAy}. ay için son 3 yıl analizi tamamlandı. Tahmini ciro: ${Math.round(ciroOrtalama).toLocaleString('tr-TR')} TL`,
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
