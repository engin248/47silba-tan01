const fs = require('fs');
const path = require('path');

// Sadece en kritik dizinleri tarayacağız
const DIRS_TO_SCAN = [
    './src/features',
    './src/app/api',
    './src/scripts',
    './arge_ajanlari',
    './scraper_bots',
    './src/lib'
];

let replacedCount = 0;

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.ts')) {
            patchFile(fullPath);
        }
    }
}

function patchFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Regex ile yakalanan sessiz catch bloklarını bul ve değiştir
    // Örneğin: catch (e) { } veya catch (err) { }
    // Boşlukları veya tek satırlık yorumları kapsamazsa diye sadece tam boşları alıyoruz
    const catchRegex = /catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\{\s*\}/g;

    if (catchRegex.test(content)) {
        const newContent = content.replace(catchRegex, (match, errVar) => {
            replacedCount++;
            return `catch (${errVar}) { console.error('[KÖR NOKTA ZIRHI - SESSİZ YUTMA ENGELLENDİ] Dosya: ${path.basename(filePath)} | Hata:', ${errVar} ? ${errVar}.message || ${errVar} : 'Bilinmiyor'); }`;
        });

        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Yamalandı: ${filePath}`);
    }

    // Altı çizili catch (_) { } durumu için özel kontrol
    const catchRegex2 = /catch\s*\(\s*_\s*\)\s*\{\s*\}/g;
    if (catchRegex2.test(content)) {
        const newContent2 = content.replace(catchRegex2, () => {
            replacedCount++;
            return `catch (_) { console.error('[KÖR NOKTA ZIRHI - YUTULAN HATA] Dosya: ${path.basename(filePath)}'); }`;
        });
        fs.writeFileSync(filePath, newContent2, 'utf8');
        console.log(`✅ Yamalandı (_ model): ${filePath}`);
    }
}

console.log("🛠️ BAŞ MÜFETTİŞ CERRAHİ AMELİYATI BAŞLADI...");
for (const dir of DIRS_TO_SCAN) {
    scanDir(path.resolve(__dirname, '..', dir));
}
console.log(`\n🎯 OPERASYON TAMAMLANDI. Toplam ${replacedCount} adet Sessiz Tünel (Empty Catch) mühürlendi ve alarm kamerası takıldı.`);
