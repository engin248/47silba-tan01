import { GoogleGenAI } from '@google/genai';
import { hataBildir } from '@/lib/hataBildirim';

const AI_MODEL_VERSION = 'gemini-2.5-flash'; // Kriter 139: Model Versiyon Kontrolü

// ─── 🔒 RATE LİMİTER: Dakikada maks 15 istek ─────────────────────────────────
const _rateLimiter = { sayac: 0, resetZamani: Date.now() };
function _rateLimiterKontrol() {
    const simdi = Date.now();
    if (simdi - _rateLimiter.resetZamani > 60000) {
        _rateLimiter.sayac = 0;
        _rateLimiter.resetZamani = simdi;
    }
    _rateLimiter.sayac++;
    return { izin: _rateLimiter.sayac <= 15, dakikadaIstek: _rateLimiter.sayac };
}

// Kriter 78, 136, 137, 138: Karar Doğrulama, Semizleme ve Bias Denetimi
export async function GuvenliYapayZekaMotoru(prompt, context_data = null, tip = 'genel') {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
        return { hata: true, mesaj: 'API Anahtarı (.env) eksik.', guven_skoru: 0 };
    }

    // 🔒 KORUMA 1: Rate Limiter
    const kotaKontrol = _rateLimiterKontrol();
    if (!kotaKontrol.izin) {
        await hataBildir(
            'aiKararMotoru',
            `Rate limit aşıldı: dakikada ${kotaKontrol.dakikadaIstek} istek`,
            `Tip: ${tip} | Limit: 15 istek/dk`
        );
        return { hata: true, mesaj: 'AI rate limit: dakikada çok fazla istek. Lütfen bekleyin.', guven_skoru: 0 };
    }

    const genai = new GoogleGenAI({ apiKey });
    const startTime = performance.now();

    // 137: Veri Semizleme Algoritması
    const temizContext = veriSemizle(context_data);

    // Prompt zenginleştirme (Kriter 78, 138)
    const safetySistemi = `\n\nDİKKAT: Sen tarafsız bir endüstriyel ERP yapay zekasısın. 
    1. Yorumlarında cinsiyet, ırk, departman veya belirli bir kişiye karşı Bias(Önyargı) yapma (Kriter 138).
    2. Kesin olmayan verilerde varsayım yapma. Bilmiyorsan 'Veri yetersiz' de.
    3. Hatalı rapor üretmemek için mantık silsileni doğrula (Kriter 78, 136).
    4. Sadece JSON formatında yanıt ver.\n\n`;

    const fullPrompt = `${safetySistemi}\n${prompt}\n\nTemizlenmiş Veri Modeli:\n${JSON.stringify(temizContext)}`;

    try {
        // ⏱️ KORUMA 2: 15 saniye timeout — sonsuz beklemeyi önler
        const zamanAsimi = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('[AI_TIMEOUT] Gemini 15 saniyede yanıt vermedi')), 15000)
        );

        const response = await Promise.race([
            genai.models.generateContent({ model: AI_MODEL_VERSION, contents: fullPrompt }),
            zamanAsimi
        ]);

        const endTime = performance.now();
        const durationMs = endTime - startTime; // Kriter 140: Performans Ölçümü (Zaman)

        let aiKarari = response.text || '';

        // JSON formatına zorla temizleme ve parse etme
        if (aiKarari.includes('```json')) {
            aiKarari = aiKarari.split('```json')[1].split('```')[0].trim();
        }

        try {
            const jsonResult = JSON.parse(aiKarari);
            return {
                hata: false,
                sonuc: jsonResult,
                performans_ms: Math.round(durationMs), // Kriter 140
                model_versiyonu: AI_MODEL_VERSION // Kriter 139
            };
        } catch (e) {
            return { hata: true, mesaj: 'AI yanıtı JSON formatına uymuyor.', guven_skoru: 0, ham_yanit: aiKarari };
        }

    } catch (e) {
        // 🚨 KORUMA 3: Hata anında Telegram'a otomatik uyarı
        const hataKodu = e.message?.includes('500') ? '500 Dahili Hata' :
            e.message?.includes('429') ? '429 Rate Limit / Kota Doldu' :
                e.message?.includes('AI_TIMEOUT') ? '⏱️ Zaman Aşımı (15sn)' :
                    e.message?.includes('403') ? '403 Yetki Hatası' : 'Bilinmeyen Hata';

        await hataBildir(
            'aiKararMotoru / Gemini API',
            `[${hataKodu}] ${e.message?.slice(0, 200)}`,
            `Tip: ${tip} | Model: ${AI_MODEL_VERSION} | Nasıl kapatılır: Ajan servisini yeniden başlat`
        );

        return { hata: true, mesaj: 'LLM İletişim Hatası: ' + e.message, guven_skoru: 0 };
    }
}

