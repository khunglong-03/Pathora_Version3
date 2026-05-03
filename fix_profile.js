const fs = require('fs');

const filePath = 'pathora/frontend/src/features/user/profile/ProfilePage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Spacing & layout -> `py-8 md:py-10 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto`
// Bỏ pt-20 cũ đi (chỉ dùng pt-8), chuyển max-w-4xl thành max-w-3xl
content = content.replace(/className="min-h-screen pt-20"/g, 'className="min-h-screen py-8 md:py-10"');
content = content.replace(/max-w-4xl mx-auto px-4 pb-8/g, 'max-w-3xl mx-auto px-4 md:px-6 lg:px-8');

// 2. Layout Stack - Fix flex classes
content = content.replace(/className="flex items-center gap-3"/g, 'className="h-stack items-center gap-3"');
content = content.replace(/className="w-10 h-10 rounded-full flex items-center justify-center"/g, 'className="size-10 rounded-full center"');
content = content.replace(/className="flex"/g, 'className="flex overflow-x-auto scrollbar-hide"'); // Nav flex

// Bỏ inline styles và dùng Tailwind
// Accent Bar Header
content = content.replace(/style={{ backgroundColor: CSS.accentMuted, borderTop: `3px solid \${CSS.accent}` }}/g, 'className="px-6 md:px-8 py-8 bg-blue-50/50 border-t-[3px] border-t-blue-500"');
content = content.replace(/className="px-6 py-8 transition-all duration-300"/g, '');

content = content.replace(/style={{ backgroundColor: `color-mix\(in srgb, \${CSS.accent} 15%, transparent\)` }}/g, 'className="size-10 rounded-full center bg-blue-100"');
content = content.replace(/style={{ color: CSS.accent }} className="w-5 h-5"/g, 'className="size-5 text-blue-600"');

// Typography
content = content.replace(/style={{ color: CSS.textPrimary, fontFamily: "var\(--font-display\)" }} className="text-2xl font-bold"/g, 'className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900"');
content = content.replace(/style={{ color: CSS.textSecondary }} className="mt-0\.5 text-sm"/g, 'className="mt-1 text-sm font-medium text-slate-500"');
content = content.replace(/style={{ color: CSS.textMuted }} className="text-xs mt-3 ml-\[52px\]"/g, 'className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-4 ml-[52px]"');

// Tabs Border
content = content.replace(/style={{ borderBottom: `1px solid \${CSS.border}` }}/g, 'className="border-b border-slate-200"');

// Tabs Items
content = content.replace(/style={{\s*color: isActive \? CSS.accent : CSS.textSecondary,\s*}}/g, '');
content = content.replace(/className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative hover:opacity-80 \${\s*isActive \? "" : "hover:!text-gray-700"\s*}`}/g, 
  'className={cn("h-stack items-center gap-2 px-6 py-4 text-sm font-bold transition-all shrink-0 relative hover:bg-slate-50", isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900")}');
content = content.replace(/className="w-4 h-4"/g, 'className="size-4"');

// Indicator
content = content.replace(/style={{ backgroundColor: CSS.accent }}/g, 'className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"');

// Panel Outer
content = content.replace(/style={{ backgroundColor: CSS.surface, boxShadow: CSS.shadowCard }}/g, 'className="bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/50"');
content = content.replace(/className="rounded-2xl overflow-hidden"/g, 'className="rounded-[1.5rem] overflow-hidden"');

// Panel Inner
content = content.replace(/className="p-6"/g, 'className="p-6 md:p-8"');

// Add cn import
if (!content.includes('import { cn }')) {
    content = content.replace('import { useMemo }', 'import { cn } from "@/lib/utils";\nimport { useMemo }');
}

fs.writeFileSync(filePath, content);
console.log(`Processed ${filePath}`);
