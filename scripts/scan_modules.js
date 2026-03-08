const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'app');
const results = {};

function scanDir(dir) {
    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (e) { return; }

    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (file === 'page.js') {
            const content = fs.readFileSync(fullPath, 'utf8');
            const moduleName = path.basename(dir);
            // Ignore app root page
            if (moduleName === 'app') continue;

            results[moduleName] = {
                pinCheck: content.includes('catch { uretimPin = !!sessionStorage') || content.includes('catch { satisPin = !!sessionStorage') || content.includes('catch { denetmenPin = !!sessionStorage') || content.includes('catch { kullaniciPin = !!sessionStorage') || content.includes('catch { ajanPin = !!sessionStorage'),
                offline: content.includes('cevrimeKuyrugaAl'),
                softDelete: content.includes('b0_sistem_loglari'),
                realtime: content.includes('.channel('),
                promiseAllSettled: content.includes('Promise.allSettled('),
                promiseAll: content.includes('Promise.all('),
                hasDelete: content.includes('.delete().eq('),
                hasInsert: content.includes('.insert(')
            };
        }
    }
}

scanDir(srcDir);
fs.writeFileSync(path.join(__dirname, '..', 'Sistem_Kontrol_Raporlari', 'modul_scan.json'), JSON.stringify(results, null, 2), 'utf8');
console.log("Scanner bitirdi");
