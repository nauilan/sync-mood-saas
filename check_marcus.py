import pandas as pd, unicodedata, re

def norm(s):
    s = str(s).strip().upper()
    s = unicodedata.normalize('NFKD', s).encode('ASCII','ignore').decode('ASCII')
    return re.sub(r'\s+', ' ', s)

df = pd.read_excel(r'C:\Users\Usuário\Downloads\base top show (1).xlsx', dtype=str)
df.columns = [unicodedata.normalize('NFKD',c).encode('ASCII','ignore').decode('ASCII').strip().lower() for c in df.columns]
df['autor_norm'] = df['autor'].apply(norm)
df['controle'] = df['controle'].str.strip().str.capitalize()
df['percentual'] = pd.to_numeric(df['percentual'], errors='coerce').fillna(0.0)

target = norm('MARCUS VINICIUS OLIVEIRA SANTANA')
rows = df[df['autor_norm'] == target]
print(f"MARCUS VINICIUS OLIVEIRA SANTANA — {len(rows)} ocorrências:\n")
print(rows[['codigo','titulo','controle','percentual']].to_string())

print("\n--- Por código: soma dos Sim ---")
sim_rows = rows[rows['controle'] == 'Sim']
by_cod = sim_rows.groupby('codigo')['percentual'].sum()
print(by_cod.to_string())

print("\n--- Códigos com Sim E Não ---")
for cod, grp in rows.groupby('codigo'):
    if set(grp['controle'].values) == {'Sim', 'Não'}:
        print(f"  codigo={cod}: {list(zip(grp['controle'], grp['percentual']))}")
