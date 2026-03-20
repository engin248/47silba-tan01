export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Sunucu YÃ¼k/Stres Testi Endpoint'i
 * Sadece admin yetkisi olanlar tetikleyebilir.
 * Parametreler: url, count, concurrency
 */
export async function POST(req) {
    try {
        // GÃ¼venlik ve yetki kontrolÃ¼
        const sessionCookie = req.cookies.get('sb47_auth_session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Yetkisiz eriÅŸim. Oturum bulunamadÄ±.' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie);
        if (session.grup !== 'tam') {
            return NextResponse.json({ error: 'Yetkisiz eriÅŸim. Bu testi sadece Sistem YÃ¶neticileri baÅŸlatabilir.' }, { status: 403 });
        }

        const body = await req.json();
        const urlReq = body.url;
        const countReq = Number(body.count) || 100;
        const conReq = Number(body.concurrency) || 10;

        // URL doÄŸrulamasÄ±
        if (!urlReq || typeof urlReq !== 'string') {
            return NextResponse.json({ error: 'GeÃ§erli bir hedef URL belirtilmelidir.' }, { status: 400 });
        }

        // Test Parametreleri Limitleri (Vercel'i kilitlememek iÃ§in koruyucu sÄ±nÄ±rlar)
        const vCount = Math.min(Math.max(1, countReq), 1000); // Maks 1000 istek
        const vConcurrency = Math.min(Math.max(1, conReq), 100); // Maks 100 eÅŸzamanlÄ± istek

        const startTime = Date.now();
        const results = {
            totalRequests: vCount,
            concurrency: vConcurrency,
            targetUrl: urlReq,
            success: 0,
            failed: 0,
            // @ts-ignore: statusCodes is dynamic
            statusCodes: {},
            /** @type {number[]} */ latencies: [],
            totalTimeMs: 0,
            avgLatencyMs: 0
        };

        // Ä°stek yÄ±ÄŸÄ±nlarÄ±nÄ± iÅŸleme (Batch processing)
        const fetchUrl = urlReq.startsWith('http') ? urlReq : `http://localhost:${process.env.PORT || 3000}${urlReq.startsWith('/') ? '' : '/'}${urlReq}`;

        let completed = 0;
        const requestPromises = [];

        // Concurrency kontrolÃ¼ iÃ§in basit bir asenkron kuyruk yapÄ±sÄ±
        async function worker() {
            while (completed < vCount) {
                // Fetch context
                const reqStartTime = Date.now();
                completed++;
                try {
                    const response = await fetch(fetchUrl, {
                        method: 'GET',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache'
                        },
                        // Timeout: 30 saniye
                        signal: AbortSignal.timeout(30000)
                    });

                    const latency = Date.now() - reqStartTime;
                    const status = response.status;
                    results.latencies.push(latency);
                    // @ts-ignore
                    results.statusCodes[status] = (results.statusCodes[status] || 0) + 1;

                    if (response.ok) {
                        results.success++;
                    } else {
                        results.failed++;
                    }
                } catch (error) {
                    const latency = Date.now() - reqStartTime;
                    results.latencies.push(latency);
                    results.failed++;
                    const errName = /** @type {any} */ (error).name || 'UnknownError';
                    // @ts-ignore
                    results.statusCodes[errName] = (results.statusCodes[errName] || 0) + 1;
                }
            }
        }

        // Ã‡alÄ±ÅŸanlarÄ± (workers) baÅŸlat
        for (let i = 0; i < vConcurrency; i++) {
            requestPromises.push(worker());
        }

        await Promise.allSettled(requestPromises);

        // Ä°statistikleri hesapla
        results.totalTimeMs = Date.now() - startTime;
        if (results.latencies.length > 0) {
            results.avgLatencyMs = Math.round(results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length);
        }

        // Test sonucunu ajan loglarÄ±na yazalÄ±m
        try {
            await supabase.from('b1_agent_loglari').insert([{
                ajan_adi: 'Sistem HafÄ±zasÄ±',
                islem_tipi: 'Stres Testi',
                mesaj: `YÃ¼k Testi: ${urlReq} hedefine ${vCount} istek atÄ±ldÄ±. BaÅŸarÄ±lÄ±: ${results.success}, Ort. Gecikme: ${results.avgLatencyMs}ms`,
                seviye: 'uyari',
                sonuc: results.failed === 0 ? 'basarili' : 'basarisiz'
            }]);
        } catch (e) {
            console.error('Test logu kaydedilemedi:', e);
        }

        return NextResponse.json(results, { status: 200 });

    } catch (error) {
        console.error('Stres test error:', error);
        return NextResponse.json({ error: error.message || 'Test yÃ¼rÃ¼tÃ¼lÃ¼rken dahili hata oluÅŸtu.' }, { status: 500 });
    }
}
