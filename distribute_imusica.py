"""
Parser robusto por balanceamento de chaves para extrair _links do mock-obras.ts
"""
import pandas as pd
import re, json
from collections import defaultdict

# ── 1. XLSX ──────────────────────────────────────────────────────────────────
df = pd.read_excel(
    r'C:\Users\Usuário\Downloads\TOP SHOW MUSIC LIMIT - IMUSICA S.A. - DIST - 2026-04-17 - - ST505168.XLSX'
)
col_royalty = [c for c in df.columns if 'ROYALTIES_TO_BE_PAID' in c][0]

# Agregar por Publishers_SongCode: valor + metadados descritivos
agg = df.groupby('Publishers_SongCode').agg(
    total_royalty=(col_royalty, 'sum'),
    publisher=('Publisher', 'first'),
    start_date=('StartDate', 'min'),
    end_date=('EndDate', 'max'),
    song_title=('Song_Title', 'first'),
    source=('Source', 'first'),
).reset_index()
agg['codigo'] = agg['Publishers_SongCode'].astype(str).str.lstrip('0')

codigo_royalty = {}
codigo_meta = {}
for _, row in agg.iterrows():
    cod = row['codigo']
    codigo_royalty[cod] = round(float(row['total_royalty']), 4)
    codigo_meta[cod] = {
        'publisher': str(row['publisher']),
        'start_date': str(row['start_date']),
        'end_date': str(row['end_date']),
        'song_title': str(row['song_title']),
        'source': str(row['source']),
    }

# ── 2. Parse mock-obras.ts com brace-balancing ───────────────────────────────
with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

def extract_nested(text, open_ch='{', close_ch='}'):
    """Extrai todos os blocos balanceados de open_ch...close_ch."""
    results = []
    depth = 0
    start = -1
    for i, ch in enumerate(text):
        if ch == open_ch:
            if depth == 0:
                start = i
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0 and start != -1:
                results.append(text[start:i+1])
                start = -1
    return results

def get_str_field(block, key):
    m = re.search(rf'\b{key}:\s*"([^"]*)"', block)
    return m.group(1) if m else None

def get_num_field(block, key):
    m = re.search(rf'\b{key}:\s*([\d.]+)', block)
    return float(m.group(1)) if m else 0.0

def get_bool_field(block, key):
    m = re.search(rf'\b{key}:\s*(true|false)', block)
    return m.group(1) == 'true' if m else False

# Encontrar o array MOCK_OBRAS
mock_start = src.index('export const MOCK_OBRAS: Obra[] = [')
mock_end = src.index('\n]\n', mock_start) + 3
mock_src = src[mock_start:mock_end]

# Extrair cada obra (blocos de nível 1 dentro do array)
# O array começa com [ e contém objetos { id: "obra-XXXX", ... }
obras_data = {}
# Encontrar posição do [ inicial
bracket_pos = mock_src.index('[')
array_content = mock_src[bracket_pos+1:]

# Extrair blocos de obra por brace-balancing
obra_blocks = extract_nested(array_content)
print(f"Obra blocks encontrados: {len(obra_blocks)}")

for block in obra_blocks:
    obra_id = get_str_field(block, 'id')
    if not obra_id or not obra_id.startswith('obra-'):
        continue
    codigo = get_str_field(block, 'codigo')
    titulo = get_str_field(block, 'titulo')
    iswc = get_str_field(block, 'iswc')
    if not codigo:
        continue

    # Encontrar _links array dentro do bloco
    links = []
    links_match = re.search(r'_links:\s*\[', block)
    if links_match:
        links_start = links_match.end()
        # Encontrar o fechamento do array de links
        depth = 1
        pos = links_start
        while pos < len(block) and depth > 0:
            if block[pos] == '[':
                depth += 1
            elif block[pos] == ']':
                depth -= 1
            pos += 1
        links_content = block[links_start:pos-1]

        # Extrair cada link (bloco {})
        link_blocks = extract_nested(links_content)
        for lb in link_blocks:
            link_id = get_str_field(lb, 'id')
            pct_ctrl = get_num_field(lb, 'percentual_controlado')
            if not link_id:
                continue

            # Titulares dentro do link
            titulares = []
            tit_match = re.search(r'titulares:\s*\[', lb)
            if tit_match:
                tit_start = tit_match.end()
                depth2 = 1
                pos2 = tit_start
                while pos2 < len(lb) and depth2 > 0:
                    if lb[pos2] == '[': depth2 += 1
                    elif lb[pos2] == ']': depth2 -= 1
                    pos2 += 1
                tit_content = lb[tit_start:pos2-1]
                tit_blocks = extract_nested(tit_content)
                for tb in tit_blocks:
                    nome = get_str_field(tb, 'nome')
                    papel = get_str_field(tb, 'papel')
                    pct = get_num_field(tb, 'percentual')
                    if nome:
                        titulares.append({'nome': nome, 'papel': papel or 'autor', 'percentual': pct})

            if titulares:
                links.append({'id': link_id, 'percentual_controlado': pct_ctrl, 'titulares': titulares})

    obras_data[codigo] = {'id': obra_id, 'codigo': codigo, 'titulo': titulo, 'iswc': iswc, 'links': links}

obras_com_links = sum(1 for o in obras_data.values() if o['links'])
print(f"Obras com links: {obras_com_links}")
print(f"Total obras: {len(obras_data)}")

