const fs = require('fs');
const file = 'pathora/frontend/src/features/dashboard/components/TourInstanceDetailPage.tsx';
let content = fs.readFileSync(file, 'utf8');

function processClasses(classes) {
    let clsArr = classes.split(/\s+/).filter(Boolean);
    
    const getPrefix = (c) => {
        const parts = c.split(':');
        if (parts.length > 1) return parts.slice(0, -1).join(':') + ':';
        return '';
    };

    let prefixes = [...new Set(clsArr.map(getPrefix))];
    let newArr = [];
    
    for (let prefix of prefixes) {
        let pClasses = clsArr.filter(c => getPrefix(c) === prefix).map(c => c.slice(prefix.length));
        
        let hasFlex = pClasses.includes('flex');
        let hasInlineFlex = pClasses.includes('inline-flex');
        let hasFlexCol = pClasses.includes('flex-col');
        let hasFlexRow = pClasses.includes('flex-row');
        let hasItemsCenter = pClasses.includes('items-center');
        let hasJustifyCenter = pClasses.includes('justify-center');
        
        // flex-1 -> spacer
        pClasses = pClasses.map(c => c === 'flex-1' ? 'spacer' : c);
        
        if (hasFlex) {
            if (hasItemsCenter && hasJustifyCenter && !hasFlexCol && !hasFlexRow) {
                pClasses = pClasses.filter(c => c !== 'flex' && c !== 'items-center' && c !== 'justify-center');
                pClasses.push('center');
            } else if (hasFlexCol) {
                pClasses = pClasses.filter(c => c !== 'flex' && c !== 'flex-col');
                pClasses.push('v-stack');
            } else {
                pClasses = pClasses.filter(c => c !== 'flex' && c !== 'flex-row');
                pClasses.push('h-stack');
            }
        }
        
        newArr.push(...pClasses.map(c => prefix + c));
    }
    
    return newArr.join(' ');
}

let newContent = content.replace(/(className=|cn\()([`"'])(.*?)\2/g, (match, p1, p2, p3) => {
    return p1 + p2 + processClasses(p3) + p2;
});

// Also replace inside template literals gracefully if simple
// className={`flex flex-col ${var}`}
// We can just do a few global replaces for common patterns
newContent = newContent.replace(/(?<!-)\bflex flex-col\b/g, 'v-stack');
newContent = newContent.replace(/(?<!-)\bflex flex-row\b/g, 'h-stack');
newContent = newContent.replace(/(?<!-)\bflex items-center justify-center\b/g, 'center');
newContent = newContent.replace(/(?<!-)\bflex-1\b/g, 'spacer');

fs.writeFileSync(file, newContent);
console.log('Refactored classes');
