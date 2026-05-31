"""
Verifica autores sem editora no mesmo link.

No CWR original:
  OWR (autor) + PWR (publisher) ficam agrupados.
  Autor SEM PWR = não controlado.

Na estrutura mock-obras.ts atual:
  Autores e publishers estão em links SEPARADOS (w1, w2, p1, p2...).
  A pergunta é: autores marcados controlado:true mas sem nenhum publisher
  vinculado — isso existe? E se existir, o % deles está sendo somado indevidamente?
"""
import re
from collections import defaultdict

SRC = r'C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-obras.ts'
PAPEL_ESCRITOR  = {'autor', 'compositor', 'autor_ca', 'versionista', 'adaptador', 'arranjador'}
PAPEL_PUBLISHER = {'editora_original', 'editora_subeditor', 'administradora'}

with open(SRC, 'r', encoding='utf-8') as f:
    src = f.read()

def extract_objects(text):
    results, depth, start = [], 0, -1
    for i, ch in enumerate(text):
        if ch == '{':
            if depth == 0: start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and start != -1:
                results.append((start, i+1, text[start:i+1]))
                start = -1
    return results

def gfs(block, key):
    m = re.search(r'\b' + key + r':\s*"([^"]*)"', block)
    return m.group(1) if m else None

def gfn(block, key):
    m = re.search(r'\b' + key + r':\s*([\d.]+)', block)
    return float(m.group(1)) if m else 0.0

def gfb(block, key):
    m = re.search(r'\b' + key + r':\s*(true|false)', block)
    return m.group(1) == 'true' if m else False

array_start = src.index('export const MOCK_OBRAS: Obra[] = [')
arr_open    = src.index('[', array_start) + 1

total_obras = 0
obras_com_autor_sem_pub = 0  # obra tem autores ctrl mas ZERO publishers ctrl
autores_ctrl_sem_pub_total = 0  # total de autores ctrl em obras sem nenhum publisher
autores_ctrl_com_pub_total = 0

casos = []  # exemplos

for _, _, obra_block in extract_objects(src[arr_open:]):
    obra_id = gfs(obra_block, 'id')
    if not obra_id or not obra_id.startswith('obra-'):
        continue
    total_obras += 1
    codigo = gfs(obra_block, 'codigo') or '?'
    titulo = gfs(obra_block, 'titulo') or '?'

    lm = re.search(r'_links:\s*\[', obra_block)
    if not lm: continue
    ls = lm.end(); depth = 1; pos = ls
    while pos < len(obra_block) and depth > 0:
        if obra_block[pos] == '[': depth += 1
        elif obra_block[pos] == ']': depth -= 1
        pos += 1
    links_text = obra_block[ls:pos-1]

    writers = []
    publishers = []

    for _, _, lb in extract_objects(links_text):
        tm = re.search(r'titulares:\s*\[', lb)
        if not tm: continue
        ts = tm.end(); d2 = 1; p2 = ts
        while p2 < len(lb) and d2 > 0:
            if lb[p2] == '[': d2 += 1
            elif lb[p2] == ']': d2 -= 1
            p2 += 1
        tits_text = lb[ts:p2-1]

        for _, _, tb in extract_objects(tits_text):
            papel = gfs(tb, 'papel') or ''
            ctrl  = gfb(tb, 'controlado')
            pct   = gfn(tb, 'percentual')
            nome  = gfs(tb, 'nome') or '?'
            if papel in PAPEL_ESCRITOR:
                writers.append({'nome': nome, 'pct': pct, 'ctrl': ctrl})
            elif papel in PAPEL_PUBLISHER:
                publishers.append({'nome': nome, 'pct': pct, 'ctrl': ctrl})

    writers_ctrl = [w for w in writers if w['ctrl']]
    pubs_ctrl    = [p for p in publishers if p['ctrl']]

    if writers_ctrl and not pubs_ctrl:
        obras_com_autor_sem_pub += 1
        autores_ctrl_sem_pub_total += len(writers_ctrl)
        if len(casos) < 10:
            casos.append({
                'codigo': codigo, 'titulo': titulo[:45],
                'writers': writers_ctrl,
                'all_pubs': publishers,
            })
    elif writers_ctrl and pubs_ctrl:
        autores_ctrl_com_pub_total += len(writers_ctrl)

print(f"Total obras: {total_obras}")
print(f"\nObras com autor ctrl SEM nenhuma editora ctrl: {obras_com_autor_sem_pub}")
print(f"  Autores ctrl nessas obras:  {autores_ctrl_sem_pub_total}")
print(f"Obras com autor ctrl COM editora ctrl:")
print(f"  Autores ctrl nessas obras:  {autores_ctrl_com_pub_total}")

if casos:
    print(f"\n--- EXEMPLOS (autores ctrl sem editora ctrl) ---")
    for c in casos[:5]:
        print(f"\n  {c['codigo']} | {c['titulo']}")
        for w in c['writers']:
            print(f"    AUTOR ctrl:   {w['nome'][:40]:40} {w['pct']:6.2f}%")
        for p in c['all_pubs']:
            ctrl_str = 'ctrl' if p['ctrl'] else 'NAO ctrl'
            print(f"    PUBLISHER:    {p['nome'][:40]:40} {p['pct']:6.2f}% [{ctrl_str}]")
else:
    print("\nNenhum caso encontrado.")
