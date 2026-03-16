import { NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseAdmin';

// ============================================================
// KUMBARACI (AKILLI KÜMELEME) — THE ORDER / NIZAM
// /api/rapor/kumbaraci
//
// GET  → Bu haftanın kalıp+model metadatasından ortak malzeme planı
// POST → Manuel malzeme listesi güncelle
// ============================================================

// Standart tekstil malzemeleri tanımlama sözlüğü
const MALZEME_ANAHTAR_KELIMELERI = {
    'dugme': ['düğme', 'button', 'dugme', 'çıt çıt'],
    'fermuar': ['fermuar', 'fermuvar', 'zipper', 'zip'],
    'astar': ['astar', 'lining'],
    'elastik': ['elastik', 'lastik', 'bant', 'elastic'],
    'dikiş_ipi': ['iplik', 'dikiş ipi', 'thread'],
    'etiket': ['etiket', 'label', 'barkod'],
    'ambalaj': ['ambalaj', 'poşet', 'torba', 'paket'],
    'ped': ['ped', 'vatka', 'shoulder pad'],
};

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const haftaSayisi = parseInt(url.searchParams.get('hafta') || '1');
        const bitisTarihi = new Date(Date.now() + haftaSayisi * 7 * 86400000).toISOString();

        // ─ Önümüzdeki haftaların kalıp taslakları ────────────
        const { data: kaliplar } = await sb
            .from('b1_model_taslaklari')
            .select('id, model_adi, malzeme_listesi, notlar, durum, created_at')
            .lte('created_at', bitisTarihi)
            .in('durum', ['aktif', 'hazirlaniyor', 'taslak'])
            .limit(100);

        // ─ Modelhane taslakları ───────────────────────────────
        const { data: modelhane } = await sb
            .from('b1_modelhane_kayitlari')
            .select('id, model_id, malzeme_notlari, durum, created_at')
            .lte('created_at', bitisTarihi)
            .limit(100);

        // ─ Malzeme ihtiyaç kümeleme ───────────────────────────
        const malzemeIstihtiyac = {};

        const tumNot = [
            ...(kaliplar || []).map(k => `${k.model_adi || ''} ${k.notlar || ''} ${JSON.stringify(k.malzeme_listesi || '')}`),
            ...(modelhane || []).map(m => `${m.malzeme_notlari || ''}`),
        ];

        for (const not of tumNot) {
            const normalNot = not.toLowerCase();
            for (const [malzemeKodu, anahtarlar] of Object.entries(MALZEME_ANAHTAR_KELIMELERI)) {
                if (anahtarlar.some(a => normalNot.includes(a))) {
                    if (!malzemeIstihtiyac[malzemeKodu]) {
                        malzemeIstihtiyac[malzemeKodu] = { malzeme: malzemeKodu, kac_modelde: 0, modeller: [] };
                    }
                    malzemeIstihtiyac[malzemeKodu].kac_modelde++;
                }
            }
        }

        const kumerlenmisMalzemeler = Object.values(malzemeIstihtiyac)
            .sort((a, b) => b.kac_modelde - a.kac_modelde)
            .map(m => ({
                ...m,
                toptan_oneri: m.kac_modelde >= 3 ? '✅ TOPTAN AL — İskonto fırsatı!' : '⬜ Tekil alım yeterli',
                oncelik: m.kac_modelde >= 5 ? 'acil' : m.kac_modelde >= 3 ? 'yuksek' : 'normal',
            }));

        // ─ Log ───────────────────────────────────────────────
        const toptan = kumerlenmisMalzemeler.filter(m => m.kac_modelde >= 3);
        await sb.from('b1_agent_loglari').insert([{
            ajan_adi: 'Kumbaracı (Akıllı Kümeleme)',
            islem_tipi: 'malzeme_kumeleme',
            kaynak_tablo: 'b1_model_taslaklari + b1_modelhane_kayitlari',
            sonuc: 'basarili',
            mesaj: `${(kaliplar || []).length + (modelhane || []).length} model analiz edildi. ${toptan.length} malzemede toptan alım önerisi üretildi.`,
        }]);

        return NextResponse.json({
            basarili: true,
            ozet: {
                analiz_edilen_model: (kaliplar?.length || 0) + (modelhane?.length || 0),
                toptan_alim_onerisi: toptan.length,
                en_cok_ihtiyac: kumerlenmisMalzemeler[0] || null,
            },
            kumelenmis_malzemeler: kumerlenmisMalzemeler,
            toptan_alim_listesi: toptan,
            tarih: new Date().toISOString(),
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
