const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'app');

function scanAndFixDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanAndFixDir(fullPath);
        } else if (file === 'page.js' || file === 'middleware.js' || file === 'auth.js') {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Fix atob bug across ALL possible pin names (uretimPin, satisPin, denetmenPin, ajanPin)
            const pinRegex = /try\s*\{\s*(\w+Pin)\s*=\s*!!atob\(sessionStorage\.getItem\('sb47_uretim_pin'\)\s*\|\|\s*''\);\s*\}\s*catch\s*\{\s*\1\s*=\s*false;\s*\}/g;
            if (pinRegex.test(content)) {
                content = content.replace(pinRegex, "try { $1 = !!atob(sessionStorage.getItem('sb47_uretim_pin') || ''); } catch { $1 = !!sessionStorage.getItem('sb47_uretim_pin'); }");
                modified = true;
            }

            // Also check for 'sb47_genel_pin' just in case
            const genelRegex = /try\s*\{\s*(\w+Pin)\s*=\s*!!atob\(sessionStorage\.getItem\('sb47_genel_pin'\)\s*\|\|\s*''\);\s*\}\s*catch\s*\{\s*\1\s*=\s*false;\s*\}/g;
            if (genelRegex.test(content)) {
                content = content.replace(genelRegex, "try { $1 = !!atob(sessionStorage.getItem('sb47_genel_pin') || ''); } catch { $1 = !!sessionStorage.getItem('sb47_genel_pin'); }");
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`[FIXED PIN BUG] ${fullPath}`);
            }
        }
    }
}

// Check root files for auth like middleware.js and lib/auth.js
scanAndFixDir(srcDir);
scanAndFixDir(path.join(__dirname, '..', 'src', 'lib'));
scanAndFixDir(path.join(__dirname, '..', 'src'));

console.log("PIN Decode Hatası Tüm Sistemde Onarıldı.");
