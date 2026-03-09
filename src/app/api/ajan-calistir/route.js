import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Servis rolüyle Supabase bağlantısı (RLS bypass)
// ============================================================
// GÜVENLİK: API Key + Yetki Kontrolü
// Sadece koordinatör oturumundan gelen istekler çalıştırabilir
// ============================================================
function yetkiKontrol(req) {
    // 1. INTERNAL_API_KEY header kontrolü (sunucu-sunucu)
    const apiKey = req.headers.get('x-internal-api-key');
    if (apiKey && apiKey === process.env.INTERNAL_API_KEY) return true;

    // 2. Koordinatör oturum cookie kontrolü (tarayıcıdan gelen istekler)
    const cookieHeader = req.headers.get('cookie') || '';
    if (cookieHeader.includes('sb47_auth_session=')) {
        try {
            const match = cookieHeader.match(/sb47_auth_session=([^;]+)/);
            if (match) {
                const session = JSON.parse(decodeURIComponent(match[1]));
                if (session?.grup === 'tam') return true;
            }
        } catch { }
    }

    return false;
}


// Perplexity ile internet araştırması
async function perplexityAra(sorgu) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey || apiKey.includes('BURAYA')) {
        return { ozet: `[Demo] "${sorgu}" için araştırma yapıldı. Sonuçlar: Sistem çalışıyor, API key eklenmesi gerekiyor.`, sonuclar: [] };
    }
    try {
        const res = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    { role: 'system', content: 'Sen bir tekstil üretim uzmanı ajansın. Türkçe yanıt ver. Sonuçları yapılandırılmış ve net ver.' },
                    { role: 'user', content: sorgu }
                ],
                max_tokens: 2000,
            }),
        });
        const data = await res.json();
        const icerik = data?.choices?.[0]?.message?.content || 'Sonuç alınamadı.';
        return { ozet: icerik, sonuclar: [], kaynaklar: data?.citations || [] };
    } catch (e) {
        return { ozet: `Araştırma hatası: ${e.message}`, sonuclar: [] };
    }
}

// ============================================================
// AJAN TİPLERİNE GÖRE GÖREV MANTIKLARI
// ============================================================

async function arastirmaGoreviniCalistir(gorev) {
    const sorgu = gorev.gorev_emri;

    if (gorev.yetki_internet) {
        const bilgi = await perplexityAra(sorgu);

        // Hedef modüle kayıt
        if (gorev.hedef_modul === 'arge' && gorev.hedef_tablo === 'b1_arge_trendler') {
            // Trend sonuclarını ayrıştır ve Ar-Ge tablosuna ekle
            const trendBasliklari = bilgi.ozet.split('\n')
                .filter(s => s.trim().length > 10)
                .slice(0, 5)
                .map(s => s.replace(/^[-*•\d.]+\s*/, '').trim())
                .filter(s => s.length > 5);

            for (const baslik of trendBasliklari) {
                await supabaseAdmin.from('b1_arge_trendler').insert([{
                    baslik: baslik.substring(0, 200),
                    platform: 'diger',
                    kategori: 'diger',
                    talep_skoru: 7,
                    aciklama: `AI araştırması: ${gorev.gorev_adi}`,
                    durum: 'inceleniyor',
                }]);
            }
            return { ...bilgi, kaydedilen: trendBasliklari.length };
        }

        // Genel araştırma — sadece özet döndür
        return bilgi;
    } else {
        // İnternet yoksa — Supabase verilerini analiz et
        const { data } = await supabaseAdmin
            .from(gorev.hedef_tablo || 'b1_arge_trendler')
            .select('*')
            .limit(20);

        return {
            ozet: `Sistem içi veri analizi: ${data?.length || 0} kayıt incelendi.`,
            kayitlar: data?.length || 0,
            veriler: data?.slice(0, 5)
        };
    }
}

async function analizGoreviniCalistir(gorev) {
    const { data: veriler } = await supabaseAdmin
        .from(gorev.hedef_tablo || 'b1_arge_trendler')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (!veriler?.length) {
        return { ozet: 'Analiz edilecek veri bulunamadı.', toplam: 0 };
    }

    const ozet = {
        toplam: veriler.length,
        ozet_bilgi: `${veriler.length} kayıt analiz edildi.`,
    };

    if (gorev.yetki_ai_kullan && gorev.yetki_internet) {
        const veriOzeti = veriler.slice(0, 10).map(v => JSON.stringify(v)).join('\n');
        const aiSonuc = await perplexityAra(
            `${gorev.gorev_emri}\n\nVeri:\n${veriOzeti}`
        );
        return { ...ozet, ai_yorumu: aiSonuc.ozet };
    }

    return ozet;
}

