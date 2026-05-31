import re

with open('apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

# For each obra in dist, check _percentual_controlado vs actual sum
import json
with open('dist_resultado.json', 'r', encoding='utf-8') as f:
    dist = json.load(f)
obras_dist = {o['obra_codigo'] for o in dist['cc_obras']}

obra_re = re.compile(r'\{\s*\n\s*id:\s*"(obra-\d+)",')

def find_end_brace(text, start):
    depth = 0
    for i in range(start, len(text)):
        if text[i] == '{': depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                return i
    return len(text)

PAPEL_PUB = {'editora_original', 'administradora', 'editora_subeditor'}

for afwcode in ['AFW2', 'AFW3', 'AFW9', '29']:
    m = re.search(rf'codigo:\s*"{afwcode}"', src)
    if not m:
        print(f"{afwcode}: not found"); continue
    s = src.rfind('{', 0, m.start())
    e = find_end_brace(src, s)
    block = src[s:e+1]
    
    pct_ctrl = re.search(r'_percentual_controlado:\s*([\d.]+)', block)
    pct_ctrl = float(pct_ctrl.group(1)) if pct_ctrl else 0
    
    autores = []; pubs = []
    for tm in re.finditer(r'percentual:\s*([\d.]+)', block):
        # get papel by looking before
        ctx = block[max(0,tm.start()-300):tm.end()]
        papel_m = re.search(r'papel:\s*"([^"]+)"', ctx)
        if not papel_m:
            continue
        papel = papel_m.group(1)
        nome_m = re.search(r'nome:\s*"([^"]+)"', ctx)
        nome = nome_m.group(1) if nome_m else ''
        pct = float(tm.group(1))
        if papel in PAPEL_PUB:
            pubs.append((nome, pct))
        else:
            autores.append((nome, pct))
    
    sum_aut = sum(p for _,p in autores)
    sum_pub = sum(p for _,p in pubs)
    total = sum_aut + sum_pub
    print(f"\n{afwcode} _pct_ctrl={pct_ctrl} | sum_autores={sum_aut:.2f} sum_pubs={sum_pub:.2f} total={total:.2f}")
    for n,p in autores:
        print(f"  AUTOR {n}: {p}%")
    for n,p in pubs:
        print(f"  PUB   {n}: {p}%")
