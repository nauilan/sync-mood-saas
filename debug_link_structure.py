"""
Analisa estrutura real dos links no mock-obras.ts:
- Links com autor + editora no mesmo link = controlados
- Links com autor sozinho (sem editora no mesmo link) = não controlados
"""
import re

with open(r'apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

PAPEL_PUBLISHER = {'editora_original', 'administradora', 'editora_subeditor'}

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

def gfs(text, key):
    m = re.search(rf'\b{key}:\s*["\']([^"\']+)["\']', text)
    return m.group(1) if m else ''

def gfn(text, key):
    m = re.search(rf'\b{key}:\s*([\d.]+)', text)
    return float(m.group(1)) if m else 0.0

# Contadores
links_com_publisher = 0   # link com ao menos 1 editora
links_so_autor = 0        # link só com autores, sem editora
links_mistos = 0          # link com autor + editora juntos
sample_mistos = []
sample_so_autor = []

for obra_block in extract_nested(src):
    lid_m = re.search(r'\blinks:\s*\[', obra_block)
    if not lid_m: continue
    ls = lid_m.end(); depth=1; pos=ls
    while pos < len(obra_block) and depth > 0:
        if obra_block[pos] == '[': depth += 1
        elif obra_block[pos] == ']': depth -= 1
        pos += 1

    for lb in extract_nested(obra_block[ls:pos-1]):
        lid = gfs(lb, 'id')
        if not lid: continue
        tm = re.search(r'titulares:\s*\[', lb)
        if not tm: continue
        ts = tm.end(); d2=1; p2=ts
        while p2 < len(lb) and d2 > 0:
            if lb[p2] == '[': d2 += 1
            elif lb[p2] == ']': d2 -= 1
            p2 += 1
        tits = []
        for tb in extract_nested(lb[ts:p2-1]):
            n = gfs(tb, 'nome'); pa = gfs(tb, 'papel')
            tits.append({'nome': n, 'papel': pa})

        has_pub = any(t['papel'] in PAPEL_PUBLISHER for t in tits)
        has_aut = any(t['papel'] not in PAPEL_PUBLISHER for t in tits)

        if has_pub and has_aut:
            links_mistos += 1
            if len(sample_mistos) < 3:
                sample_mistos.append((lid, tits))
        elif has_pub:
            links_com_publisher += 1
        elif has_aut:
            links_so_autor += 1
            if len(sample_so_autor) < 3:
                sample_so_autor.append((lid, tits))

print(f"Links com autor + editora JUNTOS (mistos): {links_mistos}")
print(f"Links só com editora:                       {links_com_publisher}")
print(f"Links só com autor (sem editora):           {links_so_autor}")

if sample_mistos:
    print("\nExemplos de links MISTOS (autor + editora no mesmo link):")
    for lid, tits in sample_mistos:
        print(f"  {lid}")
        for t in tits: print(f"    {t['nome']} | {t['papel']}")

if sample_so_autor:
    print("\nExemplos de links SÓ AUTOR (sem editora):")
    for lid, tits in sample_so_autor:
        print(f"  {lid}")
        for t in tits: print(f"    {t['nome']} | {t['papel']}")
