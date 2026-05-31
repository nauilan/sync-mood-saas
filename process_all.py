"""
Processa os arquivos TXT oficiais e gera dist_resultado.json do zero.
Cada statement = movimento separado. Descrição enriquecida com Publisher/Start/End/Title/Source.
Autores controlados: cruzados com planilha base top show (controle="Sim").
Publishers: sempre incluídos via mock-obras.ts.

PROTEÇÃO ANTI-DUPLICIDADE:
  Antes de processar, verifica o registro em processed_registry.json.
  Se o statement_id ou hash do arquivo já constar, ABORTA com erro.
"""
import re, json, copy, hashlib, os, sys, unicodedata
from collections import defaultdict

# ── CARREGAR AUTORES CONTROLADOS DA PLANILHA ──────────────────────────────────
def _norm_nome(s):
    s = str(s).strip().upper()
    s = unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('ASCII')
    s = re.sub(r'\s+', ' ', s)
    return s

def _load_controlled_authors():
    try:
        import pandas as pd
        fpath = r'C:\Users\Usuário\Downloads\base top show (1).xlsx'
        df = pd.read_excel(fpath, dtype=str)
        # normalizar nomes de colunas (remove acentos)
        df.columns = [unicodedata.normalize('NFKD', c).encode('ASCII','ignore').decode('ASCII').strip().lower()
                      for c in df.columns]
        df['codigo'] = df['codigo'].str.strip()
        df['controle'] = df['controle'].str.strip().str.capitalize()
        df['autor_norm'] = df['autor'].apply(_norm_nome)
        df['percentual'] = pd.to_numeric(df['percentual'], errors='coerce').fillna(0.0)
        sim = df[df['controle'] == 'Sim']
        ctrl = {}
        for _, row in sim.iterrows():
            cod = row['codigo']
            if cod not in ctrl:
                ctrl[cod] = {}
            ctrl[cod][row['autor_norm']] = float(row['percentual'])
        print(f"  [BASE] {len(sim)} autores controlados | {len(ctrl)} obras carregadas da planilha")
        return ctrl
    except Exception as e:
        print(f"  [AVISO] Não foi possível carregar planilha de autores: {e}")
        return {}

CONTROLLED_AUTHORS = _load_controlled_authors()
# ──────────────────────────────────────────────────────────────────────────────

REGISTRY_PATH = r'C:\Users\Usuário\Desktop\sync-mood-saas\processed_registry.json'

def load_registry():
    if os.path.exists(REGISTRY_PATH):
        with open(REGISTRY_PATH, 'r', encoding='utf-8-sig') as f:
            return json.load(f)
    return {'statements': {}, 'file_hashes': {}}

def save_registry(reg):
    with open(REGISTRY_PATH, 'w', encoding='utf-8') as f:
        json.dump(reg, f, ensure_ascii=False, indent=2)

def file_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()

# ── Arquivos a processar ──────────────────────────────────────────────────────
FILES = [
    (r'C:\Users\Usuário\Downloads\aquivos de pgto backoffice\TOP SHOW MUSIC LIMIT - IMUSICA S.A. - DIST - 2026-04-17 - - ST505168.TXT',
     'ST505168', 'IMUSICA'),
    (r'C:\Users\Usuário\Downloads\aquivos de pgto backoffice\EDI MUSIC - SPOTIFY - DIST - 2026-03-25 - - ST492348.TXT',
     'ST492348', 'SPOTIFY'),
    (r'C:\Users\Usuário\Downloads\aquivos de pgto backoffice\TOP SHOW MUSIC LIMIT - SPOTIFY - DIST - 2026-03-25 - - ST492347.TXT',
     'ST492347', 'SPOTIFY'),
    # YouTube 2026-05-20
    (r'C:\Users\Usuário\Downloads\aquivos de pgto backoffice\TOP SHOW MUSIC LIMIT - YOUTUBE - DIST - 2026-05-20 - - ST514893.TXT',
     'ST514893', 'YOUTUBE'),
    (r'C:\Users\Usuário\Downloads\aquivos de pgto backoffice\EDI MUSIC - YOUTUBE - DIST - 2026-05-20 - - ST516090.TXT',
     'ST516090', 'YOUTUBE'),
    (r'C:\Users\Usuário\Downloads\aquivos de pgto backoffice\TOP SHOW MUSIC LIMIT - YOUTUBE - DIST - 2026-05-20 - - ST516089.TXT',
     'ST516089', 'YOUTUBE'),
    # YouTube 2026-05-12
    (r'C:\Users\Usuário\Downloads\aquivos de pgto backoffice\LR EDICOES MUSICAIS - YOUTUBE - DIST - 2026-05-12 - - ST510639.TXT',
     'ST510639', 'YOUTUBE'),
    (r'C:\Users\Usuário\Downloads\aquivos de pgto backoffice\EDI MUSIC - YOUTUBE - DIST - 2026-05-12 - - ST510633.TXT',
     'ST510633', 'YOUTUBE'),
    (r'C:\Users\Usuário\Downloads\aquivos de pgto backoffice\TOP SHOW MUSIC LIMIT - YOUTUBE - DIST - 2026-05-12 - - ST510632.TXT',
     'ST510632', 'YOUTUBE'),
]

