"""
Analisa percentuais de editoras vs autores por obra distribuída.
"""
import re, json

with open('apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

with open('dist_resultado.json', 'r', encoding='utf-8') as f:
    dist = json.load(f)

# Load dist data indexed by obra_codigo
cc_obras = {}
for o in dist['cc_obras']:
    cod = o['obra_codigo']
    if cod not in cc_obras:
        cc_obras[cod] = {'titulo': o.get('obra_titulo',''), 'valor': 0}
    cc_obras[cod]['valor'] += o.get('saldo', 0)

PAPEL_PUB = {'editora_original', 'administradora', 'editora_subeditor'}

# Parse mock-obras.ts: split by top-level obra objects
# Each obra starts with id: "obra-XXXX"
obra_pattern = re.compile(r'\{\s*\n\s*id:\s*"obra-\d+",')
obra_starts = [m.start() for m in obra_pattern.finditer(src)]

def find_matching_brace(text, start):
    depth = 0
    for i in range(start, len(text)):
        if text[i] == '{': depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                return i
    return len(text)

rows = []
for i, start in enumerate(obra_starts):
    end = find_matching_brace(src, start)
    block = src[start:end+1]
    
    # Extract codigo
    cm = re.search(r'codigo:\s*"([^"]+)"', block)
    if not cm:
        continue
    cod = cm.group(1)
    if cod not in cc_obras:
        continue
    
    titulo = re.search(r'titulo:\s*"([^"]+)"', block)
    titulo = titulo.group(1) if titulo else cod
    
    # Find all link objects (have percentual_controlado)
    # Link: {id: "obra-XXXX-XX", obra_id:..., controlado:..., percentual_controlado:..., titulares:[...]}
    link_pattern = re.compile(r'\{\s*\n\s*id:\s*"obra-\d+-\w+",')
    
    edi_pct = 0.0; top_pct = 0.0; lr_pct = 0.0; other_pub_pct = 0.0; autor_pct = 0.0
    
    for lm in link_pattern.finditer(block):
        lend = find_matching_brace(block, lm.start())
        link_block = block[lm.start():lend+1]
        
        # Check if controlado
        ctrl = re.search(r'\bcontrolado:\s*(true|false)', link_block)
        if not ctrl or ctrl.group(1) != 'true':
            continue
        
        # Find titulares
        tm = re.search(r'titulares:\s*\[', link_block)
        if not tm:
            continue
        ts = tm.end()
        depth = 1; p = ts
        while p < len(link_block) and depth > 0:
            if link_block[p] == '[': depth += 1
            elif link_block[p] == ']': depth -= 1
            p += 1
        tit_block = link_block[ts:p-1]
        
        # Extract each titular
        for tb_start in [m.start() for m in re.finditer(r'\{', tit_block)]:
            tb_end = find_matching_brace(tit_block, tb_start)
            tb = tit_block[tb_start:tb_end+1]
            papel_m = re.search(r'papel:\s*"([^"]+)"', tb)
            pct_m = re.search(r'percentual:\s*([\d.]+)', tb)
            nome_m = re.search(r'nome:\s*"([^"]+)"', tb)
            if not papel_m or not pct_m:
                continue
            papel = papel_m.group(1)
            pct = float(pct_m.group(1))
            nome = nome_m.group(1).upper() if nome_m else ''
            
            if papel in PAPEL_PUB:
                if 'EDI MUSIC' in nome or 'EDI M' in nome:
                    edi_pct += pct
                elif 'TOP SHOW' in nome:
                    top_pct += pct
                elif 'LR ' in nome or 'EDICOES' in nome:
                    lr_pct += pct
                else:
                    other_pub_pct += pct
            else:
                autor_pct += pct
    
    total_pub = edi_pct + top_pct + lr_pct + other_pub_pct
    total_all = total_pub + autor_pct
    pub_pct = total_pub / total_all * 100 if total_all > 0 else 0
    valor = cc_obras[cod]['valor']
    
    rows.append({
        'cod': cod, 'titulo': titulo[:35],
        'autor_pct': round(autor_pct,2),
        'edi_pct': round(edi_pct,2),
        'top_pct': round(top_pct,2),
        'lr_pct': round(lr_pct,2),
        'total_pub': round(total_pub,2),
        'total_all': round(total_all,2),
        'pub_share': round(pub_pct,1),
        'valor': round(valor,2)
    })

rows.sort(key=lambda x: -x['valor'])
print(f"{'COD':>5}  {'TITULO':35}  {'AUT%':>7}  {'EDI%':>6}  {'TOP%':>6}  {'PUB_TOT':>8}  {'TOT':>7}  {'PUB/TOT':>8}  {'VALOR R$':>10}")
print('-'*110)
for r in rows[:30]:
    print(f"{r['cod']:>5}  {r['titulo']:35}  {r['autor_pct']:>7.2f}  {r['edi_pct']:>6.2f}  {r['top_pct']:>6.2f}  {r['total_pub']:>8.2f}  {r['total_all']:>7.2f}  {r['pub_share']:>7.1f}%  {r['valor']:>10.2f}")

print()
tot_aut = sum(r['autor_pct'] for r in rows)
tot_edi = sum(r['edi_pct'] for r in rows)
tot_top = sum(r['top_pct'] for r in rows)
tot_lr  = sum(r['lr_pct'] for r in rows)
tot_pub = sum(r['total_pub'] for r in rows)
tot_all = tot_aut + tot_pub
print(f"SOMA GERAL: autores={tot_aut:.1f}  edi={tot_edi:.1f}  top={tot_top:.1f}  lr={tot_lr:.1f}  pub_total={tot_pub:.1f}  all={tot_all:.1f}")
print(f"MEDIA % editoras sobre total: {tot_pub/tot_all*100:.1f}%")
print(f"  EDI: {tot_edi/tot_all*100:.2f}%  TOP: {tot_top/tot_all*100:.2f}%  LR: {tot_lr/tot_all*100:.2f}%")

# Distribuição atual do cc
cc_titulares = {}
for t in dist['cc_titulares']:
    nome = t.get('titular_nome','')
    if nome not in cc_titulares:
        cc_titulares[nome] = 0
    cc_titulares[nome] += t.get('saldo',0)

print()
print("--- DISTRIBUIÇÃO ATUAL POR TITULAR (top 15) ---")
for nome, val in sorted(cc_titulares.items(), key=lambda x: -x[1])[:15]:
    print(f"  {nome:45} R$ {val:>10.2f}")
total_dist = sum(cc_titulares.values())
print(f"  TOTAL DISTRIBUIDO: R$ {total_dist:.2f}")