# ── 3. Distribuição ───────────────────────────────────────────────────────────
date = '2026-04-17T00:00:00Z'
cc_obras = []
all_titular_creditos = defaultdict(lambda: {'total': 0.0, 'movimentos': []})

for idx, (codigo, royalty) in enumerate(sorted(codigo_royalty.items(), key=lambda x: -x[1]), 1):
    obra = obras_data.get(codigo)
    if not obra:
        continue

    meta = codigo_meta.get(codigo, {})
    cco_id = f'cco-{idx:03d}'
    mov_id = f'mov-obra-{idx:03d}-001'
    links = obra['links']
    distribuicoes = []
    dist_idx = 1

    # Descrição rica para MovimentoObra
    descricao_obra = (
        f"iMúsica S.A. — ST505168 | "
        f"Editora: {meta.get('publisher','')} | "
        f"Título: {meta.get('song_title','')} | "
        f"Período: {meta.get('start_date','')} a {meta.get('end_date','')} | "
        f"Fonte: {meta.get('source','')}"
    )

    # Lógica CWR: publisher/admin aparecem UMA VEZ POR LINK DE ESCRITOR
    # (Ex: 2 escritores × EDI MUSIC 10% = 20% total para EDI MUSIC)
    PAPEL_ESCRITOR = {'autor', 'compositor', 'autor_ca', 'versionista', 'adaptador', 'arranjador'}
    PAPEL_PUBLISHER = {'editora_original', 'editora_subeditor', 'administradora'}

    writer_tits = [(link, tit) for link in links for tit in link['titulares']
                   if tit['papel'] in PAPEL_ESCRITOR]
    pub_tits    = [(link, tit) for link in links for tit in link['titulares']
                   if tit['papel'] in PAPEL_PUBLISHER]
    other_tits  = [(link, tit) for link in links for tit in link['titulares']
                   if tit['papel'] not in PAPEL_ESCRITOR | PAPEL_PUBLISHER]

    # Número de links de escritor (não titulares — links distintos com papel escritor)
    writer_link_ids = {link['id'] for link, tit in writer_tits}
    n_w = max(1, len(writer_link_ids))

    # Publisher/admin replicados n_w vezes (padrão CWR: 1 participação por escritor)
    all_tits = writer_tits + pub_tits * n_w + other_tits
    sum_pct = sum(tit['percentual'] for _, tit in all_tits) or 100.0

    for link, tit in all_tits:
        pct_norm = tit['percentual'] / sum_pct * 100.0
        tit_value = round(royalty * pct_norm / 100.0, 6)
        tipo_dest = {
            'autor': 'autor', 'compositor': 'autor',
            'editora_original': 'editora', 'editora_subeditor': 'editora',
            'administradora': 'administradora',
        }.get(tit['papel'], 'autor')
        distribuicoes.append({
            'id': f'dist-{idx:03d}-{dist_idx:03d}',
            'conta_obra_movimento_id': mov_id,
            'obra_link_id': link['id'],
            'titular_nome': tit['nome'],
            'percentual_aplicado': round(pct_norm, 6),
            'valor_destinado': tit_value,
            'tipo_destino': tipo_dest,
            'status': 'distribuido',
        })
        descricao_tit = (
            f"Obra: {meta.get('song_title','')} ({codigo}) | "
            f"Editora: {meta.get('publisher','')} | "
            f"Período: {meta.get('start_date','')} a {meta.get('end_date','')} | "
            f"Fonte: {meta.get('source','')} | "
            f"Participação: {round(pct_norm,4)}% (norm)"
        )
        all_titular_creditos[tit['nome']]['total'] += tit_value
        all_titular_creditos[tit['nome']]['movimentos'].append({
            'obra_id': obra['id'],
            'obra_titulo': obra['titulo'],
            'valor': tit_value,
            'papel': tit['papel'],
            'mov_id': f'mov-tit-{idx:03d}-{dist_idx:03d}',
            'descricao': descricao_tit,
        })
        dist_idx += 1

    cc_obras.append({
        'cco_id': cco_id, 'obra_id': obra['id'], 'obra_codigo': codigo,
        'obra_titulo': obra['titulo'], 'obra_iswc': obra['iswc'],
        'saldo': royalty, 'mov_id': mov_id,
        'descricao': descricao_obra,
        'distribuicoes': distribuicoes,
    })

print(f"\nCC Obras: {len(cc_obras)}")
print(f"Total R$: {sum(o['saldo'] for o in cc_obras):.4f}")
print(f"\nTop 5 obras:")
for o in sorted(cc_obras, key=lambda x: -x['saldo'])[:5]:
    print(f"  {o['obra_codigo']:>6} | {o['obra_titulo'][:40]:40} | R$ {o['saldo']:>10.4f} | {len(o['distribuicoes'])} dist")

print(f"\nTitulares únicos: {len(all_titular_creditos)}")
for nome, data in sorted(all_titular_creditos.items(), key=lambda x: -x[1]['total'])[:10]:
    print(f"  {nome[:50]:50} | R$ {data['total']:>10.4f}")

resultado = {
    'cc_obras': cc_obras,
    'titular_creditos': {k: {'total': round(v['total'], 4), 'movimentos': v['movimentos']}
                         for k, v in all_titular_creditos.items()},
}
with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\dist_resultado.json', 'w', encoding='utf-8') as f:
    json.dump(resultado, f, ensure_ascii=False, indent=2)
print("\nResultado salvo.")
