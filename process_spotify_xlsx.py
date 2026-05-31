"""
Processa 5 XLSXs Spotify de 2025 e acumula ao dist_resultado.json existente.
Cada statement = movimento separado. Descrição enriquecida com Publisher/StartDate/EndDate/Song_Title/Source.
"""
import pandas as pd, re, json, copy
from collections import defaultdict

XLSX_FILES = [
    (r'C:\Users\Usuário\Downloads\EDI MUSIC - SPOTIFY - DIST - 2025-04-24 - - ST404792.XLSX',  'ST404792'),
    (r'C:\Users\Usuário\Downloads\TOP SHOW MUSIC LIMIT - SPOTIFY - DIST - 2025-07-29 - - ST424722.XLSX', 'ST424722'),
    (r'C:\Users\Usuário\Downloads\TOP SHOW MUSIC LIMIT - SPOTIFY - DIST - 2025-08-29 - - ST431408.XLSX', 'ST431408'),
    (r'C:\Users\Usuário\Downloads\EDI MUSIC - SPOTIFY - DIST - 2025-08-29 - - ST431409.XLSX',  'ST431409'),
    (r'C:\Users\Usuário\Downloads\TOP SHOW MUSIC LIMIT - SPOTIFY - DIST - 2025-09-05 - - ST433233.XLSX', 'ST433233'),
]

# ── 1. Ler e agregar todos os XLSXs ──────────────────────────────────────────
def fmt_date(val):
    s = str(val).strip()
    # formato YYYYMMDD
    if re.match(r'202\d{5}$', s):
        return f"{s[6:8]}/{s[4:6]}/{s[0:4]}"
    # formato YYYY-MM-DD
    if re.match(r'202\d-\d{2}-\d{2}', s):
        parts = s[:10].split('-')
        return f"{parts[2]}/{parts[1]}/{parts[0]}"
    # pandas Timestamp
    try:
        import pandas as pd
        ts = pd.Timestamp(val)
        return ts.strftime('%d/%m/%Y')
    except Exception:
        return s

stmt_summaries = {}   # stmt_id -> {total, obras, linhas}
agg = {}              # (codigo, stmt_id) -> dict

for path, stmt in XLSX_FILES:
    df = pd.read_excel(path)
    col_royalty = [c for c in df.columns if 'ROYALTIES_TO_BE_PAID' in c][0]
    df = df[df[col_royalty].notna() & (df[col_royalty] != 0)]

    grp = df.groupby('Publishers_SongCode').agg(
        total_royalty=(col_royalty, 'sum'),
        publisher=('Publisher', 'first'),
        start_date=('StartDate', 'min'),
        end_date=('EndDate', 'max'),
        song_title=('Song_Title', 'first'),
        source=('Source', 'first'),
    ).reset_index()

    linhas = 0
    for _, row in grp.iterrows():
        cod = str(row['Publishers_SongCode']).lstrip('0') or '0'
        val = round(float(row['total_royalty']), 4)
        if val == 0:
            continue
        key = (cod, stmt)
        agg[key] = {
            'codigo': cod,
            'statement': stmt,
            'total': val,
            'publisher': str(row['publisher']),
            'start_date': fmt_date(row['start_date']),
            'end_date': fmt_date(row['end_date']),
            'song_title': str(row['song_title']),
            'source': str(row['source']),
        }
        linhas += 1

    stmt_total = sum(v['total'] for (c, s), v in agg.items() if s == stmt)
    stmt_summaries[stmt] = {'total': stmt_total, 'obras': linhas}
    print(f"{stmt}: {linhas} obras | R$ {stmt_total:.4f}")

total_xlsx = sum(v['total'] for v in agg.values())
print(f"\nTotal 5 XLSXs 2025: R$ {total_xlsx:.4f}")
print(f"Chaves (código+statement): {len(agg)}")

# ── 2. Carregar catálogo de obras ─────────────────────────────────────────────
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
    m = re.search(rf'\b{key}:\s*"([^"]*)"', block); return m.group(1) if m else None
def gfn(block, key):
    m = re.search(rf'\b{key}:\s*([\d.]+)', block); return float(m.group(1)) if m else 0.0

