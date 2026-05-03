const fs = require('fs');

let content = fs.readFileSync('pathora/frontend/src/features/dashboard/components/PrivateTourInstanceListPage.tsx', 'utf8');

content = content.replace(/flex flex-col md:flex-row/g, 'v-stack md:h-stack');
content = content.replace(/flex items-center justify-between/g, 'h-stack items-center justify-between');
content = content.replace(/flex items-center/g, 'h-stack items-center');
content = content.replace(/flex flex-col/g, 'v-stack');
content = content.replace(/flex-1/g, 'spacer');

// Update typography and colors based on Pathora design guidelines
content = content.replace(/text-stone-/g, 'text-slate-');
content = content.replace(/bg-stone-/g, 'bg-slate-');
content = content.replace(/border-stone-/g, 'border-slate-');

content = content.replace(/max-w-\[87\.5rem\]/g, 'max-w-7xl');
content = content.replace(/p-6 space-y-6/g, 'py-8 md:py-10 px-4 md:px-6 lg:px-8 space-y-6');

content = content.replace(/text-3xl font-bold tracking-tight text-slate-900/g, 'text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-tight');

// Filter options simplification
content = content.replace(/<option value="draft">.*?<\/option>\n\s*<option value="pendingadjustment">.*?<\/option>\n\s*<option value="pendingmanagerreview">.*?<\/option>\n\s*<option value="pendingcustomerapproval">.*?<\/option>/, '');

fs.writeFileSync('pathora/frontend/src/features/dashboard/components/PrivateTourInstanceListPage.tsx', content);
