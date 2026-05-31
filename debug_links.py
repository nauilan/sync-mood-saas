import re

with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

start = src.find('codigo: "AFW2"')
block = src[max(0,start-100):start+3000]

# Mostrar todos os links com campos relevantes
print("=== LINKS DA OBRA AFW2 ===\n")
for m in re.finditer(r'\{[^{}]*id:\s*"([^"]*obra[^"]*)"[^{}]*\}', block, re.DOTALL):
    lb = m.group(0)
    lid = re.search(r'id:\s*"([^"]*)"', lb)
    ctrl = re.search(r'controlado:\s*(true|false)', lb)
    pct_ctrl = re.search(r'percentual_controlado:\s*([\d.]+)', lb)
    descricao = re.search(r'descricao:\s*"([^"]*)"', lb)
    print(f"  id: {lid.group(1) if lid else '?'}")
    print(f"  controlado: {ctrl.group(1) if ctrl else '?'}")
    print(f"  percentual_controlado: {pct_ctrl.group(1) if pct_ctrl else '?'}")
    print(f"  descricao: {descricao.group(1) if descricao else '?'}")
    print()

# Tambem mostrar o campo _percentual_controlado da obra
pct_obra = re.search(r'_percentual_controlado:\s*([\d.]+)', block)
print(f"Obra _percentual_controlado: {pct_obra.group(1) if pct_obra else 'NAO ENCONTRADO'}")
