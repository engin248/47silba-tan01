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

async function runGeminiConsultationUnit2() {
    try {
        console.log("SİBER MİMAR -> GEMİNİ'ye (2. BİRİM: MAĞAZA VE KASA) İş Planı Emri Gidiyor...");
        const promptText = `
        Sen Sen Tekstil'in Baş Veritabanı ve İş Akışı Mimarısın. 
        Engin Koordinatör'ün emri gereği, biz 1. Birimi (Üretimi) test edip tamamen bitirirken, senin arka planda 3 ayrı Yapay Zeka ajanı mantığıyla "2. Birim (Mağaza, Kasa, Satış, %51 Vakıf / %49 Ak Akçe Dağıtımı)" için iş planını, altyapı kriterlerini ve seçenekleri çıkarmanı istiyoruz. 
        Lütfen 2. Birimin kendi içindeki alt departmanlarını, hangi verileri alacağını (1. birimden gelen Net Maliyet ve Net Adet verisi dâhil), satış stratejisini, kar dağıtımının nasıl olacağını detaylı bir iş planı olarak Markdown formatında hazırla.
        Biz 1. birimi bitirince %100 kusursuz olarak senin bu 2. Birim planını masaya yatırıp kontrol edeceğiz. Hiçbir kör delik bırakma! 
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText,
        });

        const outputPath = 'C:\\Users\\Admin\\Desktop\\47_SIL_BASTAN_01\\.agents\\gelen_kodlar\\05_GEMINI_BIRIM_2_IS_PLANI.md';
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, response.text, 'utf8');
        console.log("BAŞARILI! 2. Birim (Mağaza/Kasa) İş Planı Hazırlandı ve Kaydedildi: " + outputPath);

    } catch (error) {
        console.error("Gemini API Hatası:", error);
    }
}

runGeminiConsultationUnit2();
