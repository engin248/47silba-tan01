// fix_raporlar.js — L8 index:461 bozuk karakteri düzelt
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/raporlar/page.js');
let content = fs.readFileSync(filePath, 'utf8');

// Index 461 etrafını göster
console.log('Index 450-480:', JSON.stringify(content.substring(450, 480)));

// L8'deki tüm bozuk Türkçe karakterleri ASCII ile değiştir
// formatTarih satırı: özel karakterler içeriyor
const lines = content.split('\n');
console.log('L8 orijinal:', JSON.stringify(lines[7]));

// L8'i tamamen temiz versiyonla değiştir
lines[7] = "const formatTarih = (iso) => { if (!iso) return '-'; const d = new Date(iso); return d.toLocaleDateString('tr-TR'); };";

// Geri birleştir
content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('L8 yazildi:', lines[7]);

// Babel parse kontrolü
try {
    const parser = require('@babel/parser');
    const result = parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx'],
        errorRecovery: false,
    });
    console.log('BABEL: OK - parse basarili');
} catch (e) {
    console.log('BABEL HATA L' + e.loc.line + ':' + e.loc.column + ' => ' + e.message.substring(0, 100));
}
