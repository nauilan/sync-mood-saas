import re

with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

# Encontrar obra AFW2
start = src.find('codigo: "AFW2"')
# Pegar bloco maior — vai até o proximo obra-XXXX
end = src.find('  {', start + 100)
block = src[max(0,start-200):end]

# Encontrar _links array
lm = re.search(r'_links:\s*\[', block)
if lm:
    ls = lm.end()
    # Extrair o array completo
    depth = 1; pos = ls
    while pos < len(block) and depth > 0:
        if block[pos] == '[': depth += 1
        elif block[pos] == ']': depth -= 1
        pos += 1
    links_raw = block[ls:pos-1]
    print("=== _links RAW (primeiros 2000 chars) ===")
    print(links_raw[:2000])
