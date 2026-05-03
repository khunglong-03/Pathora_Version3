const fs = require('fs');

const filePath = 'pathora/frontend/src/features/policies/components/PolicyPage.tsx';

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Spacing & layout -> `py-8 md:py-10 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto`
    content = content.replace(/max-w-\[1200px\]/g, 'max-w-7xl');
    content = content.replace(/pt-6 md:pt-12 flex flex-col gap-6 md:gap-8/g, 'py-8 md:py-10 flex flex-col gap-6 md:gap-8');
    content = content.replace(/px-4 sm:px-6 md:px-8/g, 'px-4 md:px-6 lg:px-8');

    // 2. Affordances and structural cleanup for utility stacking
    content = content.replace(/flex flex-col md:flex-row/g, 'v-stack md:h-stack');
    content = content.replace(/flex flex-col lg:flex-row/g, 'v-stack lg:h-stack');
    content = content.replace(/flex items-center justify-between/g, 'h-stack items-center justify-between');
    content = content.replace(/flex flex-wrap items-center/g, 'h-stack flex-wrap items-center');
    content = content.replace(/flex flex-wrap/g, 'h-stack flex-wrap');
    content = content.replace(/flex items-center/g, 'h-stack items-center');
    content = content.replace(/flex items-start/g, 'h-stack items-start');
    content = content.replace(/flex flex-col/g, 'v-stack');
    content = content.replace(/flex justify-center items-center/g, 'center');
    content = content.replace(/flex items-center justify-center/g, 'center');

    // 3. Typogaphy updates to slate and the Pathora bold display
    content = content.replace(/text-stone-/g, 'text-slate-');
    content = content.replace(/bg-stone-/g, 'bg-slate-');
    content = content.replace(/border-stone-/g, 'border-slate-');
    
    // Convert 2.5rem panels to 1.5rem panels
    content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-[1.5rem]');
    
    // Replace any lingering flex-1 with spacer
    content = content.replace(/className="(.*?)flex-1(.*?)"/g, 'className="$1spacer$2"');

    fs.writeFileSync(filePath, content);
    console.log(`Processed ${filePath}`);
}
