import { NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseAdmin';

// ============================================================
// TEDARİKÇİ / FASON SABIKA KAYDI — MİZANET
// /api/rapor/sabika-kaydi
//
// GET  → Fason/tedarikçi gecikme + defo/iade skorları
// POST → Manuel iade/defo kaydı ekle
// ============================================================

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const gunSayisi = parseInt(url.searchParams.get('gun') || '90');
        const baslangic = new Date(Date.now() - gunSayisi * 86400000).toISOString();

        // ─ Üretim emirlerinden fason gecikme analizi ─────────
        const { data: uretimler } = await sb
            .from('production_orders')
            .select('id, model_id, status, planned_end_date, completed_at, quantity, created_at, notes')
            .gte('created_at', baslangic)
            .limit(200);

        // ─ Manuel sabıka kayıtlarını çek ─────────────────────
        const { data: sabikaKayitlari } = await sb
            .from('b1_tedarikci_sabika')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        // ─ Model bazında gecikme hesabı ───────────────────────
        const modelSabika = {};
        for (const u of (uretimler || [])) {
            const key = u.model_id || 'bilinmiyor';
            if (!modelSabika[key]) {
                modelSabika[key] = {
                    model_id: key,
                    toplam_siparis: 0,
                    gec_teslim: 0,
                    zamaninda: 0,
                    gecikme_gun_toplam: 0,
                };
            }
            modelSabika[key].toplam_siparis++;

            if (u.planned_end_date && u.completed_at) {
                const plan = new Date(u.planned_end_date).getTime();
                const bitis = new Date(u.completed_at).getTime();
                const fark = (bitis - plan) / 86400000;
                if (fark > 0) {
                    modelSabika[key].gec_teslim++;
                    modelSabika[key].gecikme_gun_toplam += fark;
                } else {
                    modelSabika[key].zamaninda++;
                }
            }
        }

        // ─ Güven Skoru hesabı ────────────────────────────────
        const guvenSkorları = Object.values(modelSabika).map(m => {
            const gec_oran = m.toplam_siparis > 0 ? (m.gec_teslim / m.toplam_siparis) * 100 : 0;
            const ort_gecikme = m.gec_teslim > 0 ? m.gecikme_gun_toplam / m.gec_teslim : 0;

            // 100 üzerinden güven skoru: gecikme ve defo düştükçe skor düşer
            const guven_skoru = Math.max(0, Math.round(100 - (gec_oran * 0.7) - (ort_gecikme * 2)));

            return {
                ...m,
                gec_teslim_oran_yuzde: parseFloat(gec_oran.toFixed(1)),
                ortalama_gecikme_gun: parseFloat(ort_gecikme.toFixed(1)),
                guven_skoru,
                karar: guven_skoru >= 80 ? '✅ Güvenilir' : guven_skoru >= 60 ? '⚠️ Dikkatli Ol' : '🚨 Riskli',
            };
        }).sort((a, b) => a.guven_skoru - b.guven_skoru);

        // ─ Manuel kayıtları da dahil et ───────────────────────
        const kombine = sabikaKayitlari ? [...sabikaKayitlari, ...guvenSkorları] : guvenSkorları;

        // ─ Kritik tedarikçi alarmı ────────────────────────────
        const riskli = guvenSkorları.filter(g => g.guven_skoru < 60);
        if (riskli.length > 0) {
            await sb.from('b1_agent_loglari').insert([{
                ajan_adi: 'Tedarikçi/Fason Sabıka Kaydı',
                islem_tipi: 'sabika_analiz',
                kaynak_tablo: 'production_orders',
                sonuc: 'uyari',
                mesaj: `🚨 ${riskli.length} riskli tedarikçi/model: ${riskli.map(r => `${r.model_id}(%${r.gec_teslim_oran_yuzde} gecikme)`).join(', ')}`,
            }]);
        }

        return NextResponse.json({
            basarili: true,
            ozet: {
                toplam_analiz: guvenSkorları.length,
                riskli_sayi: riskli.length,
                en_dusuk_guven: guvenSkorları[0] || null,
            },
            guven_skorlari: guvenSkorları,
            manuel_sabika_kayitlari: sabikaKayitlari || [],
            tarih: new Date().toISOString(),
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ─── POST: Manuel iade/defo kaydı ────────────────────────────
export async function POST(req) {
    try {
        const body = await req.json();
        const { tedarikci_adi, model_id, olay_tipi, aciklama, miktar, kaydeden } = body;

        if (!olay_tipi) return NextResponse.json({ error: 'olay_tipi zorunludur (iade/defo/gecikme)' }, { status: 400 });

        const { data, error } = await sb.from('b1_tedarikci_sabika').insert([{
            tedarikci_adi: tedarikci_adi || 'Bilinmiyor',
            model_id: model_id || null,
            olay_tipi,
            aciklama: aciklama || null,
            miktar: miktar ? parseFloat(miktar) : null,
            kaydeden: kaydeden || 'Sistem',
        }]).select().single();

        if (error) throw error;

        return NextResponse.json({ basarili: true, kayit: data });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
