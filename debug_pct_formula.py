"""
Diagnóstico da fórmula de _percentual_controlado.

Regra do usuário:
  Para cada obra, somar:
  - % de cada autor (CA/A) controlado
  - % de cada editora (E) controlada
  - % de cada admin (AM) controlada
  Chegando ao % total controlado.

Se editora aparece 1x por link de autor no CWR → deve contar N vezes (N = nº autores).
Se editora está armazenada já duplicada (1 entrada por autor) → somar diretamente.

Este script verifica os dois cenários e compara com _percentual_controlado atual.
"""
import re, json
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

def analisar_obra(obra_block):
    codigo = gfs(obra_block, 'codigo') or '?'
    titulo = gfs(obra_block, 'titulo') or '?'
    pct_atual_m = re.search(r'_percentual_controlado:\s*([\d.]+)', obra_block)
    pct_atual = float(pct_atual_m.group(1)) if pct_atual_m else None

    lm = re.search(r'_links:\s*\[', obra_block)
    if not lm:
        return None

    ls = lm.end(); depth = 1; pos = ls
    while pos < len(obra_block) and depth > 0:
        if obra_block[pos] == '[': depth += 1
        elif obra_block[pos] == ']': depth -= 1
        pos += 1
    links_text = obra_block[ls:pos-1]

    writers = []   # {'pct': float, 'nome': str, 'link_id': str, 'ctrl': bool}
    publishers = []  # {'pct': float, 'nome': str, 'papel': str, 'ctrl': bool}

    for _, _, lb in extract_objects(links_text):
        lid_m = re.search(r'\bid:\s*"([^"]*)"', lb)
        link_id = lid_m.group(1) if lid_m else ''
        link_ctrl = gfb(lb, 'controlado')

        tm = re.search(r'titulares:\s*\[', lb)
        if not tm: continue
        ts = tm.end(); d2 = 1; p2 = ts
        while p2 < len(lb) and d2 > 0:
            if lb[p2] == '[': d2 += 1
            elif lb[p2] == ']': d2 -= 1
            p2 += 1
        tits_text = lb[ts:p2-1]

        for _, _, tb in extract_objects(tits_text):
            nome  = gfs(tb, 'nome') or '?'
            papel = gfs(tb, 'papel') or ''
            pct   = gfn(tb, 'percentual')
            tit_ctrl = gfb(tb, 'controlado')

            if papel in PAPEL_ESCRITOR:
                writers.append({'pct': pct, 'nome': nome, 'link_id': link_id, 'ctrl': tit_ctrl})
            elif papel in PAPEL_PUBLISHER:
                publishers.append({'pct': pct, 'nome': nome, 'papel': papel, 'ctrl': tit_ctrl, 'link_id': link_id})

    # Fórmula A: soma direta (publishers já estão multiplicados / 1 por autor)
    writer_ctrl_pcts = [w['pct'] for w in writers if w['ctrl']]
    pub_ctrl_pcts    = [p['pct'] for p in publishers if p['ctrl']]
    formula_a = sum(writer_ctrl_pcts) + sum(pub_ctrl_pcts)

    # Fórmula B: publishers × n_writers (publishers armazenados 1x para todos autores)
    n_w_ctrl = len(set(w['link_id'] for w in writers if w['ctrl']))
    n_w_ctrl = max(1, n_w_ctrl)
    # Unique publishers (deduplicate by nome+papel para evitar contar 2x quando já duplicado)
    pub_by_nome = defaultdict(float)
    for p in publishers:
        if p['ctrl']:
            pub_by_nome[p['nome'] + '|' + p['papel']] += p['pct']
    # Verificar se publishers parecem duplicados (mesmo nome aparece n_w vezes)
    pub_entries_per_name = defaultdict(int)
    for p in publishers:
        if p['ctrl']:
            pub_entries_per_name[p['nome'] + '|' + p['papel']] += 1
    max_dup = max(pub_entries_per_name.values()) if pub_entries_per_name else 0
    duplicated = (max_dup >= n_w_ctrl and n_w_ctrl > 1)

    if duplicated:
        # Publishers já estão duplicados por autor → somar direto
        formula_b = formula_a
    else:
        # Publishers estão 1x → multiplicar por n_w
        formula_b = sum(writer_ctrl_pcts) + sum(pub_by_nome.values()) * n_w_ctrl

    return {
        'codigo': codigo, 'titulo': titulo[:40],
        'pct_atual': pct_atual,
        'formula_a': round(formula_a, 2),
        'formula_b': round(min(formula_b, 100.0), 2),
        'n_writers': len(writers),
        'n_writers_ctrl': n_w_ctrl,
        'n_pubs': len(publishers),
        'pub_duplicados': duplicated,
        'writers': writers[:3],
        'publishers': publishers,
    }

