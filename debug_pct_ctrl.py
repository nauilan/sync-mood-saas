"""
Analisa o campo percentual_controlado nos links do mock-obras.ts
para distinguir autores controlados de não controlados.
"""
import re

with open(r'apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

PAPEL_PUBLISHER = {'editora_original', 'administradora', 'editora_subeditor'}

# Extrair TODOS os links com seus dados
links_data = []
for m in re.finditer(r'\{\s*id:\s*"(obra-\d+-\w+)"[^}]*?percentual_controlado:\s*([\d.]+)[^}]*?titulares:\s*\[', src, re.DOTALL):
    lid = m.group(1)
    pct_ctrl = float(m.group(2))
    # pegar titulares deste link
    ts = m.end(); depth=1; pos=ts
    while pos < len(src) and depth > 0:
        if src[pos] == '[': depth += 1
        elif src[pos] == ']': depth -= 1
        pos += 1
    tit_block = src[ts:pos-1]
    papeis = re.findall(r'papel:\s*"([^"]+)"', tit_block)
    links_data.append({'id': lid, 'pct_ctrl': pct_ctrl, 'papeis': papeis})

# Análise
from collections import Counter
# Links de autor: qual percentual_controlado têm?
autor_pcts = [l['pct_ctrl'] for l in links_data if any(p not in PAPEL_PUBLISHER for p in l['papeis'])]
pub_pcts   = [l['pct_ctrl'] for l in links_data if any(p in PAPEL_PUBLISHER for p in l['papeis'])]

print(f"Total links: {len(links_data)}")
print(f"Links de autor: {len(autor_pcts)}")
print(f"Links de publisher: {len(pub_pcts)}")
print()
print("Distribuição pct_controlado em links de AUTOR:")
ctr = Counter(autor_pcts)
for k in sorted(ctr.keys()):
    print(f"  {k:6.2f}% → {ctr[k]:4}x")
print()
print("Links de autor com pct_ctrl=0:")
zero_links = [l for l in links_data if l['pct_ctrl'] == 0 and any(p not in PAPEL_PUBLISHER for p in l['papeis'])]
print(f"  {len(zero_links)} links com percentual_controlado=0")
# mostrar exemplos de nomes em links pct=0
nomes_zero = set()
for m2 in re.finditer(r'percentual_controlado:\s*0[^}]*?nome:\s*"([^"]+)"', src, re.DOTALL):
    nomes_zero.add(m2.group(1))
print(f"  Nomes únicos em links pct=0: {len(nomes_zero)}")
for n in sorted(nomes_zero)[:10]:
    print(f"    {n}")
