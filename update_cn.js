const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Add import if cn is not imported and className is used
  if (!content.includes('import { cn }') && content.includes('className=')) {
    // Find the last import
    const importMatch = content.match(/import .* from .*;/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      content = content.replace(lastImport, lastImport + '\nimport { cn } from "@/lib/cn";');
    } else {
      content = 'import { cn } from "@/lib/cn";\n' + content;
    }
  }

  // Replace className="static string" with className={cn("static string")}
  // We need to match className="([^"]*)" but not let it match inside string literals if it's inside JS logic
  // Since it's JSX, className="..." is safe.
  content = content.replace(/className="([^"]+)"/g, 'className={cn("$1")}');

  // We should also replace template literals className={`... ${...}`} with cn("...", ...)
  // This is harder to do safely with regex. 

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Updated cn in", filePath);
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
