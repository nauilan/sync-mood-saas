import pandas as pd, unicodedata, re

def norm(s):
    s = str(s).strip().upper()
    s = unicodedata.normalize('NFKD', s).encode('ASCII','ignore').decode('ASCII')
    return re.sub(r'\s+', ' ', s)

df = pd.read_excel(r'C:\Users\Usuário\Downloads\base top show (1).xlsx', dtype=str)
df.columns = [unicodedata.normalize('NFKD',c).encode('ASCII','ignore').decode('ASCII').strip().lower() for c in df.columns]
df['autor_norm'] = df['autor'].apply(norm)
df['controle'] = df['controle'].str.strip().str.capitalize()

targets = [
    'JULIO CESAR CAMARGO',
    'JOAO THIAGO PEREIRA SALES',
    'PEDRO HENRIQUE SANCHEZ',
    'ELTON PATRICK PENTEADO RODRIGUES',
    'NAUILAN VICENTINI ZULAI RAMOS',
    'MURILLO HENRIQUE NALIN NICOLAU',
    'AUGUSTO JANTIM FERREIRA',
    'FELIPE AUGUSTO NALIN NICOLAU',
]

for t in targets:
    rows = df[df['autor_norm'] == norm(t)]
    if rows.empty:
        print(f"{t}: NAO ENCONTRADO na planilha")
    else:
        for _, r in rows.iterrows():
            ctrl = r['controle']
            cod  = r['codigo']
            pct  = r['percentual']
            print(f"{t}: controle={ctrl} | codigo={cod} | pct={pct}")
