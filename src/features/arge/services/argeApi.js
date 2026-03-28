import { supabase } from '@/lib/supabase';

// Tm AR-GE Istihbarat Verilerini Tek Seferde eker (Data Access Layer)
export const fetchArgeVerileri = async () => {
    const [stratejiRes, trendRes, logRes, canliRes] = await Promise.allSettled([
        supabase.from('b1_arge_products')
            .select('id, product_name, trend_skoru, artis_yuzdesi, ai_satis_karari, rekabet_durumu, erken_trend_mi, hermania_karar_yorumu, ai_guven_skoru, created_at')
            .order('trend_skoru', { ascending: false })
            .limit(20),
        supabase.from('b1_arge_trendler')
            .select('id, baslik, platform, kategori, talep_skoru, zorluk_derecesi, durum, created_at')
            .order('talep_skoru', { ascending: false })
            .limit(50),
        supabase.from('b1_agent_loglari')
            .select('id, ajan_adi, islem_tipi, mesaj, sonuc, created_at')
            .in('ajan_adi', ['Trend K\u015Fifi', 'Yarg\u0131 (Matematiki)', 'BATCH_GEMINI', 'Darbo\u011Faz Te\u015Fhiscisi'])
            .order('created_at', { ascending: false })
            .limit(15),
        supabase.from('bot_tracking_logs')
            .select('*')
            .order('son_guncelleme', { ascending: false })
            .limit(6)
    ]);

    return {
        strateji: stratejiRes.status === 'fulfilled' ? stratejiRes.value.data || [] : [],
        trendler: trendRes.status === 'fulfilled' ? trendRes.value.data || [] : [],
        ajanLog: logRes.status === 'fulfilled' ? logRes.value.data || [] : [],
        canliGorevler: canliRes.status === 'fulfilled' ? canliRes.value.data || [] : []
    };
};

// Google Trends / Google Alisveris API (SerpAPI) Cagrisi
export const searchSerp = async (sorgu) => {
    const res = await fetch('/api/serp-trend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sorgu }),
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error('API Hatas.');
    return await res.json();
};

// DeepSeek AI Pazar Analiz ars
export const searchDeepseek = async (urunAdi) => {
    const res = await fetch('/api/deepseek-analiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urunAdi }),
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error('Derin analiz hatas.');
    return await res.json();
};

// Beyaz Saha Ajanlarini (Botlari) Manuel Tetikleme
export const triggerBeyazAjan = async (hedefParametre) => {
    const res = await fetch('/api/beyaz-saha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ajanTipi: 'MANUEL_HEDEF',
            hedefParametre: hedefParametre || 'GENEL SAHA TARAMASI'
        })
    });
    return await res.json();
};
