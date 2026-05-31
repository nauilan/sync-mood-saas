"""
Processa dois TXT Spotify (EDI + TSM) com parser B-55 posicional.
Acumula ao JSON existente (iMusica ST505168) - EACH SOURCE AS SEPARATE MOVEMENT.
"""
import re, json, copy
from collections import defaultdict

def parse_txt_file(path, statement_id):
    rows = []
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        for raw in f:
            content = re.sub(r'^\d+\|', '', raw.strip())
            if len(content) < 300:
                continue
            publisher   = content[30:60].strip()
            source      = content[102:122].strip().split()[0] if content[102:122].strip() else 'SPOTIFY'
            start_raw   = content[122:130]
            end_raw     = content[130:138]
            song_code   = content[168:182].strip()
            song_title  = content[182:232].strip()
            def fd(d):
                return f"{d[6:8]}/{d[4:6]}/{d[0:4]}" if re.match(r'202\d{5}', d) else d
            start_date = fd(start_raw)
            end_date   = fd(end_raw)
            royalty_matches = re.findall(r'(\d{12}\.\d{9})', content)
            if not royalty_matches: continue
            royalty = float(royalty_matches[-1])
            if not song_code or royalty == 0: continue
            rows.append({'song_code': song_code, 'song_title': song_title,
                'publisher': publisher, 'start_date': start_date,
                'end_date': end_date, 'source': source,
                'royalty': royalty, 'statement': statement_id})
    return rows

FILES = [
    (r'C:\Users\Usuário\Downloads\EDI MUSIC - SPOTIFY - DIST - 2026-03-25 - - ST492348.TXT', 'ST492348'),
    (r'C:\Users\Usuário\Downloads\TOP SHOW MUSIC LIMIT - SPOTIFY - DIST - 2026-03-25 - - ST492347.TXT', 'ST492347'),
]

all_rows = []
for path, stmt in FILES:
    rows = parse_txt_file(path, stmt)
    all_rows.extend(rows)
    total = sum(r['royalty'] for r in rows)
    codes = set(r['song_code'].lstrip('0') or '0' for r in rows)
    print(f"{stmt}: {len(rows)} linhas | {len(codes)} códigos | R$ {total:.4f}")

# Agregar por (song_code + statement) para preservar separação por fonte
agg = {}
for row in all_rows:
    cod = row['song_code'].lstrip('0') or '0'
    key = (cod, row['statement'])
    if key not in agg:
        agg[key] = {'song_code': row['song_code'], 'total': 0.0,
            'publisher': row['publisher'], 'start_date': row['start_date'],
            'end_date': row['end_date'], 'song_title': row['song_title'],
            'source': row['source'], 'statement': row['statement'], 'codigo': cod}
    agg[key]['total'] = round(agg[key]['total'] + row['royalty'], 9)

print(f"Total Spotify: R$ {sum(v['total'] for v in agg.values()):.4f}")
print(f"Chaves (código+statement): {len(agg)}")

# Cruzar com catálogo
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
            lid = gfs(lb, 'id'); pct = gfn(lb, 'percentual_controlado')
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
            if tits: links.append({'id': lid, 'percentual_controlado': pct, 'titulares': tits})
    obras_data[codigo] = {'id': obra_id, 'codigo': codigo, 'titulo': titulo, 'iswc': iswc, 'links': links}

# Distribuição Spotify — gera NOVOS cc_obras (separados dos iMusica)
DATE = '2026-03-25T00:00:00Z'
cc_obras_spotify = []
titular_spotify = defaultdict(lambda: {'total': 0.0, 'movimentos': []})

