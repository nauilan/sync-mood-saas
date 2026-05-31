"""
Analisa os percentuais das editoras por obra no mock-obras.ts.
Compara com o percentual total de autores controlados por obra.
"""
import re, json

with open(r'apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

with open('dist_resultado.json', 'r', encoding='utf-8') as f:
    dist = json.load(f)

PAPEL_PUBLISHER = {'editora_original', 'administradora', 'editora_subeditor'}

def gfs(text, key):
    m = re.search(rf'\b{key}:\s*["\']([^"\']+)["\']', text)
    return m.group(1) if m else ''

def gfn(text, key):
    m = re.search(rf'\b{key}:\s*([\d.]+)', text)
    return float(m.group(1)) if m else 0.0

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

# Obras que aparecem na distribuição
obras_dist = {o['obra_codigo'] for o in dist['cc_obras']}

# Para cada obra com distribuição, ver % das editoras vs % dos autores
rows = []
for obra_block in extract_nested(src):
    cod = gfs(obra_block, 'codigo')
    if cod not in obras_dist:
        continue
    titulo = gfs(obra_block, 'titulo')

    lid_m = re.search(r'\blinks:\s*\[', obra_block)
    if not lid_m:
        continue
    ls = lid_m.end(); depth=1; pos=ls
    while pos < len(obra_block) and depth > 0:
        if obra_block[pos] == '[': depth += 1
        elif obra_block[pos] == ']': depth -= 1
        pos += 1

    edi_pct = 0.0; top_pct = 0.0; other_pub_pct = 0.0; autor_pct = 0.0
    n_pub_links = 0; n_aut_links = 0

    for lb in extract_nested(obra_block[ls:pos-1]):
        tm = re.search(r'titulares:\s*\[', lb)
        if not tm: continue
        ts = tm.end(); d2=1; p2=ts
        while p2 < len(lb) and d2 > 0:
            if lb[p2] == '[': d2 += 1
            elif lb[p2] == ']': d2 -= 1
            p2 += 1
        for tb in extract_nested(lb[ts:p2-1]):
            nome = gfs(tb, 'nome'); papel = gfs(tb, 'papel'); pct = gfn(tb, 'percentual')
            if papel in PAPEL_PUBLISHER:
                n_pub_links += 1
                if 'EDI' in nome.upper():
                    edi_pct += pct
                elif 'TOP SHOW' in nome.upper():
                    top_pct += pct
                else:
                    other_pub_pct += pct
            else:
                autor_pct += pct
                n_aut_links += 1

    total_pub = edi_pct + top_pct + other_pub_pct
    total_all = total_pub + autor_pct
    pub_share = total_pub / total_all * 100 if total_all > 0 else 0
    rows.append((cod, titulo[:35], round(autor_pct,2), round(edi_pct,2), round(top_pct,2), round(total_pub,2), round(pub_share,1)))

rows.sort(key=lambda x: -x[5])
print(f"{'COD':>5}  {'TITULO':35}  {'AUTORES%':>10}  {'EDI%':>8}  {'TOP%':>8}  {'PUB_TOTAL%':>12}  {'PUB/ALL%':>10}")
print('-'*100)
for r in rows[:30]:
    print(f"{r[0]:>5}  {r[1]:35}  {r[2]:>10.2f}  {r[3]:>8.2f}  {r[4]:>8.2f}  {r[5]:>12.2f}  {r[6]:>10.1f}%")

# Resumo
total_aut = sum(r[2] for r in rows)
total_edi = sum(r[3] for r in rows)
total_top = sum(r[4] for r in rows)
total_pub = sum(r[5] for r in rows)
total_all = total_aut + total_pub
print()
print(f"MÉDIA % editoras sobre total controlado: {total_pub/total_all*100:.1f}%")
print(f"  EDI MUSIC média: {total_edi/total_all*100:.2f}%  |  TOP SHOW média: {total_top/total_all*100:.2f}%")
