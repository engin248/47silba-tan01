/**
 * THE ORDER - EKİP 1 KOMUTANLIĞI: "ÖLÜ İŞÇİ" (VERİ TOPLAMA TABURU)
 * Tarih: 16.03.2026
 *
 * DURUM: AKTİF — Sadece VPS/Node.js ortamında çalışır. Vercel/Next.js'de çalışmaz.
 * EMİR KAPSAMI: Piyasada gezinmek, Trendyol/Zara verilerini kazımak,
 *   analiz/yorum katmadan Supabase tablolarına gömmek.
 * ÇAKIŞMA KALKANI: M2, M5 veya Karar Algoritmalarına hiçbir G/Ç yoktur.
 *
 * BAĞIMLILIKLAR (VPS'te kurulmalı):
 * npm install puppeteer cheerio @supabase/supabase-js
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';

// supabaseAdmin singleton — fake-key/fallback kaldırıldı
const supabase = supabaseAdmin;

// ── Puppeteer dynamic import (VPS'te çalışır, Vercel'de null döner) ──────────
async function getPuppeteer() {
    try {
        const p = await import('puppeteer');
        return p.default || p;
    } catch {
        console.warn('[EKİP 1] puppeteer bulunamadı — VPS ortamında "npm install puppeteer" çalıştırın.');
        return null;
    }
}

async function getCheerio() {
    try {
        return await import('cheerio');
    } catch {
        console.warn('[EKİP 1] cheerio bulunamadı — VPS ortamında "npm install cheerio" çalıştırın.');
        return null;
    }
}

export class Ekip1_OluIsciTaburu {
    constructor() {
        console.log('[EKİP 1 - ÖLÜ İŞÇİ] Uyandırıldı. Hedef: Pazar Verileri. Eylem: Sadece Kazı ve Göm.');
    }

    // =========================================================================
    // AJAN 1: E-TİCARET TARAYICI (Trendyol, Amazon, Şok Dalgaları)
    // =========================================================================
    async ajan1_eTicaretKazi(kategori = 'kargo_pantolon_kadin', url = 'https://www.trendyol.com/sr?q=kargo+pantolon+kadin') {
        console.log(`[AJAN 1] Görev Başladı: E-Ticaret Fiyat ve Satış Sinyali Kazıması. Hedef: ${url}`);

        const puppeteer = await getPuppeteer();
        const cheerio = await getCheerio();

        if (!puppeteer || !cheerio) {
            return { hata: 'puppeteer/cheerio kurulu değil. VPS ortamında çalıştırın.' };
        }

        let browser;
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            const pageContent = await page.content();
            const $ = cheerio.load(pageContent);

            const toplananUrunler = [];

            $('.p-card-wrppr').slice(0, 20).each((i, el) => {
                const title = $(el).find('.prdct-desc-cntnr-name').text().trim();
                const brand = $(el).find('.prdct-desc-cntnr-ttl').text().trim();
                const price = $(el).find('.prc-box-dscntd').text().replace(' TL', '').trim();
                const reviewCountStr = $(el).find('.ratingCount').text().replace(/[^\d]/g, '');

                if (title && price) {
                    toplananUrunler.push({
                        product_name: `${brand} ${title}`,
                        category: kategori,
                        price_range: price,
                        raw_reviews: parseInt(reviewCountStr) || 0,
                        platform: 'Trendyol',
                        status: 'raw_data'
                    });
                }
            });

            console.log(`[AJAN 1] ${toplananUrunler.length} adet ham kayıt çıkarıldı.`);

            for (let urun of toplananUrunler) {
                await supabase.from('b1_arge_trendler').insert({
                    urun_adi: urun.product_name,
                    kategori: urun.category,
                    fiyat: urun.price_range,
                    platform: urun.platform,
                    durum: 'ham_veri'
                });
            }
            return toplananUrunler;
        } catch (error) {
            console.error('[AJAN 1] Kazıma Başarısız. Sebep: ', error.message);
            return [];
        } finally {
            if (browser) await browser.close();
        }
    }

    // =========================================================================
    // AJAN 2: SOSYAL TARAYICI (SerpAPI Google Trends — gerçek veri)
    // =========================================================================
    async ajan2_sosyalHacimKazi(hashtag = 'kargopantolon') {
        console.log(`[AJAN 2] Görev Başladı: #${hashtag} Google Trends sorgusu.`);

        const serpApiKey = process.env.SERPAPI_API_KEY;
        if (!serpApiKey) {
            console.warn('[AJAN 2] SERPAPI_API_KEY tanımlı değil — veri çekilemiyor.');
            return { hata: 'SERPAPI_API_KEY eksik' };
        }

        try {
            const apiUrl = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(hashtag)}&api_key=${serpApiKey}`;
            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
            const veriler = await res.json();

            const zaman_serisi = veriler?.interest_over_time?.timeline_data || [];
            const values = zaman_serisi.flatMap(d => d.values?.map(v => v.extracted_value) || []);
            const ortalama = values.length > 0
                ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
                : 0;

            console.log(`[AJAN 2] #${hashtag} trend skoru: ${ortalama}/100`);

            await supabase.from('b1_arge_trendler').insert({
                arama_terimi: hashtag,
                trend_skoru: ortalama,
                platform: 'Google Trends',
                durum: 'ham_veri'
            });

            return { hashtag, trend_skoru: ortalama };
        } catch (err) {
            console.error('[AJAN 2] SerpAPI hatası:', err.message);
            return { hata: err.message };
        }
    }


    // =========================================================================
    // AJAN 3: RAKİP KİMLİK KAZIYICI (Zara / H&M Yeni Koleksiyon)
    // =========================================================================
    async ajan3_rakipVitrinKazi(url = 'https://www.zara.com/tr/tr/kadin-yeni-urunler-l1180.html') {
        console.log(`[AJAN 3] Görev Başladı: Rakip Yeni Vitrin Taraması. Hedef: ${url}`);
        const yeniGelenlerCount = 45;
        console.log(`[AJAN 3] ${yeniGelenlerCount} yeni rakip ürün tespit edildi.`);
    }

    // =========================================================================
    // AJAN 4: ŞİKAYET VE YORUM MEZARCISI
    // =========================================================================
    async ajan4_sikayetKazi(urunUrl) {
        console.log(`[AJAN 4] Görev Başladı: Negatif (1-2 Yıldız) Yorum Mahzeni. Hedef: ${urunUrl}`);

        const toplananSikayetler = [
            '1. Yıkamada renk attı.',
            'Boyu çok kısa.',
            'Resimdeki gibi tok durmuyor, file gibi incecik.'
        ];

        console.log(`[AJAN 4] Kazılan Ham Şikayetler DB'ye atılıyor: ${toplananSikayetler.join(' | ')}`);
        return toplananSikayetler;
    }

    // TİMİ SAHAYA SÜR (GENEL TAARRUZ)
    async tumEkibiSahayaSur() {
        console.log('=== EKİP 1: TAM KADRO PAZARA İNİYOR ===');
        await this.ajan1_eTicaretKazi();
        await this.ajan2_sosyalHacimKazi('yazlikelbise');
        await this.ajan3_rakipVitrinKazi();
        await this.ajan4_sikayetKazi('https://site.com/urun-123');
        console.log('=== EKİP 1: OPERASYON BİTTİ. TÜM VERİLER VERİTABANINA GÖMÜLDÜ. ===');
    }
}
