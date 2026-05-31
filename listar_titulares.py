import json
with open('dist_resultado.json','r',encoding='utf-8') as f:
    data = json.load(f)
rows = sorted(data['titular_creditos'].items(), key=lambda x: -x[1]['total'])
print(f"{'#':>3}  {'Nome':<45}  {'Total':>12}")
print('-'*65)
for i,(nome,v) in enumerate(rows,1):
    total = v['total']
    print(f"{i:>3}  {nome:<45}  R$ {total:>10.2f}")
print('-'*65)
print(f"Total titulares: {len(rows)}")
