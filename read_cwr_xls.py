import pandas as pd

xls_path = r"C:\Users\Usuário\Downloads\B-5-CWR - 08-3615_CWR_LOOKUP_TABLES_2008-10-28_EN.XLS"

xl = pd.ExcelFile(xls_path)
print("Abas:", xl.sheet_names)
print()

for sheet in xl.sheet_names:
    df = pd.read_excel(xls_path, sheet_name=sheet, header=None)
    print(f"=== ABA: {sheet} ({df.shape[0]} linhas x {df.shape[1]} colunas) ===")
    print(df.head(30).to_string())
    print()
