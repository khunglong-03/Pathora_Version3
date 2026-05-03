const fs = require('fs');
const filePath = 'pathora/frontend/src/features/policies/components/PolicyPage.tsx';

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix remaining padding/margin to match design spec
    content = content.replace(/p-8 md:p-10/g, 'p-6 md:p-8 lg:p-10'); // Makes internal padding slightly more dynamic
    
    // Ensure all h-stack/v-stack apply correctly
    content = content.replace(/flex flex-col gap-2/g, 'v-stack gap-2');
    content = content.replace(/flex flex-col gap-1/g, 'v-stack gap-1');
    content = content.replace(/flex items-center gap-4/g, 'h-stack items-center gap-4');
    content = content.replace(/flex items-center gap-5/g, 'h-stack items-center gap-5');
    content = content.replace(/flex flex-col gap-8/g, 'v-stack gap-8');
    content = content.replace(/flex flex-col gap-5/g, 'v-stack gap-5');
    content = content.replace(/flex items-start gap-5/g, 'h-stack items-start gap-5');

    fs.writeFileSync(filePath, content);
    console.log(`Processed ${filePath} - Pass 3`);
}
