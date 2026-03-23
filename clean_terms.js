const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'features');

const replacements = [
    { target: /\[SPAM ZIRHI\]/g, replace: 'ÇİFT TIKLAMA KORUMASI' },
    { target: /SPAM ZIRHI/g, replace: 'ÇİFT TIKLAMA KORUMASI' },
    { target: /\[AI ZIRHI\]/g, replace: 'SİSTEM OPTİMİZASYONU' },
    { target: /AI ZIRHI/g, replace: 'SİSTEM OPTİMİZASYONU' },
    { target: /KASAP OPERASYONU/g, replace: 'OTOMASYON İŞLEMİ' },
    { target: /Kasap Operasyonu/g, replace: 'Otomasyon İşlemi' },
    { target: /Sinsi Zarar/g, replace: 'Gizli Maliyet' },
    { target: /sinsi zarar/gi, replace: 'gizli maliyet' },
    { target: /ZIRHI/g, replace: 'KONTROLÜ' },
    { target: /ZIRH/g, replace: 'KORUMA' },
    { target: /\[M8 ZIRHI:([^\]]+)\]/g, replace: 'M8 KONTROLÜ:$1' },
    { target: /EKİP GAMMA/g, replace: 'VERİ BÜTÜNLÜĞÜ UZMANI' }
];

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            for (const r of replacements) {
                if (r.target.test(content)) {
                    content = content.replace(r.target, r.replace);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Modified:', fullPath);
            }
        }
    }
}

processDir(targetDir);
console.log('Terminoloji temizliği tamamlandı.');
