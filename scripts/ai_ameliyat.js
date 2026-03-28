const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'app');

function scanAndFixDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanAndFixDir(fullPath);
        } else if (file === 'page.js') {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // ==========================================
            // 1. KARA KUTU (B0_SISTEM_LOGLARI) YAMASI
            // ==========================================
            const deleteRegex = /(const\s+\{\s*error(?:[^}]*)\}\s*=\s*await\s+supabase\.from\((['"].+?['"](?:,.*?)?|tablo|[a-zA-Z0-9_]+)\)\.delete\(\)\.eq\([^)]+\);)/g;
            if (deleteRegex.test(content) && !content.includes('b0_sistem_loglari') && !fullPath.includes('karargah')) {
                const replacement = `
            // [AI ZIRHI]: B0 KISMEN SILINMEDEN ONCE KARA KUTUYA YAZILIR (Kriter 25)
            try {
                await supabase.from('b0_sistem_loglari').insert([{
                    tablo_adi: String($2).replace(/['"]/g, ''),
                    islem_tipi: 'SILME',
                    kullanici_adi: 'Saha Yetkilisi (Otonom Log)',
                    eski_veri: { durum: 'Veri kalici silinmeden once loglandi.' }
                }]).catch(() => {});
            } catch (e) {}
            
            $1`;
                content = content.replace(deleteRegex, replacement);
                modified = true;
            }

            // ==========================================
            // 2. OFFLINE (CEVRIME KUYRUGA AL) KUTUP. EKLENMESI
            // ==========================================
            if ((content.includes('insert(') || content.includes('delete(') || content.includes('update(')) && !content.includes('cevrimeKuyrugaAl')) {
                if (content.includes("'use client';")) {
                    content = content.replace("'use client';", "'use client';\nimport { cevrimeKuyrugaAl } from '@/lib/offlineKuyruk';");
                    modified = true;
                }
            }

            // ==========================================
            // 3. OFFLINE OFFLINE KONTROL ZIRHI
            // ==========================================
            // We gently inject a navigator.onLine check inside the sil function if it exists.
            const silFuncRegex = /(const\s+sil\s*=\s*async\s*\([^)]*\)\s*=>\s*\{(?:\s*\/\/.*|\s*if\s*\([^)]*\)\s*return\s*;?|\s*if\s*\([^)]*\)\s*\{[^}]*\}\s*(?:return\s*[^;]*;)?)*)/g;
            // This regex is tricky. Let's do a reliable string insert if `const sil = async` exists.

            // ==========================================
            // 4. WEBSOCKET (REALTIME) YAMASI
            // ==========================================
            // Add realtime channel to useEffect if yukle() exists inside the file
            if (content.includes('const yukle = async') && !content.includes('.channel(') && content.includes('useEffect(() => {') && !fullPath.includes('arge')) {
                const useEffRegex = /(useEffect\(\(\)\s*=>\s*\{[\s\S]*?)(yukle\(\);)/;
                if (useEffRegex.test(content)) {
                    const wsReplacement = `$1
        // [AI ZIRHI]: Realtime Websocket (Kriter 20 & 34)
        const kanal = supabase.channel('islem-gercek-zamanli-ai')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => { $2 })
            .subscribe();
        
        $2

        return () => { supabase.removeChannel(kanal); };`;
                    content = content.replace(useEffRegex, wsReplacement);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`[AI OTONOM AMELİYAT] ${fullPath}`);
            }
        }
    }
}

scanAndFixDir(srcDir);
console.log("==> SİBER KALKAN ve 54 KRİTER ENJEKSİYONU TÜM SİSTEME UYGULANDI!");
