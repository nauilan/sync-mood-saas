import re

with open(r'apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

# Buscar obras que contem JULIO CESAR CAMARGO
targets = [
    'JULIO CESAR CAMARGO',
    'JOAO THIAGO PEREIRA SALES',
    'ARIOSTO PORTO MULLER',   # controlado (grande valor)
    'NAUILAN VICENTINI ZULAI RAMOS',
]

for nome in targets:
    print(f"\n=== {nome} ===")
    idx = 0
    while True:
        pos = src.find(nome, idx)
        if pos == -1:
            break
        # pegar o bloco da obra (ir para trás até achar o id da obra)
        trecho = src[max(0,pos-500):pos+200]
        # obra id
        m = re.search(r'id:\s*"(obra-\d+)"', trecho)
        obra_id = m.group(1) if m else '??'
        # titulo
        m2 = re.search(r'titulo:\s*"([^"]+)"', trecho)
        titulo = m2.group(1) if m2 else '??'
        # link id
        m3 = re.search(r'id:\s*"(obra-\d+-\w+)"', src[max(0,pos-300):pos+50])
        link_id = m3.group(1) if m3 else '??'
        # controlado do link
        m4 = re.search(r'controlado:\s*(true|false)', src[max(0,pos-200):pos+300])
        ctrl = m4.group(1) if m4 else '??'
        # papel
        m5 = re.search(r'papel:\s*"([^"]+)"', src[pos:pos+100])
        papel = m5.group(1) if m5 else '??'
        # percentual
        m6 = re.search(r'percentual:\s*([\d.]+)', src[pos:pos+200])
        pct = m6.group(1) if m6 else '??'
        print(f"  obra={obra_id} titulo={titulo} link={link_id} papel={papel} pct={pct}% ctrl={ctrl}")
        idx = pos + 1
