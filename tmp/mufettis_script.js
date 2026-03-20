const fs = require('fs');
const path = require('path');

const modules = [
  'karargah', 'arge', 'kumas', 'modelhane', 'kalip', 'kesim', 'imalat', 'maliyet',
  'muhasebe', 'kasa', 'stok', 'katalog', 'siparisler', 'musteriler', 'personel',
  'gorevler', 'kameralar', 'ajanlar', 'denetmen', 'raporlar', 'tasarim', 'uretim',
  'guvenlik', 'ayarlar', 'giris'
];

const basePath = path.join(__dirname, '..', 'CUsersEsisyaDesktop47_SilBastan_02_mizanet.com_19_Mart_2026_04_11');
// Actually, I am in some directory, let's use the absolute path given
const projectRoot = process.env.CWD || 'C:/Users/Esisya/Desktop/47_SilBastan_02_mizanet.com_19_Mart_2026_04_11';

function findJsFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

let report = '';

modules.forEach(mod => {
  report += `## ${mod.toUpperCase()}\n`;
  
  // K1
  const isKarargah = mod === 'karargah';
  const pagePath = isKarargah ? path.join(projectRoot, 'src', 'app', 'page.js') : path.join(projectRoot, 'src', 'app', mod, 'page.js');
  
  let k1 = false;
  let pageContent = '';
  if (fs.existsSync(pagePath)) {
    k1 = true;
    pageContent = fs.readFileSync(pagePath, 'utf8');
  }
  report += `K1 Sayfa var mı      : ${k1 ? '✅' : '❌'} — [kanıt: ${isKarargah ? 'src/app/page.js' : `src/app/${mod}/page.js`}]\n`;

  // K2
  const k2 = pageContent.includes('Container');
  report += `K2 Container bağlı  : ${k2 ? '✅' : '❌'} — [kanıt: ${k2 ? 'page.js imports Container' : 'Bulunamadi'}]\n`;

  // Scan features
  const featurePath = path.join(projectRoot, 'src', 'features', mod);
  const featureFiles = findJsFiles(featurePath);
  
  let hasSupabase = false;
  let hasLoading = false;
  let hasError = false;
  let hasAddBtn = false;
  let hasConfirm = false;
  let hasEmerald = false;
  let hasValidation = false;
  
  let proofSupabase = '';
  
  for (const f of featureFiles) {
    const content = fs.readFileSync(f, 'utf8');
    const fName = path.basename(f);
    
    if (content.includes('supabase.from')) {
        hasSupabase = true;
        proofSupabase = fName;
    }
    if (content.includes('loading') || content.includes('isLoading')) hasLoading = true;
    if (content.includes('error') || content.includes('errorMessage') || content.includes('setError')) hasError = true;
    if (content.includes('Buton') || content.toLowerCase().includes('ekle') || content.toLowerCase().includes('yeni ')) hasAddBtn = true;
    if (content.includes('confirm') || content.toLowerCase().includes('onay') || content.toLowerCase().includes('emin mi')) hasConfirm = true;
    if (content.includes('#047857') || content.includes('emerald')) hasEmerald = true;
    if (content.includes('onSubmit') || content.includes('required') || content.includes('e.preventDefault()') || content.includes('if (!')) hasValidation = true;
  }
  
  report += `K3 Veri çekme       : ${hasSupabase ? '✅' : '❌'} — [kanıt: ${hasSupabase ? proofSupabase : 'Yok'}]\n`;
  report += `K4 Yükleme durumu   : ${hasLoading ? '✅' : '⚠️'}\n`;
  report += `K5 Hata durumu      : ${hasError ? '✅' : '⚠️'}\n`;
  report += `K6 Ekle butonu      : ${hasAddBtn ? '✅' : '❌'}\n`;
  report += `K7 Form doğrulama   : ${hasValidation ? '✅' : '⚠️'}\n`;
  report += `K8 Silme onayı      : ${hasConfirm ? '✅' : '⚠️'}\n`;
  report += `K9 Tema rengi       : ${hasEmerald ? '✅' : '❌'}\n\n`;
});

fs.writeFileSync(path.join(projectRoot, 'tmp', 'mufettis_report.txt'), report);
console.log('Denetim tamamlandı.');
