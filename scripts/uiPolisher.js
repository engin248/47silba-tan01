const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, '../src/features');

const replacements = [
    { from: /background:\s*'white'/g, to: "background: '#122b27'" },
    { from: /background:\s*'#ffffff'/gi, to: "background: '#122b27'" },
    { from: /background:\s*'#f1f5f9'/gi, to: "background: '#173a34'" },
    { from: /background:\s*'#f8fafc'/gi, to: "background: '#0b1d1a'" },
    { from: /background:\s*'#f9fafb'/gi, to: "background: '#0b1d1a'" },

    { from: /color:\s*'#0f172a'/gi, to: "color: 'white'" },
    { from: /color:\s*'#1e293b'/gi, to: "color: 'white'" },
    { from: /color:\s*'#334155'/gi, to: "color: '#e2e8f0'" },
    { from: /color:\s*'#475569'/gi, to: "color: '#a7f3d0'" },
    { from: /color:\s*'#64748b'/gi, to: "color: '#a7f3d0'" },
    { from: /color:\s*'#374151'/gi, to: "color: '#e2e8f0'" },
    { from: /color:\s*'#111827'/gi, to: "color: 'white'" },

    { from: /border:\s*'1px solid #e2e8f0'/gi, to: "border: '1px solid #1e4a43'" },
    { from: /border:\s*'1px solid #e5e7eb'/gi, to: "border: '1px solid #1e4a43'" },
    { from: /border:\s*'2px solid #e5e7eb'/gi, to: "border: '2px solid #1e4a43'" },
    { from: /border:\s*'2px solid #f1f5f9'/gi, to: "border: '2px solid #1e4a43'" },
    { from: /borderColor:\s*'#e5e7eb'/gi, to: "borderColor: '#1e4a43'" },
    { from: /borderColor:\s*'#e2e8f0'/gi, to: "borderColor: '#1e4a43'" },
    { from: /border:\s*'1px solid #f1f5f9'/gi, to: "border: '1px solid #1e4a43'" },

    { from: /bg-slate-50/g, to: "bg-[#0d1117] text-white" },
    { from: /bg-white/g, to: "bg-[#122b27]" },
    { from: /text-slate-800/g, to: "text-white" },
    { from: /text-slate-500/g, to: "text-emerald-200" },
    { from: /border-slate-200/g, to: "border-[#1e4a43]" },
    { from: /text-slate-900/g, to: "text-white" },
    { from: /text-gray-800/g, to: "text-white" },
    { from: /text-gray-500/g, to: "text-emerald-200" },
    { from: /border-gray-200/g, to: "border-[#1e4a43]" },
    { from: /text-slate-600/g, to: "text-emerald-300" }
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Apply mappings
    for (const { from, to } of replacements) {
        content = content.replace(from, to);
    }

    // Special wrapper fixes
    content = content.replace(/className="min-h-screen[^"]*"/, 'className="min-h-screen font-sans text-white bg-[#0d1117]"');
    content = content.replace(/className='min-h-screen[^']*'/, "className='min-h-screen font-sans text-white bg-[#0d1117]'");

    // Add wrapper div if it's returning empty div but doesn't have min-h-screen
    // Actually that might be risky, skipping advanced AST rewrites for now.

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', path.basename(filePath));
        return true;
    }
    return false;
}

function traverse(dir) {
    let updatedCount = 0;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            updatedCount += traverse(fullPath);
        } else if (file.endsWith('MainContainer.js') && file !== 'KarargahMainContainer.js') {
            if (processFile(fullPath)) updatedCount++;
        }
    }
    return updatedCount;
}

const total = traverse(featuresDir);
console.log(`\nOperation Complete. Total updated modules: ${total}`);
