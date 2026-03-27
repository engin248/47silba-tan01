import { NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseAdmin';

// ============================================================
// KR NOKTA FIRE RADARI — THE ORDER / NIZAM
// /api/rapor/kor-nokta
//
// GET  → Model bazında kumaş harcama & fire oranı raporu
// POST → Manuel fire kaydı ekle (Usta girişi)
// ============================================================

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const gunSayisi = parseInt(url.searchParams.get('gun') || '30');
        const filtreModel = url.searchParams.get('model_id') || null;

        const baslangic = new Date(Date.now() - gunSayisi * 86400000).toISOString();

        //  retim emirlerini ek (biten siparişler) 
        let uretimQuery = sb
            .from('production_orders')
            .select('id, model_id, quantity, fabric_used, fabric_planned, status, created_at, completed_at')
            .gte('created_at', baslangic)
            .not('fabric_used', 'is', null)
            .not('fabric_planned', 'is', null);

        if (filtreModel) uretimQuery = uretimQuery.eq('model_id', filtreModel);
        const { data: uretimler } = await uretimQuery.limit(100);

        //  Fire hesabı 
        const modelFireMap = {};
        for (const u of (uretimler || [])) {
            const key = u.model_id || 'bilinmiyor';
            if (!modelFireMap[key]) {
                modelFireMap[key] = { model_id: key, toplam_planlanan: 0, toplam_kullanilan: 0, kayit_sayisi: 0 };
            }
            modelFireMap[key].toplam_planlanan += Number(u.fabric_planned) || 0;
            modelFireMap[key].toplam_kullanilan += Number(u.fabric_used) || 0;
            modelFireMap[key].kayit_sayisi++;
        }

        const fireRaporlari = Object.values(modelFireMap).map(m => {
            const fire_metre = parseFloat((m.toplam_kullanilan - m.toplam_planlanan).toFixed(2));
            const fire_oran = m.toplam_planlanan > 0
                ? parseFloat(((fire_metre / m.toplam_planlanan) * 100).toFixed(1))
                : 0;
            return {
                ...m,
                fire_metre: Math.max(0, fire_metre),
                fire_oran_yuzde: Math.max(0, fire_oran),
                durum: fire_oran > 10 ? 'kritik' : fire_oran > 5 ? 'uyari' : 'normal',
            };
        }).sort((a, b) => b.fire_oran_yuzde - a.fire_oran_yuzde);

        //  Manuel fire kayıtlarını ek 
        const { data: manuelFireler } = await sb
            .from('b1_fire_kayitlari')
            .select('*')
            .gte('created_at', baslangic)
            .order('created_at', { ascending: false })
            .limit(50);

        //  Alarm: %10 st fire varsa kaydet 
        const kritikler = fireRaporlari.filter(f => f.durum === 'kritik');
        if (kritikler.length > 0) {
            await sb.from('b1_sistem_uyarilari').insert([{
                uyari_tipi: 'fire_yuksek',
                seviye: 'kritik',
                baslik: `🔥 ${kritikler.length} modelde yksek fire oranı tespit edildi`,
                mesaj: kritikler.map(k => `Model ${k.model_id}: %${k.fire_oran_yuzde} fire`).join(', '),
                kaynak_tablo: 'production_orders',
                durum: 'aktif',
            }]);
        }

        if (kritikler.length > 0) {
            await sb.from('b1_agent_loglari').insert([{
                ajan_adi: 'Kr Nokta Fire Radarı',
                islem_tipi: 'fire_analiz',
                kaynak_tablo: 'production_orders',
                sonuc: 'uyari',
                mesaj: `${fireRaporlari.length} model analiz edildi. ${kritikler.length} kritik fire vakası.`,
            }]);
        }

        return NextResponse.json({
            basarili: true,
            ozet: {
                analiz_edilen_model: fireRaporlari.length,
                kritik_fire: kritikler.length,
                en_yuksek_fire: fireRaporlari[0] || null,
            },
            model_fire_raporlari: fireRaporlari,
            manuel_fire_kayitlari: manuelFireler || [],
            tarih: new Date().toISOString(),
        });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

//  POST: Manuel Fire Kaydı 
export async function POST(req) {
    try {
        const body = await req.json();
        const { model_id, fire_metre, fire_nedeni, ustanin_notu, kaydeden } = body;

        if (!model_id || !fire_metre) {
            return NextResponse.json({ error: 'model_id ve fire_metre zorunludur.' }, { status: 400 });
        }

        const { data, error } = await sb.from('b1_fire_kayitlari').insert([{
            model_id,
            fire_metre: parseFloat(fire_metre),
            fire_nedeni: fire_nedeni || 'Belirtilmedi',
            ustanin_notu: ustanin_notu || null,
            kaydeden: kaydeden || 'Sistem',
        }]).select().single();

        if (error) throw error;

        return NextResponse.json({ basarili: true, kayit: data });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