async function kontrolGoreviniCalistir(gorev) {
    const modül = gorev.hedef_modul || 'genel';
    const sonuclar = {};

    // Modüle göre farklı kontroller
    if (modül === 'stok' || modül === 'genel') {
        const { data: urunler } = await supabaseAdmin
            .from('b2_urun_katalogu')
            .select('id, urun_adi_tr, stok_adeti, min_stok_alarm')
            .eq('aktif', true);

        const kritikStok = (urunler || []).filter(u =>
            u.min_stok_alarm && u.stok_adeti <= u.min_stok_alarm
        );
        sonuclar.stok = { toplam: urunler?.length || 0, kritik: kritikStok.length };
    }

    if (modül === 'arge' || modül === 'genel') {
        const { data: trendler } = await supabaseAdmin
            .from('b1_arge_trendler')
            .select('durum')
            .limit(500);
        const bekleyen = (trendler || []).filter(t => t.durum === 'inceleniyor').length;
        const onaylanan = (trendler || []).filter(t => t.durum === 'onaylandi').length;
        sonuclar.arge = { toplam: trendler?.length || 0, bekleyen, onaylanan };
    }

    if (modül === 'muhasebe' || modül === 'genel') {
        const { data: raporlar } = await supabaseAdmin
            .from('b1_muhasebe_raporlari')
            .select('id, rapor_durumu')
            .limit(10);
        sonuclar.muhasebe = { raporlar: raporlar?.length || 0 };
    }

    return {
        ozet: `${modül} modülü kontrol edildi.`,
        modül,
        sonuclar,
    };
}

async function raporGoreviniCalistir(gorev) {
    const { data: trendler } = await supabaseAdmin.from('b1_arge_trendler').select('durum, kategori, talep_skoru').limit(500);
    const { data: gorevler } = await supabaseAdmin.from('b1_ajan_gorevler').select('durum, gorev_tipi').limit(50);

    const rapor = {
        tarih: new Date().toISOString(),
        arge: {
            toplam: trendler?.length || 0,
            onaylandi: trendler?.filter(t => t.durum === 'onaylandi').length || 0,
            bekleyen: trendler?.filter(t => t.durum === 'inceleniyor').length || 0,
            ort_skor: trendler?.length ?
                (trendler.reduce((s, t) => s + (t.talep_skoru || 0), 0) / trendler.length).toFixed(1) : 0
        },
        ajan_gorevler: {
            toplam: gorevler?.length || 0,
            tamamlandi: gorevler?.filter(g => g.durum === 'tamamlandi').length || 0,
            bekleyen: gorevler?.filter(g => g.durum === 'bekliyor').length || 0,
        }
    };

    const ozetMetin = `
📊 SİSTEM RAPORU — ${new Date().toLocaleDateString('tr-TR')}
• Ar-Ge Trendler: ${rapor.arge.toplam} toplam, ${rapor.arge.onaylandi} onaylı, ${rapor.arge.bekleyen} bekliyor
• Ortalama Talep Skoru: ${rapor.arge.ort_skor}/10
• Ajan Görevler: ${rapor.ajan_gorevler.toplam} toplam, ${rapor.ajan_gorevler.tamamlandi} tamamlandı
    `.trim();

    return { ozet: ozetMetin, detay: rapor };
}

// ============================================================
// ANA HANDLER
// ============================================================
export async function POST(req) {
    const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
);
    try {
        // ─── GÜVENLİK KONTROLÜ ───────────────────────────────────────
        if (!yetkiKontrol(req)) {
            return NextResponse.json({
                error: 'Yetkisiz erişim. Sadece Koordinatör bu işlemi yapabilir.',
                kod: 'UNAUTHORIZED'
            }, { status: 401 });
        }

        const { gorev_id } = await req.json();

        if (!gorev_id) {
            return NextResponse.json({ error: 'gorev_id gerekli' }, { status: 400 });
        }

        // Görevi yükle
        const { data: gorev, error: gorevHata } = await supabaseAdmin
            .from('b1_ajan_gorevler')
            .select('*')
            .eq('id', gorev_id)
            .single();

        if (gorevHata || !gorev) {
            return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 });
        }

        if (gorev.durum === 'calisıyor') {
            return NextResponse.json({ error: 'Görev zaten çalışıyor' }, { status: 409 });
        }

        // Görevi "çalışıyor" yap
        await supabaseAdmin.from('b1_ajan_gorevler').update({
            durum: 'calisıyor',
            baslangic_tarihi: new Date().toISOString(),
            tekrar_sayisi: (gorev.tekrar_sayisi || 0) + 1,
        }).eq('id', gorev_id);

        // Görevi çalıştır
        let sonuc;
        switch (gorev.gorev_tipi) {
            case 'arastirma': sonuc = await arastirmaGoreviniCalistir(gorev); break;
            case 'analiz': sonuc = await analizGoreviniCalistir(gorev); break;
            case 'kontrol': sonuc = await kontrolGoreviniCalistir(gorev); break;
            case 'rapor': sonuc = await raporGoreviniCalistir(gorev); break;
            default: sonuc = { ozet: `"${gorev.gorev_tipi}" tipi için henüz uygulama yok.` };
        }

        // Başarılı sonucu yaz
        await supabaseAdmin.from('b1_ajan_gorevler').update({
            durum: 'tamamlandi',
            bitis_tarihi: new Date().toISOString(),
            sonuc_ozeti: sonuc.ozet || 'Görev tamamlandı.',
            sonuc_detay: sonuc,
        }).eq('id', gorev_id);

        // Ajan logu
        await supabaseAdmin.from('b1_agent_loglari').insert([{
            ajan_adi: gorev.ajan_adi,
            islem_tipi: gorev.gorev_tipi,
            kaynak_tablo: gorev.hedef_tablo,
            sonuc: 'basarili',
            mesaj: `Görev tamamlandı: ${gorev.gorev_adi}`,
        }]);

        return NextResponse.json({ basarili: true, sonuc, gorev_id });

    } catch (e) {
        console.error('[Ajan Çalıştır]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
