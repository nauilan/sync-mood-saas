import re, json

with open('apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

codigos = re.findall(r'codigo:\s*["\']([^"\']+)["\']', src)
print('Total obras mock:', len(codigos))
print('Exemplos codigo:', codigos[:10])

with open('dist_resultado.json', 'r', encoding='utf-8') as f:
    dist = json.load(f)

obras_dist = {o['obra_codigo'] for o in dist['cc_obras']}
print('Total obras dist:', len(obras_dist))
print('Exemplos dist:', list(obras_dist)[:10])

overlap = obras_dist & set(codigos)
print('Overlap:', len(overlap))

# Also check gfs function
def gfs(text, key):
    m = re.search(rf'\b{key}:\s*["\'](.*?)["\']', text)
    return m.group(1) if m else ''

# Extract obra blocks
def extract_nested(text):
    items = []; depth = 0; start = None
    for i, c in enumerate(text):
        if c == '{':
            if depth == 0: start = i
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0 and start is not None:
                items.append(text[start:i+1])
    return items

obras = extract_nested(src)
print('Blocos de obras extraídos:', len(obras))
if obras:
    print('Primeiro codigo via gfs:', gfs(obras[0], 'codigo'))
    print('Primeiros 200 chars:', obras[0][:200])
