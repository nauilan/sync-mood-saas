"""
Extrai titulares únicos do CWR (mock-obras.ts) e gera mock-titulares-cwr.ts
"""
import re, os, json
from collections import defaultdict

TS_FILE  = r"C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-obras.ts"
OUT_FILE = r"C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-titulares-cwr.ts"

# ── parse ──────────────────────────────────────────────────────────────────────
with open(TS_FILE, encoding="utf-8") as f:
    content = f.read()

def get_field(block, key):
    m = re.search(r'(?<!\w)' + re.escape(key) + r'\s*:\s*"([^"]*)"', block)
    if m: return m.group(1)
    m = re.search(r'(?<!\w)' + re.escape(key) + r'\s*:\s*([^,\n\]}{]+)', block)
    if m: return m.group(1).strip().rstrip(',').strip()
    return ""

def extract_array(text, key):
    match = re.search(r'\b' + re.escape(key) + r'\s*:\s*\[', text)
    if not match: return ""
    start = match.end() - 1
    depth = 0
    for j in range(start, len(text)):
        c = text[j]
        if c == '[': depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0: return text[start:j+1]
    return text[start:]

def extract_objects(s):
    objects, depth, start = [], 0, None
    inner = s[1:-1] if s.startswith('[') else s
    for k, c in enumerate(inner):
        if c == '{':
            if depth == 0: start = k
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0 and start is not None:
                objects.append(inner[start:k+1])
                start = None
    return objects

# find obra blocks
marker     = content.find("export const MOCK_OBRAS: Obra[] = [")
eq_bracket = content.index("= [", marker)
array_start = eq_bracket + 3

obras_raw = []
depth, current_start = 0, None
i = array_start
while i < len(content):
    ch = content[i]
    if ch == '{':
        if depth == 0: current_start = i
        depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0 and current_start is not None:
            obras_raw.append(content[current_start:i+1])
            current_start = None
    elif ch == ']' and depth == 0:
        break
    i += 1

print(f"Obras encontradas: {len(obras_raw)}")

# ── collect titulares ──────────────────────────────────────────────────────────
# key = ipi se numérico; ipi-code se alfanumérico; else nome normalizado
titulares = {}   # key -> dict
obra_counts = defaultdict(set)  # key -> set of obra ids

for obra_block in obras_raw:
    obra_id = get_field(obra_block, "id")
    for lobj in extract_objects(extract_array(obra_block, "_links")):
        for tobj in extract_objects(extract_array(lobj, "titulares")):
            nome       = get_field(tobj, "nome")
            papel      = get_field(tobj, "papel")
            ipi        = get_field(tobj, "ipi")
            cae        = get_field(tobj, "cae")
            controlado = get_field(tobj, "controlado")
            try:
                pct = float(get_field(tobj, "percentual"))
            except Exception:
                pct = 0.0

            if not nome:
                continue

            # determine key
            key = ipi if ipi else nome.upper().strip()

            obra_counts[key].add(obra_id)

            if key not in titulares:
                titulares[key] = {
                    "nome": nome,
                    "papel": papel,
                    "ipi": ipi,
                    "cae": cae,
                    "controlado": controlado == "true",
                    "papeis": set(),
                }

            titulares[key]["papeis"].add(papel)
            # keep most informative ipi/cae
            if ipi and not titulares[key]["ipi"]:
                titulares[key]["ipi"] = ipi
            if cae and not titulares[key]["cae"]:
                titulares[key]["cae"] = cae

print(f"Titulares únicos: {len(titulares)}")

# ── classify PF / PJ ──────────────────────────────────────────────────────────
PAPEIS_PF = {"autor", "compositor", "versionista", "adaptador", "interprete_referencia"}
PAPEIS_PJ = {"editora_original", "administradora", "subeditora"}

PAPEL_TO_FUNCAO = {
    "autor":              "CA",
    "compositor":         "CA",
    "versionista":        "V",
    "adaptador":          "AD",
    "editora_original":   "E",
    "administradora":     "AM",
    "subeditora":         "SE",
    "interprete_referencia": "I",
}

def classify(t):
    papeis = t["papeis"]
    if papeis & PAPEIS_PJ:
        return "PJ"
    return "PF"

def funcoes_for(papeis):
    seen, result = set(), []
    for p in sorted(papeis):
        f = PAPEL_TO_FUNCAO.get(p)
        if f and f not in seen:
            seen.add(f)
            result.append(f)
    return result

