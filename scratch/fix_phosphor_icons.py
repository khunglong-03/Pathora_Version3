import os
import re

def refactor_icons(directory):
    count = 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Find all phosphor imports block
                import_pattern = r'import\s+\{([\s\S]*?)\}\s+from\s+[\'"]@phosphor-icons/react[\'"]'
                matches = list(re.finditer(import_pattern, content))
                if not matches:
                    continue

                new_content = content
                modified = False
                
                for match in matches:
                    import_block = match.group(0)
                    inner_imports = match.group(1)
                    
                    tags = [t.strip() for t in inner_imports.replace('\n', ',').split(',') if t.strip()]
                    
                    tag_replacements = {}
                    for tag in tags:
                        if ' as ' in tag:
                            continue
                        if not tag.endswith('Icon') and re.match(r'^[A-Z][a-zA-Z0-9]*$', tag):
                            tag_replacements[tag] = tag + 'Icon'
                            
                    if not tag_replacements:
                        continue
                    
                    modified = True
                    
                    # 1. First, replace the import statement exactly
                    new_inner = inner_imports
                    for old, new in tag_replacements.items():
                        new_inner = re.sub(r'\b' + old + r'\b', new, new_inner)
                    
                    new_import_block = import_block.replace(inner_imports, new_inner)
                    new_content = new_content.replace(import_block, new_import_block)
                    
                    # 2. Re-replace the generic occurrences in the WHOLE file body
                    for old, new in tag_replacements.items():
                        # We use \b to ensure exact word matches
                        new_content = re.sub(r'\b' + old + r'\b', new, new_content)
                
                if modified:
                    with open(filepath, 'w', encoding='utf-8') as fx:
                        fx.write(new_content)
                    print(f"Refactored: {filepath}")
                    count += 1

    print(f"Total files updated: {count}")

if __name__ == "__main__":
    refactor_icons(r"d:\Doan2\pathora\frontend\src")
