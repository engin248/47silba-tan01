/**
 * NIZAM ETL (Extract, Transform, Load) Pipeline
 * Kural 1: Aşırı Token Maliyetlerini (Aylık 300-400$) Önlemek.
 * Kural 2: Ham ve gereksiz veriyi 'b1_raw_data_lake' çöplüğünde (arşiv) tutmak.
 * Kural 3: Sadece damıtılmış veriyi Gemiye (Gemini) yollayarak nokta atışı gerekli bilgiyi çekmek.
 */

export function temizleVeSadelestir(htmlVeyaMetin) {
    if (!htmlVeyaMetin || typeof htmlVeyaMetin !== 'string') return '';

    // 1. Script ve Style etiketlerini içeriğiyle birlikte uçur
    let s = htmlVeyaMetin.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // 2. SVG, SVG path, iframe, imaj gibi gereksiz DOM elyaflarını uçur
    s = s.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
    s = s.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // 3. Kalan tüm HTML Taglerini text'ten ayıkla
    s = s.replace(/(<([^>]+)>)/gi, ' ');

    // 4. Aşırı boşlukları, tab'ları, newline kümelerini tek satıra indirge.
    // Yapay zeka newline'ları anlar ama biz token alanından kısmak için boşlukları zip'liyoruz.
    s = s.replace(/\s+/g, ' ').trim();

    // 5. Baştan başla ve maksimum limit köy (Gemini token cost'unu kilitle)
    // Eğer metin 5000 karakterden (Yaklaşık 1200 Token) uzunsa, kes! Geri kalanı büyük ihtimalle junk veridir (Yorum, footer vs).
    if (s.length > 5000) {
        s = s.substring(0, 5000) + '...[SİSTEM KESİNTİSİ-TOKEN TASARRUFU]';
    }

    return s;
}

/**
 * Gereksiz HTML bloğunu alıp sadece en saf ve gerekli kısımları döndürür.
 * (Gemini'ye bu verilecektir - Aylık binlerce dolar yerine 5-10 dolar fatura)
 */
export function geminiIcinMaliyetFiltresi(rawDataObj) {
    if (!rawDataObj) return '';

    const filtreli = {
        baslik: rawDataObj.baslik || rawDataObj.title || '',
        fiyat: rawDataObj.fiyat || rawDataObj.price || '0',
        kategori: rawDataObj.kategori || rawDataObj.category || '',
        aciklamalar: temizleVeSadelestir(rawDataObj.htmlText || rawDataObj.description || rawDataObj.content || '')
    };

    return JSON.stringify(filtreli);
}
