import re, csv, os

TS_FILE  = r"C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-obras.ts"
OUT_FILE = r"C:\Users\Usuário\Desktop\CWR_TSM_760_OBRAS.csv"

with open(TS_FILE, encoding="utf-8") as f:
    content = f.read()

marker     = content.find("export const MOCK_OBRAS: Obra[] = [")
eq_bracket = content.index("= [", marker)
array_start = eq_bracket + 3  # skip past '= ['

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

def parse_obra(block):
    o = {f: get_field(block, f) for f in [
        "codigo","titulo","iswc","duracao","idioma",
        "genero","ano","status","observacoes","id","_percentual_controlado"
    ]}
    autores, editoras = [], []
    for lobj in extract_objects(extract_array(block, "_links")):
        for tobj in extract_objects(extract_array(lobj, "titulares")):
            nome  = get_field(tobj, "nome")
            papel = get_field(tobj, "papel").lower()
            ctrl  = get_field(tobj, "controlado")
            raw_pct = get_field(tobj, "percentual")
            try:
                pct_str = f"{float(raw_pct):.2f}%"
            except Exception:
                pct_str = raw_pct + "%"
            entry = f"{nome} ({pct_str})"
            if any(x in papel for x in ["editora","editor","administradora","sub_editora","administrador"]):
                editoras.append(f"{entry} [controlado={ctrl}]")
            elif any(x in papel for x in ["autor","compositor","lyricist","writer","co_autor"]):
                autores.append(entry)
            else:
                autores.append(f"{entry} [{papel}]")
    o["autores"]  = "; ".join(autores)
    o["editoras"] = "; ".join(editoras)
    return o

obras = [parse_obra(b) for b in obras_raw]
print(f"Parsed {len(obras)} obras")

FIELDS = ["codigo","titulo","iswc","duracao","idioma","autores","editoras",
          "genero","ano","status","observacoes","_percentual_controlado","id"]
LABELS = ["Codigo","Titulo","ISWC","Duracao","Idioma","Autores","Editoras",
          "Genero","Ano","Status","Observacoes","% Controlado","ID"]

with open(OUT_FILE, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.writer(f)
    writer.writerow(LABELS)
    for o in obras:
        writer.writerow([o.get(field, "") for field in FIELDS])

size = os.path.getsize(OUT_FILE)
print(f"Saved: {OUT_FILE}")
print(f"Rows : {len(obras)} + 1 header")
print(f"Size : {size:,} bytes ({size/1024:.1f} KB)")