for idx, ((cod, stmt), m) in enumerate(sorted(agg.items(), key=lambda x: -x[1]['total']), 1):
    obra = obras_data.get(cod)
    if not obra: continue
    royalty = round(m['total'], 4)
    cco_id = f'sp-{stmt.lower()}-{idx:03d}'
    mov_id = f'sp-mov-{stmt.lower()}-{idx:03d}'
    desc_obra = (f"Spotify — {m['statement']} | Editora: {m['publisher']} | "
                 f"Título: {m['song_title']} | Período: {m['start_date']} a {m['end_date']} | Fonte: {m['source']}")
    distribuicoes = []
    # Lógica CWR: publisher/admin aparecem UMA VEZ POR LINK DE ESCRITOR
    PAPEL_ESCRITOR = {'autor', 'compositor', 'autor_ca', 'versionista', 'adaptador', 'arranjador'}
    PAPEL_PUBLISHER = {'editora_original', 'editora_subeditor', 'administradora'}
    writer_tits_sp = [(link, tit) for link in obra['links'] for tit in link['titulares']
                      if tit['papel'] in PAPEL_ESCRITOR]
    pub_tits_sp    = [(link, tit) for link in obra['links'] for tit in link['titulares']
                      if tit['papel'] in PAPEL_PUBLISHER]
    other_tits_sp  = [(link, tit) for link in obra['links'] for tit in link['titulares']
                      if tit['papel'] not in PAPEL_ESCRITOR | PAPEL_PUBLISHER]
    writer_link_ids_sp = {link['id'] for link, tit in writer_tits_sp}
    n_w_sp = max(1, len(writer_link_ids_sp))
    all_tits_sp = writer_tits_sp + pub_tits_sp * n_w_sp + other_tits_sp
    sum_pct_sp = sum(tit['percentual'] for _, tit in all_tits_sp) or 100.0
    for di, (link, tit) in enumerate(all_tits_sp):
        pct_norm = tit['percentual'] / sum_pct_sp * 100.0
        tit_value = round(royalty * pct_norm / 100.0, 6)
        tipo_dest = {'autor':'autor','compositor':'autor','editora_original':'editora','editora_subeditor':'editora','administradora':'administradora'}.get(tit['papel'],'autor')
        d_id = f'sp-dist-{idx:03d}-{di:02d}'
        distribuicoes.append({'id': d_id, 'conta_obra_movimento_id': mov_id,
            'obra_link_id': link['id'], 'titular_nome': tit['nome'],
            'percentual_aplicado': round(pct_norm, 6), 'valor_destinado': tit_value,
            'tipo_destino': tipo_dest, 'status': 'distribuido'})
        desc_tit = (f"Obra: {m['song_title']} ({cod}) | Editora: {m['publisher']} | "
                    f"Período: {m['start_date']} a {m['end_date']} | Fonte: {m['source']} | Participação: {round(pct_norm,4)}% (norm)")
        titular_spotify[tit['nome']]['total'] += tit_value
        titular_spotify[tit['nome']]['movimentos'].append({
            'obra_id': obra['id'], 'obra_titulo': obra['titulo'],
            'valor': tit_value, 'papel': tit['papel'],
            'mov_id': f'sp-tit-{idx:03d}-{di:02d}', 'descricao': desc_tit})
    cc_obras_spotify.append({'cco_id': cco_id, 'obra_id': obra['id'],
        'obra_codigo': cod, 'obra_titulo': obra['titulo'], 'obra_iswc': obra['iswc'],
        'saldo': royalty, 'mov_id': mov_id, 'descricao': desc_obra, 'distribuicoes': distribuicoes})

# Carregar iMusica (fresh read para evitar aliasing)
with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\dist_resultado.json', encoding='utf-8') as f:
    prev_raw = f.read()
prev = json.loads(prev_raw)
imusica_obras = copy.deepcopy(prev['cc_obras'])  # deep copy para evitar mutação
imusica_titulares = copy.deepcopy(prev['titular_creditos'])

# Verificar se é uma sessão limpa (apenas iMusica) ou já tem Spotify
total_prev = sum(o['saldo'] for o in imusica_obras)
# Se total_prev >> 1557, é porque já foi mergeado antes — use apenas iMusica original
# Heurística: se tem cco-ids começando com 'sp-', já foi processado
has_spotify_already = any(o['cco_id'].startswith('sp-') for o in imusica_obras)
if has_spotify_already:
    # Separar iMusica de Spotify anterior
    imusica_obras = [o for o in imusica_obras if not o['cco_id'].startswith('sp-')]
    print(f"[!] Removidos {len(prev['cc_obras'])-len(imusica_obras)} CC Obras Spotify anteriores")

# Concatenar: iMusica + Spotify (obras separadas por fonte)
all_obras = imusica_obras + cc_obras_spotify

# Mesclar titulares (acumulativo)
all_titulares = copy.deepcopy(imusica_titulares)
# Remover movimentos Spotify anteriores
for nome in all_titulares:
    all_titulares[nome]['movimentos'] = [
        m for m in all_titulares[nome]['movimentos'] if not m.get('mov_id','').startswith('sp-')]
    all_titulares[nome]['total'] = round(sum(m['valor'] for m in all_titulares[nome]['movimentos']), 4)

for nome, spdata in titular_spotify.items():
    if nome in all_titulares:
        all_titulares[nome]['total'] = round(all_titulares[nome]['total'] + spdata['total'], 4)
        all_titulares[nome]['movimentos'].extend(spdata['movimentos'])
    else:
        all_titulares[nome] = {'total': round(spdata['total'], 4), 'movimentos': list(spdata['movimentos'])}

# Salvar JSON final
resultado = {'cc_obras': all_obras, 'titular_creditos': all_titulares}
with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\dist_resultado.json', 'w', encoding='utf-8') as f:
    json.dump(resultado, f, ensure_ascii=False, indent=2)

total_imusica = sum(o['saldo'] for o in imusica_obras)
total_spotify = sum(o['saldo'] for o in cc_obras_spotify)
print(f"\nResumo final:")
print(f"  iMúsica ST505168:  {len(imusica_obras)} obras | R$ {total_imusica:.4f}")
print(f"  Spotify ST492347+48: {len(cc_obras_spotify)} CC entradas | R$ {total_spotify:.4f}")
print(f"  TOTAL GERAL:       {len(all_obras)} CC Obras | R$ {total_imusica+total_spotify:.4f}")
print(f"  Titulares únicos:  {len(all_titulares)}")
