import os
import re
import sys

def camel_case(s):
    if not s:
        return s
    return s[0].lower() + s[1:]

def update_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add using if missing
    using_statement = "using System.Text.Json.Serialization;"
    if using_statement not in content:
        # Find the last using statement or the beginning of namespace/class
        using_matches = list(re.finditer(r'^using\s+[\w\.]+;', content, re.MULTILINE))
        if using_matches:
            last_using = using_matches[-1]
            content = content[:last_using.end()] + f"\n{using_statement}" + content[last_using.end():]
        elif "namespace" in content:
            content = content.replace("namespace", f"{using_statement}\n\nnamespace", 1)
        else:
            content = f"{using_statement}\n{content}"

    # Handle primary constructor records
    # Pattern: public (sealed )?record Name(...)
    def replace_record(match):
        prefix = match.group(1) or ""
        name = match.group(2)
        params = match.group(3)
        suffix = match.group(4) or ""
        
        updated_params = []
        param_list = []
        current_param = ""
        depth = 0
        for char in params:
            if char == ',' and depth == 0:
                param_list.append(current_param.strip())
                current_param = ""
            else:
                current_param += char
                if char == '<' or char == '(':
                    depth += 1
                elif char == '>' or char == ')':
                    depth -= 1
        if current_param.strip():
            param_list.append(current_param.strip())

        for p in param_list:
            if not p: continue
            # Handle comments or existing attributes
            clean_p = re.sub(r'/\*.*?\*/', '', p)
            clean_p = re.sub(r'//.*', '', clean_p).strip()
            
            # Find the parameter name (usually the last word before = or end)
            # Be careful with defaults like 'string? SearchText = null'
            m = re.search(r'([\w@]+)\s*(=.*)?$', clean_p)
            if not m:
                updated_params.append(p)
                continue
            
            prop_name = m.group(1)
            camel = camel_case(prop_name)
            
            if "JsonPropertyName" in p:
                updated_params.append(p)
            else:
                # Insert [property: JsonPropertyName("...")] before the parameter
                # If there are already attributes like [property: ...], we append to them
                # But let's keep it simple for now
                updated_params.append(f'[property: JsonPropertyName("{camel}")] {p}')
        
        if len(updated_params) > 1 or "\n" in params:
            params_str = ",\n    ".join(updated_params)
            return f"public {prefix}record {name}(\n    {params_str}){suffix}"
        else:
            params_str = ", ".join(updated_params)
            return f"public {prefix}record {name}({params_str}){suffix}"

    # Match public (sealed )?record Name(...)
    content = re.sub(r'public\s+(sealed\s+)?record\s+(\w+)\s*\(([\s\S]*?)\)([\s\S]*?)(?=\{|$|;)', replace_record, content)

    # Handle properties in classes/records body
    def replace_property(match):
        indent = match.group(1)
        attributes = match.group(2) or ""
        prop_type = match.group(3)
        prop_name = match.group(4)
        rest = match.group(5)
        
        if "JsonPropertyName" in attributes or "JsonPropertyName" in prop_name:
            return match.group(0)
        
        camel = camel_case(prop_name)
        return f'{indent}[JsonPropertyName("{camel}")]\n{indent}{attributes}public {prop_type} {prop_name}{rest}'

    # Matches properties like: public string Name { get; set; }
    # indent, attributes, type, name, rest
    prop_regex = r'^(\s+)((\[[^\]]+\]\s*)*)public\s+([\w<>\[\]\?\.@]+)\s+(\w+)\s*(\{[\s\S]*?\})'
    content = re.sub(prop_regex, replace_property, content, flags=re.MULTILINE)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        if os.path.exists(arg):
            update_file(arg)
            print(f"Updated {arg}")
