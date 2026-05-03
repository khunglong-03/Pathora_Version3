const fs = require('fs');

const filePaths = [
    'pathora/frontend/src/features/about/components/AboutHeroBanner.tsx',
    'pathora/frontend/src/features/about/components/AboutStatsBar.tsx',
    'pathora/frontend/src/features/about/components/AboutWhoWeAre.tsx',
    'pathora/frontend/src/features/about/components/AboutValuesSection.tsx',
    'pathora/frontend/src/features/about/components/AboutTimelineSection.tsx',
    'pathora/frontend/src/features/about/components/AboutTeamSection.tsx',
    'pathora/frontend/src/features/about/components/AboutCTABanner.tsx'
];

filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // 1. Spacing & layout -> `py-8 md:py-10 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto`
        content = content.replace(/max-w-\[1400px\]/g, 'max-w-7xl');
        content = content.replace(/max-w-\[1200px\]/g, 'max-w-7xl');
        content = content.replace(/py-20 md:py-32/g, 'py-8 md:py-10');
        content = content.replace(/py-16 md:py-24/g, 'py-8 md:py-10');
        content = content.replace(/py-24/g, 'py-8 md:py-10');
        content = content.replace(/px-6 lg:px-12/g, 'px-4 md:px-6 lg:px-8');
        content = content.replace(/px-4 md:px-8 lg:px-16/g, 'px-4 md:px-6 lg:px-8');
        content = content.replace(/px-6/g, 'px-4 md:px-6 lg:px-8');

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
        
        content = content.replace(/text-5xl md:text-7xl font-bold tracking-tighter/g, 'text-4xl md:text-5xl font-bold tracking-tighter');
        content = content.replace(/text-3xl md:text-5xl font-bold tracking-tighter/g, 'text-4xl md:text-5xl font-bold tracking-tighter');
        content = content.replace(/text-4xl md:text-5xl font-bold tracking-tighter leading-tight/g, 'text-4xl md:text-5xl font-bold tracking-tighter leading-none');
        
        // 4. Panel shapes and styling
        content = content.replace(/rounded-2xl/g, 'rounded-[1.5rem]');
        content = content.replace(/rounded-3xl/g, 'rounded-[1.5rem]');
        content = content.replace(/rounded-4xl/g, 'rounded-[2.5rem]');
        content = content.replace(/shadow-sm/g, 'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]');
        content = content.replace(/shadow-lg/g, 'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]');
        content = content.replace(/shadow-xl/g, 'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]');

        // Replace any lingering flex-1 with spacer
        content = content.replace(/className="(.*?)flex-1(.*?)"/g, 'className="$1spacer$2"');

        fs.writeFileSync(filePath, content);
        console.log(`Processed ${filePath}`);
    }
});