# ── Verificação anti-duplicidade ──────────────────────────────────────────────
registry = load_registry()
duplicatas = []

for path, stmt_id, source in FILES:
    if not os.path.exists(path):
        print(f"  [AVISO] Arquivo não encontrado: {path}")
        continue
    fh = file_hash(path)
    if stmt_id in registry['statements']:
        prev = registry['statements'][stmt_id]
        duplicatas.append(
            f"  DUPLICADO: statement {stmt_id} já processado em {prev['processado_em']}\n"
            f"    arquivo anterior : {prev['arquivo']}\n"
            f"    arquivo atual    : {path}"
        )
    elif fh in registry['file_hashes']:
        prev_stmt = registry['file_hashes'][fh]
        duplicatas.append(
            f"  DUPLICADO: arquivo já processado como {prev_stmt} (hash idêntico)\n"
            f"    arquivo: {path}"
        )

if duplicatas:
    print("\n" + "="*60)
    print("ERRO — ARQUIVOS DUPLICADOS DETECTADOS. PROCESSAMENTO ABORTADO.")
    print("="*60)
    for d in duplicatas:
        print(d)
    print("\nSe deseja reprocessar, remova as entradas do processed_registry.json.")
    sys.exit(1)

print("✓ Anti-duplicidade: nenhum arquivo duplicado detectado.")

# ── Parser posicional (layout B-55 UBEM 920 chars) ────────────────────────────
def fmt_date(d):
    return f"{d[6:8]}/{d[4:6]}/{d[0:4]}" if re.match(r'202\d{5}', d) else d

def parse_txt(path, stmt_id, default_source):
    rows = []
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        for raw in f:
            content = re.sub(r'^\d+\|', '', raw.strip())
            if len(content) < 300:
                continue
            publisher  = content[30:60].strip()
            src_raw    = content[102:122].strip()
            source     = src_raw.split()[0] if src_raw else default_source
            start_raw  = content[122:130]
            end_raw    = content[130:138]
            song_code  = content[168:182].strip().lstrip('0') or '0'
            song_title = content[182:232].strip()
            start_date = fmt_date(start_raw)
            end_date   = fmt_date(end_raw)
            matches = re.findall(r'(\d{12}\.\d{9})', content)
            if not matches:
                continue
            royalty = float(matches[-1])
            if not song_code or royalty == 0:
                continue
            rows.append({
                'song_code': song_code, 'song_title': song_title,
                'publisher': publisher, 'start_date': start_date,
                'end_date': end_date, 'source': source,
                'royalty': royalty, 'statement': stmt_id,
            })
    return rows

# ── Agregar por (código + statement) ─────────────────────────────────────────
all_rows = []
for path, stmt, src in FILES:
    rows = parse_txt(path, stmt, src)
    all_rows.extend(rows)
    total = sum(r['royalty'] for r in rows)
    codes = {r['song_code'] for r in rows}
    print(f"{stmt} ({src}): {len(rows)} linhas | {len(codes)} códigos | R$ {total:.4f}")

agg = {}
for row in all_rows:
    key = (row['song_code'], row['statement'])
    if key not in agg:
        agg[key] = {
            'codigo': row['song_code'], 'statement': row['statement'],
            'total': 0.0, 'publisher': row['publisher'],
            'start_date': row['start_date'], 'end_date': row['end_date'],
            'song_title': row['song_title'], 'source': row['source'],
        }
    agg[key]['total'] = round(agg[key]['total'] + row['royalty'], 9)

print(f"\nTotal agregado: R$ {sum(v['total'] for v in agg.values()):.4f}")
print(f"Chaves (código+statement): {len(agg)}")

# ── Carregar catálogo de obras ────────────────────────────────────────────────
with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-obras.ts',
          'r', encoding='utf-8') as f:
    src_ts = f.read()

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
    m = re.search(rf'\b{key}:\s*"([^"]*)"', block)
    return m.group(1) if m else None

