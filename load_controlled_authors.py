"""
Constrói o dicionário de autores controlados a partir da planilha base top show.
Formato: {codigo_obra: {nome_normalizado: percentual}}
Somente linhas onde controle == 'Sim'
"""
import pandas as pd
import unicodedata, re

def norm(s):
    """Normaliza nome: uppercase, sem acentos, sem espaços duplos."""
    s = str(s).strip().upper()
    s = unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('ASCII')
    s = re.sub(r'\s+', ' ', s)
    return s

df = pd.read_excel(r"C:\Users\Usuário\Downloads\base top show (1).xlsx", dtype=str)
df.columns = [c.strip().lower().replace('\u00f3','o').replace('\u00e9','e') for c in df.columns]
# normaliza nome da coluna código
col_map = {c: c.encode('ascii','ignore').decode('ascii').strip().lower() for c in df.columns}
df.columns = [col_map[c] for c in df.columns]
df['codigo'] = df['codigo'].str.strip()
df['controle'] = df['controle'].str.strip().str.capitalize()
df['autor_norm'] = df['autor'].apply(norm)
df['percentual'] = pd.to_numeric(df['percentual'], errors='coerce').fillna(0.0)

# Somente controlados
sim = df[df['controle'] == 'Sim'].copy()

# Por codigo: {nome_norm: percentual}
controlled = {}
for _, row in sim.iterrows():
    cod = row['codigo']
    if cod not in controlled:
        controlled[cod] = {}
    controlled[cod][row['autor_norm']] = float(row['percentual'])

# Estatísticas
print(f"Total linhas 'Sim': {len(sim)}")
print(f"Obras únicas com ao menos 1 controlado: {len(controlled)}")
print(f"\nExemplo código 29:")
for k,v in controlled.get('29', {}).items():
    print(f"  {k}: {v}%")
print(f"\nExemplo código 399 (tem Sim e Não):")
nao_399 = df[(df['codigo']=='399') & (df['controle']=='Não')]
sim_399 = df[(df['codigo']=='399') & (df['controle']=='Sim')]
print("  NÃO:", list(nao_399['autor']))
print("  SIM:", list(sim_399['autor']))