mock_start = src.index('export const MOCK_OBRAS: Obra[] = [')
array_content = src[src.index('[', mock_start)+1:]
obras_data = {}
for block in extract_nested(array_content):
    obra_id = gfs(block, 'id')
    if not obra_id or not obra_id.startswith('obra-'): continue
    codigo = gfs(block, 'codigo'); titulo = gfs(block, 'titulo'); iswc = gfs(block, 'iswc')
    if not codigo: continue
    links = []
    lm = re.search(r'_links:\s*\[', block)
    if lm:
        ls = lm.end(); depth = 1; pos = ls
        while pos < len(block) and depth > 0:
            if block[pos] == '[': depth += 1
            elif block[pos] == ']': depth -= 1
            pos += 1
        for lb in extract_nested(block[ls:pos-1]):
            lid = gfs(lb, 'id')
            if not lid: continue
            tits = []
            tm = re.search(r'titulares:\s*\[', lb)
            if tm:
                ts = tm.end(); d2 = 1; p2 = ts
                while p2 < len(lb) and d2 > 0:
                    if lb[p2] == '[': d2 += 1
                    elif lb[p2] == ']': d2 -= 1
                    p2 += 1
                for tb in extract_nested(lb[ts:p2-1]):
                    n = gfs(tb, 'nome'); pa = gfs(tb, 'papel'); pc = gfn(tb, 'percentual')
                    if n: tits.append({'nome': n, 'papel': pa or 'autor', 'percentual': pc})
            if tits: links.append({'id': lid, 'titulares': tits})
    obras_data[codigo] = {'id': obra_id, 'codigo': codigo, 'titulo': titulo, 'iswc': iswc, 'links': links}

# ── 3. Distribuição ───────────────────────────────────────────────────────────
PAPEL_ESCRITOR  = {'autor', 'compositor', 'autor_ca', 'versionista', 'adaptador', 'arranjador'}
PAPEL_PUBLISHER = {'editora_original', 'editora_subeditor', 'administradora'}

cc_obras_2025  = []
titular_2025   = defaultdict(lambda: {'total': 0.0, 'movimentos': []})
nao_encontradas = []

for idx, ((cod, stmt), m) in enumerate(sorted(agg.items(), key=lambda x: -x[1]['total']), 1):
    obra = obras_data.get(cod)
    if not obra:
        nao_encontradas.append((cod, stmt, m['song_title'], m['total']))
        continue
    royalty = m['total']
    cco_id  = f'sp2025-{stmt.lower()}-{idx:03d}'
    mov_id  = f'sp2025-mov-{stmt.lower()}-{idx:03d}'

    desc_obra = (
        f"Spotify — {stmt} | "
        f"Editora: {m['publisher']} | "
        f"Título: {m['song_title']} | "
        f"Período: {m['start_date']} a {m['end_date']} | "
        f"Fonte: {m['source']}"
    )

    # CWR: publisher × n_escritores
    writer_tits = [(lk, t) for lk in obra['links'] for t in lk['titulares'] if t['papel'] in PAPEL_ESCRITOR]
    pub_tits    = [(lk, t) for lk in obra['links'] for t in lk['titulares'] if t['papel'] in PAPEL_PUBLISHER]
    other_tits  = [(lk, t) for lk in obra['links'] for t in lk['titulares']
                   if t['papel'] not in PAPEL_ESCRITOR | PAPEL_PUBLISHER]
    n_w = max(1, len({lk['id'] for lk, t in writer_tits}))
    all_tits = writer_tits + pub_tits * n_w + other_tits
    sum_pct  = sum(t['percentual'] for _, t in all_tits) or 100.0

    distribuicoes = []
    for di, (lk, tit) in enumerate(all_tits):
        pct_norm  = tit['percentual'] / sum_pct * 100.0
        tit_value = round(royalty * pct_norm / 100.0, 6)
        tipo_dest = {
            'autor': 'autor', 'compositor': 'autor',
            'editora_original': 'editora', 'editora_subeditor': 'editora',
            'administradora': 'administradora',
        }.get(tit['papel'], 'autor')
        distribuicoes.append({
            'id': f'sp2025-dist-{idx:03d}-{di:02d}',
            'conta_obra_movimento_id': mov_id,
            'obra_link_id': lk['id'],
            'titular_nome': tit['nome'],
            'percentual_aplicado': round(pct_norm, 6),
            'valor_destinado': tit_value,
            'tipo_destino': tipo_dest,
            'status': 'distribuido',
        })
        desc_tit = (
            f"Obra: {m['song_title']} ({cod}) | "
            f"Editora: {m['publisher']} | "
            f"Período: {m['start_date']} a {m['end_date']} | "
            f"Fonte: {m['source']} | "
            f"Participação: {round(pct_norm,4)}% (norm)"
        )
        titular_2025[tit['nome']]['total'] += tit_value
        titular_2025[tit['nome']]['movimentos'].append({
            'obra_id': obra['id'], 'obra_titulo': obra['titulo'],
            'valor': tit_value, 'papel': tit['papel'],
            'mov_id': f'sp2025-tit-{idx:03d}-{di:02d}',
            'descricao': desc_tit,
        })

    cc_obras_2025.append({
        'cco_id': cco_id, 'obra_id': obra['id'],
        'obra_codigo': cod, 'obra_titulo': obra['titulo'], 'obra_iswc': obra['iswc'],
        'saldo': royalty, 'mov_id': mov_id,
        'descricao': desc_obra, 'distribuicoes': distribuicoes,
    })

