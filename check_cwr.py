"""Verifica quantas obras têm estrutura CWR incorreta (publisher não duplicado por escritor)."""
import re

with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

def extract_nested(text):
    results = []; depth = 0; start = -1
    for i, ch in enumerate(text):
        if ch == '{':
            if depth == 0: start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start != -1:
                results.append(text[start:i+1]); start = -1
    return results

def gfs(block, key):
    m = re.search(r'\b' + key + r':\s*"([^"]*)"', block)
    return m.group(1) if m else None

def gfn(block, key):
    m = re.search(r'\b' + key + r':\s*([\d.]+)', block)
    return float(m.group(1)) if m else 0.0

mock_start = src.index('export const MOCK_OBRAS: Obra[] = [')
array_content = src[src.index('[', mock_start)+1:]
obra_blocks = extract_nested(array_content)

issues = 0
total_obras = 0
examples = []

for block in obra_blocks:
    obra_id = gfs(block, 'id')
    if not obra_id or not obra_id.startswith('obra-'):
        continue
    total_obras += 1
    codigo = gfs(block, 'codigo') or '?'
    titulo = gfs(block, 'titulo') or '?'

    lm = re.search(r'_links:\s*\[', block)
    if not lm:
        continue
    ls = lm.end(); depth = 1; pos = ls
    while pos < len(block) and depth > 0:
        if block[pos] == '[': depth += 1
        elif block[pos] == ']': depth -= 1
        pos += 1

    writer_pcts = []
    pub_pcts = []
    for lb in extract_nested(block[ls:pos-1]):
        tm = re.search(r'titulares:\s*\[', lb)
        if not tm:
            continue
        ts = tm.end(); d2 = 1; p2 = ts
        while p2 < len(lb) and d2 > 0:
            if lb[p2] == '[': d2 += 1
            elif lb[p2] == ']': d2 -= 1
            p2 += 1
        for tb in extract_nested(lb[ts:p2-1]):
            n = gfs(tb, 'nome')
            pa = gfs(tb, 'papel')
            pc = gfn(tb, 'percentual')
            if not n:
                continue
            if pa in ('autor', 'compositor', 'autor_ca', 'versionista'):
                writer_pcts.append(pc)
            else:
                pub_pcts.append((pa or 'unknown', pc))

    n_writers = len(writer_pcts)
    if n_writers < 2 or not pub_pcts:
        continue

    total_sum = sum(writer_pcts) + sum(p for _, p in pub_pcts)
    if abs(total_sum - 100.0) > 0.5:
        issues += 1
        expected = sum(writer_pcts) + n_writers * sum(p for _, p in pub_pcts)
        if len(examples) < 8:
            examples.append((codigo, titulo, n_writers, total_sum, expected, writer_pcts, pub_pcts))

print("Obras com estrutura CWR incompleta (publisher nao duplicado por escritor):")
for e in examples:
    cod, tit, nw, s, exp, wp, pp = e
    print(f"  {cod:8} | {tit[:35]:35} | {nw} escritores | soma={s:.1f}% | CWR_correto={exp:.1f}%")
    print(f"           escritores: {wp}")
    print(f"           pub/admin:  {pp}")

print(f"\nTotal obras analisadas: {total_obras}")
print(f"Obras com estrutura CWR incorreta: {issues}")
print(f"Obras ok (1 escritor ou publisher ja proporcional): {total_obras - issues}")
