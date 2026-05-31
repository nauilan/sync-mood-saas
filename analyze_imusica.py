import pandas as pd

df = pd.read_excel(r'C:\Users\Usuário\Downloads\TOP SHOW MUSIC LIMIT - IMUSICA S.A. - DIST - 2026-04-17 - - ST505168.XLSX')
col_royalty = [c for c in df.columns if 'ROYALTIES_TO_BE_PAID' in c][0]

print("Todos os Publishers_SongCode distintos:")
for c in sorted(df['Publishers_SongCode'].unique()):
    total = df[df['Publishers_SongCode']==c][col_royalty].sum()
    count = len(df[df['Publishers_SongCode']==c])
    print(f"  {c}  |  linhas={count}  |  valor=R$ {round(total,4)}")

print()
print(f"Total geral: R$ {round(df[col_royalty].sum(), 4)}")
print(f"Publishers_SongCode distintos: {df['Publishers_SongCode'].nunique()}")

# TXT — verificar Publisher_SongCode (campo fixo)
# Já vimos que no TXT o código 00000000000170 aparece bastante
# Checar formato
print()
print("Formato do Publishers_SongCode no XLSX — comprimento dos valores:")
lens = df['Publishers_SongCode'].astype(str).str.len().value_counts()
print(lens)
