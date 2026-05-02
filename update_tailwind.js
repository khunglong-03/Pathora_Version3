const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // flex flex-col -> v-stack
  content = content.replace(/flex flex-col/g, 'v-stack');
  
  // flex flex-row -> h-stack
  content = content.replace(/flex flex-row/g, 'h-stack');
  
  // flex items-center justify-center -> center
  content = content.replace(/flex items-center justify-center/g, 'center');
  
  // Just "flex " if it has items-center and justify-between
  // Actually, let's just do flex-1 -> spacer
  content = content.replace(/\bflex-1\b/g, 'spacer');
  
  // items-center h-stack or v-stack? We shouldn't blindly replace flex.
  // The rules in azz.md:
  // v-stack = flex flex-col
  // h-stack = flex flex-row
  // center = flex items-center justify-center
  // spacer = flex-1
  // circle = aspect-square rounded-full shrink-0
  
  content = content.replace(/aspect-square rounded-full shrink-0/g, 'circle');

  // Any remaining "flex" that is used to make a row? 
  // If it's `flex items-center` -> `items-center h-stack`
  // `flex justify-` -> `justify-... h-stack`
  // But wait, what if it's already `v-stack flex`? 
  // It's safer to only replace exact matches.

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Updated", filePath);
  }
}

function traverse(dir) {
  for (const f of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceFile(fullPath);
    }
  }
}

traverse('pathora/frontend/src/features/home/components');
