import re
with open('apps/web/lib/mock-obras.ts', encoding='utf-8') as f:
    src = f.read()
false_count = len(re.findall(r'controlado:\s*false', src))
true_count  = len(re.findall(r'controlado:\s*true', src))
print(f'controlado: true  = {true_count}')
print(f'controlado: false = {false_count}')
# Mostra primeiros 5 exemplos de false
count = 0
for m in re.finditer(r'controlado:\s*false', src):
    start = max(0, m.start()-400)
    snippet = src[start:m.start()+50]
    nome = re.search(r'nome:\s*"([^"]+)"', snippet)
    papel = re.search(r'papel:\s*"([^"]+)"', snippet)
    pct = re.search(r'percentual:\s*([\d.]+)', snippet)
    n = nome.group(1) if nome else '?'
    pa = papel.group(1) if papel else '?'
    pc = pct.group(1) if pct else '?'
    print(f'  nome={n[:35]}, papel={pa}, pct={pc}%')
    count += 1
    if count >= 5:
        break
