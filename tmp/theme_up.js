const fs = require('fs');
const filepath = 'C:/Users/Admin/Desktop/47_SIL_BASTAN_01/src/features/karargah/components/KarargahMainContainer.js';
let content = fs.readFileSync(filepath, 'utf8');

// ----- 0. Genel Zemin (Sayfa Arka Planı) -----
content = content.replace(
    /bg-slate-50 min-h-screen p-4 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white pb-20/g,
    'bg-[#050B14] min-h-screen p-4 lg:p-6 text-slate-300 font-sans selection:bg-emerald-500 selection:bg-[#050B14] selection:text-emerald-400 pb-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0A192F] via-[#050B14] to-[#010409]'
);

// ----- 1. Panel Glassmorphism Arka Planları -----
content = content.replace(/bg-blue-900\/95 backdrop-blur-md/g, 'bg-[#0B1526]/80 backdrop-blur-2xl ring-1 ring-white/5');
content = content.replace(/border border-blue-700/g, 'border-0');
content = content.replace(/shadow-lg border border-blue-700/g, 'shadow-2xl border-0');

// ----- 2. İç Kutular & Form Elemanları -----
content = content.replace(/bg-blue-950/g, 'bg-[#020610]/40 ring-1 ring-white/5 shadow-inner');
content = content.replace(/border border-blue-800/g, 'border-0');
content = content.replace(/border border-blue-600/g, 'border-0 ring-1 ring-white/10');
content = content.replace(/border-t border-blue-700\/50/g, 'border-t border-white/5');
content = content.replace(/border border-white\/10/g, 'ring-1 ring-white/5 border-0');

// ----- 3. Modüller (A, B, C Grupları Butonları) -----
content = content.replace(/text-white/g, 'text-slate-100'); // Genel beyazlikleri biraz kirdik

content = content.replace(/bg-blue-800 border-blue-600 text-slate-100 shadow-sm hover:bg-blue-700/g, 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300');

content = content.replace(/bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm hover:bg-emerald-100/g, 'bg-[#121C2D]/60 text-slate-300 ring-1 ring-white/10 shadow-lg hover:bg-[#18263C]/90 hover:ring-emerald-500/50 hover:text-emerald-300 transition-all duration-300');

content = content.replace(/bg-\[\#02624B\].*?shadow-sm hover:brightness-110/g, 'bg-emerald-600/10 text-emerald-500 ring-1 ring-emerald-600/20 shadow-lg hover:bg-emerald-600/20 hover:text-emerald-400 hover:shadow-[0_0_15px_rgba(4,120,87,0.3)] transition-all duration-300');

content = content.replace(/bg-\[\#047857\].*?shadow-sm hover:brightness-110/g, 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg hover:bg-emerald-500/20 hover:ring-emerald-500/40 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300');

content = content.replace(/bg-slate-100 border-slate-300 text-slate-600 shadow-sm hover:bg-slate-200/g, 'bg-[#121C2D]/60 text-slate-400 ring-1 ring-stone-500/20 hover:bg-[#18263C]/90 hover:text-slate-200 transition-all duration-300');

// ----- 4. Renk İnce Ayarları (Eski Mavi Metinlerin Temizlenmesi) -----
content = content.replace(/text-blue-100/g, 'text-slate-200');
content = content.replace(/text-blue-200/g, 'text-slate-400');
content = content.replace(/text-blue-300/g, 'text-slate-500');
content = content.replace(/text-blue-400/g, 'text-slate-400');
content = content.replace(/border-blue-700/g, 'border-[#1e293b]');
content = content.replace(/border-blue-800/g, 'border-[#0f172a]');
content = content.replace(/placeholder-blue-300/g, 'placeholder-slate-600');

// ----- 5. Üst Metrik Kutuları (Zümrüt Premium Düzenlemesi) -----
content = content.replace(/bg-\[\#022c22\]/g, 'bg-[#030907]/80 backdrop-blur-xl ring-1 ring-emerald-900/40');

fs.writeFileSync(filepath, content);
console.log('TEMA DÜNYA STANDARTLARINA (PREMIUM DARK & GLASS) ÇEKILDI.');