// KRİTER 137: Yanlış/Boş/Kayıp verileri çöpe atan, sadece değerli veriyi alan algoritma
function veriSemizle(data) {
    if (!data) return null;
    if (Array.isArray(data)) {
        return data.filter(d => d !== null && d !== undefined && d !== '' && d !== ' ' && d !== 'a')
            .map(d => typeof d === 'object' ? veriSemizle(d) : d);
    }
    if (typeof data === 'object') {
        const cleaned = {};
        for (const [key, val] of Object.entries(data)) {
            if (val !== null && val !== undefined && val !== '' && val !== ' ' && val !== 'a') {
                cleaned[key] = typeof val === 'object' ? veriSemizle(val) : val;
            }
        }
        return cleaned;
    }
    return data;
}

// KRİTER 73: Dün Fire Neden Fazlaydı? (Üretim/Fire Analizi)
export async function fireAnaliziYap(uretimDatalari) {
    const prompt = `Aşağıdaki üretim verilerine bakarak son 24 saatin fire analizi oranlarını çıkar. Hangi bantta veya kumaşta neden fire fazla çıkmış olabilir kök neden senaryosu üret. Format: {"fire_orani_yuzde": number, "kok_neden_tahmini": string, "guven_skoru": number}`;
    return await GuvenliYapayZekaMotoru(prompt, uretimDatalari, 'fire_analizi');
}

// KRİTER 74: Kâr/Zarar Stok Satış Analizi
export async function karZararStokAnalizi(katalogVeSiparisDatalari) {
    const prompt = `Bu stok ve sipariş datalarına göre sistemin tahmini kâr/zarar performansını özetle. En çok kâr getiren ama en az stoğu kalan kritik kalemi bul. Format: {"karlilik_durumu": "iyi|orta|kötü", "analiz_raporu": string, "kritik_stok_adi": string}`;
    return await GuvenliYapayZekaMotoru(prompt, katalogVeSiparisDatalari, 'finans_stok');
}

// KRİTER 75: İnternetten Gelecek Ay Trendlerini Toplama
export async function trendAnalizi(perplexityInternetDatalari) {
    const prompt = `Web search apisinden gelen bu raw datalarından gelecek ayın 3 ana global moda tekstil trendini çıkar. Format: {"trend_1": string, "trend_2": string, "trend_3": string, "ai_sektorel_ozet": string}`;
    return await GuvenliYapayZekaMotoru(prompt, perplexityInternetDatalari, 'arastirma');
}

// KRİTER 76: Makine/Kumaş Arıza Kök Neden Analizi
export async function arizaKokNedenBul(hataLoglari) {
    const prompt = `Makine/Kumaş bakım hata loglarından en çok tekrar eden arızayı bul ve tekstil mühendisliği mantığına göre olası kök neden (root cause) ve çözüm öner. Format: {"ana_ariza": string, "kok_neden": string, "uzman_cozum_onerisi": string}`;
    return await GuvenliYapayZekaMotoru(prompt, hataLoglari, 'bakim_teknik');
}

// KRİTER 77: Yönetici/Çalışan Öneri Sistemi (Şu iş öne çekilmeli)
export async function akilliOneriUret(isEmirleriData) {
    const prompt = `Mevcut iş emirlerinin termin tarihlerini ve durumlarını incele. Aciliyeti yüksek olup gecikme riski olan veya darboğaza giren bir iş var mı? Hangi iş öne çekilmeli? Format: {"one_cekilecek_is_id": string|null, "karar_gerekcesi": string, "ai_tavsiyesi": string}`;
    return await GuvenliYapayZekaMotoru(prompt, isEmirleriData, 'planlama_oneri');
}
