const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  content = content.replace(/sm:flex-row/g, 'sm:h-stack');
  content = content.replace(/md:flex-row/g, 'md:h-stack');
  content = content.replace(/lg:flex-row/g, 'lg:h-stack');
  content = content.replace(/xl:flex-row/g, 'xl:h-stack');
  
  content = content.replace(/sm:flex-col/g, 'sm:v-stack');
  content = content.replace(/md:flex-col/g, 'md:v-stack');
  content = content.replace(/lg:flex-col/g, 'lg:v-stack');
  content = content.replace(/xl:flex-col/g, 'xl:v-stack');

  // Also replace any remaining flex items-center justify-center
  content = content.replace(/flex items-center justify-center/g, 'center');

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