def is_numeric_ipi(ipi):
    return bool(ipi and re.match(r'^\d+$', ipi.strip()))

def codigo_titular(idx, t, tipo):
    ipi = t["ipi"] or ""
    # If it's an internal code like HR01, ED01 → use as codigo
    if ipi and not is_numeric_ipi(ipi):
        return ipi
    return f"{str(idx).zfill(5)}CWR"

# ── split name for PF ─────────────────────────────────────────────────────────
def split_name(nome):
    parts = nome.strip().split()
    if len(parts) == 1:
        return nome, ""
    return " ".join(parts[1:]), parts[0]

# ── build sorted list ─────────────────────────────────────────────────────────
sorted_items = sorted(titulares.items(), key=lambda x: x[1]["nome"])
pj_items = [(k, v) for k, v in sorted_items if classify(v) == "PJ"]
pf_items = [(k, v) for k, v in sorted_items if classify(v) == "PF"]

print(f"  PF (autores):    {len(pf_items)}")
print(f"  PJ (editoras):   {len(pj_items)}")

# ── generate TypeScript ───────────────────────────────────────────────────────
lines = []
lines.append("// ============================================================")
lines.append("// mock-titulares-cwr.ts — Titulares extraídos do CWR")
lines.append("// Fonte: CW260020TSL_189.V21 — Top Show Music Limitada")
lines.append("// GERADO AUTOMATICAMENTE — NÃO EDITAR MANUALMENTE")
lines.append("// ============================================================")
lines.append("")
lines.append("import type {")
lines.append("  TitularComDados,")
lines.append("  TitularPessoaFisica,")
lines.append("  TitularPessoaJuridica,")
lines.append("  TitularFuncao,")
lines.append("} from './types-cadastros'")
lines.append("")

# helpers inline
lines.append("function fn(id: string, tid: string, f: TitularFuncao['funcao']): TitularFuncao {")
lines.append("  return { id, titular_id: tid, funcao: f, sigla: f, ativa: true, created_at: '2025-01-01T00:00:00Z' }")
lines.append("}")
lines.append("")

# ── PJ objects ────────────────────────────────────────────────────────────────
lines.append("// ── Pessoas Jurídicas (editoras / administradoras) ──────────────")
lines.append("")
for idx, (key, t) in enumerate(pj_items, start=1):
    tid = f"cwr-pj-{idx:04d}"
    lines.append(f"const PJ_{idx:04d}: TitularPessoaJuridica = {{")
    lines.append(f"  titular_id: '{tid}',")
    lines.append(f"  razao_social: {json.dumps(t['nome'])},")
    lines.append(f"  nome_fantasia: null,")
    lines.append(f"  cnpj: null,")
    lines.append(f"  ie: null,")
    lines.append(f"  im: null,")
    lines.append(f"  responsavel_legal: null,")
    lines.append(f"  sociedade_autoral: '189',")  # ECAD society
    lines.append(f"  cae: {json.dumps(t['cae'] or None)},")
    real_ipi = t['ipi'] if is_numeric_ipi(t['ipi']) else None
    lines.append(f"  ipi: {json.dumps(real_ipi)},")
    lines.append(f"  site: null,")
    lines.append(f"}}")
    lines.append("")

# ── PF objects ────────────────────────────────────────────────────────────────
lines.append("// ── Pessoas Físicas (autores / compositores) ───────────────────")
lines.append("")
for idx, (key, t) in enumerate(pf_items, start=1):
    tid = f"cwr-pf-{idx:04d}"
    nome = t["nome"]
    parts = nome.strip().split()
    nome_artistico = None
    # Try to detect pseudonym — if ipi is non-numeric code like JD01, use as hint
    lines.append(f"const PF_{idx:04d}: TitularPessoaFisica = {{")
    lines.append(f"  titular_id: '{tid}',")
    lines.append(f"  nome_completo: {json.dumps(nome)},")
    lines.append(f"  cpf: null,")
    lines.append(f"  rg: null,")
    lines.append(f"  data_nasc: null,")
    lines.append(f"  nacionalidade: 'Brasileira',")
    lines.append(f"  estado_civil: null,")
    lines.append(f"  profissao: 'Compositor/Autor',")
    lines.append(f"  nome_artistico_principal: null,")
    lines.append(f"  sociedade_autoral: '189',")
    lines.append(f"  cae: {json.dumps(t['cae'] or None)},")
    real_ipi = t['ipi'] if is_numeric_ipi(t['ipi']) else None
    lines.append(f"  ipi: {json.dumps(real_ipi)},")
    lines.append(f"}}")
    lines.append("")

