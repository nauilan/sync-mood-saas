"""
Verifica quantos titulares têm controlado: false nas obras.
"""
import re

with open(r'apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

# Contar controlado: true vs false em titulares individuais
ctrl_true  = len(re.findall(r'\bcontrolado:\s*true', src))
ctrl_false = len(re.findall(r'\bcontrolado:\s*false', src))
print(f"controlado: true  → {ctrl_true}")
print(f"controlado: false → {ctrl_false}")

# Verificar estrutura da obra 29 - quais titulares são controlados
idx = src.find('"codigo": "29"')
if idx == -1:
    idx = src.find('codigo: "29"')
chunk = src[idx:idx+4000]

# Extrair cada titular e seu controlado
for m in re.finditer(r'nome:\s*"([^"]+)".*?controlado:\s*(true|false)', chunk, re.DOTALL):
    print(f"  {m.group(1):45} controlado={m.group(2)}")
