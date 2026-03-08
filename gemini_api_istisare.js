import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

const envFile = fs.readFileSync('C:\\Users\\Admin\\Desktop\\Kamera-Panel\\.env.local', 'utf8');
const match = envFile.match(/GEMINI_API_KEY=(.+)/);
if (!match) {
    console.error("Gemini API Key bulunamadı.");
    process.exit(1);
}
const apiKey = match[1].trim();
const ai = new GoogleGenAI({ apiKey: apiKey });

async function runGeminiConsultation3() {
    try {
        console.log("SİBER MİMAR -> GEMİNİ'ye (1. BİRİM İÇ MİMARİ/VERİ AKIŞI) Ulaşılıyor...");
        const promptPath = 'C:\\Users\\Admin\\Desktop\\47_SIL_BASTAN_01\\.agents\\emirler\\04_BIRIM_1_DETAYLI_KRITER_VE_VERI_AKISI_ISTISARE.md';
        const promptText = "Sen Sen Tekstil'in Baş Veritabanı ve İş Akışı Mimarısın. Engin Koordinatör'ün emri gereği '1. Birim (Üretim/Dikim)' içindeki 5 alt departmanın (Model, Eşleştirme, Operasyon, Maliyet, Analiz) KRİTERLERİNİ, SEÇENEKLERİNİ ve BİRBİRLERİNE KARŞI VERİ AKIŞINI (Haberleşmesini) yazılım düzeyinde (Arayüz yapmadan önce) tasarlamakla görevlisin. Markdown formatında detaylı ve teknik bir analiz sun:\n\n" + fs.readFileSync(promptPath, 'utf8');

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText,
        });

        const outputPath = 'C:\\Users\\Admin\\Desktop\\47_SIL_BASTAN_01\\.agents\\gelen_kodlar\\04_GEMINI_BIRIM_1_DERIN_ANALIZ.md';
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, response.text, 'utf8');
        console.log("BAŞARILI! 1. Birim Detaylı Analiz Dosyası Kaydedildi: " + outputPath);

    } catch (error) {
        console.error("Gemini API Hatası:", error);
    }
}

runGeminiConsultation3();
