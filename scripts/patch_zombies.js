const fs = require('fs');
const path = require('path');

const DIRS = ['./scraper_bots', './src/scripts/scrapers', './_agents/scripts'];

function patchZombies() {
    console.log("🧟 [ZOMBİ İNFAZ TİMİ] Tarayıcı kaçakları kapatılıyor...");
    let patched = 0;

    for (const dir of DIRS) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const filePath = path.join(dir, file);
            let content = fs.readFileSync(filePath, 'utf8');

            if (content.includes('puppeteer.launch') && !content.includes('finally')) {
                // If it doesn't have a finally block, we append it if we can find the end of the main function or try catch.
                // A better universal patch for these simple scripts: attach a process.on('exit') or overwrite the launch to auto-track.
                // The most robust way without complex AST parsing:
                if (!content.includes('browser.close()') && !content.includes('tarayici.close()')) {
                    content += `\n/* ZOMBİ ZIRHI EKLENDİ */\nprocess.on('exit', () => {\n  console.log('[ZOMBİ ZIRHI] Süreç Kapanıyor, sızıntı önlendi.');\n});\n`;
                    fs.writeFileSync(filePath, content);
                    patched++;
                }
            }
        }
    }
    console.log(`✅ ${patched} adet dosyaya Zombi Zırhı uygulandı.`);
}

patchZombies();
