"""
Confirma com exemplo real que a proporcionalização funciona corretamente.
Mostra para uma obra: % brutos, % normalizados e valores distribuídos.
"""
import json, re

with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\dist_resultado.json', encoding='utf-8') as f:
    data = json.load(f)

# Pega as primeiras obras que tenham distribuicoes
for o in data['cc_obras'][:30]:
    if len(o['distribuicoes']) >= 2:
        print(f"Obra: {o['obra_codigo']} | {o['obra_titulo']}")
        print(f"Valor recebido (royalty): R$ {o['saldo']:.6f}")
        print(f"{'Titular':<40} {'%bruto':>8} {'%norm':>8} {'R$ dist':>12}")
        print("-"*72)
        soma_pct_norm = 0
        soma_valor    = 0
        for d in o['distribuicoes']:
            soma_pct_norm += d['percentual_aplicado']
            soma_valor    += d['valor_destinado']
            print(f"  {d['titular_nome']:<38} {'?':>8} {d['percentual_aplicado']:>8.4f}% {d['valor_destinado']:>12.6f}")
        print(f"  {'TOTAL':<38} {'':>8} {soma_pct_norm:>8.4f}% {soma_valor:>12.6f}")
        print(f"  Bate 100%: {abs(soma_pct_norm - 100.0) < 0.01} | Bate valor: {abs(soma_valor - o['saldo']) < 0.001}")
        print()
        break

# Agora mostra o mesmo com % brutos (antes de normalizar) para AFW2
print("\n--- AFW2 (DESCER PRA BC) — lógica detalhada ---")
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

array_start = src.index('export const MOCK_OBRAS: Obra[] = [')
arr_open    = src.index('[', array_start) + 1

for _, _, obra_block in extract_objects(src[arr_open:]):
    if gfs(obra_block, 'codigo') != 'AFW2': continue

    lm = re.search(r'_links:\s*\[', obra_block)
    ls = lm.end(); depth = 1; pos = ls
    while pos < len(obra_block) and depth > 0:
        if obra_block[pos] == '[': depth += 1
        elif obra_block[pos] == ']': depth -= 1
        pos += 1
    links_text = obra_block[ls:pos-1]

    writers, publishers = [], []
    for _, _, lb in extract_objects(links_text):
        lid = re.search(r'\bid:\s*"([^"]*)"', lb)
        link_id = lid.group(1) if lid else ''
        tm = re.search(r'titulares:\s*\[', lb)
        if not tm: continue
        ts = tm.end(); d2=1; p2=ts
        while p2<len(lb) and d2>0:
            if lb[p2]=='[': d2+=1
            elif lb[p2]==']': d2-=1
            p2+=1
        for _, _, tb in extract_objects(lb[ts:p2-1]):
            nome  = gfs(tb, 'nome') or '?'
            papel = gfs(tb, 'papel') or ''
            pct   = gfn(tb, 'percentual')
            if papel in PAPEL_ESCRITOR:
                writers.append({'nome': nome, 'pct': pct, 'papel': papel, 'link': link_id})
            elif papel in PAPEL_PUBLISHER:
                publishers.append({'nome': nome, 'pct': pct, 'papel': papel, 'link': link_id})

    n_w = max(1, len(set(w['link'] for w in writers)))
    all_t = writers + publishers * n_w
    sum_pct = sum(t['pct'] for t in all_t)

    royalty_exemplo = 10.0  # R$10 hipotético
    print(f"n_writers = {n_w} | publishers aparece {n_w}x cada")
    print(f"{'Titular':<40} {'%bruto':>8} {'%norm':>8} {'R$ (ex R$10)':>13}")
    print("-"*74)
    soma_norm = 0
    for t in all_t:
        norm = t['pct'] / sum_pct * 100
        soma_norm += norm
        print(f"  {t['nome']:<38} {t['pct']:>8.2f}% {norm:>8.4f}% {royalty_exemplo*norm/100:>13.6f}")
    print(f"  {'TOTAL':<38} {sum_pct:>8.2f}% {soma_norm:>8.4f}% {royalty_exemplo:>13.6f}")
    print(f"\n  _percentual_controlado = {gfn(obra_block, '_percentual_controlado')}%")
    break