def gfn(block, key):
    m = re.search(rf'\b{key}:\s*([\d.]+)', block)
    return float(m.group(1)) if m else 0.0

mock_start = src_ts.index('export const MOCK_OBRAS: Obra[] = [')
array_content = src_ts[src_ts.index('[', mock_start)+1:]
obras_data = {}
for block in extract_nested(array_content):
    obra_id = gfs(block, 'id')
    if not obra_id or not obra_id.startswith('obra-'): continue
    codigo = gfs(block, 'codigo'); titulo = gfs(block, 'titulo')
    iswc   = gfs(block, 'iswc')
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
            # Ler flag controlado do link (se false = não controlado = não distribui)
            ctrl_m = re.search(r'\bcontrolado:\s*(true|false)', lb)
            link_controlado = (ctrl_m.group(1) == 'true') if ctrl_m else True
            tits = []
            tm = re.search(r'titulares:\s*\[', lb)
            if tm:
                ts = tm.end(); d2 = 1; p2 = ts
                while p2 < len(lb) and d2 > 0:
                    if lb[p2] == '[': d2 += 1
                    elif lb[p2] == ']': d2 -= 1
                    p2 += 1
                for tb in extract_nested(lb[ts:p2-1]):
                    n = gfs(tb, 'nome'); pa = gfs(tb, 'papel')
                    pc = gfn(tb, 'percentual')
                    if n: tits.append({'nome': n, 'papel': pa or 'autor', 'percentual': pc})
            if tits:
                links.append({
                    'id': lid,
                    'controlado': link_controlado,
                    'percentual_controlado': gfn(lb, 'percentual_controlado'),
                    'titulares': tits,
                })
    obras_data[codigo] = {
        'id': obra_id, 'codigo': codigo, 'titulo': titulo,
        'iswc': iswc, 'links': links,
    }

print(f"Catálogo carregado: {len(obras_data)} obras")

# ── Distribuição ──────────────────────────────────────────────────────────────
PAPEL_ESCRITOR  = {'autor', 'compositor', 'autor_ca', 'versionista', 'adaptador', 'arranjador'}
PAPEL_PUBLISHER = {'editora_original', 'editora_subeditor', 'administradora'}
TIPO_MAP = {
    'autor': 'autor', 'compositor': 'autor',
    'editora_original': 'editora', 'editora_subeditor': 'editora',
    'administradora': 'administradora',
}

cc_obras      = []
all_titulares = defaultdict(lambda: {'total': 0.0, 'movimentos': []})
nao_encontradas = []