# ── 4. Carregar resultado anterior e mesclar ─────────────────────────────────
with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\dist_resultado.json', encoding='utf-8') as f:
    prev = json.load(f)

# Remover sp2025 anteriores se existirem (idempotente)
prev_obras = [o for o in prev['cc_obras'] if not o['cco_id'].startswith('sp2025-')]
removed = len(prev['cc_obras']) - len(prev_obras)
if removed:
    print(f"[!] Removidas {removed} entradas sp2025 anteriores (idempotente)")

all_obras = prev_obras + cc_obras_2025

# Titulares: remover movimentos sp2025 anteriores, mesclar novos
all_titulares = copy.deepcopy(prev['titular_creditos'])
for nome in list(all_titulares.keys()):
    all_titulares[nome]['movimentos'] = [
        mv for mv in all_titulares[nome]['movimentos']
        if not mv.get('mov_id', '').startswith('sp2025-')
    ]
    all_titulares[nome]['total'] = round(sum(mv['valor'] for mv in all_titulares[nome]['movimentos']), 4)

for nome, data in titular_2025.items():
    if nome in all_titulares:
        all_titulares[nome]['total'] = round(all_titulares[nome]['total'] + data['total'], 4)
        all_titulares[nome]['movimentos'].extend(data['movimentos'])
    else:
        all_titulares[nome] = {'total': round(data['total'], 4), 'movimentos': list(data['movimentos'])}

resultado = {'cc_obras': all_obras, 'titular_creditos': all_titulares}
with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\dist_resultado.json', 'w', encoding='utf-8') as f:
    json.dump(resultado, f, ensure_ascii=False, indent=2)

# ── 5. Relatório ─────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("RELATÓRIO POR FONTE")
print("="*60)

# Totais por prefixo cco_id
fonte_totais = defaultdict(float)
fonte_obras  = defaultdict(int)
for o in all_obras:
    if o['cco_id'].startswith('sp2025-'):
        stmt_key = o['cco_id'].split('-')[1].upper()  # ST404792 etc
        fonte_totais[stmt_key] += o['saldo']
        fonte_obras[stmt_key] += 1
    elif o['cco_id'].startswith('sp-'):
        stmt_key = o['cco_id'].split('-')[1].upper()  # ST492347 etc
        fonte_totais[stmt_key] += o['saldo']
        fonte_obras[stmt_key] += 1
    else:
        fonte_totais['IMUSICA_ST505168'] += o['saldo']
        fonte_obras['IMUSICA_ST505168'] += 1

for k in sorted(fonte_totais):
    print(f"  {k:25} {fonte_obras[k]:3} obras | R$ {fonte_totais[k]:>12.4f}")

total_geral = sum(o['saldo'] for o in all_obras)
print(f"\n  {'TOTAL GERAL':25} {len(all_obras):3} CC    | R$ {total_geral:>12.4f}")
print(f"  Titulares únicos: {len(all_titulares)}")

if nao_encontradas:
    print(f"\n  Não encontradas no catálogo ({len(nao_encontradas)} obras):")
    for cod, stmt, title, val in nao_encontradas[:10]:
        print(f"    {stmt} | {cod:8} | {title[:40]:40} | R$ {val:.4f}")