# ── MOCK_TITULARES_CWR array ──────────────────────────────────────────────────
lines.append("// ── Array principal ───────────────────────────────────────────────")
lines.append("")
lines.append("export const MOCK_TITULARES_CWR: TitularComDados[] = [")
lines.append("")

all_items = [("PJ", idx, key, t) for idx, (key, t) in enumerate(pj_items, start=1)] + \
            [("PF", idx, key, t) for idx, (key, t) in enumerate(pf_items, start=1)]

for tipo, idx, key, t in all_items:
    tid = f"cwr-{tipo.lower()}-{idx:04d}"
    cod = codigo_titular(idx, t, tipo)
    obra_count = len(obra_counts[key])
    funcoes = funcoes_for(t["papeis"])
    ctrl = t["controlado"]

    real_ipi = t['ipi'] if is_numeric_ipi(t['ipi']) else None

    lines.append(f"  // {t['nome']} | IPI: {t['ipi'] or '-'} | obras: {obra_count}")
    lines.append(f"  {{")
    lines.append(f"    id: '{tid}',")
    lines.append(f"    codigo_titular: {json.dumps(cod)},")
    lines.append(f"    id_interno: 'TIT-{tid}',")
    lines.append(f"    tipo_pessoa: '{tipo}',")
    lines.append(f"    editora_id: 'ed-tsm',")
    lines.append(f"    ativo: true,")
    obs_parts = []
    if t['ipi'] and not is_numeric_ipi(t['ipi']):
        obs_parts.append(f"Codigo CWR: {t['ipi']}")
    if real_ipi:
        obs_parts.append(f"IPI: {real_ipi}")
    obs_parts.append(f"Papeis CWR: {', '.join(sorted(t['papeis']))}")
    lines.append(f"    observacoes: {json.dumps('; '.join(obs_parts))},")
    lines.append(f"    created_at: '2025-01-01T00:00:00Z',")
    lines.append(f"    updated_at: '2025-01-01T00:00:00Z',")
    lines.append(f"    _pf: {f'PF_{idx:04d}' if tipo == 'PF' else 'null'},")
    lines.append(f"    _pj: {f'PJ_{idx:04d}' if tipo == 'PJ' else 'null'},")

    # funcoes
    funcao_strs = [f"fn('fn-{tid}-{i}', '{tid}', '{f}')" for i, f in enumerate(funcoes)]
    lines.append(f"    _funcoes: [{', '.join(funcao_strs)}],")
    lines.append(f"    _pseudonimos: [],")
    lines.append(f"    _enderecos: [],")
    lines.append(f"    _contatos: [],")
    lines.append(f"    _documentos: [],")
    lines.append(f"    _dados_bancarios: [],")
    lines.append(f"    _obras: {obra_count},")
    lines.append(f"    _contratos: 0,")
    lines.append(f"  }},")
    lines.append("")

lines.append("]")
lines.append("")

# ── stats export ──────────────────────────────────────────────────────────────
lines.append(f"// Stats: {len(pf_items)} autores PF + {len(pj_items)} editoras PJ = {len(titulares)} titulares únicos")
lines.append(f"// Fonte: {len(obras_raw)} obras do CWR CW260020TSL_189.V21")

ts_content = "\n".join(lines)
with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write(ts_content)

size = os.path.getsize(OUT_FILE)
print(f"\nGerado: {OUT_FILE}")
print(f"Tamanho: {size:,} bytes ({size/1024:.1f} KB)")
print(f"Total de titulares: {len(titulares)}")
print(f"  Autores PF: {len(pf_items)}")
print(f"  Editoras PJ: {len(pj_items)}")

# ── summary by papel ──────────────────────────────────────────────────────────
papel_counts = defaultdict(int)
for k, v in titulares.items():
    for p in v["papeis"]:
        papel_counts[p] += 1
print("\nPor papel:")
for papel, cnt in sorted(papel_counts.items(), key=lambda x: -x[1]):
    print(f"  {papel:30s} {cnt}")
