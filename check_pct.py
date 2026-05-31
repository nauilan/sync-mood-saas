import re
with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

start = src.find('codigo: "AFW2"')
block = src[max(0,start-50):start+300]
m = re.search(r'_percentual_controlado:\s*([\d.]+)', block)
print('AFW2 _percentual_controlado:', m.group(1) if m else 'NAO ENCONTRADO')

vals = re.findall(r'_percentual_controlado:\s*([\d.]+)', src)
from collections import Counter
buckets = Counter()
for v in vals:
    f = float(v)
    if f == 100.0: buckets['100%'] += 1
    elif f >= 75: buckets['75-99%'] += 1
    elif f >= 50: buckets['50-74%'] += 1
    elif f >= 25: buckets['25-49%'] += 1
    else: buckets['< 25%'] += 1
print(f'Total obras: {len(vals)}')
print('Distribuicao:', dict(buckets))
