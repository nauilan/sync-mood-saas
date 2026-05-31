"""
Corrige _percentual_controlado com lógica CWR real:

  _percentual_controlado = soma(escritores ctrl) + soma(publishers ctrl) × n_escritores

Isso reflete o padrão CWR onde cada publisher/admin aparece UMA VEZ POR LINK DE ESCRITOR.
Ex: 2 escritores × EDI MUSIC 10% = 20% total; + 2 escritores × TOP 2.5% = 5% total.
Se a obra é 100% administrada pela editora: result = 100%.
Se há OWR (escritores de outra editora): result < 100%.
"""
import re

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

def calcular_pct_controlado(obra_block):
    """Calcula _percentual_controlado com fórmula CWR: escritores + publishers × n_escritores."""
    lm = re.search(r'_links:\s*\[', obra_block)
    if not lm:
        return 100.0

    ls = lm.end(); depth = 1; pos = ls
    while pos < len(obra_block) and depth > 0:
        if obra_block[pos] == '[': depth += 1
        elif obra_block[pos] == ']': depth -= 1
        pos += 1
    links_text = obra_block[ls:pos-1]

    writer_pcts  = []   # percentual de cada escritor controlado
    pub_pcts     = []   # percentual de cada publisher/admin controlado
    writer_ids   = set()

    for _, _, lb in extract_objects(links_text):
        lid_m = re.search(r'\bid:\s*"([^"]*)"', lb)
        link_id = lid_m.group(1) if lid_m else ''

        tm = re.search(r'titulares:\s*\[', lb)
        if not tm: continue
        ts = tm.end(); d2 = 1; p2 = ts
        while p2 < len(lb) and d2 > 0:
            if lb[p2] == '[': d2 += 1
            elif lb[p2] == ']': d2 -= 1
            p2 += 1
        tits_text = lb[ts:p2-1]

        for _, _, tb in extract_objects(tits_text):
            nome  = gfs(tb, 'nome')
            papel = gfs(tb, 'papel') or ''
            pct   = gfn(tb, 'percentual')
            if not nome: continue

            if papel in PAPEL_ESCRITOR:
                writer_pcts.append(pct)
                writer_ids.add(link_id)
            elif papel in PAPEL_PUBLISHER:
                pub_pcts.append(pct)

    if not writer_pcts and not pub_pcts:
        return 100.0

    n_w = max(1, len(writer_ids))

    # Fórmula CWR: publisher aparece 1x por escritor
    pct_ctrl = sum(writer_pcts) + sum(pub_pcts) * n_w
    return min(round(pct_ctrl, 2), 100.0)

# Processar todas as obras
array_start = src.index('export const MOCK_OBRAS: Obra[] = [')
arr_open    = src.index('[', array_start) + 1

changed = 0
result  = src
stats = {'100': 0, 'partial': 0}

for obra_start, obra_end, obra_block in reversed(extract_objects(src[arr_open:])):
    real_start = arr_open + obra_start
    real_end   = arr_open + obra_end

    obra_id = gfs(obra_block, 'id')
    if not obra_id or not obra_id.startswith('obra-'):
        continue

    novo_pct = calcular_pct_controlado(obra_block)
    new_obra = re.sub(
        r'_percentual_controlado:\s*[\d.]+',
        f'_percentual_controlado: {novo_pct}',
        obra_block
    )

    if abs(novo_pct - 100.0) < 0.1:
        stats['100'] += 1
    else:
        stats['partial'] += 1

    if new_obra != obra_block:
        changed += 1
        old_m = re.search(r'_percentual_controlado:\s*([\d.]+)', obra_block)
        old_v = float(old_m.group(1)) if old_m else 0
        codigo = gfs(obra_block, 'codigo') or ''
        titulo = gfs(obra_block, 'titulo') or ''
        if codigo in ('AFW2',) or (stats['partial'] <= 5 and abs(novo_pct - 100.0) > 0.1):
            print(f"  {codigo:8} {titulo[:35]:35} {old_v:7.2f}% -> {novo_pct:7.2f}%")
        result = result[:real_start] + new_obra + result[real_end:]

print(f"\nTotal obras corrigidas: {changed}")
print(f"Obras 100% controladas: {stats['100']}")
print(f"Obras controle parcial: {stats['partial']}")

with open(SRC, 'w', encoding='utf-8') as f:
    f.write(result)

print("mock-obras.ts atualizado!")