for idx, ((cod, stmt), m) in enumerate(
        sorted(agg.items(), key=lambda x: -x[1]['total']), 1):
    obra = obras_data.get(cod)
    if not obra:
        nao_encontradas.append((cod, stmt, m['song_title'], m['total']))
        continue

    royalty = round(m['total'], 4)
    source_tag = m['statement']
    cco_id = f'cc-{source_tag.lower()}-{idx:04d}'
    mov_id = f'mov-{source_tag.lower()}-{idx:04d}'

    desc_obra = (
        f"{m['source']} — {m['statement']} | "
        f"Editora: {m['publisher']} | "
        f"Título: {m['song_title']} | "
        f"Período: {m['start_date']} a {m['end_date']} | "
        f"Fonte: {m['source']}"
    )

    # ── REGRA CWR + PLANILHA DE CONTROLE ──────────────────────────────────────
    # 1. Excel: filtro de quais autores são controlados (controle="Sim")
    # 2. Percentuais: sempre do mock-obras.ts (CWR) — garante proporção correta
    # 3. Publishers sempre incluídos
    # 4. Proporcionaliza (autor_pct + publisher_pct) a 100%
    PAPEL_PUBLISHER_SET = {'editora_original', 'administradora', 'editora_subeditor'}

    ctrl_autores = CONTROLLED_AUTHORS.get(str(cod), {})  # {nome_norm: pct_excel}

    # Passo 1: coletar autores controlados e contar N de entradas de autor
    autor_entries = []   # (link_id, nome, papel, percentual_mock)
    pub_entries   = []   # (link_id, nome, papel, percentual_mock)  — pct = por-autor

    for lk in obra['links']:
        for t in lk['titulares']:
            papel = t['papel']
            if papel in PAPEL_PUBLISHER_SET:
                pub_entries.append((lk['id'], t['nome'], papel, t['percentual']))
            else:
                nome_norm = _norm_nome(t['nome'])
                if nome_norm in ctrl_autores:
                    autor_entries.append((lk['id'], t['nome'], papel, t['percentual']))

    # Passo 2: N autores controlados (inclui 0% para contar links CWR)
    N = len(autor_entries) if autor_entries else 1

    # Passo 3: editoras × N (replicar proporcionalmente como no CWR original)
    pub_entries_scaled = [
        (lid, nome, papel, round(pct * N, 6))
        for lid, nome, papel, pct in pub_entries
    ]

    all_t_raw = autor_entries + pub_entries_scaled  # (link_id, nome, papel, percentual_mock)

    # Garantir ao menos 1 publisher
    has_publisher = any(p in PAPEL_PUBLISHER_SET for _, _, p, _ in all_t_raw)
    if not all_t_raw or not has_publisher:
        nao_encontradas.append((cod, stmt, m['song_title'], m['total']))
        continue

    sum_pct = sum(pct for _, _, _, pct in all_t_raw) or 100.0

    # Rebuilda all_t como lista de (link_dict, t_dict) para o restante do código
    all_t = [({'id': lid}, {'nome': nome, 'papel': papel, 'percentual': pct})
             for lid, nome, papel, pct in all_t_raw]

    distribuicoes = []
    for di, (lk, tit) in enumerate(all_t):
        pct_norm  = tit['percentual'] / sum_pct * 100.0
        tit_value = round(royalty * pct_norm / 100.0, 6)
        tipo_dest = TIPO_MAP.get(tit['papel'], 'autor')
        d_id = f'dist-{source_tag.lower()}-{idx:04d}-{di:02d}'
        distribuicoes.append({
            'id': d_id,
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
            f"Participação: {round(pct_norm, 4)}% (norm)"
        )
        all_titulares[tit['nome']]['total'] = round(
            all_titulares[tit['nome']]['total'] + tit_value, 6)
        all_titulares[tit['nome']]['movimentos'].append({
            'obra_id': obra['id'], 'obra_titulo': obra['titulo'],
            'valor': tit_value, 'papel': tit['papel'],
            'mov_id': f'tit-{source_tag.lower()}-{idx:04d}-{di:02d}',
            'descricao': desc_tit,
        })

    cc_obras.append({
        'cco_id': cco_id, 'obra_id': obra['id'],
        'obra_codigo': cod, 'obra_titulo': obra['titulo'],
        'obra_iswc': obra['iswc'],
        'saldo': royalty, 'mov_id': mov_id,
        'descricao': desc_obra, 'distribuicoes': distribuicoes,
    })

# ── Salvar ────────────────────────────────────────────────────────────────────
resultado = {
    'cc_obras': cc_obras,
    'titular_creditos': {
        k: {'total': round(v['total'], 4), 'movimentos': v['movimentos']}
        for k, v in all_titulares.items()
    },
}
OUT = r'C:\Users\Usuário\Desktop\sync-mood-saas\dist_resultado.json'
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(resultado, f, ensure_ascii=False, indent=2)

# ── Registrar arquivos processados (anti-duplicidade) ────────────────────────
from datetime import datetime
now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
for path, stmt_id, source in FILES:
    if not os.path.exists(path):
        continue
    fh = file_hash(path)
    registry['statements'][stmt_id] = {
        'arquivo': os.path.basename(path),
        'caminho': path,
        'source': source,
        'processado_em': now,
        'hash': fh,
    }
    registry['file_hashes'][fh] = stmt_id
save_registry(registry)
print(f"\n✓ Registro atualizado: {REGISTRY_PATH}")

# ── Relatório ─────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("RELATÓRIO POR FONTE")
print("="*60)
fonte_total = defaultdict(float)
fonte_obras = defaultdict(int)
for o in cc_obras:
    stmt_key = o['cco_id'].split('-')[1].upper()
    fonte_total[stmt_key] += o['saldo']
    fonte_obras[stmt_key] += 1
for k in sorted(fonte_total):
    print(f"  {k:12} {fonte_obras[k]:3} obras | R$ {fonte_total[k]:>12.4f}")
total_geral = sum(o['saldo'] for o in cc_obras)
print(f"\n  {'TOTAL GERAL':12} {len(cc_obras):3} CC    | R$ {total_geral:>12.4f}")
print(f"  Titulares únicos: {len(all_titulares)}")

if nao_encontradas:
    print(f"\n  Não encontradas no catálogo ({len(nao_encontradas)}):")
    for cod, stmt, title, val in nao_encontradas[:10]:
        print(f"    {stmt} {cod:8} {title[:35]:35} R$ {val:.4f}")