# Processar
array_start = src.index('export const MOCK_OBRAS: Obra[] = [')
arr_open    = src.index('[', array_start) + 1

obras = []
for _, _, obra_block in extract_objects(src[arr_open:]):
    obra_id = gfs(obra_block, 'id')
    if not obra_id or not obra_id.startswith('obra-'):
        continue
    r = analisar_obra(obra_block)
    if r:
        obras.append(r)

print(f"Total obras analisadas: {len(obras)}")

# Verificar discrepâncias
disc_a = [o for o in obras if o['pct_atual'] is not None and abs(o['formula_a'] - o['pct_atual']) > 1]
disc_b = [o for o in obras if o['pct_atual'] is not None and abs(o['formula_b'] - o['pct_atual']) > 1]

print(f"\nFórmula A (soma direta)      — discrepâncias vs atual: {len(disc_a)}")
print(f"Fórmula B (pub × n_writers)  — discrepâncias vs atual: {len(disc_b)}")

# Mostrar amostra de obras conhecidas
print("\n--- OBRAS ESPECÍFICAS ---")
for o in obras:
    if o['codigo'] in ('AFW2', 'AFW1', 'AFW3', 'AFW4', '1', '2', '3'):
        print(f"\n{o['codigo']:8} | {o['titulo'][:35]:35}")
        print(f"  Atual={o['pct_atual']}% | Fórmula_A={o['formula_a']}% | Fórmula_B={o['formula_b']}%")
        print(f"  Writers: {o['n_writers']} ({o['n_writers_ctrl']} ctrl) | Publishers: {o['n_pubs']} | Dup={o['pub_duplicados']}")
        for w in o['writers']:
            print(f"    W [{w['link_id'][-3:]}] {w['nome'][:30]:30} {w['pct']:6.2f}% ctrl={w['ctrl']}") 
        for p in o['publishers']:
            print(f"    P [{p['link_id'][-3:]}] {p['nome'][:30]:30} {p['pct']:6.2f}% {p['papel']}")

# Distribuição final
from collections import Counter
dist = Counter()
for o in obras:
    if o['formula_b'] == 100:
        dist['100%'] += 1
    elif o['formula_b'] >= 75:
        dist['75-99%'] += 1
    elif o['formula_b'] >= 50:
        dist['50-74%'] += 1
    elif o['formula_b'] >= 25:
        dist['25-49%'] += 1
    else:
        dist['<25%'] += 1

print(f"\n--- DISTRIBUIÇÃO FÓRMULA B ---")
for k, v in sorted(dist.items()):
    print(f"  {k}: {v}")

# Discrepância: obras onde formula_b != pct_atual (top 10)
print(f"\n--- TOP 10 DISCREPÂNCIAS (Fórmula B vs Atual) ---")
for o in sorted(disc_b, key=lambda x: abs(x['formula_b'] - (x['pct_atual'] or 0)), reverse=True)[:10]:
    print(f"  {o['codigo']:8} | atual={o['pct_atual']:7.2f}% | calc={o['formula_b']:7.2f}% | Δ={abs(o['formula_b']-(o['pct_atual'] or 0)):.2f}%  [{o['titulo'][:30]}]")
